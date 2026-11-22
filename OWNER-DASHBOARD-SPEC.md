# Owner command center — Orange Aesthetics

Owner requested a private management system similar in function to Silver Iris Farms' owner dashboard, adapted to the aesthetics business. **Stripe is selected**; account onboarding and API integration remain pending.

## Modules
- Executive dashboard: collected revenue, refunds, processor fees, recorded expenses, net cash, receivables, subscription MRR, liabilities and trends. Separate cash flow from accounting profit.
- Sales: Stripe online and Terminal payments, cash/manual payments, refunds, disputes, payout deposits, undeposited balances, reconciliation exceptions; immutable financial events and audit log.
- Memberships: $99/$199/$399 plans, active/paused/cancelled, renewal failures, plan discounts, rollover, earned/redeemed credits and liability ledger. Never redeem on payment alone.
- Appointments/operations: service scheduling, capacity, staff tasks, check-in status, treatment clearance flag from approved clinical workflow, no-shows, exceptions. No PHI in payment processor.
- Retail: Neocutis inventory, SKU, supplier, wholesale and approved retail prices, stock adjustments, returns, pickup/shipping, reorder points, gross margin.
- Expenses: categorized purchases, receipts, vendor management, tax categories, mileage, staff time and compensation tracking (if configured).
- Reports: day/week/month/YTD, category revenue, marketing ROI (including Groupon net proceeds), repeat visits, churn, refunds, fees, cash flow, tax-ready exports.
- Access: owner full permissions, manager configurable, MA limited, clinician clinical workflow; MFA and audit trail; strict server authorization. Private dashboard hosted on authenticated route/subdomain, never a public static data store.
- Exception queue: failed renewals, unsettled payments, refund reviews, missing receipts, inventory discrepancies, reconciliation differences, overdue tasks.

## Prototype
- `owner-preview.html` is a **publicly accessible non-sensitive mockup** with fictional data, no authentication, no database, no payment actions. It is deliberately not linked from public navigation and has noindex. It must not be used for real records.

## Implementation sequence
1. Owner establishes Stripe merchant account and approves eligible merchant categories; secure backend and hosting provisioned.
2. Owner-only login with MFA, audited role authorization, protected database, backup and retention policies; signed vendor agreements including HIPAA BAA where necessary.
3. Stripe checkout, Billing and Terminal sandbox integration; server-side product catalog and webhooks; no clinical information in Stripe.
4. Reconciliation ledger, manual payments, expenses and receipts, membership entitlement ledger.
5. Scheduling, operational task queues, staff check-in and inventory.
6. Reports, exports, QA, independent security testing, go-live review.

## Important constraints
- Never display medical weight-loss prices publicly.
- Clinic handles initial medical weight-loss consultation; insurance labs when covered; clinical documentation stays in approved EHR.
- No real patient data, real sales or card credentials in GitHub or a static website.
- All owner dashboards require server-side authorization; hiding a URL is not security.


## Business management and backup decision — 2026-11-22
Owner wants the authenticated Orange Aesthetics platform to operate the business end-to-end, with independently recoverable data and downloadable owner archives. See [BUSINESS-OPERATIONS-BACKUP-PLAN.md](BUSINESS-OPERATIONS-BACKUP-PLAN.md) for the implementation and security specification.
- Target: daily encrypted full database backups, weekly independent immutable offsite copies, monthly owner-downloadable audited business archives, quarterly actual restore drills, and failure alerts. Continuous PITR preferred if supported.
- Owner dashboard must include Backup Center, last verified successful job, backup history, downloadable monthly archive and restore-test evidence. Owner exports must exclude clinical charts and payment credentials; HIPAA-sensitive records require separate approved workflow.
- Retain expired IV credits, issuance, redemptions, refunds and legal restorations in immutable history. Backups are distinct from historical event logs. No automatic 90-day forfeiture without California counsel signoff.
- Added pure `app/lib/export-manifest.mjs` and five `app/tests/export-manifest.test.mjs` test cases for file hashes/manifest integrity. **No real archive, storage, scheduled job, owner download or restoration is implemented; tests have not been executed.**
- Next dependencies: protected backend, BAA/security decisions, authenticated owner endpoint, real backup provider, independent storage, tested restoration, approved retention policy.


## Cash-pay clinical record architecture — 2026-11-22
Owner confirms **100% cash-pay; no insurance claims** for Orange Aesthetics. Prefer existing Practice Fusion EHR for clinical charts and consents, but verify separate legal entity and account access with vendor and attorney before any cross-practice data access. Keep the Orange Aesthetics portal as the business/credit/payment/stock/owner system; no clinical chart duplication. Practice Fusion offers documented FHIR APIs and EHI export, but neither is confirmed configured or free; do not treat EHI export as a restorable EHR backup. Separate authorized clinical exports from ordinary daily/weekly business backups and monthly owner business ZIPs. Full vendor questions, public pricing and compliance gates: [PRACTICE-FUSION-CLINICAL-PLAN.md](PRACTICE-FUSION-CLINICAL-PLAN.md). Attorney issues L11-L15 in [LEGAL-COUNSEL-REVIEW.md](LEGAL-COUNSEL-REVIEW.md). **No actual EHR integration, records export, vendor account, BAA or clinical backup configured.**
