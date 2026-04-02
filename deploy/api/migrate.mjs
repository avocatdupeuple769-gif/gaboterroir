import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SQL = `
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('acheteur', 'producteur', 'transporteur');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('disponible', 'epuise', 'suspendu');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('en_attente', 'paye', 'en_livraison', 'livre', 'annule');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('airtel_money', 'moov_money', 'wallet');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('depot', 'retrait', 'vente', 'achat', 'commission');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL DEFAULT '',
  prenom TEXT NOT NULL DEFAULT '',
  telephone TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'acheteur',
  ville TEXT NOT NULL DEFAULT '',
  quartier TEXT NOT NULL DEFAULT '',
  province TEXT NOT NULL DEFAULT 'Estuaire',
  photo_profile TEXT NOT NULL DEFAULT '',
  cni_verified BOOLEAN NOT NULL DEFAULT false,
  wallet_solde NUMERIC(12, 2) NOT NULL DEFAULT 0,
  is_kyc_verified BOOLEAN NOT NULL DEFAULT false,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
  total_sales INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  producteur_id TEXT NOT NULL REFERENCES users(id),
  nom TEXT NOT NULL,
  categorie TEXT NOT NULL,
  prix NUMERIC(10, 2) NOT NULL,
  unite TEXT NOT NULL DEFAULT 'kg',
  quantite_disponible NUMERIC(10, 2) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  province TEXT NOT NULL DEFAULT 'Estuaire',
  ville TEXT NOT NULL DEFAULT '',
  statut product_status NOT NULL DEFAULT 'disponible',
  photos TEXT[] NOT NULL DEFAULT '{}',
  video_url TEXT,
  is_flash_sale BOOLEAN NOT NULL DEFAULT false,
  flash_sale_price NUMERIC(10, 2),
  flash_sale_expiry TIMESTAMP,
  via_sms BOOLEAN NOT NULL DEFAULT false,
  via_ussd BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  acheteur_id TEXT NOT NULL REFERENCES users(id),
  producteur_id TEXT NOT NULL REFERENCES users(id),
  transporteur_id TEXT REFERENCES users(id),
  statut order_status NOT NULL DEFAULT 'en_attente',
  montant_total NUMERIC(10, 2) NOT NULL,
  code_sequestre TEXT NOT NULL,
  payment_method payment_method NOT NULL DEFAULT 'airtel_money',
  payment_ref TEXT,
  adresse_livraison TEXT NOT NULL DEFAULT '',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantite NUMERIC(10, 2) NOT NULL,
  prix_unitaire NUMERIC(10, 2) NOT NULL,
  sous_total NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS mobile_money_transactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  order_id INTEGER REFERENCES orders(id),
  montant NUMERIC(10, 2) NOT NULL,
  type transaction_type NOT NULL,
  payment_method payment_method NOT NULL,
  telephone TEXT NOT NULL,
  reference TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en_attente',
  metadata TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_logs (
  id SERIAL PRIMARY KEY,
  from_tel TEXT NOT NULL,
  to_tel TEXT NOT NULL,
  message TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'entrant',
  processed BOOLEAN NOT NULL DEFAULT false,
  action TEXT,
  result TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ussd_sessions (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  telephone TEXT NOT NULL,
  current_step TEXT NOT NULL DEFAULT 'menu',
  data TEXT NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

async function migrate() {
  console.log("GaboTerroir - Running database migrations...");
  const client = await pool.connect();
  try {
    await client.query(SQL);
    console.log("✓ Migrations completed successfully!");
  } catch (err) {
    console.error("✗ Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
