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
