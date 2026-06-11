import { Elysia } from 'elysia'
import { SuppliersService } from './suppliers.service'
import { CreateSupplierSchema, UpdateSupplierSchema, SupplierIdParam } from './suppliers.schema'
import { requireAuth, requireAdmin } from '../../shared/auth'

const readRoutes = new Elysia({ prefix: '/suppliers' })
  .use(requireAuth)
  .get('/', async ({ set }) => {
    try {
      return { data: await SuppliersService.findAll() }
    } catch {
      set.status = 500; return { error: 'Internal server error' }
    }
  })
  .get('/:id', async ({ params, set }) => {
    try {
      const supplier = await SuppliersService.findById(params.id)
      if (!supplier) { set.status = 404; return { error: 'Supplier not found' } }
      return { data: supplier }
    } catch {
      set.status = 500; return { error: 'Internal server error' }
    }
  }, { params: SupplierIdParam })

const writeRoutes = new Elysia({ prefix: '/suppliers' })
  .use(requireAdmin)
  .post('/', async ({ body, set }) => {
    try {
      const supplier = await SuppliersService.create(body)
      set.status = 201; return { data: supplier }
    } catch (err: any) {
      if (err.message === 'EMAIL_TAKEN') { set.status = 409; return { error: 'Email already registered' } }
      set.status = 500; return { error: 'Internal server error' }
    }
  }, { body: CreateSupplierSchema })
  .put('/:id', async ({ params, body, set }) => {
    try {
      const supplier = await SuppliersService.update(params.id, body)
      if (!supplier) { set.status = 404; return { error: 'Supplier not found' } }
      return { data: supplier }
    } catch {
      set.status = 500; return { error: 'Internal server error' }
    }
  }, { params: SupplierIdParam, body: UpdateSupplierSchema })
  .delete('/:id', async ({ params, set }) => {
    try {
      const supplier = await SuppliersService.deactivate(params.id)
      if (!supplier) { set.status = 404; return { error: 'Supplier not found' } }
      return { data: supplier }
    } catch {
      set.status = 500; return { error: 'Internal server error' }
    }
  }, { params: SupplierIdParam })

export const suppliersRoutes = new Elysia()
  .use(readRoutes)
  .use(writeRoutes)