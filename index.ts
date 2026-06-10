import Elysia  from "elysia"
import { cors } from "@elysiajs/cors"
import { productsRoutes } from "./src/modules/products/products.routes"

const app = new Elysia()
    .use(cors())
    .use(productsRoutes)
    .listen(process.env.PORT ?? 3000)

console.log(`Servidor corriendo en http://localhost:${app.server?.port}`)