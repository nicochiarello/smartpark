-- ============================================================
-- SmartPark – Schema Supabase
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- Tabla de espacios físicos (los 4 lugares de la maqueta)
CREATE TABLE IF NOT EXISTS parking_spaces (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  address          TEXT NOT NULL,
  lat              DOUBLE PRECISION NOT NULL,
  lng              DOUBLE PRECISION NOT NULL,
  price_per_hour   NUMERIC(10,2) NOT NULL DEFAULT 1000,
  description      TEXT NOT NULL DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'reserved', 'occupied_valid', 'occupied_illegal')),
  current_license_plate TEXT,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de reservas (pagadas con mock MercadoPago)
CREATE TABLE IF NOT EXISTS reservations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id            TEXT NOT NULL REFERENCES parking_spaces(id),
  user_name           TEXT NOT NULL,
  license_plate       TEXT NOT NULL,
  date                DATE NOT NULL,
  time_from           TIME NOT NULL,
  time_to             TIME NOT NULL,
  amount_pesos        NUMERIC(10,2) NOT NULL,
  mp_mock_id          TEXT,
  blockchain_tx_hash  TEXT,
  status              TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de eventos de ocupación (log de CV + auditoría)
CREATE TABLE IF NOT EXISTS occupancy_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id            TEXT NOT NULL REFERENCES parking_spaces(id),
  license_plate       TEXT,
  occupied            BOOLEAN NOT NULL,
  is_valid            BOOLEAN,              -- null si occupied=false
  duration_seconds    INTEGER DEFAULT 0,
  blockchain_tx_hash  TEXT,
  detected_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Seed: 4 lugares de la maqueta
-- ============================================================
INSERT INTO parking_spaces (id, name, address, lat, lng, price_per_hour, description)
VALUES
  ('P1', 'Lugar P1', 'Maqueta SmartPark – Sector A', -32.8895, -68.8455, 1000,
   'Lugar de estacionamiento A1 de la maqueta física SmartPark.'),
  ('P2', 'Lugar P2', 'Maqueta SmartPark – Sector A', -32.8895, -68.8450, 1000,
   'Lugar de estacionamiento A2 de la maqueta física SmartPark.'),
  ('P3', 'Lugar P3', 'Maqueta SmartPark – Sector B', -32.8898, -68.8455, 1000,
   'Lugar de estacionamiento B1 de la maqueta física SmartPark.'),
  ('P4', 'Lugar P4', 'Maqueta SmartPark – Sector B', -32.8898, -68.8450, 1000,
   'Lugar de estacionamiento B2 de la maqueta física SmartPark.')
ON CONFLICT (id) DO NOTHING;
