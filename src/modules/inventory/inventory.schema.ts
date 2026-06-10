import { t } from "elysia"

export const CreateMovementSchema = t.Object({
    product_id:   t.String({ format: "uuid" }),
    warehouse_id: t.String({ format: "uuid" }),
    // transfer se agrega en una iteración futura
    type:         t.Union([
        t.Literal("entry"),
        t.Literal("exit"),
        t.Literal("adjustment")
    ]),
    // El cliente siempre manda positivo.
    // El service convierte a negativo para exit.
    quantity:     t.Integer(),
    notes:        t.Optional(t.String()),
    reference:    t.Optional(t.String())
})

export const ProductIdParamSchema = t.Object({
    productId: t.String({ format: "uuid" })
})