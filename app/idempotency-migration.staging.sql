-- REVIEW ONLY: apply solely to a dedicated Orange Aesthetics database after review.
-- Existing oa_idempotency_keys has request_hash and result_ref; add durable status/result.
ALTER TABLE public.oa_idempotency_keys
 ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
 CHECK (status IN ('pending','committed'));
ALTER TABLE public.oa_idempotency_keys
 ADD COLUMN IF NOT EXISTS result_json jsonb;
-- An older row with result_ref but no result_json is intentionally not replayable.
-- No migration of legacy results is attempted; manual reconciliation is required.
