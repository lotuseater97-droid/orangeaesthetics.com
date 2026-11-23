# Financial idempotency: canonical fingerprint and database requirements

The new `idempotency-fingerprint.mjs` deterministically fingerprints an **already validated** invoice or expense request, including organization, operation, kind, target record, requested status and allowlisted payload. It uses Node's SHA-256; no credentials or sensitive data should be included in the request. JSON object key ordering is normalized.

## Durable adapter algorithm (not deployed)
Within one database transaction:
1. Obtain a unique claim for `(organization_id, idempotency_key)`. This must use a database unique constraint and concurrency-safe locking; a read-then-insert without a constraint is unsafe.
2. Compare the stored fingerprint to the newly calculated fingerprint. A mismatch rejects key reuse.
3. A committed identical request returns its stored result without repeating the mutation or audit event.
4. A new claim proceeds to the authorized mutation, immutable audit insertion and final committed result, all within the same transaction.
5. On any failure, roll back all writes and allow a safe retry.

`evaluateIdempotencyRecord` is a pure policy helper, not a database lock or proof of transactional correctness. `fingerprintOperation` must only receive server-validated, canonicalized business payloads. The application must not expose secret session tokens, full financial details or sensitive data in logs.

## Current blockers
A dedicated Orange Aesthetics database, a transaction-capable adapter, a verified session implementation and end-to-end concurrent request tests remain necessary. No changes were made to Silver Iris infrastructure.
