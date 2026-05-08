ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS pump_number INTEGER,
  ADD COLUMN IF NOT EXISTS nozzle_number INTEGER,
  ADD COLUMN IF NOT EXISTS mode TEXT;

UPDATE orders
SET pump_number = ((id - 1) % 8) + 1
WHERE pump_number IS NULL;

UPDATE orders
SET nozzle_number = ((id - 1) % 16) + 1
WHERE nozzle_number IS NULL;

UPDATE orders
SET mode = 'AUTOMATICO'
WHERE mode IS NULL;

ALTER TABLE orders
  ALTER COLUMN pump_number SET NOT NULL,
  ALTER COLUMN nozzle_number SET NOT NULL,
  ALTER COLUMN mode SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_orders_pump_number_positive'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT ck_orders_pump_number_positive CHECK (pump_number > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_orders_nozzle_number_positive'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT ck_orders_nozzle_number_positive CHECK (nozzle_number > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_orders_mode'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT ck_orders_mode CHECK (mode IN ('AUTOMATICO', 'MANUAL'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_pump_number ON orders (pump_number);
CREATE INDEX IF NOT EXISTS idx_orders_nozzle_number ON orders (nozzle_number);
