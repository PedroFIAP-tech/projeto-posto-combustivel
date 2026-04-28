UPDATE orders
SET fuel_id = keeper.id
FROM fuels duplicate
JOIN fuels keeper
  ON keeper.name = duplicate.name
 AND keeper.id < duplicate.id
WHERE orders.fuel_id = duplicate.id;

DELETE FROM fuels duplicate
USING fuels keeper
WHERE duplicate.name = keeper.name
  AND duplicate.id > keeper.id;

CREATE UNIQUE INDEX IF NOT EXISTS ux_fuels_name ON fuels (name);
