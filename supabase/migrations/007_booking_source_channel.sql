-- Migration 007: Add 'calculator' and 'website' as valid source_channel values
-- Required for the public booking page that self-books from the HB calculator CTA

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_channel_check;

ALTER TABLE leads
  ADD CONSTRAINT leads_source_channel_check
  CHECK (source_channel IN (
    'meta_ad', 'tiktok_ad', 'referral', 'walk_in', 'cold_call', 'other',
    'calculator', 'website'
  ));
