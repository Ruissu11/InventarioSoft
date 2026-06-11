import db    from "../../shared/db"
import { getPagination, buildMeta } from "../../shared/pagination"

// Tiempo de vida del caché en segundos.
// 60 segundos significa: la primera petición va a BD,
// las siguientes 60 segundos se sirven desde Redis.
const CACHE_TTL = 60
const CACHE_KEY = "products:all"

export const ProductsService = {

    async getAll(page = 1, limit = 20) {
       const { limit: lim, offset } = getPagination(page, limit)
         // Promise.all ejecuta ambas queries en paralelo — no en secuencia.
         // Sin esto: query1 (~20ms) + query2 (~20ms) = ~40ms.
         // Con esto: ambas corren a la vez = ~20ms total.
        const [products, [{ total }]] = await Promise.all([
            db`
            SELECT
                p.*,
                c.name AS category_name,
                s.name AS supplier_name
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN suppliers  s ON s.id = p.supplier_id
            WHERE p.is_active = true
            ORDER BY p.name ASC
            LIMIT  ${lim}
            OFFSET ${offset}
            `,
            db`
            SELECT COUNT(*)::int AS total
            FROM products
            WHERE is_active = true
            `
        ])

        return { data: products, meta: buildMeta(page, lim, total) }
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
        return product ?? null
    }
}