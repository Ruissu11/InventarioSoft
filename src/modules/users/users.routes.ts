import { Elysia } from 'elysia'
import { UsersService } from './users.service'
import {
  RegisterSchema,
  LoginSchema,
  UpdateUserSchema,
  UserIdParam,
} from './users.schema'
import { jwtPlugin, requireAuth, requireAdmin } from '../../shared/auth'

// ── Grupo 1: rutas públicas — no requieren token ──────────────────────────────
// Register y Login son los únicos endpoints sin autenticación.
const authRoutes = new Elysia({ prefix: '/auth' })
  .use(jwtPlugin)   // necesita jwt.sign para el login

  .post('/register', async ({ body, set }) => {
    try {
      const user = await UsersService.register(body)
      set.status = 201
      return { data: user }
    } catch (err: any) {
      console.error('REGISTER ERROR:', err.message)
      if (err.message === 'EMAIL_TAKEN') {
        set.status = 409
        return { error: 'Email already registered' }
      }
      set.status = 500
      return { error: 'Internal server error' }
    }
  }, { body: RegisterSchema })

  .post('/login', async ({ body, jwt, set }) => {
    try {
      const user = await UsersService.login(body.email, body.password)

      // Firmamos con los datos mínimos para autorización.
      // sub = UUID del usuario (convención estándar de JWT — "subject").
      // No incluir datos que cambien frecuentemente (como full_name).
      const token = await jwt.sign({
        sub:   user.id,
        email: user.email,
        role:  user.role,
      })

      return { data: { token, user } }
    } catch (err: any) {
      if (err.message === 'INVALID_CREDENTIALS') {
        set.status = 401
        return { error: 'Invalid email or password' }
      }
      if (err.message === 'USER_INACTIVE') {
        set.status = 403
        return { error: 'Account is inactive' }
      }
      set.status = 500
      return { error: 'Internal server error' }
    }
  }, { body: LoginSchema })


// ── Grupo 2: solo admin (/users) ──────────────────────────────────────────────
// Listar y desactivar usuarios son operaciones administrativas.
const adminUserRoutes = new Elysia({ prefix: '/users' })
  .use(requireAdmin)

  .get('/', async ({ set }) => {
    try {
      return { data: await UsersService.findAll() }
    } catch {
      set.status = 500
      return { error: 'Internal server error' }
    }
  })

  .delete('/:id', async ({ params, set }) => {
    try {
      const user = await UsersService.deactivate(params.id)
      if (!user) { set.status = 404; return { error: 'User not found' } }
      return { data: user }
    } catch {
      set.status = 500
      return { error: 'Internal server error' }
    }
  }, { params: UserIdParam })


// ── Grupo 3: cualquier usuario autenticado (/users) ───────────────────────────
// Un usuario puede ver/editar su propio perfil.
// Admin puede ver/editar cualquier perfil.
//
// Por qué currentUser! (non-null assertion):
// requireAuth.onBeforeHandle ya cortó la request si currentUser era null.
// Si este handler se ejecuta, TypeScript no lo sabe pero nosotros sí.
const protectedUserRoutes = new Elysia({ prefix: '/users' })
  .use(requireAuth)

  .get('/:id', async ({ params, currentUser, set }) => {
    if (currentUser!.role !== 'admin' && currentUser!.sub !== params.id) {
      set.status = 403
      return { error: 'Forbidden: can only view your own profile' }
    }
    try {
      const user = await UsersService.findById(params.id)
      if (!user) { set.status = 404; return { error: 'User not found' } }
      return { data: user }
    } catch {
      set.status = 500
      return { error: 'Internal server error' }
    }
  }, { params: UserIdParam })

  .put('/:id', async ({ params, body, currentUser, set }) => {
    if (currentUser!.role !== 'admin' && currentUser!.sub !== params.id) {
      set.status = 403
      return { error: 'Forbidden: can only edit your own profile' }
    }
    // Staff no puede auto-promoverse ni desactivar cuentas.
    // Solo admin puede modificar role e is_active.
    if (currentUser!.role !== 'admin') {
      delete (body as any).role
      delete (body as any).is_active
    }
    try {
      const user = await UsersService.update(params.id, body)
      if (!user) { set.status = 404; return { error: 'User not found' } }
      return { data: user }
    } catch {
      set.status = 500
      return { error: 'Internal server error' }
    }
  }, { params: UserIdParam, body: UpdateUserSchema })


// ── Módulo exportado ──────────────────────────────────────────────────────────
export const usersRoutes = new Elysia()
  .use(authRoutes)
  .use(adminUserRoutes)
  .use(protectedUserRoutes)