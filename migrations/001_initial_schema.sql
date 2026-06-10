-- ============================================================
-- Migración 001 — Schema inicial del sistema de inventario

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'operator'
                  CHECK (role IN ('admin', 'operator', 'viewer')),
    is_active     BOOLEAN      NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


CREATE TABLE categories (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,

    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


CREATE TABLE suppliers (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255),
    phone      VARCHAR(50),
    address    TEXT,
    is_active  BOOLEAN      NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE warehouses (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(255) NOT NULL,
    location   TEXT,
    is_active  BOOLEAN      NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    sku           VARCHAR(100)  NOT NULL UNIQUE,
    name          VARCHAR(255)  NOT NULL,
    description   TEXT,
    category_id   UUID          REFERENCES categories(id) ON DELETE SET NULL,
    supplier_id   UUID          REFERENCES suppliers(id)  ON DELETE SET NULL,
    unit_price    NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    unit          VARCHAR(50)   NOT NULL DEFAULT 'unidad',
    minimum_stock INTEGER       NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
    is_active     BOOLEAN       NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id   UUID        NOT NULL REFERENCES products(id)   ON DELETE CASCADE,
    warehouse_id UUID        NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity     INTEGER     NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, warehouse_id)
);


CREATE TABLE stock_movements (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id   UUID        NOT NULL REFERENCES products(id)   ON DELETE RESTRICT,
    warehouse_id UUID        NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    user_id      UUID        REFERENCES users(id) ON DELETE SET NULL,
    type         VARCHAR(20) NOT NULL
                 CHECK (type IN ('entry', 'exit', 'adjustment', 'transfer')),
    quantity     INTEGER     NOT NULL,
    notes        TEXT,
    reference    VARCHAR(255),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- Listar productos por categoría
CREATE INDEX idx_products_category_id   ON products(category_id);
-- Listar productos por proveedor
CREATE INDEX idx_products_supplier_id   ON products(supplier_id);
-- Buscar producto por SKU (ya tiene UNIQUE, pero índice explícito para claridad)
CREATE INDEX idx_products_sku           ON products(sku);

-- Ver todo el stock de un producto (en todos sus almacenes)
CREATE INDEX idx_inventory_product_id   ON inventory(product_id);
-- Ver todo el stock de un almacén (todos sus productos)
CREATE INDEX idx_inventory_warehouse_id ON inventory(warehouse_id);

-- Ver historial de movimientos de un producto
CREATE INDEX idx_movements_product_id   ON stock_movements(product_id);
-- Ver movimientos de un almacén
CREATE INDEX idx_movements_warehouse_id ON stock_movements(warehouse_id);
-- Ver movimientos recientes (DESC porque casi siempre quieres los más nuevos primero)
CREATE INDEX idx_movements_created_at   ON stock_movements(created_at DESC);
-- Ver qué hizo un usuario específico (auditoría)
CREATE INDEX idx_movements_user_id      ON stock_movements(user_id);
