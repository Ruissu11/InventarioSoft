import { t } from 'elysia'

export const CreateSupplierSchema = t.Object({
  name:      t.String({ minLength: 2, maxLength: 150 }),
  email:     t.String({ format: 'email' }),
  is_active: t.Optional(t.Boolean()),
})

export const UpdateSupplierSchema = t.Object({
  name:      t.Optional(t.String({ minLength: 2, maxLength: 150 })),
  email:     t.Optional(t.String({ format: 'email' })),
  is_active: t.Optional(t.Boolean()),
})

export const SupplierIdParam = t.Object({
  id: t.String({ format: 'uuid' }),
})