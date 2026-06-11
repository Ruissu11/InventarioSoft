import sql from '../../shared/db'

export const WarehousesService = {

  async findAll() {
    return sql`
      SELECT id, name, location, is_active
      FROM warehouses
      ORDER BY name ASC
    `
  },

  async findById(id: string) {
    const [warehouse] = await sql`
      SELECT id, name, location, is_active
      FROM warehouses
      WHERE id = ${id}
    `
    return warehouse ?? null
  },

  async create(data: { name: string; location?: string; is_active?: boolean }) {
    const [existing] = await sql`
      SELECT id FROM warehouses WHERE name = ${data.name}
    `
    if (existing) throw new Error('NAME_TAKEN')

    const [warehouse] = await sql`
      INSERT INTO warehouses (name, location, is_active)
      VALUES (${data.name}, ${data.location ?? null}, ${data.is_active ?? true})
      RETURNING id, name, location, is_active
    `
    return warehouse
  },

  async update(id: string, data: { name?: string; location?: string; is_active?: boolean }) {
    const [warehouse] = await sql`
      UPDATE warehouses
      SET
        name      = COALESCE(${data.name      ?? null}::text,    name),
        location  = COALESCE(${data.location  ?? null}::text,    location),
        is_active = COALESCE(${data.is_active ?? null}::boolean, is_active)
      WHERE id = ${id}
      RETURNING id, name, location, is_active
    `
    return warehouse ?? null
  },

  async deactivate(id: string) {
    const [warehouse] = await sql`
      UPDATE warehouses
      SET is_active = false
      WHERE id = ${id}
      RETURNING id, name, location, is_active
    `
    return warehouse ?? null
  },
}