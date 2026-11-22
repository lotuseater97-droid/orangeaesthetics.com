# Orange Aesthetics launch gates

## Built in repository
- Marketing site, IV menu and membership information, skincare landing page, medical weight-management informational page, guest IV treatment browsing page.
- Public weight-loss pricing is intentionally omitted.
- Public pages do not collect clinical information or accept payment.

## Must complete before real checkout
1. Verify Cloudflare Pages deployment and orangeaesthetics.com DNS/SSL with IONOS; test navigation and mobile.
2. Choose payment processor; establish merchant account, checkout, recurring membership billing, refunds, sales tax rules for retail products, and webhooks. Never expose processor secret keys.
3. Establish a dedicated HIPAA-appropriate backend and signed BAAs where needed; configure patient/staff identity, staff MFA, authorization, RLS, audit logs, backups, retention, incident response and vendor review. Do not use unrelated Supabase projects.
4. Build secure order APIs, signed webhook handling, idempotent charges, payment reconciliation, QR check-in and atomic membership entitlement ledger. Do not treat payment as administration.
5. Approve service catalog, member discounts/eligibility, enrollment terms, cancellation, rollover, no-show and refund rules.
6. Obtain Neocutis reseller authorization for online sales, actual SKU inventory, approved descriptions/images, prices, stock, shipping and return policies.
7. Medical weight loss: initial consultation through Pacific Urgent Care, insured labs when covered, clinician approval, in-clinic administration and EHR charting. No public prices. Verify legal medication sourcing.
8. Test with fictional records and processor sandbox; independent security review before production patient data.

## Needed from owner
- Payment processor and merchant account details (never send passwords or card numbers).
- Authorized Neocutis product catalog, inventory, prices and fulfillment choices.
- Final membership terms and staff permissions.
- Confirm production domain status and approved clinic privacy/terms documents.

## Portal UI work completed (November 2026)
- `member-preview.html`: responsive member area prototype for tier, entitlements, renewal, card placeholder, receipts, appointments, add-ons and activity; fictional data only.
- `staff-preview.html`: staff workflow prototype for two-identifier check-in, payment verification, clinician approval, credit redemption, exceptions and role separation; no live scanner or lookup.
- `owner-preview.html`: owner command center prototype for revenue, Stripe reconciliation, memberships, expenses, inventory and reports; fictional data only.
- **NOT DONE:** real account signup/login, MFA, Stripe onboarding or checkout, subscription billing, secure database, HIPAA agreements, protected patient data, server-side roles, actual QR tokens or redemption. Do not call any prototype a production portal.
