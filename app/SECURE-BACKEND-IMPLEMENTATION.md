# Secure business backend — next release gate

Status: code foundation only. Not deployed or connected to production customers.

## Connected account discovery (2026-11-22)
The accessible Supabase account currently lists only project `sqvpiqxrscsberzdtqvt`, identified in the Silver Iris repository as **Silver Iris Farms**. **Do not use or modify that project for Orange Aesthetics.** A dedicated Orange Aesthetics project is not currently available in the connected account. No Supabase schema, credentials or records were changed.

## Existing code
- `app/lib/business-api.mjs`: pure validation/authorization boundary for business create/state transitions. Server must construct actor from verified session; never accept client-supplied actor/role/organization. Explicit field allowlists reject unexpected fields.
- `app/lib/business-navigation.mjs`: UI capability vocabulary, not independently sufficient for authorization.
- `app/lib/workflow-rules.mjs`: state transitions and idempotency key requirement.
- `app/lib/business-operations.mjs`: owner reporting and inventory calculations.
- `app/tests/business-api.test.mjs`: synthetic cross-tenant, staff-permission, state, input and idempotency tests.
- `app/prototypes/owner-business.html`: synthetic-data design preview only, never publish without authentication.

## Before live data
1. Provision **dedicated** Orange Aesthetics Supabase project, staging first. Verify current Supabase changelog/docs and choose proper region, backup/PITR, retention and applicable BAA/healthcare agreements.
2. Confirm business-only data boundary with legal/privacy review. Keep clinical intake, treatment notes, diagnosis, patient chart and PHI in compliant EHR systems. Never include clinical data in ordinary marketing leads or generic CRM.
3. Implement database migrations, RLS on every exposed table, organization isolation, server-managed roles, private storage, grants and test account fixture. Use secure server-side authorization and test access denial for anonymous, members and cross-org actors.
4. Build authenticated API endpoints calling these pure rules; enforce idempotency and financial atomicity in transactions, audit all changes and ensure CSRF protection/rate limits/session revocation.
5. Implement business dashboards using actual protected API responses; do not embed customer or financial data in static files or public JavaScript.
6. Connect Stripe **test mode** only after verified backend; verify signed webhooks, no duplicate settlement, refunds, deposit reconciliation and payment record provenance. Never store card data or PHI in Stripe metadata.
7. Add monitored backups, independent offsite recovery, export and actual restore drills before production cutover.
8. Security acceptance: MFA, RLS matrix, audit logs, privacy/retention review, mobile/accessibility, backups, monitoring, real test data and negative tests.

## Deployment separation
Existing marketing site deploys via Cloudflare Worker and `wrangler.toml`. Keep private `app/` and credentials excluded via `.assetsignore`. Do not expose this scaffold through a public /app route until authenticated backend and full security tests are complete.
