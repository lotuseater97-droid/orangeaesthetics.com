# Server-side business service boundary
Development contract only; no HTTP endpoint, database, login or deployment.

`app/lib/business-service.mjs` combines existing validation/state transitions with server-owned session resolution, active staff membership lookup, tenant-scoped record access and an audit callback. The client supplies a session credential, operation and allowed payload; the client never supplies its effective role or organization.

## Required production adapters
- `resolveSession(token)`: verify signed, unexpired, non-revoked server-side session, including MFA and CSRF where relevant.
- `resolveMembership(userId)`: fetch **server-owned** active staff membership and organization; must not use user-controlled metadata. Current adapter assumes a single staff organization; multi-organization support needs explicit organization selection and authorization.
- `repository.create/get/transition`: enforce tenant isolation in SQL/RLS and use transactions, row locks, idempotency, immutable audit, optimistic concurrency and database constraints. `get` must scope queries by organization. Never implement these adapters with browser-accessible service-role credentials.
- `audit`: production audit events must be persisted **atomically within the same database transaction** as the business change. The current demonstration callback is deliberately not atomic and is unsuitable for production.

## Known limitations
The service is a testable integration seam, not a secure running API. It does not enforce provider identity, appointment resource locking, Stripe reconciliation, server persistence, data retention, encryption, email delivery or rate limiting. No PHI should enter business CRM fields. The production service must also support verified membership changes, revocation and multi-tenant staff access.
