# PostgreSQL transaction runner — integration boundary

`createPostgresTransactionRunner({pool})` accepts a dedicated server-only pg-compatible pool. Each call checks out one connection, runs `BEGIN`, executes all callback SQL on that same connection, and `COMMIT`s only after the callback succeeds. Failure triggers `ROLLBACK` and the connection is released. A rollback failure is surfaced as an `AggregateError`, not silently treated as successful.

This is an actual PostgreSQL transaction orchestration implementation, but **it has only been tested with a mocked pg-compatible client**, not a real Orange database. It does not yet supply the domain-specific `tx.create/getForUpdate/transition/audit/claimIdempotency/finishIdempotency` methods required by `transactional-business-service.mjs`.

Do not deploy until an Orange-only database exists, the domain adapter is implemented, real PostgreSQL rollback/concurrency tests pass, and pool credentials are securely stored server-side. Never reuse the Silver Iris database.
