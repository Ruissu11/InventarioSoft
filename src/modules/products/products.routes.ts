import { Elysia }             from "elysia"
import { ProductsService }    from "./products.service"
import {
  CreateProductSchema,
  UpdateProductSchema,
  ProductIdSchema
} from "./products.schema"
import { requireAuth, requireAdmin } from "../../shared/auth"
import { PaginationSchema }   from "../../shared/pagination"

// GET solo requiere estar autenticado — cualquier rol puede consultar.
const readRoutes = new Elysia({ prefix: "/products" })
  .use(requireAuth)

  .get("/", async ({ query, set }) => {
    try {
      return await ProductsService.getAll(query.page, query.limit)
    } catch {
      set.status = 500
      return { error: "Internal server error" }
    }
  }, { query: PaginationSchema })

  .get("/:id", async ({ params, set }) => {
    try {
      const product = await ProductsService.getById(params.id)
      if (!product) { set.status = 404; return { message: "Producto no encontrado" } }
      return { data: product }
    } catch {
      set.status = 500
      return { error: "Internal server error" }
    }
  }, { params: ProductIdSchema })


// POST/PUT/DELETE solo admin — modificar el catálogo es operación administrativa.
const writeRoutes = new Elysia({ prefix: "/products" })
  .use(requireAdmin)

  .post("/", async ({ body, set }) => {
    try {
      const product = await ProductsService.create(body)
      set.status = 201
      return { data: product }
    } catch (e: any) {
      if (e.code === "23505") { set.status = 409; return { message: "El SKU ya existe" } }
      set.status = 500
      return { error: "Internal server error" }
    }
  }, { body: CreateProductSchema })

  .put("/:id", async ({ params, body, set }) => {
    try {
      const product = await ProductsService.update(params.id, body)
      if (!product) { set.status = 404; return { message: "Producto no encontrado" } }
      return { data: product }
    } catch {
      set.status = 500
      return { error: "Internal server error" }
    }
  }, { params: ProductIdSchema, body: UpdateProductSchema })

  .delete("/:id", async ({ params, set }) => {
    try {
      const product = await ProductsService.remove(params.id)
      if (!product) { set.status = 404; return { message: "Producto no encontrado" } }
      return { message: "Producto eliminado correctamente" }
    } catch {
      set.status = 500
      return { error: "Internal server error" }
    }
  }, { params: ProductIdSchema })


export const productsRoutes = new Elysia()
  .use(readRoutes)
  .use(writeRoutes)