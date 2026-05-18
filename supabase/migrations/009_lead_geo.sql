-- Migration 009: Add geo columns to leads for IP-based location capture
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS city   text,
  ADD COLUMN IF NOT EXISTS region text;
