-- DRAFT ONLY. Do not apply until legal, schema and security review.
-- Append-only audit of benefit history. No PHI in event payloads.
CREATE TABLE IF NOT EXISTS benefit_history_events (
 id uuid PRIMARY KEY,
 grant_id uuid NOT NULL REFERENCES benefit_grants(id),
 event_type text NOT NULL CHECK(event_type IN ('issued','redeemed','expired','restored','expiration_overridden','refunded','redemption_reversed')),
 quantity integer NOT NULL CHECK(quantity > 0),
 event_at timestamptz NOT NULL DEFAULT now(),
 actor_id uuid REFERENCES app_users(id),
 reason_code text NOT NULL,
 terms_version text NOT NULL,
 idempotency_key text NOT NULL UNIQUE,
 related_event_id uuid REFERENCES benefit_history_events(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS benefit_history_grant_time_idx ON benefit_history_events(grant_id,event_at,id);
-- Production requirements: append-only permissions and trigger, owner/manager RLS,
-- verified billing period provenance, atomic redemption transaction, encrypted backups,
-- retention schedule, and tested restore. No public SELECT/INSERT/UPDATE/DELETE grants.
