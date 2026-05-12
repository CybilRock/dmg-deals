-- Migration 004: Partner self-registration — add status to people
ALTER TABLE people
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved'
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- Existing rows (Debbie etc.) default to approved — no manual update needed
