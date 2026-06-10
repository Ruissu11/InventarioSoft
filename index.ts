import Elysia  from "elysia"
import { cors } from "@elysiajs/cors"
import { productsRoutes } from "./src/modules/products/products.routes"
import { inventoryRoutes }  from "./src/modules/inventory/inventory.routes"

const app = new Elysia()
    .use(cors())
    .use(productsRoutes)
    .use(inventoryRoutes)
    .listen(process.env.PORT ?? 3000)

console.log(`Servidor corriendo en http://localhost:${app.server?.port}`)