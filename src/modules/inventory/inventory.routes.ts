import Elysia from "elysia"
import { InventoryService }                        from "./inventory.service"
import { CreateMovementSchema, ProductIdParamSchema } from "./inventory.schema"

export const inventoryRoutes = new Elysia({ prefix: "/inventory" })

    // Listar todo el stock actual
    .get("/", async () => {
        const inventory = await InventoryService.getAll()
        return { data: inventory }
    })

    // Stock de un producto en todos sus almacenes
    .get("/product/:productId", async ({ params, set }) => {
        const inventory = await InventoryService.getByProduct(params.productId)
        if (!inventory.length) {
            set.status = 404
            return { message: "Sin stock registrado para este producto" }
        }
        return { data: inventory }
    }, {
        params: ProductIdParamSchema
    })

    // Registrar un movimiento de stock
    .post("/movement", async ({ body, set }) => {
        try {
            const result = await InventoryService.createMovement(body)
            set.status = 201
            return {
                data: {
                    movement:  result.movement,
                    inventory: result.inventory
                },
                alert: result.belowMinimum
                    ? `⚠ Stock bajo mínimo: quedan ${result.inventory.quantity} unidades de ${result.productName} (mínimo: ${result.minimum})`
                    : null
            }
        } catch (e: any) {
    if (e.message === "INVALID_QUANTITY") {
        set.status = 400
        return { message: "Cantidad inválida para este tipo de movimiento" }
    }
    // Bun.sql puede exponer el código PostgreSQL en distintas propiedades
    // según la versión. Verificamos las tres posibles ubicaciones.
    const isCheckViolation =
        e.code === "23514" ||
        e.errno === "23514" ||
        (e.message && e.message.includes("inventory_quantity_check"))

    if (isCheckViolation) {
        set.status = 409
        return { message: "Stock insuficiente para registrar la salida" }
    }
    throw e
}
    }, {
        body: CreateMovementSchema
    })