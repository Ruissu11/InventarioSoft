import sql from '../../shared/db'

export const SuppliersService = {

  async findAll() {
    return sql`
      SELECT id, name, email, is_active
      FROM suppliers
      ORDER BY name ASC
    `
  },

  async findById(id: string) {
    const [supplier] = await sql`
      SELECT id, name, email, is_active
      FROM suppliers
      WHERE id = ${id}
    `
    return supplier ?? null
  },

  async create(data: { name: string; email: string; is_active?: boolean }) {
    const [existing] = await sql`
      SELECT id FROM suppliers WHERE email = ${data.email}
    `
    if (existing) throw new Error('EMAIL_TAKEN')

    const [supplier] = await sql`
      INSERT INTO suppliers (name, email, is_active)
      VALUES (${data.name}, ${data.email}, ${data.is_active ?? true})
      RETURNING id, name, email, is_active
    `
    return supplier
  },

  async update(id: string, data: { name?: string; email?: string; is_active?: boolean }) {
    const [supplier] = await sql`
      UPDATE suppliers
      SET
        name      = COALESCE(${data.name      ?? null}::text,    name),
        email     = COALESCE(${data.email     ?? null}::text,    email),
        is_active = COALESCE(${data.is_active ?? null}::boolean, is_active)
      WHERE id = ${id}
      RETURNING id, name, email, is_active
    `
    return supplier ?? null
  },

  async deactivate(id: string) {
    const [supplier] = await sql`
      UPDATE suppliers
      SET is_active = false
      WHERE id = ${id}
      RETURNING id, name, email, is_active
    `
    return supplier ?? null
  },
}