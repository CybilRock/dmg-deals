-- Link deals to the specific booker who worked the pre-sales
ALTER TABLE deals ADD COLUMN IF NOT EXISTS booker_id uuid REFERENCES people(id);
CREATE INDEX IF NOT EXISTS idx_deals_booker_id ON deals(booker_id);
