# Owner read pipeline: full server composition

`owner-read-stack.mjs` composes the previously separate read components into a single framework-neutral handler:

HTTP GET -> trusted token extraction -> verified session with explicit active organization -> organization-bound active staff membership SQL lookup -> role-aware parameterized business SQL -> tenant/assignment verification -> allowlisted JSON.

`owner-read-stack.test.mjs` tests the entire chain through the HTTP boundary using a synthetic SQL executor, including denial and leakage paths. This tests integration, **not real PostgreSQL execution**.

## Not ready for production
No live HTTP route is registered. The public Cloudflare static Worker remains unchanged. Before deployment provide an Orange-only database, a verified session provider, a real trusted SQL client, secure cookie/origin policy, request throttling, timeouts, operational logging without PHI, and real-database security/integration tests. The current database schema is review-only and has not been applied.
