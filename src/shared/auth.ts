import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { bearer } from '@elysiajs/bearer'

export type JwtPayload = {
  sub:   string
  email: string
  role:  'admin' | 'operator' | 'viewer'
}

// ─── Plugin base JWT ──────────────────────────────────────────────────────────
export const jwtPlugin = new Elysia({ name: 'jwt-plugin' })
  .use(bearer())
  .use(
    jwt({
      name:   'jwt',
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
      exp:    '7d',
    })
  )

// ─── Guard: cualquier usuario autenticado ─────────────────────────────────────
// Autocontenido: incluye jwtPlugin, derive y onBeforeHandle en un solo nivel.
// Quien haga .use(requireAuth) recibe todo propagado con scoped.
export const requireAuth = new Elysia({ name: 'require-auth' })
  .use(jwtPlugin)
  .derive({ as: 'scoped' }, async ({ bearer, jwt }) => {
    let currentUser: JwtPayload | null = null
    if (bearer) {
      const payload = await jwt.verify(bearer)
      if (payload) currentUser = payload as JwtPayload
    }
    return { currentUser }
  })
  .onBeforeHandle({ as: 'scoped' }, ({ currentUser, set }) => {
    if (!currentUser) {
      set.status = 401
      return { error: 'Unauthorized: token missing or invalid' }
    }
  })

// ─── Guard: solo admin ────────────────────────────────────────────────────────
// Autocontenido también — NO usa requireAuth internamente.
// Repite la verificación del token + chequea el rol en el mismo nivel.
// Por qué no extender requireAuth: scoped solo va un nivel,
// encadenar dos plugins hace que los hooks del interno no lleguen
// al componente que usa el externo.
export const requireAdmin = new Elysia({ name: 'require-admin' })
  .use(jwtPlugin)
  .derive({ as: 'scoped' }, async ({ bearer, jwt }) => {
    let currentUser: JwtPayload | null = null
    if (bearer) {
      const payload = await jwt.verify(bearer)
      if (payload) currentUser = payload as JwtPayload
    }
    return { currentUser }
  })
  .onBeforeHandle({ as: 'scoped' }, ({ currentUser, set }) => {
    if (!currentUser) {
      set.status = 401
      return { error: 'Unauthorized: token missing or invalid' }
    }
    if (currentUser.role !== 'admin') {
      set.status = 403
      return { error: 'Forbidden: admin role required' }
    }
  })