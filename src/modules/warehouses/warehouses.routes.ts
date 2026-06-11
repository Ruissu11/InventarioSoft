import { Elysia } from 'elysia'
import { WarehousesService } from './warehouses.service'
import { CreateWarehouseSchema, UpdateWarehouseSchema, WarehouseIdParam } from './warehouses.schema'
import { requireAuth, requireAdmin } from '../../shared/auth'

const readRoutes = new Elysia({ prefix: '/warehouses' })
  .use(requireAuth)
  .get('/', async ({ set }) => {
    try {
      return { data: await WarehousesService.findAll() }
    } catch {
      set.status = 500; return { error: 'Internal server error' }
    }
  })
  .get('/:id', async ({ params, set }) => {
    try {
      const warehouse = await WarehousesService.findById(params.id)
      if (!warehouse) { set.status = 404; return { error: 'Warehouse not found' } }
      return { data: warehouse }
    } catch {
      set.status = 500; return { error: 'Internal server error' }
    }
  }, { params: WarehouseIdParam })

const writeRoutes = new Elysia({ prefix: '/warehouses' })
  .use(requireAdmin)
  .post('/', async ({ body, set }) => {
    try {
      const warehouse = await WarehousesService.create(body)
      set.status = 201; return { data: warehouse }
    } catch (err: any) {
      if (err.message === 'NAME_TAKEN') { set.status = 409; return { error: 'Warehouse name already exists' } }
      set.status = 500; return { error: 'Internal server error' }
    }
  }, { body: CreateWarehouseSchema })
  .put('/:id', async ({ params, body, set }) => {
    try {
      const warehouse = await WarehousesService.update(params.id, body)
      if (!warehouse) { set.status = 404; return { error: 'Warehouse not found' } }
      return { data: warehouse }
    } catch {
      set.status = 500; return { error: 'Internal server error' }
    }
  }, { params: WarehouseIdParam, body: UpdateWarehouseSchema })
  .delete('/:id', async ({ params, set }) => {
    try {
      const warehouse = await WarehousesService.deactivate(params.id)
      if (!warehouse) { set.status = 404; return { error: 'Warehouse not found' } }
      return { data: warehouse }
    } catch {
      set.status = 500; return { error: 'Internal server error' }
    }
  }, { params: WarehouseIdParam })

export const warehousesRoutes = new Elysia()
  .use(readRoutes)
  .use(writeRoutes)