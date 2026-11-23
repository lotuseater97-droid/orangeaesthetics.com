# Transaction-scoped financial idempotency

`postgres-idempotency.mjs` implements an atomic PostgreSQL claim/finalize protocol for financial writes. It uses a unique (organization_id,key) insert with `ON CONFLICT DO NOTHING`, canonical SHA-256 fingerprint, committed-result replay, and a conditional update that stores the completed result in the **same transaction**. Concurrent duplicate inserts serialize on the unique index under PostgreSQL READ COMMITTED; the adapter must not be used under a different isolation level without testing.

`idempotency-migration.staging.sql` adds `status` and `result_json` to the existing review-only schema. **It has not been applied.** Older incomplete records intentionally fail closed.

The adapter requires one dedicated transaction-scoped query client and must be created anew per transaction. It is not a standalone HTTP endpoint and does not yet complete the full business write adapter. All tests use simulated SQL responses; real PostgreSQL concurrency and rollback tests remain mandatory before deployment.
