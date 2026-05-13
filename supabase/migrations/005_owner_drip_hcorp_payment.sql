-- Migration 005: Owner flag, DVC drip commission tracking, HCorp payment tracking

-- People: flag the business owner so deals they close have zero consultant payout
ALTER TABLE people ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;

-- Deals: DVC No-Deposit drip commission (consultant's 5% paid as drip installments arrive)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS drip_remaining_payout numeric NOT NULL DEFAULT 0;

-- Deals: HolidayCorp payment tracking (deposit / full / full_finance)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS hcorp_payment_type text
  CHECK (hcorp_payment_type IN ('full', 'deposit', 'full_finance'));
ALTER TABLE deals ADD COLUMN IF NOT EXISTS hcorp_amount_paid numeric NOT NULL DEFAULT 0;

-- Mark Cybil as the owner (update email if needed)
-- UPDATE people SET is_owner = true WHERE email = 'cybil777744@gmail.com';
-- Or by name if email not set:
-- UPDATE people SET is_owner = true WHERE name ILIKE 'cybil%';
