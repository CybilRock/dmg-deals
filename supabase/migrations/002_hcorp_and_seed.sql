-- Migration 002: HolidayCorp deposit_type values + seed data

-- Extend deposit_type constraint to include HolidayCorp membership terms
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_deposit_type_check;
ALTER TABLE deals ADD CONSTRAINT deals_deposit_type_check CHECK (deposit_type IN (
  '10pct', '25to49pct', '50pct', 'no_deposit', 'self_generated', 'upgrade',
  'hcorp_3yr', 'hcorp_5yr', 'hcorp_10yr'
));

-- Seed opening DHR debt balance (retention owed by DHR as at May 2026)
INSERT INTO dhr_debt_ledger (entry_type, amount, notes)
VALUES ('opening_balance', 1500000, 'Opening balance — DHR retention as at May 2026');

-- Add Debbie as booker
INSERT INTO people (name, role, active)
VALUES ('Debbie', 'booker', true);
