import db    from "../../shared/db"
import redis from "../../shared/redis"

// Tiempo de vida del caché en segundos.
// 60 segundos significa: la primera petición va a BD,
// las siguientes 60 segundos se sirven desde Redis.
const CACHE_TTL = 60
const CACHE_KEY = "products:all"

export const ProductsService = {

    async getAll() {
        // 1. Intentar desde caché
        const cached = await redis.get(CACHE_KEY)
        if (cached) {
            return JSON.parse(cached)
        }

        // 2. Cache miss — ir a la BD
        const products = await db`
            SELECT
                p.id,
                p.sku,
                p.name,
                p.description,
                p.unit_price,
                p.unit,
                p.minimum_stock,
                p.is_active,
                c.name AS category_name,
                s.name AS supplier_name
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN suppliers  s ON s.id = p.supplier_id
            WHERE p.is_active = true
            ORDER BY p.name ASC
        `

        // 3. Guardar en caché para las próximas peticiones
        await redis.set(CACHE_KEY, JSON.stringify(products), "EX", CACHE_TTL)

        return products
    },

    async getById(id: string) {
        const [product] = await db`
            SELECT
                p.*,
                c.name AS category_name,
                s.name AS supplier_name
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN suppliers  s ON s.id = p.supplier_id
            WHERE p.id = ${id}
              AND p.is_active = true
        `
        return product ?? null
    },

    async create(data: typeof import("./products.schema").CreateProductSchema.static) {
        const [product] = await db`
            INSERT INTO products
                (sku, name, description, category_id, supplier_id,
                 unit_price, unit, minimum_stock)
            VALUES
                (${data.sku}, ${data.name}, ${data.description ?? null},
                 ${data.category_id ?? null}, ${data.supplier_id ?? null},
                 ${data.unit_price}, ${data.unit ?? "unidad"},
                 ${data.minimum_stock ?? 0})
            RETURNING *
        `

        // Invalidar caché: los datos cambiaron
        await redis.del(CACHE_KEY)

        return product
    },

    async update(id: string, data: typeof import("./products.schema").UpdateProductSchema.static) {
        // Construir el UPDATE dinámicamente solo con los campos enviados
        const [product] = await db`
            UPDATE products
            SET ${db(data)},
                updated_at = NOW()
            WHERE id = ${id}
              AND is_active = true
            RETURNING *
        `

        await redis.del(CACHE_KEY)

        return product ?? null
    },

    async remove(id: string) {
        // Soft delete: marcamos is_active = false, no borramos el registro
        const [product] = await db`
            UPDATE products
            SET is_active  = false,
                updated_at = NOW()
            WHERE id = ${id}
              AND is_active = true
            RETURNING id
        `

        if (product) await redis.del(CACHE_KEY)

        return product ?? null
    }
}