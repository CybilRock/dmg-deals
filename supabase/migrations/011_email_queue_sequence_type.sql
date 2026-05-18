-- Migration 011: Add sequence_type to email_queue for multi-sequence routing
ALTER TABLE email_queue
  ADD COLUMN IF NOT EXISTS sequence_type text NOT NULL DEFAULT 'consumer'
    CHECK (sequence_type IN ('consumer', 'agent'));

CREATE INDEX IF NOT EXISTS email_queue_sequence_idx
  ON email_queue (sequence_type, status, scheduled_at);
