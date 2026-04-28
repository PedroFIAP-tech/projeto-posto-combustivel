CREATE TABLE IF NOT EXISTS "User" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'frentista'
);

CREATE TABLE IF NOT EXISTS "Fuel" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "price_per_liter" DOUBLE PRECISION NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Order" (
  "id" SERIAL PRIMARY KEY,
  "total_value" DOUBLE PRECISION NOT NULL,
  "liters_delivered" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDENTE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "user_id" INTEGER NOT NULL REFERENCES "User"("id"),
  "fuel_id" INTEGER NOT NULL REFERENCES "Fuel"("id")
);

CREATE INDEX IF NOT EXISTS "idx_Order_status" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "idx_Order_created_at" ON "Order"("created_at");
CREATE INDEX IF NOT EXISTS "idx_Order_user_id" ON "Order"("user_id");
CREATE INDEX IF NOT EXISTS "idx_Order_fuel_id" ON "Order"("fuel_id");
