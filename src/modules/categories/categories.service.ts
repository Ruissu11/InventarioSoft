import sql from '../../shared/db'

export const CategoriesService = {

  async findAll() {
    return sql`
      SELECT id, name, description
      FROM categories
      ORDER BY name ASC
    `
  },

  async findById(id: string) {
    const [category] = await sql`
      SELECT id, name, description
      FROM categories
      WHERE id = ${id}
    `
    return category ?? null
  },

  async create(data: { name: string; description?: string }) {
    const [existing] = await sql`
      SELECT id FROM categories WHERE name = ${data.name}
    `
    if (existing) throw new Error('NAME_TAKEN')

    const [category] = await sql`
      INSERT INTO categories (name, description)
      VALUES (${data.name}, ${data.description ?? null})
      RETURNING id, name, description
    `
    return category
  },

  async update(id: string, data: { name?: string; description?: string }) {
    const [category] = await sql`
      UPDATE categories
      SET
        name        = COALESCE(${data.name        ?? null}::text, name),
        description = COALESCE(${data.description ?? null}::text, description)
      WHERE id = ${id}
      RETURNING id, name, description
    `
    return category ?? null
  },

  async delete(id: string) {
    // Si hay productos usando esta categoría, PostgreSQL lanza error 23503 (FK violation).
    // Lo capturamos en el service y lo convertimos en un error de dominio legible.
    try {
      const [category] = await sql`
        DELETE FROM categories
        WHERE id = ${id}
        RETURNING id, name
      `
      return category ?? null
    } catch (err: any) {
      if (err.code === '23503') throw new Error('CATEGORY_IN_USE')
      throw err
    }
  },
}