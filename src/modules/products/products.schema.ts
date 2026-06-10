import { t } from "elysia"

// Schema para crear un producto (POST)
// Todos los campos son requeridos excepto description y supplier_id
export const CreateProductSchema = t.Object({
    sku:           t.String({ minLength: 1, maxLength: 100 }),
    name:          t.String({ minLength: 1, maxLength: 255 }),
    description:   t.Optional(t.String()),
    category_id:   t.Optional(t.String({ format: "uuid" })),
    supplier_id:   t.Optional(t.String({ format: "uuid" })),
    unit_price:    t.Number({ minimum: 0 }),
    unit:          t.Optional(t.String({ default: "unidad" })),
    minimum_stock: t.Optional(t.Integer({ minimum: 0, default: 0 }))
})

// Schema para actualizar un producto (PUT)
// Todos los campos son opcionales — solo envías lo que cambia
export const UpdateProductSchema = t.Partial(CreateProductSchema)

// Schema para el parámetro :id en la URL
export const ProductIdSchema = t.Object({
    id: t.String({ format: "uuid" })
})