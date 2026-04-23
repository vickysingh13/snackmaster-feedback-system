-- Add fields required by full admin control features.
-- Run with: psql $DATABASE_URL -f backend/db/alter_admin_control_fields.sql

BEGIN;

ALTER TABLE machines
  ADD COLUMN IF NOT EXISTS name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS qr_code_url VARCHAR(255),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS refund_status VARCHAR(30) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS admin_remarks TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'submissions_refund_status_check'
  ) THEN
    ALTER TABLE submissions
      ADD CONSTRAINT submissions_refund_status_check
      CHECK (refund_status IN ('pending', 'processing', 'completed'));
  END IF;
END $$;

UPDATE submissions
SET refund_status = 'pending'
WHERE type = 'refund' AND (refund_status IS NULL OR refund_status = '');

COMMIT;
