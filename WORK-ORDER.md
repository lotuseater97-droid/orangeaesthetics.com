# Orange Aesthetics — Execution Work Order

**Date:** 2026-11-22  
**Authority:** MASTER-PLAN.md; IV-MEMBERSHIP-APP-SPEC.md; OWNER-DASHBOARD-SPEC.md; LAUNCH-CHECKLIST.md; app/README.md.
**Method:** Read full master plan and relevant specification, inspect source, implement small independently reviewable commits, update status, and test before claiming functionality. This document is a resumable task queue, **not an unattended background job**.

## Ground rules
1. Preserve ivory/sea-glass branding, Orange address/phone and Pacific hours (Mon–Fri 8–5, Sat 8–2, Sun closed).
2. Three distinct experiences: **member**, **staff**, **owner**. Staff QR scanning does not grant financial or clinical privileges. Owner may view operational reports and manage roles but cannot bypass clinical authorization.
3. Separate QR for guest public catalog from private member QR. Member QR is short-lived, opaque, revocable, and contains no identity or medical information.
4. Stripe selected but not configured. No PHI in Stripe or analytics; no weight-loss pricing on public pages. Clinic medical screening is separate from payment.
5. Every work item records acceptance criteria, evidence, tests, blockers and rollback. No production launch until compliance, account connections and verification.

## Ordered queue

| ID | Priority | Work item | Acceptance evidence | State |
|---|---|---|---|---|
| W01 | P0 | Reconcile master plan and specs; create execution ledger | This work order and master-plan link | Complete |
| W02 | P0 | Design roles, permissions and separation of duties | Pure permission matrix + test source committed; server enforcement pending | Scaffold complete; untested |
| W03 | P0 | Define member QR lifecycle, check-in and redemption state machine | Draft schema, state guards and test source committed; transaction design pending | Scaffold complete; untested |
| W04 | P0 | Build auth and session architecture | API contract and pure access guards drafted; dedicated backend, sessions and MFA not deployed | Design complete; implementation blocked |
| W05 | P0 | Build protected membership/credits APIs | Added member-scoped paid subscription checks and approved reversal handling; production must require scope and server-derived inputs | Policy expanded; blocked: W04 |
| W06 | P0 | Implement QR issuance, scan, verify and atomic redemption | Added draft QR uniqueness, idempotency and redemption constraints; protected transaction/API still pending | SQL draft; blocked: W04/W05 |
| W07 | P0 | Connect Stripe sandbox and webhook reconciliation | Signed webhooks, duplicate event tests, refunds, portal and no PHI | Blocked: merchant onboarding/terms |
| W08 | P1 | Build authenticated member UI | Actual credits, appointments, QR and billing from protected APIs | Blocked: W04–W07 |
| W09 | P1 | Build authenticated staff UI | Check-in, benefits, visit queue, safe redemption/reversal | Blocked: W04–W07 |
| W10 | P1 | Build authenticated owner UI | Reports, audit, inventory, membership and role administration | Blocked: W04–W07 |
| W11 | P1 | Secure appointment notifications | HTTPS delivery, rate limits, test receipt, privacy review | Blocked: provider/secrets |
| W12 | P1 | Enforce IV ordering review server-side | Clinical evidence signoff; unverified combinations not auto-orderable | Blocked: clinical approval |
| W13 | P1 | Public website QA | Links, accessibility, mobile, copy, hours, photos, SEO | Open |
| W14 | P2 | NEOCUTIS retail fulfillment | Authorized resale, inventory, tax/shipping/returns | Blocked: retailer approval |
| W15 | P0 | Prelaunch security, compliance and disaster recovery | Independent test, BAAs, backups, monitoring, rollback | Blocked: live infrastructure |

## Execution protocol
- **Inspect:** master plan and specific existing source before edits; preserve decisions.
- **Implement:** commit smallest coherent changes to main only if non-destructive and clearly labeled draft; use staging/feature branches for risky migrations.
- **Verify:** run Node tests in a checked-out repository when available; for remote-only commits mark tests **not run**. Never infer deployed status from GitHub.
- **Document:** append concise progress to MASTER-PLAN.md; update this queue on meaningful milestones.
- **Resume:** choose first unblocked item, then work downward. Do not repeatedly re-research without checking existing source and evidence logs.

## Immediate deliverables
- Draft role permission model for member/staff/owner plus clinician and manager scopes.
- Draft QR token/check-in/visit schema extension (unapplied).
- Unit tests for permission and state transitions.
- Update master plan to reflect current QR demo and three distinct portal previews.

## Progress log — 2026-11-22
- Created pure role/permission model, check-in transition guards, QR credential/check-in schema draft and test source. These are **not** production authorization or an operational database.
- Next unblocked step: inspect checkout/member UI and add more testable static design; live authenticated functions remain gated by dedicated backend, contracts and secure deployment.

## Progress log — 2026-11-22 (continued)
- W04: Created `app/PORTAL-API-CONTRACT.md` detailing member, staff, clinician and owner endpoints; opaque QR lifecycle, MFA, audit and transactional redemption. **Contract only.**
- W04/W05: Added `app/lib/portal-access.mjs` with pure fail-closed action/self-access guards and `app/tests/portal-access.test.mjs` with isolation and MFA test cases. **Not deployed; tests not executed.**
- Remaining immediate work: run the full Node test suite in an actual checkout, design durable transaction migration, select/provision dedicated backend with compliance review, and wire authenticated portals only after gates.

## Progress log — QR credential security (2026-11-22)
- Added `app/lib/qr-token.mjs` using Node cryptographic random generation, SHA-256 hash storage helper, constant-time comparison and strict 60-second validity window. These are pure server-side helpers; **not connected to browser or database**.
- Added `app/tests/qr-token.test.mjs` for uniqueness, matching, malformed input, expiry, revocation and consumption. **Not executed**.
- Next: protected transaction to atomically consume token, verify role and create audited check-in; independent authorization and clinical gates required.

## Progress log — ledger integrity (2026-11-22)
- W05: Added `app/lib/grant-selection.mjs` and `app/tests/grant-selection.test.mjs` for deterministic earliest-expiring, paid, unspent credit selection. Pure helper only; database state is authoritative.
- W06: Added `app/redemption-integrity.draft.sql` with unique QR/check-in constraints, reversal record and idempotency record drafts. This is **unapplied**, requires review of schema evolution and transaction locking, and is not an API.
- No live credit deduction, authenticated login, Stripe integration or real patient QR operation. Tests committed but **not executed**.

## Progress log — member isolation and reversal policy (2026-11-22)
- Strengthened `app/lib/grant-selection.mjs` with optional authenticated-member scoping through server-verified active paid subscription records and separate approved reversal events. Legacy unscoped mode remains for existing tests; **must not be used in production APIs**.
- Added tests for cross-member isolation, unpaid/inactive subscriptions, unapproved reversal flags and missing subscription scope. **Not run**.
- Next: remove legacy unscoped entry point before any API integration, implement transaction-safe SQL and verify test suite in checkout.


## Membership rollover legal gate — 2026-11-22
- Owner preference: **90-day rollover** of unused monthly benefits. **Proposed only; not legally approved.** Do not implement automatic forfeiture, advertise enforceable expiry, or enable billing until California counsel classifies each paid service credit versus truly free promotional benefit.
- California Civil Code 1749.5 gift-certificate restrictions and exceptions require review; April 1, 2026 statutory change must be checked. Source: https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1749.5.&lawCode=CIV
- California Automatic Renewal Law BPC 17602: express consent, clear terms, retainable acknowledgment, consent record retention, annual reminders, online cancellation and fee-change notices. Source: https://oag.ca.gov/node/608083
- Medical Board corporate-practice and medical-spa ownership/clinical control: https://www.mbc.ca.gov/Licensing/Physicians-and-Surgeons/Practice-Information/default.aspx
- Counsel to review: medical-practice entity and NP/physician supervision/authorization, clinical eligibility and refund when unsuitable, HIPAA/payment separation and BAAs, package vs gift-card treatment, cash-out rights, cancellation and refund policy, advertising, sales tax and consumer privacy.
- **System rule pending legal signoff:** retain original grant issuance/payment/expiry records; support separate non-expiring prepaid-value ledger if legally required; never erase historical grants; provide member-visible terms and audit trail.

## Progress — Wellness discount scope (2026-11-22)
- Owner decided Wellness $99/month should provide 15% off eligible Orange Aesthetics services and retail, rather than IV-only. Updated public membership description, detailed membership specification and master plan.
- Proposed 90-day rollover is visible as pending legal approval; no automatic expiration or live discount processing. Higher-tier discount scope and exclusions remain to be confirmed.
