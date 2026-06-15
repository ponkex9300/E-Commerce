-- Postgres initialization for relational module (customers, orders, roles)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  encrypted_card TEXT,
  last_login_at TIMESTAMPTZ,
  login_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS encrypted_card TEXT;

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS login_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  total NUMERIC(10,2),
  subtotal NUMERIC(10,2),
  item_count INT DEFAULT 0,
  status VARCHAR(30) DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS item_count INT DEFAULT 0;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'completed';

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT,
  quantity INT,
  price NUMERIC(10,2),
  product_name TEXT,
  product_brand TEXT,
  product_image TEXT,
  product_slug TEXT
);

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS product_name TEXT;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS product_brand TEXT;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS product_image TEXT;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS product_slug TEXT;

-- basic roles
INSERT INTO roles (name) VALUES ('admin') ON CONFLICT DO NOTHING;
INSERT INTO roles (name) VALUES ('user') ON CONFLICT DO NOTHING;
