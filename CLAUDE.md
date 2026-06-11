# InventarioSoft — Sistema de gestión de inventario

## Stack
- Runtime: Bun v1.3.14
- Framework: Elysia
- BD: PostgreSQL 16 (Docker)
- Caché: Redis 7 (Docker)
- Cliente BD: Bun.sql (nativo)
- Cliente Redis: bun:redis (nativo)

## Comandos para iniciar el proyecto
1. Abrir Docker Desktop
2. `docker compose up -d`
3. `bun run index.ts`

## Estructura
src/
├── modules/
│   ├── products/   ✅ CRUD completo + caché Redis
│   └── inventory/  ✅ movimientos de stock + transacciones
└── shared/
├── db.ts       cliente PostgreSQL
└── redis.ts    cliente Redis
migrations/
└── 001_initial_schema.sql

## Estado actual
- ✅ Schema BD: 7 tablas (users, categories, suppliers, warehouses, products, inventory, stock_movements)
- ✅ Módulo products: GET, POST, PUT, DELETE con caché Redis
- ✅ Módulo inventory: GET all, GET by product, POST movement (entry/exit/adjustment)
- ✅ Transacciones PostgreSQL funcionando
- ✅ Alerta de stock mínimo funcionando
- ⬜ Módulo users + autenticación JWT
- ⬜ Módulo categories (CRUD simple)
- ⬜ Módulo suppliers (CRUD simple)
- ⬜ Módulo warehouses (CRUD simple)

## Variables de entorno (.env)
PORT=3000
DATABASE_URL=postgresql://inventario_user:inventario_pass@localhost:5432/inventario_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=cambia_esto_por_un_string_largo

## Decisiones importantes
- Soft delete en products/suppliers (is_active = false)
- stock_movements es append-only — nunca UPDATE ni DELETE
- ON DELETE RESTRICT en stock_movements para preservar historial
- CHECK (quantity >= 0) en inventory rechaza stock negativo a nivel BD
- UUID como PK en todas las tablas
- TIMESTAMPTZ en todos los timestamps