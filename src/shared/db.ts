import { sql } from "bun"

// sql es un singleton que Bun crea automáticamente leyendo DATABASE_URL.
// No necesitas instalar pg, postgres.js ni ningún driver externo.
// Internamente maneja un pool de conexiones — no crea una conexión nueva
// por cada query, las reutiliza eficientemente.
export default sql
