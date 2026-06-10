import db    from "../../shared/db"
import redis from "../../shared/redis"

const CACHE_KEY = "inventory:all"

export const InventoryService = {

    async getAll() {
        const cached = await redis.get(CACHE_KEY)
        if (cached) return JSON.parse(cached)

        const inventory = await db`
            SELECT
                i.id,
                i.quantity,
                i.updated_at,
                p.id            AS product_id,
                p.sku,
                p.name          AS product_name,
                p.minimum_stock,
                p.unit,
                w.id            AS warehouse_id,
                w.name          AS warehouse_name
            FROM inventory i
            JOIN products   p ON p.id = i.product_id
            JOIN warehouses w ON w.id = i.warehouse_id
            WHERE p.is_active = true
            ORDER BY p.name ASC, w.name ASC
        `

        await redis.set(CACHE_KEY, JSON.stringify(inventory), "EX", 30)
        return inventory
    },

    async getByProduct(productId: string) {
        return await db`
            SELECT
                i.id,
                i.quantity,
                i.updated_at,
                w.id   AS warehouse_id,
                w.name AS warehouse_name,
                p.minimum_stock,
                p.unit
            FROM inventory   i
            JOIN warehouses  w ON w.id = i.warehouse_id
            JOIN products    p ON p.id = i.product_id
            WHERE i.product_id = ${productId}
            ORDER BY w.name ASC
        `
    },

    async createMovement(data: {
        product_id:   string
        warehouse_id: string
        type:         "entry" | "exit" | "adjustment"
        quantity:     number
        notes?:       string
        reference?:   string
        user_id?:     string
    }) {
        // El cliente siempre manda cantidad positiva para entry y exit.
        // El service convierte el signo según el tipo.
        // adjustment puede ser positivo (agregar) o negativo (reducir).
        let delta: number

        if (data.type === "entry") {
            if (data.quantity <= 0) throw new Error("INVALID_QUANTITY")
            delta = data.quantity
        } else if (data.type === "exit") {
            if (data.quantity <= 0) throw new Error("INVALID_QUANTITY")
            delta = -data.quantity         // negativo = sale del stock
        } else {
            if (data.quantity === 0) throw new Error("INVALID_QUANTITY")
            delta = data.quantity          // adjustment: el cliente decide el signo
        }

        // TRANSACCIÓN: las dos operaciones ocurren juntas o ninguna.
        // Si PostgreSQL rechaza el UPDATE (ej: stock quedaría negativo),
        // el INSERT de stock_movements también se deshace automáticamente.
        const result = await db.begin(async sql => {

            // 1. Registrar el movimiento (historial inmutable)
            const [movement] = await sql`
                INSERT INTO stock_movements
                    (product_id, warehouse_id, user_id, type, quantity, notes, reference)
                VALUES
                    (${data.product_id}, ${data.warehouse_id}, ${data.user_id ?? null},
                     ${data.type}, ${delta}, ${data.notes ?? null}, ${data.reference ?? null})
                RETURNING *
            `

            // 2. Actualizar el stock actual (UPSERT)
            // ON CONFLICT maneja ambos casos:
            //   - Primera vez: INSERT (no existe fila para este producto+almacén)
            //   - Siguientes:  UPDATE (suma/resta al stock existente)
            // El CHECK (quantity >= 0) en la tabla rechaza stock negativo.
            const existing = await sql`
    SELECT id FROM inventory
    WHERE product_id   = ${data.product_id}
    AND   warehouse_id = ${data.warehouse_id}
`

let inventory

if (existing.length > 0) {
    const [updated] = await sql`
        UPDATE inventory
        SET quantity   = quantity + ${delta},
            updated_at = NOW()
        WHERE product_id   = ${data.product_id}
        AND   warehouse_id = ${data.warehouse_id}
        RETURNING *
    `
    inventory = updated
} else {
    const [inserted] = await sql`
        INSERT INTO inventory (product_id, warehouse_id, quantity)
        VALUES (${data.product_id}, ${data.warehouse_id}, ${delta})
        RETURNING *
    `
    inventory = inserted
}


            // 3. Verificar si el stock bajó del mínimo configurado
            const [product] = await sql`
                SELECT name, minimum_stock
                FROM products
                WHERE id = ${data.product_id}
            `

            return {
                movement,
                inventory,
                belowMinimum: inventory.quantity < product.minimum_stock,
                productName:  product.name,
                minimum:      product.minimum_stock
            }
        })

        // Invalidar cachés después de la transacción exitosa
        await redis.del(CACHE_KEY)
        await redis.del("products:all")

        return result
    }
}