# Orange Aesthetics application foundation

**Code scaffold, NOT deployed and NOT production-ready.** Static site remains unchanged. Do not direct real customers here.

## Design
- `catalog.json` is a **draft server-owned allowlist**, never an authoritative price until approved. No weight-loss medication SKUs or prices.
- `lib/ledger.mjs` contains pure, deterministic accounting helpers and guards. Real production credits must be committed transactionally in a protected database.
- `lib/stripe-events.mjs` classifies signed Stripe events **after** a server verifies signatures. No customer or clinical information is stored.
- `schema.sql` is a proposed PostgreSQL migration, **not applied**. No database has been created.
- `tests/*.test.mjs` run with Node.js built-in test runner: `node --test app/tests/*.test.mjs` from repository root.

## Integration plan
1. Provision dedicated HIPAA-reviewed hosting/database, separate staging and production, authentication and MFA.
2. Confirm legal/merchant review, approved catalog, contract, sales tax and refund policies.
3. Integrate Stripe-hosted Checkout, Billing and Customer Portal using server-side credentials and webhook signature verification. Never put PHI in Stripe.
4. Persist payment events, subscriptions and entitlements in an ACID database; enforce authorization and idempotency. Implement audit logs, backups and monitoring.
5. Add real member/staff/owner UIs only after secure authentication and role tests.

**Do not paste Stripe secret keys into GitHub or chat.**
