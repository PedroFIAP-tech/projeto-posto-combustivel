DO $$
BEGIN
  IF to_regclass('public.users') IS NULL AND to_regclass('public."User"') IS NOT NULL THEN
    ALTER TABLE "User" RENAME TO users;
  END IF;

  IF to_regclass('public.fuels') IS NULL AND to_regclass('public."Fuel"') IS NOT NULL THEN
    ALTER TABLE "Fuel" RENAME TO fuels;
  END IF;

  IF to_regclass('public.orders') IS NULL AND to_regclass('public."Order"') IS NOT NULL THEN
    ALTER TABLE "Order" RENAME TO orders;
  END IF;
END $$;

ALTER INDEX IF EXISTS "idx_Order_status" RENAME TO idx_orders_status;
ALTER INDEX IF EXISTS "idx_Order_created_at" RENAME TO idx_orders_created_at;
ALTER INDEX IF EXISTS "idx_Order_user_id" RENAME TO idx_orders_user_id;
ALTER INDEX IF EXISTS "idx_Order_fuel_id" RENAME TO idx_orders_fuel_id;
