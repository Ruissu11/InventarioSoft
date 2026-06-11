import Elysia  from "elysia"
import { cors } from "@elysiajs/cors"
import { productsRoutes } from "./src/modules/products/products.routes"
import { inventoryRoutes }  from "./src/modules/inventory/inventory.routes"
import { usersRoutes }      from "./src/modules/users/users.routes"
import { categoriesRoutes } from "./src/modules/categories/categories.routes"
import {suppliersRoutes} from "./src/modules/suppliers/suppliers.routes"
import {warehousesRoutes} from "./src/modules/warehouses/warehouses.routes"

const app = new Elysia()
    .use(cors())
    .use(productsRoutes)
    .use(inventoryRoutes)
    .use(usersRoutes)
    .use(categoriesRoutes)
    .use(suppliersRoutes)
    .use(warehousesRoutes)
    .listen(process.env.PORT ?? 3000)

console.log(`Servidor corriendo en http://localhost:${app.server?.port}`)