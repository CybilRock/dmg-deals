-- Migration 010: Email queue for B2C nurture sequences
CREATE TABLE IF NOT EXISTS email_queue (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       uuid        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  email_number  int         NOT NULL CHECK (email_number BETWEEN 1 AND 5),
  scheduled_at  timestamptz NOT NULL,
  sent_at       timestamptz,
  status        text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lead_id, email_number)
);

CREATE INDEX IF NOT EXISTS email_queue_pending_idx
  ON email_queue (scheduled_at)
  WHERE status = 'pending';
