import Elysia from "elysia"
import { ProductsService }    from "./products.service"
import {
    CreateProductSchema,
    UpdateProductSchema,
    ProductIdSchema
} from "./products.schema"

export const productsRoutes = new Elysia({ prefix: "/products" })

    .get("/", async () => {
        const products = await ProductsService.getAll()
        return { data: products }
    })

    .get("/:id", async ({ params, set }) => {
        const product = await ProductsService.getById(params.id)
        if (!product) {
            set.status = 404
            return { message: "Producto no encontrado" }
        }
        return { data: product }
    }, {
        params: ProductIdSchema
    })

    .post("/", async ({ body, set }) => {
        try {
            const product = await ProductsService.create(body)
            set.status = 201
            return { data: product }
        } catch (e: any) {
            if (e.code === "23505") {
                set.status = 409
                return { message: "El SKU ya existe" }
            }
            throw e
        }
    }, {
        body: CreateProductSchema
    })

    .put("/:id", async ({ params, body, set }) => {
        const product = await ProductsService.update(params.id, body)
        if (!product) {
            set.status = 404
            return { message: "Producto no encontrado" }
        }
        return { data: product }
    }, {
        params: ProductIdSchema,
        body:   UpdateProductSchema
    })

    .delete("/:id", async ({ params, set }) => {
        const product = await ProductsService.remove(params.id)
        if (!product) {
            set.status = 404
            return { message: "Producto no encontrado" }
        }
        return { message: "Producto eliminado correctamente" }
    }, {
        params: ProductIdSchema
    })