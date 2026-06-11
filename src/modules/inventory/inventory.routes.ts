import { Elysia }              from "elysia"
import { InventoryService }    from "./inventory.service"
import {
  CreateMovementSchema,
  ProductIdParamSchema
} from "./inventory.schema"
import { requireAuth }         from "../../shared/auth"
import { PaginationSchema }    from "../../shared/pagination"

// Todos los endpoints de inventory requieren autenticación.
// Cualquier rol puede consultar stock y registrar movimientos —
// restringir a admin sería demasiado restrictivo en un sistema de inventario.
export const inventoryRoutes = new Elysia({ prefix: "/inventory" })
  .use(requireAuth)

  .get("/", async ({ query, set }) => {
    try {
      return await InventoryService.getAll(query.page, query.limit)
    } catch {
      set.status = 500
      return { error: "Internal server error" }
    }
  }, { query: PaginationSchema })

  .get("/product/:productId", async ({ params, set }) => {
    try {
      const inventory = await InventoryService.getByProduct(params.productId)
      if (!inventory.length) {
        set.status = 404
        return { message: "Sin stock registrado para este producto" }
      }
      return { data: inventory }
    } catch {
      set.status = 500
      return { error: "Internal server error" }
    }
  }, { params: ProductIdParamSchema })

  .post("/movement", async ({ body, currentUser, set }) => {
    try {
      // user_id viene del JWT — nunca del body del cliente.
      // Si el cliente enviara su propio user_id podría falsificar la autoría
      // de un movimiento. Al tomarlo del token firmado, eso es imposible.
      //
      // La desestructuración descarta cualquier user_id que venga en el body
      // antes de sobreescribirlo con el del token.
      const { user_id: _ignored, ...movementData } = body as any

      const result = await InventoryService.createMovement({
        ...movementData,
        user_id: currentUser!.sub,
      })

      set.status = 201
      return {
        data: {
          movement:  result.movement,
          inventory: result.inventory,
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
      const isCheckViolation =
        e.code === "23514" ||
        e.errno === "23514" ||
        (e.message && e.message.includes("inventory_quantity_check"))
      if (isCheckViolation) {
        set.status = 409
        return { message: "Stock insuficiente para registrar la salida" }
      }
      set.status = 500
      return { error: "Internal server error" }
    }
  }, { body: CreateMovementSchema })