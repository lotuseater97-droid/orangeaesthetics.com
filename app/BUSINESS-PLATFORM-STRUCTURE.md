# Orange Aesthetics — Business platform architecture

Status: implementation foundation, NOT an authenticated deployed app. Silver Iris Farms Google Drive master plan and private GitHub repository were reviewed read-only on 2026-11-22. This is a structural adaptation only. No branding, theme, photos, equestrian models, voice entry, secrets or customer data are copied.

## What was reused conceptually
Silver Iris uses a public site plus role-aware owner/staff/member experiences, an owner Business overview, grouped workspace navigation, Finance drill-down, inquiry-to-client workflow, scheduling, invoices/payments, expenses, vendors, tasks, documents, reports, permissions and audit events. Its business workspace aggregates money in/out, outstanding A/R, undeposited cash/check, mileage, leads, and tasks. Those reusable *patterns* inform this design; implementation is independent.

## Orange Aesthetics navigation
- **Today:** appointments, pending requests, follow-ups, alerts.
- **Business:** overview, Finances (invoices, payments, expenses, deposits, tax exports), Services & Pricing, Vendors, Inventory.
- **Operations:** appointment board, non-clinical client/contact directory, membership benefit verification, tasks.
- **Communication:** leads/inquiries, approved messaging, announcements, non-clinical documents.
- **Administration:** team permissions, account, settings, audit log, Backup Center.
- **Member:** upcoming visits, membership plan and benefit status, invoices/receipts, account. Clinical notes never belong in the generic member business database.

Use ONE collapsible navigation on desktop and mobile; dashboard is a direct destination. Keep detailed registers as drill-down pages instead of permanent sidebar buttons.

## Entity translation (no equestrian concepts)
Silver Iris households/clients → Orange Aesthetics non-clinical customer/contact accounts; lessons → appointments; lesson packages/credits → IV membership benefits and redemption ledger; trainers → clinic staff; services/packages → treatments and memberships; leads → consultation inquiries; horse/feed/tack inventory → treatment supplies and retail skincare inventory; payments, expenses, vendors, tasks, documents, notifications, audit logs and reports retain their business purpose.

## Required workflows
1. Inquiry: submitted → new → contacted → qualified → appointment requested/converted → closed. Assign staff, log communication without medical details.
2. Appointment: requested → reviewed → confirmed → completed/cancelled/no-show. Only the scheduling system confirms availability. Avoid PHI in external calendar descriptions.
3. Financial: invoice draft → issued → paid/partially paid/void; payment method, receipt, refund, payout/deposit reconciliation; idempotent Stripe webhook settlement after signature verification.
4. Membership: enrollment request → payment confirmed → subscription active; issue benefits only after confirmed paid period; require clinician authorization at redemption; reversal/refund history is immutable; no automatic 90-day expiry until approved.
5. Inventory: receiving, consumption, adjustments, lot/expiry tracking where applicable, reorder alerts, vendor purchases; restricted clinical stock requires extra controls.
6. Owner: today queue, revenue/expenses/A-R/undeposited, member activity, appointment conversion, supplies, staff tasks, exports and backup verification.

## Architecture and security
- Existing Cloudflare Worker is a static marketing site; its Pages Function appointment endpoint is NOT deployed by assets-only Wrangler config.
- Build a **separate protected application deployment** (or an intentionally migrated integrated Worker) with backend authentication and verified session, server-side RBAC, per-record RLS, secure audit trail, and protected storage. Do not replace the working static site blindly.
- Dedicated Orange Aesthetics project and credentials; do not reuse Silver Iris auth, database, organization IDs, Stripe keys or calendar.
- Separate non-clinical business records from clinical/EHR records. No symptoms, diagnoses, infusion screening or clinical notes in ordinary inquiry, billing or CRM tables. HIPAA/CMIA, BAA, data minimization and retention require professional review.
- Never publish owner/employee dashboards as unauthenticated HTML, rely on hidden links for security, or use browser localStorage as authoritative financial data.
- PWA optional after protected routes are configured not to cache private responses.

## Build order
A. Finish public site, repair appointment submission or switch to phone-only until backend is available.
B. Create protected owner/staff/member app, owner login, permissions, migration and seed data in a **dedicated** staging environment.
C. Build inquiry board, appointment board, task queue and business overview.
D. Build invoices, manual payments, expense ledger, vendors, inventory, reports/CSV, deposit reconciliation.
E. Integrate Stripe test mode and approved membership benefit ledger; verify webhook idempotency, refunds and credits.
F. Build member self-service, notification preferences and optional Google Calendar sync with retries.
G. Add receipt/document capture, protected evidence, audit log, owner backup/download center and restoration tests.
H. Run authorization, financial reconciliation, accessibility, mobile, security, and disaster-recovery acceptance tests before production.

## Implemented now
- `app/lib/business-navigation.mjs`: role-aware workspace and capability configuration, not a server auth layer.
- `app/lib/business-operations.mjs`: pure owner metrics, work queues, inventory balance and lead state guards.
- `app/tests/business-operations.test.mjs`: synthetic tests. These modules are deliberately under `app/`, excluded from the current static public deployment by `.assetsignore`.

## Dependencies not yet provisioned
Dedicated database/auth, runtime secrets, live Stripe, clinical approvals, notification transport, actual Google Calendar, protected app deployment, backup provider and operational data. No real patient information or payment processing should begin before these are complete.
