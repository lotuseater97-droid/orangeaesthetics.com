-- Orange Aesthetics Neon development migration 002
-- Run only after migration 001 (initial orange_app tables).
-- Development/synthetic data only. NOT HIPAA production authorization.
-- Redemption API must derive staff identity from a verified server-side session.
BEGIN;
ALTER TABLE orange_app.redemptions ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS uq_redemptions_idempotency ON orange_app.redemptions(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_redemptions_active_grant ON orange_app.redemptions(grant_id) WHERE status='completed';
CREATE INDEX IF NOT EXISTS idx_orders_member ON orange_app.orders(member_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grants_member ON orange_app.benefit_grants(member_id,expires_at);
-- Never grant direct browser/public execution of redemption routines.
REVOKE ALL ON SCHEMA orange_app FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA orange_app FROM PUBLIC;
REVOKE ALL ON FUNCTION orange_app.redeem_credit(uuid,uuid,integer,text) FROM PUBLIC;
COMMIT;
