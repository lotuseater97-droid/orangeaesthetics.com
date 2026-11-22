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

## Additional foundation helpers
- `lib/webhook-signature.mjs`: Stripe raw-body signature verification with timestamp tolerance; not an HTTP endpoint.
- `lib/checkout-policy.mjs`: fail-closed checkout eligibility validation. Draft catalog remains disabled.
- `lib/owner-metrics.mjs`: deterministic owner financial totals and stock movements; not connected to real records.
- `tests/integration-policy.test.mjs`: test source for the above; **not executed yet**.

### Same-bag / same-line safety foundation
`lib/same-bag-engine.mjs` is a pure, fail-closed validation engine for exact ingredient combinations and formulation constraints. `tests/same-bag-engine.test.mjs` contains synthetic test fixtures (not medical recommendations). No real IV admixture has been approved and no production ordering endpoint is connected. All clinical compatibility decisions require a licensed pharmacist/medical director and documented formulation-specific evidence. Never use test policy fixtures in production.


## Business management and backup decision — 2026-11-22
Owner wants the authenticated Orange Aesthetics platform to operate the business end-to-end, with independently recoverable data and downloadable owner archives. See [BUSINESS-OPERATIONS-BACKUP-PLAN.md](../BUSINESS-OPERATIONS-BACKUP-PLAN.md) for the implementation and security specification.
- Target: daily encrypted full database backups, weekly independent immutable offsite copies, monthly owner-downloadable audited business archives, quarterly actual restore drills, and failure alerts. Continuous PITR preferred if supported.
- Owner dashboard must include Backup Center, last verified successful job, backup history, downloadable monthly archive and restore-test evidence. Owner exports must exclude clinical charts and payment credentials; HIPAA-sensitive records require separate approved workflow.
- Retain expired IV credits, issuance, redemptions, refunds and legal restorations in immutable history. Backups are distinct from historical event logs. No automatic 90-day forfeiture without California counsel signoff.
- Added pure `app/lib/export-manifest.mjs` and five `app/tests/export-manifest.test.mjs` test cases for file hashes/manifest integrity. **No real archive, storage, scheduled job, owner download or restoration is implemented; tests have not been executed.**
- Next dependencies: protected backend, BAA/security decisions, authenticated owner endpoint, real backup provider, independent storage, tested restoration, approved retention policy.


## Silver Iris business architecture adaptation — 2026-11-22
- Reviewed **Silver Iris Farms Google Drive** business master plan and completion work order, plus private GitHub `naria-collab/SILVERIRISFARMS` README, implementation decisions, Business/Finances/dashboard code and role-aware application layout. **Silver Iris was read-only and unchanged.**
- Adapted ONLY useful business architecture: one protected owner/staff/member system, grouped workspaces, owner Business/Finances overview, inquiries, scheduling, invoices, cash/check deposit reconciliation, expenses, vendors, inventory, reports, tasks, staff permissions, audit events and backup center. Did NOT copy equestrian entities, voice workflows, styling, themes, assets, credentials or data.
- Created `app/BUSINESS-PLATFORM-STRUCTURE.md`, `app/lib/business-navigation.mjs`, `app/lib/business-operations.mjs`, `app/lib/workflow-rules.mjs`, synthetic tests, and a GitHub Actions test workflow.
- These are real committed business-domain foundations but **not yet a deployed, authenticated, database-backed owner dashboard**. Existing static Worker excludes `app/`; no real customer or financial data is collected. A dedicated secure backend, auth/RLS, payment integration, and regulatory review remain required.
- Public site remains Orange Aesthetics' existing visual identity and navigation.
