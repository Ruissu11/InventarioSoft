import { t } from 'elysia'

export const CreateCategorySchema = t.Object({
  name:        t.String({ minLength: 2, maxLength: 100 }),
  description: t.Optional(t.String({ maxLength: 500 })),
})

export const UpdateCategorySchema = t.Object({
  name:        t.Optional(t.String({ minLength: 2, maxLength: 100 })),
  description: t.Optional(t.String({ maxLength: 500 })),
})

export const CategoryIdParam = t.Object({
  id: t.String({ format: 'uuid' }),
})