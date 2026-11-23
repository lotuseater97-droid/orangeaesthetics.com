# Transactional business service — development contract

The new `transactional-business-service.mjs` is an alternative, stricter write orchestration layer to the earlier non-atomic `business-service.mjs`. It is **not a running database**.

The caller supplies only a session token and operation; effective organization, role and identity come from verified server-side adapters. Every create/transition happens inside a supplied transaction. Financial writes require a durable idempotency claim, business mutation, audit record and finalized response in **one transaction**. A retry with the same key and canonical request returns the previous result; a changed request must be rejected by the adapter.

## Mandatory adapter guarantees before production
- `withTransaction` must start a real database transaction and roll back on **any** thrown error, including audit and idempotency finalization.
- `getForUpdate` must lock the organization-scoped record and prevent concurrent stale transitions.
- `claimIdempotency` must enforce uniqueness and compare a canonical operation/request fingerprint; the sample tests use mocks and do not prove this property.
- `audit` must persist an immutable record inside the same transaction.
- Database RLS, authorization, encrypted secrets, MFA, session revocation, CSRF, rate limits, retention and restore drills remain required.
- Never send clinical chart data or PHI into this business layer.

The previous `business-service.mjs` remains for compatibility but is not suitable as the production write path because its audit callback runs outside the database mutation.

## Verified organization binding (security update)
The transactional write service now requires `verifySession(token)` to return both an active `user_id` and an explicit `organization_id`. It calls `lookupStaff({user_id,organization_id})` and rejects any membership whose organization differs from the verified session. This prevents multi-organization users from accidentally or maliciously writing to a different organization's financial records. Missing organization or mismatched membership is denied **before starting a transaction**. Update any server integration that previously used `lookupStaff(user_id)`; do not derive the active organization from unverified request input.
