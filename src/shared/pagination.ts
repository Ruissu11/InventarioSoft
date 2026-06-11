import { t } from 'elysia'

// t.Numeric convierte automáticamente "20" (string de URL) a número.
// t.Number no hace esa conversión — para query params siempre usar Numeric.
export const PaginationSchema = t.Object({
  page:  t.Optional(t.Numeric({ minimum: 1,                   default: 1  })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100,     default: 20 })),
})

// offset = cuántas filas saltar. page=2, limit=20 → skip 20 filas.
export function getPagination(page = 1, limit = 20) {
  return { limit, offset: (page - 1) * limit }
}

// Meta que va en cada respuesta paginada. El cliente sabe cuántas páginas
// existen sin hacer otra consulta.
export function buildMeta(page: number, limit: number, total: number) {
  return { page, limit, total, pages: Math.ceil(total / limit) }
}