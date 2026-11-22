-- REVIEW-ONLY PostgreSQL draft. Do NOT apply without dedicated backend, authorization and compliance review.
-- Complements app/schema.sql and app/qr-checkin-schema.draft.sql.
-- This is structural integrity, NOT a working redemption endpoint or security policy.

-- A QR credential can be used for at most one check-in.
CREATE UNIQUE INDEX IF NOT EXISTS uq_member_checkins_qr ON member_checkins(qr_credential_id)
 WHERE qr_credential_id IS NOT NULL;

-- Each visit may have only one confirmed redemption. Compensating reversal is a separate event.
ALTER TABLE benefit_redemptions ADD COLUMN IF NOT EXISTS checkin_id uuid REFERENCES member_checkins(id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_benefit_redemptions_checkin ON benefit_redemptions(checkin_id)
 WHERE checkin_id IS NOT NULL AND state='confirmed';

-- A grant's available quantity is computed under lock, not stored in a client-controlled balance.
-- The draft base schema's benefit_redemptions.state='reversed' overwrites history;
-- production should use append-only reversal events and never erase original confirmations.
CREATE TABLE IF NOT EXISTS benefit_redemption_reversals (
 id uuid PRIMARY KEY,
 redemption_id uuid NOT NULL UNIQUE REFERENCES benefit_redemptions(id),
 approved_by uuid NOT NULL REFERENCES app_users(id),
 reason_code text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);

-- Record the idempotent operation outcome separately from user-provided request data.
CREATE TABLE IF NOT EXISTS redemption_requests (
 id uuid PRIMARY KEY,
 idempotency_key text NOT NULL UNIQUE,
 checkin_id uuid NOT NULL REFERENCES member_checkins(id),
 staff_id uuid NOT NULL REFERENCES app_users(id),
 redemption_id uuid UNIQUE REFERENCES benefit_redemptions(id),
 state text NOT NULL CHECK(state IN ('pending','confirmed','rejected')),
 created_at timestamptz NOT NULL DEFAULT now()
);

-- REQUIRED SERVER TRANSACTION ALGORITHM (not implemented):
-- BEGIN; authenticate server session and enforce staff role/MFA; lock idempotency key;
-- SELECT checkin FOR UPDATE; ensure identity verified, clinician clearance and service performed;
-- SELECT eligible paid subscription and benefit grant FOR UPDATE;
-- COUNT confirmed redemptions excluding authorized reversals; require count < quantity;
-- INSERT benefit_redemptions + redemption_requests + audit event; COMMIT;
-- On unique conflict retry read the original result; do not grant additional credit.
-- Lock order must be consistent across concurrent requests to avoid deadlocks.
-- A clinical clearance reference must come from approved EHR workflow, not staff browser boolean.
-- SECURITY: revoke public privileges, apply least privilege, row security and audit policies separately.
