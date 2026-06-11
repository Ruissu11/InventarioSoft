import { t } from 'elysia'

// Registro: password con límite 72 chars porque bcrypt trunca silenciosamente
// a 72 bytes. Documentarlo en el schema evita sorpresas de seguridad.
export const RegisterSchema = t.Object({
  email:     t.String({ format: 'email' }),
  full_name: t.String({ minLength: 2, maxLength: 100 }),
  password:  t.String({ minLength: 8, maxLength: 72 }),
  role: t.Optional(t.Union([t.Literal('admin'), t.Literal('operator'), t.Literal('viewer')])),
})

// Login: validación mínima. El service decide si las credenciales son válidas.
export const LoginSchema = t.Object({
  email:    t.String({ format: 'email' }),
  password: t.String({ minLength: 1 }),
})

// Actualización: todos opcionales → semántica PATCH (solo lo que envías cambia).
// No incluye password ni email — cambiar esos requiere endpoints dedicados
// con flujos de verificación propios (out of scope aquí).
export const UpdateUserSchema = t.Object({
  full_name: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
  role: t.Optional(t.Union([t.Literal('admin'), t.Literal('operator'), t.Literal('viewer')])),
  is_active: t.Optional(t.Boolean()),
})

export const UserIdParam = t.Object({
  id: t.String({ format: 'uuid' }),
})