-- Migration 006: Comms log — calls, emails, whatsapp, and notes against a person record

CREATE TABLE comms_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  person_id   uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('call', 'email', 'whatsapp', 'note')),
  direction   text CHECK (direction IN ('inbound', 'outbound')),  -- null for notes
  summary     text NOT NULL,
  logged_by   text  -- name of the admin who logged it
);

CREATE INDEX ON comms_log(person_id, created_at DESC);

-- Explicit grants (required from Supabase May 30 2026+)
GRANT SELECT, INSERT, DELETE ON comms_log TO authenticated;
GRANT SELECT, INSERT, DELETE ON comms_log TO service_role;
