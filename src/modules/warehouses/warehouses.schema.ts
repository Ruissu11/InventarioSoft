import { t } from 'elysia'

export const CreateWarehouseSchema = t.Object({
  name:      t.String({ minLength: 2, maxLength: 150 }),
  location:  t.Optional(t.String({ maxLength: 255 })),
  is_active: t.Optional(t.Boolean()),
})

export const UpdateWarehouseSchema = t.Object({
  name:      t.Optional(t.String({ minLength: 2, maxLength: 150 })),
  location:  t.Optional(t.String({ maxLength: 255 })),
  is_active: t.Optional(t.Boolean()),
})

export const WarehouseIdParam = t.Object({
  id: t.String({ format: 'uuid' }),
})