# PostgreSQL business write stack (restricted transition-only integration)

The new `postgres-business-write-stack.mjs` wires verified session and organization-scoped staff membership to the transactional business service, PostgreSQL connection-pinned transaction runner, tenant-scoped row locking/status transitions/audit SQL, and durable financial idempotency. Each transition is executed on **one** checked-out PostgreSQL connection. A failed audit or idempotency finalization rolls back the entire transaction.

The exported API intentionally exposes **transitions only**. Record creation is not exposed; the internal create operation rejects requests because the existing schema and create payloads have not yet been reconciled. Financial transitions such as invoice `paid` still require accounting reconciliation and verified payment events before production use. This is not deployed.

Tests use a synthetic pg-compatible pool; real PostgreSQL concurrency tests, migration review, accounting constraints and Orange-only credentials are outstanding.
