import sql  from '../../shared/db'

export const UsersService = {

  async register(data: {
    email:     string
    full_name: string
    password:  string
    role?:     string
  }) {
    // Verificar email único antes de hashear.
    // Evita trabajo innecesario si el email ya existe.
    const [existing] = await sql`
      SELECT id FROM users WHERE email = ${data.email}
    `
    if (existing) throw new Error('EMAIL_TAKEN')

    // Bun.password.hash usa bcrypt por defecto.
    // ~100ms intencional — hace ataques de fuerza bruta computacionalmente caros.
    // NUNCA almacenar el password en texto plano. Ni en logs.
    const password_hash = await Bun.password.hash(data.password)

    const [user] = await sql`
      INSERT INTO users (email, full_name, password_hash, role)
      VALUES (
        ${data.email},
        ${data.full_name},
        ${password_hash},
        ${data.role ?? 'operator'}  
      )
      RETURNING id, email, full_name, role, is_active, created_at
    `
    // RETURNING excluye password_hash explícitamente.
    // Nunca debe salir del service.
    return user
  },

  async login(email: string, password: string) {
    // Seleccionamos password_hash SOLO aquí para verificar.
    // En ningún otro método del service se selecciona esta columna.
    const [user] = await sql`
      SELECT id, email, full_name, role, is_active, password_hash
      FROM users
      WHERE email = ${email}
    `
    console.log('LOGIN DEBUG:', { user, is_active: user?.is_active })

    // Por qué mensaje genérico "INVALID_CREDENTIALS" para ambos casos
    // (email inexistente y password incorrecto):
    // Si devolvemos mensajes distintos, un atacante puede enumerar
    // qué emails están registrados. El mensaje genérico previene eso.
    if (!user)          throw new Error('INVALID_CREDENTIALS')
    if (!user.is_active) throw new Error('USER_INACTIVE')

    const valid = await Bun.password.verify(password, user.password_hash as string)
    if (!valid) throw new Error('INVALID_CREDENTIALS')

    // Destruir password_hash del objeto antes de devolverlo.
    // El spread operator crea un nuevo objeto sin esa clave.
    const { password_hash, ...safeUser } = user as any
    return safeUser
  },

  async findAll() {
    return sql`
      SELECT id, email, full_name, role, is_active, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `
  },

  async findById(id: string) {
    const [user] = await sql`
      SELECT id, email, full_name, role, is_active, created_at, updated_at
      FROM users
      WHERE id = ${id}
    `
    return user ?? null
  },

  async update(id: string, data: {
    full_name?: string
    role?:      string
    is_active?: boolean
  }) {
    // COALESCE: si el valor es NULL (campo no enviado), conserva el valor actual.
    // ?? null convierte undefined → null para que COALESCE funcione correctamente.
    // Importante: false ?? null === false (nullish coalescing no toca false/0).
    const [user] = await sql`
      UPDATE users
      SET
        full_name  = COALESCE(${data.full_name  ?? null}::text,    full_name),
        role       = COALESCE(${data.role       ?? null}::text,    role),
        is_active  = COALESCE(${data.is_active  ?? null}::boolean, is_active),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, full_name, role, is_active, created_at, updated_at
    `
    return user ?? null
  },

  async deactivate(id: string) {
    // Soft delete: nunca borrar usuarios. Las auditorías en stock_movements
    // necesitan que el user_id siga siendo una FK válida.
    const [user] = await sql`
      UPDATE users
      SET is_active = false, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, full_name, role, is_active
    `
    return user ?? null
  },
}