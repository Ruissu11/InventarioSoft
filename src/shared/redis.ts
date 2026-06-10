import { redis } from "bun"

// redis es el cliente singleton de Bun.
// Lee REDIS_URL automáticamente — no necesitas instalar ioredis ni node-redis.
// Soporta todos los comandos Redis estándar: get, set, del, incr, expire, etc.
export default redis
