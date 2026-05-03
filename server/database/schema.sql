CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subcategories (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category_id, id)
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,

  category_id TEXT NOT NULL REFERENCES categories(id),
  subcategory_id TEXT REFERENCES subcategories(id),

  brand TEXT NOT NULL DEFAULT '',
  product_type TEXT NOT NULL DEFAULT '',
  country_of_origin TEXT NOT NULL DEFAULT '',

  description TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT '',
  benefits TEXT NOT NULL DEFAULT '',

  unit TEXT NOT NULL DEFAULT '1 шт',
  package_info TEXT NOT NULL DEFAULT 'продається поштучно',

  composition TEXT NOT NULL DEFAULT '',
  allergens TEXT NOT NULL DEFAULT '',
  storage_conditions TEXT NOT NULL DEFAULT '',

  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  old_price NUMERIC(10, 2),

  image TEXT NOT NULL DEFAULT '',

  popular BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  purchase_count INTEGER NOT NULL DEFAULT 0,

  stock_status TEXT NOT NULL DEFAULT 'in_stock',
  stock_quantity INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  telegram TEXT NOT NULL DEFAULT '',

  building TEXT NOT NULL DEFAULT '',
  entrance TEXT NOT NULL DEFAULT '',
  floor TEXT NOT NULL DEFAULT '',
  apartment TEXT NOT NULL DEFAULT '',

  password_hash TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number INTEGER NOT NULL UNIQUE,

  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,

  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL DEFAULT '',
  customer_telegram TEXT NOT NULL DEFAULT '',

  delivery_type TEXT NOT NULL DEFAULT 'pickup',
  building TEXT NOT NULL DEFAULT '',
  entrance TEXT NOT NULL DEFAULT '',
  floor TEXT NOT NULL DEFAULT '',
  apartment TEXT NOT NULL DEFAULT '',

  payment_method TEXT NOT NULL DEFAULT 'Після підтвердження',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',

  status TEXT NOT NULL DEFAULT 'new',

  comment TEXT NOT NULL DEFAULT '',
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,

  is_final BOOLEAN NOT NULL DEFAULT false,
  final_type TEXT,
  finalized_at TIMESTAMPTZ,
  cancel_reason TEXT NOT NULL DEFAULT '',
  stock_restored_at TIMESTAMPTZ,

  ready_telegram_notification JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  package_info TEXT NOT NULL DEFAULT '',

  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,

  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  cost_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  profit NUMERIC(10, 2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  type TEXT NOT NULL,
  label TEXT NOT NULL,

  status_from TEXT,
  status_to TEXT,

  payment_from TEXT,
  payment_to TEXT,

  reason TEXT NOT NULL DEFAULT '',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_counters (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);