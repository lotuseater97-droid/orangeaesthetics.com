# Tenant-scoped PostgreSQL transitions and audit

The `postgres-business-transitions.mjs` adapter adds concrete SQL for locking an existing business record (`SELECT ... FOR UPDATE`), updating its status only when the previous state matches, and inserting an audit record. Every query uses bound parameters for identifiers and values, with fixed allowlisted table names. Use these operations **only inside** `createPostgresTransactionRunner`'s callback so audit and update commit or roll back together.

This is a partial domain adapter, **not a complete financial write path**: financial creation, durable idempotency claim/finalization and real database integration remain outstanding. The adapter deliberately does not pretend to implement those features. No database was changed or deployed.

The current staging schema stores audit action, actor, organization and record identity but not old/new state; add a reviewed migration if state-specific audit detail is required.
