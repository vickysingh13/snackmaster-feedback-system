-- Refresh machine master data without dropping schema or submissions.
-- Keeps numeric id as primary key and stores real machine IDs in machine_code.
-- Run with: psql $DATABASE_URL -f backend/db/update_machines.sql

BEGIN;

-- 1) Ensure rows 1..15 contain the target machine data.
INSERT INTO machines (id, machine_code, location, area, status)
VALUES
  (1, '2143', 'WIPRO GOPANPALLY', 'GROUND FLOOR', 'active'),
  (2, '2144', 'WIPRO MANIKONDA 5', 'GROUND FLOOR', 'active'),
  (3, '2145', 'WIPRO MANIKONDA 4', 'GROUND FLOOR', 'active'),
  (4, '2632', 'WIPRO GOPANPALLY 1', 'GROUND FLOOR', 'active'),
  (5, '2633', 'WIPRO GOPANPALLY 2', 'GROUND FLOOR', 'active'),
  (6, '2634', 'WIPRO GOPANPALLY 3', 'GROUND FLOOR', 'active'),
  (7, '2642', 'WIPRO MANIKONDA 1', '9TH FLOOR', 'active'),
  (8, '2643', 'WIPRO MANIKONDA 2', '3RD FLOOR', 'active'),
  (9, '2644', 'WIPRO MANIKONDA 3', 'GROUND FLOOR', 'active'),
  (10, '2645', 'WIPRO MANIKONDA 6', 'GROUND FLOOR', 'active'),
  (11, '4772', 'DRAPER STARTUP HOUSE', 'GACHIBOWLI', 'active'),
  (12, 'VV00006', 'HOTEL SAYINN', 'GROUND FLOOR', 'active'),
  (13, 'vv00001', 'BOB', 'BANK OF BARODA GACHIBOWLI', 'active'),
  (14, 'vv00002', 'IIRM', 'IIRM FINANCIAL DIST', 'active'),
  (15, 'vv00003', 'UOH', 'UNIVERSITY OF HYDERABAD GACHIBOWLI', 'active')
ON CONFLICT (id) DO UPDATE
SET
  machine_code = EXCLUDED.machine_code,
  location = EXCLUDED.location,
  area = EXCLUDED.area,
  status = EXCLUDED.status;

-- 2) Remove any old dummy machines not in the new set.
-- Existing submissions stay intact via ON DELETE SET NULL on submissions.machine_id.
DELETE FROM machines
WHERE id NOT IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);

-- 3) Keep autoincrement in sync.
SELECT setval(
  pg_get_serial_sequence('machines', 'id'),
  COALESCE((SELECT MAX(id) FROM machines), 1),
  true
);

COMMIT;
