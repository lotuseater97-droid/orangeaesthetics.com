-- DRAFT ONLY: review and apply in a protected dedicated backend with server-side authorization.
-- No patient names, DOB, clinical notes or raw QR tokens in this schema.
CREATE TABLE IF NOT EXISTS member_qr_credentials (
 id uuid PRIMARY KEY, member_id uuid NOT NULL REFERENCES app_users(id), token_hash text NOT NULL UNIQUE,
 issued_at timestamptz NOT NULL, expires_at timestamptz NOT NULL, revoked_at timestamptz,
 consumed_at timestamptz, CHECK(expires_at>issued_at)
);
CREATE INDEX IF NOT EXISTS member_qr_credentials_member_idx ON member_qr_credentials(member_id,expires_at);
CREATE TABLE IF NOT EXISTS member_checkins (
 id uuid PRIMARY KEY, member_id uuid NOT NULL REFERENCES app_users(id), scanned_by uuid NOT NULL REFERENCES app_users(id),
 qr_credential_id uuid REFERENCES member_qr_credentials(id), status text NOT NULL CHECK(status IN
 ('scanned','identity_verified','eligibility_verified','awaiting_clinical_clearance','cleared','service_performed','redeemed','cancelled')),
 visit_reference text UNIQUE, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS checkin_transitions (
 id uuid PRIMARY KEY, checkin_id uuid NOT NULL REFERENCES member_checkins(id), actor_id uuid NOT NULL REFERENCES app_users(id),
 from_status text, to_status text NOT NULL, occurred_at timestamptz NOT NULL DEFAULT now()
);
-- Transactional requirements (NOT provided by this draft):
-- 1. Lock QR credential, validate hash/expiry/revocation and consume atomically.
-- 2. Never expose raw QR tokens or token hashes in staff browser responses.
-- 3. Verify two patient identifiers via approved protected workflow; do not store them in QR.
-- 4. Check subscription payment, credits, approved service and clinician clearance independently.
-- 5. Lock benefit grant and redemption count in same transaction, with idempotency key and audit event.
-- 6. Enforce tenant isolation, RLS/least privilege, secure backups and retention before deployment.
