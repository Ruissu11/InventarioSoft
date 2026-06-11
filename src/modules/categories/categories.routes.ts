import { Elysia } from 'elysia'
import { CategoriesService } from './categories.service'
import { CreateCategorySchema, UpdateCategorySchema, CategoryIdParam } from './categories.schema'
import { requireAuth, requireAdmin } from '../../shared/auth'

const readRoutes = new Elysia({ prefix: '/categories' })
  .use(requireAuth)
  .get('/', async ({ set }) => {
    try {
      return { data: await CategoriesService.findAll() }
    } catch {
      set.status = 500; return { error: 'Internal server error' }
    }
  })
  .get('/:id', async ({ params, set }) => {
    try {
      const category = await CategoriesService.findById(params.id)
      if (!category) { set.status = 404; return { error: 'Category not found' } }
      return { data: category }
    } catch {
      set.status = 500; return { error: 'Internal server error' }
    }
  }, { params: CategoryIdParam })

const writeRoutes = new Elysia({ prefix: '/categories' })
  .use(requireAdmin)
  .post('/', async ({ body, set }) => {
    try {
      const category = await CategoriesService.create(body)
      set.status = 201; return { data: category }
    } catch (err: any) {
      if (err.message === 'NAME_TAKEN') { set.status = 409; return { error: 'Category name already exists' } }
      set.status = 500; return { error: 'Internal server error' }
    }
  }, { body: CreateCategorySchema })
  .put('/:id', async ({ params, body, set }) => {
    try {
      const category = await CategoriesService.update(params.id, body)
      if (!category) { set.status = 404; return { error: 'Category not found' } }
      return { data: category }
    } catch {
      set.status = 500; return { error: 'Internal server error' }
    }
  }, { params: CategoryIdParam, body: UpdateCategorySchema })
  .delete('/:id', async ({ params, set }) => {
    try {
      const category = await CategoriesService.delete(params.id)
      if (!category) { set.status = 404; return { error: 'Category not found' } }
      return { data: category }
    } catch (err: any) {
      if (err.message === 'CATEGORY_IN_USE') { set.status = 409; return { error: 'Category has products assigned — reassign them first' } }
      set.status = 500; return { error: 'Internal server error' }
    }
  }, { params: CategoryIdParam })

export const categoriesRoutes = new Elysia()
  .use(readRoutes)
  .use(writeRoutes)