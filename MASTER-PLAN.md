# Orange Aesthetics & Wellness — MASTER PLAN

**Updated:** 2026-11-22  
**Repository:** `lotuseater97-droid/orangeaesthetics.com`  
**Status:** Development. **NOT a live payment, member, staff or owner application.**

> This is the project source of truth. Read it before making changes. Update it and the relevant detailed specification after each meaningful implementation. Do not describe prototypes as production functionality.

**Engineering progress (2026-11-23):** Added `app/lib/postgres-transaction.mjs` with commit/rollback/release tests for the server-only staff reservation flow. It is not wired to a deployed endpoint or verified against a live PostgreSQL database. Next: connect a trusted PostgreSQL pool and authenticated staff endpoint, apply/review the staged reservation migration, and run concurrent booking integration tests.\n\n**Engineering progress (2026-11-23, reservation lifecycle):** Added server-only `app/lib/reservation-transitions.mjs` and `app/tests/reservation-transitions.test.mjs` for tenant-scoped, compare-and-swap status updates (review → confirmed/declined/cancelled; confirmed → completed/no-show/cancelled). This is not connected to a deployed authenticated endpoint. Next: integrate verified staff authorization and transactional runner into the HTTP API, review/apply scheduling migration, and run live PostgreSQL concurrency tests.\n\n## 1. Vision
One coherent Orange Aesthetics platform: public marketing website, guest service browsing and payment, recurring IV memberships, self-service member area, staff check-in and redemption, NEOCUTIS skincare sales, and a private Silver Iris Farms-style owner command center. Mobile-first, elegant coastal-luxury brand; no unnecessary app installation.

## 2. Fixed owner decisions
- **Payments:** Stripe chosen as primary provider. Stripe account creation/onboarding and connection **pending**. Hosted Checkout/Billing/Customer Portal/Terminal where appropriate; verify merchant eligibility and privacy restrictions first.
- **IV plans:** Wellness $99/mo; Performance $199/mo; Elite $399/mo. Owner selected Wellness 15%, Performance 20%, and Elite 25% discounts across eligible Orange Aesthetics services and retail (not just IV), and proposed 90-day unused IV benefit rollover; both require final lawful exclusions and written contract review before billing. NAD+ separate.
- **Weight management:** initial evaluation at Pacific Urgent Care; lab testing through regular insurance where covered; clinician-authorized injections in clinic. **Never display public weight-loss medication prices**. Keep clinical data in compliant clinical systems.
- **Skincare:** NEOCUTIS product catalog with *advertised reference retail prices*, not verified inventory, acquisition cost, authorized online resale, or final sales price.
- **Partner:** Flourish Longer is independent; link to its separate booking and payment experience. No shared charges or revenue split.
- **Brand:** ivory #FAF8F3, sea glass #435D60, sage #A9C3BB, champagne #D6B68C, bronze #A77B61. Headline: “Where Beauty Meets Imagination” (original Orange Aesthetics tagline); supporting line “Refined aesthetics. Personalized care.” No navy.
- **Location:** 1520 E Lincoln Ave, Orange, CA 92865; phone (714) 921-3870.
- **Hours (owner decision, temporary):** Orange Aesthetics follows Pacific Urgent Care hours: Monday–Friday 8 AM–5 PM, Saturday 8 AM–2 PM, Sunday closed. Keep hours consistent across public pages and local listings; appointment availability remains subject to confirmation.

## 3. Current implementation truth
| Area | State | Verified reality |
|---|---|---|
| Marketing site and treatment pages | Built but untested | Static HTML/CSS in GitHub; live domain/Cloudflare deployment not verified |
| IV menu and membership pricing pages | Built but untested | Informational only |
| NEOCUTIS catalog | Built but untested | Reference prices, browser-only planning bag; no orders |
| Guest IV browsing | Built but untested | No payments |
| Medical weight-management information | Built but untested | No public weight-loss pricing |
| Member area | Prototype | `member-preview.html`; fictional data, no login, credits or billing |
| Staff check-in | Prototype | `staff-preview.html` has a demo-only QR camera scanner; no real login, member lookup, check-ins or redemption |
| Owner dashboard | Prototype | `owner-preview.html`; fictional data, no accounting integration |
| Stripe payments/Billing/Terminal | Scaffold only | Event classification and raw-body HMAC signature verification helpers drafted; no deployed endpoint, Stripe SDK connection, secrets, products or checkout |
| Protected backend/database | Schema draft only | Proposed SQL, pure ledger, checkout guardrails, owner metrics and test source in app/; no database, authentication, deployed API or applied migration |
| Domain/deployment | Unverified | Do not claim site is live until checked |

### Scheduling persistence checkpoint (2026-11-23)
`app/booking-reservations.staging.sql` drafts atomic provider/room overlap exclusion constraints with tenant-scoped references and no direct client grants. **Review only: not applied, tested against a live database, or exposed through an authenticated API.** Next: review PostgreSQL extension permissions, existing appointment schema and RLS, implement a staff-authorized transactional booking endpoint, test concurrent inserts and cancellation/rebooking, then stage migration in a dedicated development database. Do not treat slot suggestions as reservations.

## 4. Product surfaces
**Public:** Home, aesthetics, IV pricing, memberships, skincare catalog, weight-management information, contact, guest checkout when enabled.

**Member:** Sign up/in, subscription status, credits/rollover, opaque QR member card, receipts, Stripe-hosted payment method management, purchases and explicit recurring add-ons, appointments, activity history, cancellation.

**Staff:** MFA, least-privilege role permissions, QR scan and manual fallback, two-identifier identity check, membership verification, separate payment/clinical clearance/administration states, atomic redemption and reversal, refund approvals, inventory and tasks.

**Owner:** Revenue, costs, Stripe reconciliation, MRR/churn, refunds/disputes, inventory and gross margin, vendors, expenses/receipts, mileage, staff time, schedules, reports/exports, audit and exceptions. Separate cash flow from profit.

## 5. Architecture and nonnegotiable security
- Public website may remain on Cloudflare Pages; authenticated application requires secure server/API, protected storage, backups and server-enforced role authorization.
- Select and provision a **dedicated** backend for Orange Aesthetics; do not reuse unrelated projects. Do not introduce PHI before appropriate signed BAAs, HIPAA configurations and security review.
- Stripe secrets server-side only; create sessions from server-owned prices, validate webhook signatures, deduplicate events and use idempotent reconciliation. Stripe is not an EHR. Never send clinical details/PHI into Stripe metadata, products, receipts or logs.
- No patient names, clinical notes, MRNs, dates of birth, medical details, card credentials, or secret keys in GitHub, client code, static pages, analytics or QR tokens.
- Entitlements are issued after authoritative paid status, not browser redirects; QR credentials opaque and revocable; atomic redemption with audit trail; clinician approval is separate from payment.
- No public static dashboard may be mistaken for secure login; current previews contain fictional data and are not suitable for actual operations.

## 6. Build order and acceptance gates
### Phase A — Public-site readiness
- [x] Create informational treatment pages, IV menu and membership descriptions.
- [x] Create NEOCUTIS reference catalog and browser-only planning bag.
- [x] Create member, staff and owner UI previews.
- [ ] Audit mobile layout, navigation, accessibility, copy, broken links and pricing.
- [ ] Verify Cloudflare Pages deployment, custom domain, TLS, DNS and email records.
- [ ] Approve business privacy/terms and membership contract language.

### Phase B — Secure foundation
- [ ] Provision separate backend and deployment environments (development/staging/production).
- [ ] Establish HIPAA applicability, vendor contracts/BAAs, security design and data classification.
- [ ] Implement authenticated roles (member, MA, clinician, manager, owner), MFA for staff/owner, access audit and tested authorization.
- [ ] Build versioned catalog, subscriptions, payment ledger, entitlements, audit and inventory schema with migrations and automated tests.

### Phase C — Stripe and membership workflows
- [ ] Create/verify Stripe account; confirm merchant eligibility for all offered services.
- [ ] Configure sandbox products/prices for approved nonclinical services and membership terms; no secret keys committed.
- [ ] Build server-generated Stripe Checkout sessions, Billing, hosted Customer Portal and signed webhook reconciliation.
- [ ] Implement paid-period credit grants, expiration/rollover, refunds, cancellation, disputes, failure handling, idempotency and concurrent redemption tests.
- [ ] Test guest payment, recurring membership, cancellation, refunds, failure and duplicate webhook paths end-to-end.

### Phase D — Staff and owner operations
- [ ] Real member QR issuance/rotation/revocation, staff lookup and two-identifier verification.
- [ ] Staff workflow for credit use, clinical approval flag and service administration state with EHR boundary.
- [ ] Owner revenue/expense/fee reconciliation, inventory, vendors, receipts, mileage, staff time and reporting.
- [ ] Restrict owner-only financial data and verify role escalation is impossible.

### Phase E — Retail and launch
- [ ] Confirm NEOCUTIS authorized online resale, SKUs, real inventory, imagery permissions, tax, shipping and return rules.
- [ ] Complete legal/compliance review, independent security testing, backup recovery, monitoring and staff training.
- [ ] Deploy production; test domain, transactions, renewals, email and mobile flows; mark live only after observed successful tests.

## 7. Working rules for future AI/developers
1. **Read `MASTER-PLAN.md` first**, then relevant spec and current source before edits.
2. Make actual GitHub commits where possible. Summarize exact changed files and whether tested. No claims of background work.
3. Keep implementation status truthful: Not started / Prototype / Built but untested / Tested / Live.
4. Record every important decision, dependency, blocker and changed assumption here. Link detailed documents instead of duplicating them excessively.
5. Preserve owner decisions unless explicitly changed. Never invent patient data, merchant credentials, inventory, authorized pricing, or legal approval.
6. For risky changes, prioritize security, reversible migrations, tests and rollback plan. Never silently turn a public static page into a place to enter real patient information.
7. Next session should review this plan and resume the highest-value unblocked task, updating the checklist as progress is made.

## 8. Linked detailed references
- [Launch checklist](LAUNCH-CHECKLIST.md)
- [IV membership and app specification](IV-MEMBERSHIP-APP-SPEC.md)
- [Owner dashboard specification](OWNER-DASHBOARD-SPEC.md)
- [Competitive audit](COMPETITIVE-AUDIT-2026.md)
- [README / deployment notes](README.md)

## 9. Current blockers requiring owner action
- Stripe account onboarding and account connection (no passwords, banking details or API secrets in chat).
- Dedicated backend choice and required vendor compliance arrangements.
- Final membership terms and cancellation/refund rules.
- NEOCUTIS authorized resale rights, inventory and fulfillment decisions.
- Live domain/deployment verification and legal text approval.

## 10. Implementation log — 2026-11-21
- Created `app/README.md`, `app/catalog.json`, `app/schema.sql`, `app/.env.example`, `app/lib/ledger.mjs`, `app/lib/stripe-events.mjs`, `app/tests/business.test.mjs`.
- Draft catalog excludes weight-loss medication pricing; schema is unapplied; pure ledger and Stripe event helpers are not a live payment integration.
- Test code was committed but **has not been executed in a verified repository checkout**. Do not mark as tested.
- Next priority: create secure authenticated backend with verified webhook signatures, idempotent database transactions and real automated integration tests after infrastructure and vendor decisions.

- Added `app/lib/webhook-signature.mjs`, `app/lib/checkout-policy.mjs`, `app/lib/owner-metrics.mjs` and `app/tests/integration-policy.test.mjs` for signature verification, fail-closed checkout policy and accounting helpers. **Source committed, tests not executed in a checked-out repository.**

- Visual refresh requested: prior page relied heavily on abstract art and CSS background images. Home now uses explicit editorial photo elements for hero, service cards, interior feature and partner section; image loading remains externally hosted and has **not been browser-verified**. These are illustrative stock photographs, not actual clinic, staff or patient images. Replace with licensed/owned clinic photography before launch where possible.\n\n- Owner identified imagery shared with Pacific Urgent Care. Replaced the duplicated homepage hero/skin/laser photograph source and wellness interior source with different candidate editorial images. **Image URLs and cross-site uniqueness are not yet browser-verified.** Require separate approved photo library for Orange Aesthetics, distinct from Pacific Urgent Care.

- Visual refinement: standardized navigation on key pages, simplified homepage, added editorial photo panels on treatment, membership, shop and contact pages, and new responsive styles. **Browser QA and photo licensing/uniqueness checks are pending**; Pacific Urgent Care images may be referenced stylistically but not reused.

- Added prominent per-tier membership enrollment buttons ($99/$199/$399) on `memberships.html`, currently routed to contact with tier query parameter. These are **inquiry CTAs, not Stripe buy buttons**, because payment onboarding, approved contract terms and backend checkout remain incomplete. Replace with secure Stripe-hosted checkout only after those gates.

- Appointment workflow decision: existing Pacific urgent care manager remains responsible for all appointment requests. Notification destination is private and **must not appear in client code or public GitHub**. Added `/appointment-request.html` with contact-only intake and Cloudflare Pages function `/api/appointment-request`; function is **not operational until a trusted notification endpoint and token are configured as server secrets**. Do not claim email delivery or confirmed bookings. No medical history or clinical notes in email.

- Added conservative IV combination chart at `/iv-combinations.html`, draft policy `app/iv-combination-policy.json`, fail-closed evaluator `app/lib/iv-safety.mjs`, and test source. **No combinations are approved or verified.** The public chart is informational and cannot authorize treatment. The evaluator is not connected to an authenticated ordering/administration workflow; production requires server-side enforcement, versioned approved clinical rules, exact formulation/compatibility sources and patient-specific checks. Tests are not yet executed.

- Same-bag/same-line only: implemented `app/lib/same-bag-engine.mjs` for conservative backend formulation evaluation. It checks approved policy/version, exact ingredient and source SKU, concentrations and cumulative dose, diluent, final volume, infusion/hold times, every ingredient pair, evidence expiry and clinical review flags. Added synthetic tests; **not run in a checkout, not deployed, no actual combinations approved**. The engine cannot determine clinical compatibility from chemistry alone; every allowed rule must be pharmacist-validated against exact formulation and credible compatibility evidence. No medical/patient data in public UI or GitHub.

## 11. Next development focus
Audit existing source for broken navigation and accessibility; prepare real app architecture, migrations and test harness in repository without connecting real patient data or pretending payment flows are active. Keep the current public site safe and operational.


## 12. Website remediation register — 2026-11-22

This register consolidates the 36-item audit. **Source-level corrections are not production verification.** Keep open until tested in the deployed website.

### Corrected in GitHub (deployment and visual QA pending)
- [x] Checkout menu labels now identify Mini/Full **PlenishIV** as the supplier product and Myers-style as the familiar search term; mini is a half-dose subject to actual product directions.
- [x] Checkout Glow description explicitly places glutathione in a **separate post-infusion push**, not the bag.
- [x] Membership Wellness benefit now uses Mini PlenishIV terminology.
- [x] Checkout has an appointment-request CTA; **this is not payment or a confirmed booking**.
- [x] Pricing clarifies that high-dose vitamin C needs individualized clinical/lab screening and that Plaquex product identity and administration are unverified.
- [x] Public compatibility chart clarifies that add-on selection is distinct from combining two complete cocktails; evidence-unknown is not known-incompatible.
- [x] Source-linked `app/iv-evidence-review.json` and historical Dripology reference are available for clinical review; **not clinical approval**.

### P0 — clinical, payment and privacy gates (open)
- [ ] Implement server-enforced patient-order restrictions and versioned, signed-off clinical compatibility policy; current chart and engines are informational/unwired.
- [ ] Obtain exact Anazao product labels/SKUs, diluents, concentrations, route, hold time, sterility data, and pharmacist-reviewed compatibility sources. Verify zinc sourcing and Plaquex identity.
- [ ] Confirm California-specific scope, prescribing, office stock sourcing, and sterile compounding arrangements before elective same-bag mixing.
- [ ] Implement clinician review workflow, secure clinical screening/consent in appropriate compliant systems, and emergency readiness.
- [ ] Configure and test manager appointment notification endpoint/secrets; no PHI in routine email; ensure rate limiting and abuse protection.
- [ ] Complete Stripe onboarding, eligible product configuration, secure checkout, recurring billing, webhook reconciliation, refunds and cancellation; no payment is live.
- [ ] Establish compliant backend, access control/MFA, data minimization, BAAs where applicable, logging and backups before collecting sensitive information.

### P1 — public-site quality (open)
- [ ] Verify Cloudflare branch/deployment, DNS/HTTPS, cache invalidation and live pages after commits.
- [ ] Audit all pages for links, mobile menu, layout, keyboard use, accessibility, contrast, images and loading performance.
- [ ] Audit clinical/marketing benefit claims and California advertising compliance; finalize legal, privacy, cancellation and refund text.
- [ ] Verify pricing and membership inclusions/rollover/exclusions; publish approved contractual terms.
- [ ] Verify SEO metadata, canonical URLs, sitemap, robots, structured data and local listings.
- [ ] Verify photography rights and replace placeholder/duplicated stock imagery with approved assets.

### P2 — secure product workflows (open)
- [ ] Member signup/login, payment portal, credits, rollover, receipts, QR token lifecycle.
- [ ] Staff role-based check-in, redemption, reversal, clinical clearance separation, inventory.
- [ ] Owner financial reporting, Stripe reconciliation, expenses, receipts, vendor and staff workflows.
- [ ] NEOCUTIS authorization, stock, shipping, tax, returns and ecommerce.
- [ ] Automated test execution and end-to-end mobile, email, security and payment verification before launch.

### Verification limitations
Edits in this session were committed through GitHub. No local repository checkout, browser rendering, Cloudflare production inspection, test run, Stripe configuration or email-delivery test was performed. Do not mark these as deployed, tested or live.


## 13. Follow-on hardening — 2026-11-22
- [x] Strengthened the Cloudflare appointment function: HTTPS-only notification destination, reject cross-origin requests and non-JSON bodies, cap payload size even when Content-Length is absent, validate input, reject redirecting notification destinations, and return controlled errors for delivery failures/timeouts. **Not a substitute for provider authentication, rate limiting, HIPAA assessment or a successful delivery test.**
- [x] Corrected the compatibility checker message for a single treatment with no add-on: it is an inquiry, not an unapproved combination.
- [x] Restrict membership preselection query values to the three advertised tiers; the public request continues to transmit only broad service categories.
- [ ] Before enabling appointment intake: configure a trusted HTTPS delivery provider, add durable rate limiting/bot mitigation, verify endpoint response and receipt, and confirm privacy/security arrangements.
- [ ] Browser-test form errors, success state, mobile and accessibility; code commits alone do not establish production behavior.


## 14. Operating-hours decision — 2026-11-22
- [x] Updated contact page to show Pacific Urgent Care hours as the current Orange Aesthetics operating hours: Monday–Friday 8 AM–5 PM; Saturday 8 AM–2 PM; Sunday closed.
- [ ] Verify hours consistently wherever they appear on the public website and external listings, and confirm against any holiday schedule before publishing exceptions.


## 15. Public-page consistency and structured hours — 2026-11-22
- [x] Updated Wellness page to identify Mini/Full PlenishIV as the actual supplier cocktail, retaining Myers-style as a familiar descriptive term.
- [x] Linked the Wellness page to appointment requests and the IV combination review chart; clarified that a published price does not guarantee eligibility or availability.
- [x] Added a direct appointment-request link from the IV pricing page.
- [x] Added current Monday–Saturday Pacific Urgent Care operating hours to homepage MedicalBusiness structured data; Sunday is closed. **Search-engine rendering and actual deployed metadata not verified.**
- [ ] Check all remaining pages, external business listings and holiday exceptions for consistent hours and contact details.
- [ ] Validate structured data with a live structured-data validator and confirm canonical domain/deployment.


## 16. Appointment validation correctness — 2026-11-22
- [x] Fixed a JavaScript regex escaping error in the Cloudflare appointment function that could incorrectly reject valid email addresses. Source-level correction only; delivery still requires provider setup and live testing.
- [x] Disallow non-default ports on configured notification destination to reduce configuration risk.
- [ ] Execute positive/negative tests for valid emails, malformed emails, honeypot, payload size, cross-origin requests and upstream delivery before enabling production form.


## 17. Appointment intake defense and test coverage — 2026-11-22
- [x] Appointment function rejects unexpected JSON keys, preventing accidental forwarding of extra patient/clinical fields; rejects CR/LF in contact fields.
- [x] Added `app/tests/appointment-request.test.mjs` covering accepted contact-only requests, invalid email, extra medical fields, newline injection, cross-origin requests, missing configuration, insecure notification URL and provider failure.
- [ ] Execute test suite in a checked-out repository and resolve any failures; **test source committed, not run**.
- [ ] Add durable rate limiting, abuse monitoring, delivery provider setup and independent verification of notification receipt before accepting public submissions.


## 18. Three portal roles and QR check-in architecture — 2026-11-22

### Member portal (role: member)
- Membership status, plan, earned/used/expiring credits, visits, billing/receipts and secure Stripe portal access.
- Personal rotating QR credential generated by a protected API; no patient name, DOB, medical details, credit balances or email embedded in QR.
- QR token should be opaque, random, short-lived, revocable and scoped to check-in only; rate-limit redemption/lookup.

### Staff portal (role: staff; finer clinical permissions remain separate)
- Mobile-first camera QR scan with manual fallback, two-identifier identity verification, active paid membership, available credit and eligible service review.
- Staff may request check-in and redemption but cannot approve clinical treatment, modify grants or access owner finance dashboards.
- Server must verify auth, role, token expiration/replay, membership standing and credit ledger; redemption must be atomic and idempotent. Record staff ID, visit reference, timestamp and audit event. Reversal requires manager/owner approval.

### Owner portal (role: owner)
- Includes staff operational capabilities plus role administration, plan and price configuration, membership/revenue reports, refunds, inventory, expenses, audit and reconciliation.
- Owner permissions are server enforced; owner cannot silently bypass clinical clearance or change financial ledger history.

### Source implementation status
- [x] Updated `staff-preview.html` with a demo-only camera QR scanner (BarcodeDetector where supported), manual demo code and explicit non-operational steps.
- [x] Updated `owner-preview.html` with staff/member navigation; updated `member-preview.html` with appointment request and QR activation explanation.
- [ ] Dedicated authentication provider, MFA for staff/owner, protected sessions and server-side role enforcement.
- [ ] Dedicated database schema for opaque rotating QR token hashes, check-in events, visit authorization and credit ledger.
- [ ] Real member card QR issuance, secure staff scanner endpoint and transactional redemption/reversal APIs.
- [ ] Integrate Stripe verified payments/subscriptions and establish member entitlement rules.
- [ ] End-to-end test on Android and iOS, including camera permissions, QR expiry, replay, revoked cards, duplicate scans and offline behavior.

**Never use demo QR code OA-DEMO-CARD for real identification, eligibility or billing.** No live patient lookup or credits exist in these preview pages.


## 19. Structured execution work order and QR foundation — 2026-11-22
- [x] Read full master plan and linked membership/app, owner dashboard, launch and app foundation specifications; created [WORK-ORDER.md](WORK-ORDER.md) with priority, dependencies, acceptance criteria and resumption protocol.
- [x] Added `app/lib/portal-permissions.mjs` with fail-closed member/MA/clinician/manager/owner action matrix and member self-access check. **Pure code only, not enforced by deployed API.**
- [x] Added `app/lib/checkin-policy.mjs` with explicit check-in transition and QR/redemption precondition checks. **Pure code only, not transactional or deployed.**
- [x] Added `app/qr-checkin-schema.draft.sql` for hashed, expiring and revocable QR credentials, check-in states and transition history. **Draft, unapplied; not a complete production migration.**
- [x] Added `app/tests/portal-permissions.test.mjs` covering privilege separation, invalid roles, skipped check-in stages, payment/clinical gates and QR replay conditions. **Tests written but not executed in a verified checkout.**
- [ ] Implement and verify authenticated, database-backed member/staff/owner API and transactional check-in before displaying real member data or issuing real QR cards.
- [ ] Review the draft schema and state model with clinical/compliance staff, particularly identity verification, visit recording and audit retention.


## 20. Work-order execution — 2026-11-22
- [x] Created `app/PORTAL-API-CONTRACT.md`: proposed protected member, staff, clinical and owner endpoints; short-lived opaque QR, server role authorization, audit, idempotent redemption and immutable reversal design. **No endpoints deployed.**
- [x] Added `app/lib/portal-access.mjs` pure authorization/self-access checks and `app/tests/portal-access.test.mjs` for cross-member isolation and MFA guards. **Tests not executed; no live identity provider.**
- [ ] Verify all tests locally and implement the database transaction and access controls after backend selection and HIPAA/vendor review.


## 21. QR token security foundation — 2026-11-22
- [x] Added `app/lib/qr-token.mjs` with server-only cryptographically random 256-bit opaque QR credentials, hashed token comparison and a 60-second expiry guard. Never put these tokens in logs or URLs.
- [x] Added `app/tests/qr-token.test.mjs` for malformed, expired, revoked, consumed and mismatched credentials. **Test source committed, not run**.
- [ ] Implement real token issuance and atomic database consumption with authenticated member/staff roles, rate limits and audit; no production QR cards are active.


## 22. Redemption integrity and membership credit selection — 2026-11-22
- [x] Drafted `app/redemption-integrity.draft.sql` with proposed unique QR use, redemption request idempotency, reversal records and transactional locking requirements. **Not applied, not production-ready.**
- [x] Added `app/lib/grant-selection.mjs` for deterministic paid, valid, available grant selection and `app/tests/grant-selection.test.mjs` with boundary tests. **Not executed; helper is not a transactional credit ledger.**
- [ ] Review reversal semantics, concurrency behavior, migrations, role isolation and audit requirements in a dedicated staging database before connecting portals.


## 23. Credit isolation and reversal safeguards — 2026-11-22
- [x] Updated `app/lib/grant-selection.mjs` to support member-scoped, active payment-verified subscription checks and approved compensating reversal records.
- [x] Expanded `app/tests/grant-selection.test.mjs` with member isolation, payment status and reversal tests. **Not executed.**
- [ ] Legacy unscoped helper use is for existing draft tests only; require server-derived member identity and authoritative subscription records before production use. Enforce isolation at the database transaction boundary.


## Membership rollover legal gate — 2026-11-22
- Owner preference: **90-day rollover** of unused monthly benefits. **Proposed only; not legally approved.** Do not implement automatic forfeiture, advertise enforceable expiry, or enable billing until California counsel classifies each paid service credit versus truly free promotional benefit.
- California Civil Code 1749.5 gift-certificate restrictions and exceptions require review; April 1, 2026 statutory change must be checked. Source: https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1749.5.&lawCode=CIV
- California Automatic Renewal Law BPC 17602: express consent, clear terms, retainable acknowledgment, consent record retention, annual reminders, online cancellation and fee-change notices. Source: https://oag.ca.gov/node/608083
- Medical Board corporate-practice and medical-spa ownership/clinical control: https://www.mbc.ca.gov/Licensing/Physicians-and-Surgeons/Practice-Information/default.aspx
- Counsel to review: medical-practice entity and NP/physician supervision/authorization, clinical eligibility and refund when unsuitable, HIPAA/payment separation and BAAs, package vs gift-card treatment, cash-out rights, cancellation and refund policy, advertising, sales tax and consumer privacy.
- **System rule pending legal signoff:** retain original grant issuance/payment/expiry records; support separate non-expiring prepaid-value ledger if legally required; never erase historical grants; provide member-visible terms and audit trail.


## 24. Wellness membership discount scope — 2026-11-22
- [x] Owner decision: $99 Wellness includes one Mini PlenishIV monthly and **15% off eligible Orange Aesthetics services and skincare retail**, including additional IVs, injectables, laser and skin services. Do not extend to independent partners or Pacific Urgent Care/insurance-billed services by implication.
- [x] Public `memberships.html` revised to reflect broader proposed benefit and pending 90-day rollover legal approval.
- [ ] Finalize exclusions, whether higher-tier 20%/25% discounts share the same scope, discount stacking, minimum prices, resale rights and medical-service fee compliance. No live checkout or automatic expiration.


## California membership legal architecture — 2026-11-22 (reviewed sources; COUNSEL APPROVAL REQUIRED)
**Owner decisions:** Orange Aesthetics is separate from Pacific Urgent Care. All tiers receive their respective discount on **eligible services and retail products actually sold by Orange Aesthetics only**: Wellness 15%, Performance 20%, Elite 25%. No discount on Pacific Urgent Care, insurance-billed care, or independent partner sales. Included IV entitlements should expire 90 days after issuance **only if enforceable after California healthcare counsel reviews the actual consideration, service delivery, and contract**. Do not present the plan as legally cleared or start automatic forfeiture before approval.

**Legal findings and design controls:**
1. Civil Code §§1749.45, 1749.5 as amended by SB22, operative April 1, 2026: covered purchased gift certificates cannot expire; cash redemption threshold is $15; truly free loyalty/promotional exception requires no money or value exchanged, so it is NOT presumed to apply to a paid membership IV. Source: https://legiscan.com/CA/text/SB22/2025 . Structure a time-limited, nontransferable membership service entitlement (no cash denomination, reload, gifting, standalone voucher or cash wallet), but labels alone do not defeat statutory treatment. Counsel must decide whether 90-day forfeiture is enforceable. Purchased packages, gift certificates, stored value and any legally protected paid balance are separate and must not expire under this rule.
2. BPC §§17600–17606 (particularly 17602): pre-purchase conspicuous renewal terms and separate express affirmative consent, retainable acknowledgment, accessible cancellation including online cancellation for online signup, annual reminders, required notices and consent record retention. Source: https://law.justia.com/codes/california/code-bpc/division-7/part-3/chapter-1/article-9/section-17602/ . Do not enable auto-billing before tested controls.
3. BPC §650: no referral inducements, prohibited percentage-based referrals or improper cross-entity rebates. Direct Orange Aesthetics discount only; no Pacific cross-subsidies. Source: https://law.justia.com/codes/california/code-bpc/division-2/chapter-1/article-6/section-650/ . Review professional advertising and undiscounted-price representation.
4. BPC §2400, §2775, §§2837.103–.104 and relevant professional corporation law: separate entity must be legally authorized to deliver medical services. NP-owned professional nursing corporation may be possible under applicable scope/authorization; ordinary LLC cannot simply practice medicine. 103/104 authorization and standardized procedures are materially different. Sources: https://www.rn.ca.gov/practice/ab890.shtml and https://www.mbc.ca.gov/Download/Documents/medical-spas-business.pdf . Verify actual entity and clinicians with counsel.
5. All treatments require independent clinical screening and informed consent. Medical ineligibility, provider unavailability, scheduling barriers, cancellations, refunds, chargebacks and service discontinuation require fair written policies; no forfeiture of protected funds. Clinical records remain separate from payment systems.

**Proposed contract model (NOT approved terms):** Membership grants an ongoing access/discount program and a specified number of monthly *service-use entitlements*, each issued on the paid billing date and usable until the exact timestamp 90 calendar days later; oldest eligible entitlement consumed first. Display issue date, expiration date and advance reminders; never promise a treatment without clinical approval. Do not use the word 'free' to imply the IV was exchanged for no consideration. Clarify whether entitlement survives cancellation, pauses, inability to schedule, and medical ineligibility. Never advertise 90-day expiration as legally enforceable until attorney signoff. A 3-credit maximum conflicts with Elite's two per month and must NOT be hard-coded; any cap must be plan-specific and reviewed.

**Implementation gates:** legal opinion on gift certificate classification; professional entity and scope verification; signed member agreement and checkout copy; refund/cancellation/no-show rules; consent records, accessible cancellation, reminders, separate non-expiring purchased-value ledger, test cases for rollover/refund/reversal, and manual override audit. No live billing, expiration job or patient data yet.


## Expired-benefit backup and legal recovery — 2026-11-22
Owner requested that proposed 90-day IV benefits disappear from *usable* member balances, be redeemed earliest-expiring first, and remain in a protected historical ledger after expiration for future legal remediation. Design recorded in [app/EXPIRED-BENEFIT-RECOVERY.md](app/EXPIRED-BENEFIT-RECOVERY.md). Expiration enforcement is **NOT enabled** pending California legal approval. Preserve immutable grant/payment/redemption/expiration events and use audited restoration/refund adjustments rather than deleting or rewriting records. Implementation and tests pending protected backend.


## Benefit recovery implementation progress — 2026-11-22
- Added `app/lib/benefit-history.mjs` pure projection for oldest-expiring-first selection, retained expired history, approved reversals/restorations, and retrospective impact counts.
- Added `app/tests/benefit-history.test.mjs` with seven test cases and `app/benefit-history.draft.sql` append-only audit event schema proposal. These are **not deployed** and tests have not been verified in repository runtime.
- **Important limitation:** projection is a prototype, not a production credit ledger. It does not enforce member scoping, verify payment, implement legal reinstatement of expired dates, or run atomic concurrent redemptions. Production implementation must address these before enabling anything.
- Expiration remains explicitly gated by legal approval; no live 90-day expiration or real backups are configured. Next: backend, event immutability/RLS, real backup/restore and integration tests.


## Consolidated membership compliance architecture — 2026-11-22
**Authoritative documents:** [LEGAL-COUNSEL-REVIEW.md](LEGAL-COUNSEL-REVIEW.md) (all open legal questions, L01–L10) and [MEMBERSHIP-TERMS-ATTORNEY-DRAFT.md](MEMBERSHIP-TERMS-ATTORNEY-DRAFT.md) (proposed customer terms). Do not treat legal review questions as resolved simply because implementation is designed around them.

**Owner-approved commercial design:** separate Orange Aesthetics entity; Wellness $99/one Mini PlenishIV/15%, Performance $199/one qualifying IV/20%, Elite $399/two qualifying IVs/25%; discounts only for eligible Orange Aesthetics services and retail, never Pacific Urgent Care or external partners. Proposed 90-day grant expiration, earliest-expiring-first redemption, owner-only retained expired history, audited legal recovery.

**Safe-by-default implementation:** issue only from verified payments; do not send PHI to Stripe; member/MA/owner access segregated; never delete credit history; keep gift cards and purchased stored value in a separate non-expiring-policy ledger; disable expiration server-side until attorney signoff; expose no production portal before authenticated HIPAA-ready backend, backups and tested restore. Clinical approval remains independent of payment. No live systems or tests are implied by this specification.

**Next work:** validate pure ledger against all boundary and remediation cases, implement server-side legal approval switch, append-only protected event store and real backup/restore, wire authenticated portals and signed payment webhooks only after infrastructure/legal gates. Remove contradictory historical 30-day wording wherever still present before launch.


## Business management and backup decision — 2026-11-22
Owner wants the authenticated Orange Aesthetics platform to operate the business end-to-end, with independently recoverable data and downloadable owner archives. See [BUSINESS-OPERATIONS-BACKUP-PLAN.md](BUSINESS-OPERATIONS-BACKUP-PLAN.md) for the implementation and security specification.
- Target: daily encrypted full database backups, weekly independent immutable offsite copies, monthly owner-downloadable audited business archives, quarterly actual restore drills, and failure alerts. Continuous PITR preferred if supported.
- Owner dashboard must include Backup Center, last verified successful job, backup history, downloadable monthly archive and restore-test evidence. Owner exports must exclude clinical charts and payment credentials; HIPAA-sensitive records require separate approved workflow.
- Retain expired IV credits, issuance, redemptions, refunds and legal restorations in immutable history. Backups are distinct from historical event logs. No automatic 90-day forfeiture without California counsel signoff.
- Added pure `app/lib/export-manifest.mjs` and five `app/tests/export-manifest.test.mjs` test cases for file hashes/manifest integrity. **No real archive, storage, scheduled job, owner download or restoration is implemented; tests have not been executed.**
- Next dependencies: protected backend, BAA/security decisions, authenticated owner endpoint, real backup provider, independent storage, tested restoration, approved retention policy.


## Cash-pay clinical record architecture — 2026-11-22
Owner confirms **100% cash-pay; no insurance claims** for Orange Aesthetics. Prefer existing Practice Fusion EHR for clinical charts and consents, but verify separate legal entity and account access with vendor and attorney before any cross-practice data access. Keep the Orange Aesthetics portal as the business/credit/payment/stock/owner system; no clinical chart duplication. Practice Fusion offers documented FHIR APIs and EHI export, but neither is confirmed configured or free; do not treat EHI export as a restorable EHR backup. Separate authorized clinical exports from ordinary daily/weekly business backups and monthly owner business ZIPs. Full vendor questions, public pricing and compliance gates: [PRACTICE-FUSION-CLINICAL-PLAN.md](PRACTICE-FUSION-CLINICAL-PLAN.md). Attorney issues L11-L15 in [LEGAL-COUNSEL-REVIEW.md](LEGAL-COUNSEL-REVIEW.md). **No actual EHR integration, records export, vendor account, BAA or clinical backup configured.**


## Brand alignment — original Orange Aesthetics website, 2026-11-22
Original website https://orangeaesthetics.com/ uses the tagline **Where Beauty Meets Imagination** and emphasizes personalized medical aesthetics, IV hydration, skincare, natural-looking enhancement and a luxurious clinical setting. Owner rejected **Feel beautiful. Live well.** because it resembles Flourish Longer branding. Homepage headline restored to **Where beauty meets imagination.** Supporting copy: **Refined aesthetics. Personalized care.** Do not reuse the rejected slogan; keep Orange Aesthetics brand distinct from Flourish Longer and Pacific Urgent Care. Avoid unsubstantiated treatment efficacy claims. Homepage change committed to GitHub; Cloudflare production deployment remains separately unverified and may be stalled.


## Homepage implementation — balanced aesthetics and IV wellness (2026-11-22)
Owner wants both specialties equally prominent. Actual index.html updated with equal primary CTAs and two equal editorial specialty panels; IV pricing FAQ corrected to reference Orange Aesthetics. Responsive styles.css updated and stylesheet cache-busted. Deployment not verified; no live functionality claimed.


## Unified public navigation implemented — 2026-11-22
Owner selected top-level **Home / Aesthetics / IV Therapy / Providers / Memberships**, with secondary **More** menu, external **Pacific Urgent Care** link clearly separate, and **Book Now** CTA. Actual HTML headers updated across 11 core pages; styles.css adds responsive dropdown treatment. Aesthetics currently links to existing aesthetic-pricing.html and IV Therapy to existing pricing.html, not newly built landing pages. Cloudflare publication and mobile/browser testing remain unverified. More menu houses injectables, skin, laser, shop, wellness and contact.


## Dedicated landing pages and internal consistency audit — 2026-11-22
Created aesthetics.html and iv-therapy.html, updated all 20 audited public page headers to consistent simplified navigation, fixed IV pricing business separation copy, and added responsive specialty CSS. See INTERNAL-CONSISTENCY-AUDIT-2026-11-22.md for findings, remaining clinical/legal checks, Cloudflare deployment and visual QA blockers. Changes are in GitHub, not verified live.


## Follow-up source audit — 2026-11-22
- Refined homepage to keep aesthetics and IV therapy equal; removed oversized standalone Flourish Longer homepage feature and independent partner tile. Partner remains available through secondary wellness content, subject to owner approval.
- Preserved four original specialty showcase cards, feature split, pricing highlight, two IV/membership cards, visit steps and FAQs; checked opening/closing section counts.
- Added two-column layout for remaining IV/membership cards and mobile single-column fallback.
- Added canonical URL metadata to aesthetics.html and iv-therapy.html.
- Confirmed source-level section structure and navigation; **still no live Cloudflare deployment, browser screenshot, or production form delivery verification**.


## Full-platform implementation pass — 2026-11-22
- Updated prominent appointment CTAs on homepage, both specialty landing pages, contact and memberships to link to appointment-request.html; label is **Request Appointment**, not guaranteed booking.
- Fixed CSS responsive nav wrapping and More dropdown clipping risk; still requires browser visual QA.
- Added PRODUCTION-DEPLOYMENT-CHECKLIST.md documenting Cloudflare Workers versus Pages incompatibility risk and acceptance checks. GitHub repository root has no package.json/wrangler config; actual Cloudflare project settings must be inspected before choosing a deployment mechanism.
- Appointment API is a Pages Function and uses server secrets for notification endpoint; cannot claim it runs on Workers or is operational. No PHI or payment tests.
- Stripe, auth, membership ledger, staff tools and owner dashboard remain prototypes/scaffolds, not deployed or secure.


## Silver Iris business architecture adaptation — 2026-11-22
- Reviewed **Silver Iris Farms Google Drive** business master plan and completion work order, plus private GitHub `naria-collab/SILVERIRISFARMS` README, implementation decisions, Business/Finances/dashboard code and role-aware application layout. **Silver Iris was read-only and unchanged.**
- Adapted ONLY useful business architecture: one protected owner/staff/member system, grouped workspaces, owner Business/Finances overview, inquiries, scheduling, invoices, cash/check deposit reconciliation, expenses, vendors, inventory, reports, tasks, staff permissions, audit events and backup center. Did NOT copy equestrian entities, voice workflows, styling, themes, assets, credentials or data.
- Created `app/BUSINESS-PLATFORM-STRUCTURE.md`, `app/lib/business-navigation.mjs`, `app/lib/business-operations.mjs`, `app/lib/workflow-rules.mjs`, synthetic tests, and a GitHub Actions test workflow.
- These are real committed business-domain foundations but **not yet a deployed, authenticated, database-backed owner dashboard**. Existing static Worker excludes `app/`; no real customer or financial data is collected. A dedicated secure backend, auth/RLS, payment integration, and regulatory review remain required.
- Public site remains Orange Aesthetics' existing visual identity and navigation.

## Staff reservation transaction safety — 2026-11-23
- Server-only `createStaffReservation` now runs `validateBooking` inside the supplied transaction, passing the same query function used for insertion. Rejected policy checks prevent inserts; tests cover execution order.
- This is **not** a deployed staff endpoint. The transaction provider, trusted role/tenant authorization, service-hours validator, and reviewed staging migration remain integration gates. PostgreSQL exclusion constraints, not preflight availability, must be the final concurrent-booking safeguard.


### Booking transaction safety (2026-11-23)
The server-only PostgreSQL transaction runner now applies a transaction-local, parameterized 15-second statement timeout (configurable 1,000–120,000 ms) before executing reservation callbacks. This limits lock-holding from stalled statements. CI verification is required; this does not make booking endpoints production-ready. Staged reservation schema still requires reviewed deployment, tenant authorization, and live PostgreSQL concurrency tests.

### Transaction query failure tracking (2026-11-23)
The server-only PostgreSQL runner now retains rejected query outcomes even after a pending promise settles, preventing a fire-and-forget failed statement from being missed before COMMIT. The transaction must roll back on any observed query failure. This remains an internal adapter; authenticated staff endpoints, migration review, and live concurrency verification are outstanding.

### Transaction safety checkpoint — 2026-11-25
- Confirmed main commits `0091812431bc9c491cfa2d98e85d17de921460fc`, `2cc0c89a6399cbfdd54118c39d8d9407edbb5050`, and `2d644117c9027173c023cb327f018f424e9fb2b6`: drain pending queries, reject failed queries before commit, and set a parameterized transaction-local statement timeout (15 seconds default, configurable 1–120 seconds).
- Regression tests committed; execution not yet verified. Next: verify CI, connect trusted pool and authenticated staff reservation endpoint in staging only. Production activation remains blocked.


### Public website QA — 2026-11-26
W13: Hardened static audit against browser-normalized active URL schemes (d631548); added regression cases (e45e971). Committed to main; CI execution and live deployment not verified. W13 remains open for mobile/browser QA. No production payment or clinical gates changed.


### Mobile and accessibility development — 2026-11-26
W13: Shared CSS mobile navigation, focus and reduced-motion improvements (32c88a2); homepage skip navigation and cache version (bb21bbb, c484e50). Browser QA and deployment verification pending. Extend skip navigation to remaining public pages after verification.


### Appointment form privacy — 2026-11-26
W11/W13: Explicit POST fallback, disabled submit until script initializes, noscript telephone fallback and keyboard skip link committed (8d8d254). Prevents default GET submission of contact details. Browser tests and notification delivery remain unverified; no live activation.


### Appointment backend resource handling — 2026-11-26
W11: Avoid awaiting oversized body cancellation and cancel unused notification response bodies (9ae7831). Source committed; runtime tests and notification delivery not verified. No live configuration changes.


### Private API transport safeguards — 2026-11-26
Development runtime now sets request/header/keep-alive timeouts and maximum header size, with no-store and connection-close on oversized bodies (be6bb72). Source committed; runtime testing pending. Staff scheduling integration remains unfinished. No production activation.


## Engineering checkpoint — 2026-11-26: gated staff appointment HTTP transport
- Added `app/lib/staff-reservation-http.mjs`: private, disabled-by-default POST adapter supporting reservation creation and lifecycle transitions by composing existing transactional services. Strict origin, JSON body size/shape, UUID, staff active status and MFA gates; verifies current staff permissions through trusted server callbacks; returns nonidentifying success/error messages and no-store headers.
- Added `app/tests/staff-reservation-http.test.mjs`: synthetic coverage for disabled state, both mutation types, MFA failures, malformed requests, authorization errors and sanitized server errors.
- GitHub commits: `7c959b0f9ddad2cd025e8b62dd70e84e03bbb4a7`, `f0755f33ad5bbd7f7fa79eeca071111d204a2065`. GitHub Actions run 45898512010 was in progress when checked; no passing result claimed yet. Local clone blocked by container DNS resolution.
- This adapter is **not wired to a public route**, has no production staff OIDC/MFA implementation and cannot handle real appointments. Before enabling: approved staff identity verification with trusted subject-to-staff UUID mapping; deployment security review, tenant isolation, migration/rehearsed rollback, concurrency tests against development Postgres, and monitoring.
- Next: connect authenticated development-only staff read/write API after verified OIDC and active staff membership integration, preserving disabled-by-default production gates.

- **Verified CI update (2026-11-26):** GitHub Actions Business foundation tests run [45898512010](https://github.com/lotuseater97-droid/orangeaesthetics.com/actions/runs/45898512010) completed successfully for commit `f0755f33ad5bbd7f7fa79eeca071111d204a2065` (unit job success). This confirms automated repository tests at that commit, not live Postgres integration, production authorization or deployment.

## Independent development priority — 2026-11-26
Owner directs developers to defer all tasks requiring human authorization into a separate approval backlog, without blocking independent implementation. Preserve all activation gates; continue synthetic-data dashboard, reporting, inventory, scheduling, accessibility and automated tests. Implemented nested staff shift overlap detection in `app/lib/staff-operations.mjs` (6f1378c) and added regression coverage; CI not yet verified. Next independent task: improve owner reporting and staff scheduling review without live records or payroll activation.

### Independent owner reporting improvement — 2026-11-26
Owner financial and inventory summary arithmetic now rejects unsafe integer totals instead of silently losing precision (8cb604c). Five synthetic regression tests added (444e4a9). CI verification pending; no production or approval-dependent changes. Next independent work: owner reporting date-range summaries and inventory review.

### Owner reporting date ranges — 2026-11-26
Implemented pure inclusive business-local date range financial summaries in `app/lib/owner-period-report.mjs` (1baff1f), with counts and existing safe-cent arithmetic; five regression tests (513be8a). Trusted data adapter must supply pre-scoped business dates; no UI or production integration yet. CI pending. Next independent task: inventory review and low-stock reporting.

### Independent inventory review — 2026-11-26
Improved existing low-stock and reorder engine: grouped movements for efficient review, reject duplicate movement IDs and invalid calendar dates, protect stock and reorder arithmetic from overflow (22fdf53). Four regression tests added (6a853e2). CI pending; no live inventory or clinical use activated. Next independent task: expense category reporting and dashboard integration with synthetic data.

### Owner expense reporting — 2026-11-26
Added paid expense category summaries by inclusive payment date, with category totals, counts, duplicate rejection and existing safe-cent calculations (593be59); five synthetic tests (e5014b5). Cash-basis reporting deliberately excludes approved but unpaid expenses; trusted adapter must map paid_on and status from authoritative records. CI pending; no live data or activation. Next independent task: integrate reporting modules into synthetic owner dashboard.

### Integrated owner reporting — 2026-11-26
Composed financial, paid expense category and current inventory reports in `app/lib/owner-dashboard-report.mjs` (9760513), with three integration tests (5c6bb20). Pure view model only; trusted adapter and UI integration remain pending. Previous Business foundation run 45899723738 passed at e5014b5; static audit and checkout integration failed at that revision and require diagnosis. New tests pending CI. Next independent work: diagnose failing workflows and build synthetic dashboard interface. No production activation.

### Interactive owner finance interface — 2026-11-26
Connected existing app/prototypes/owner-interactive.html finance view to shared reporting engine via ES module import, with date range controls, cash metrics, category breakdown and current inventory alert count (9c55149). Synthetic records only; serve over local HTTP for module imports. Browser QA pending. CI diagnosis: static audit asset/link and private exclusion steps passed, Worker security test failed; checkout integration failed at application library syntax check before full tests. Job logs not available in job metadata; exact causes remain unresolved. Next independent task: resolve syntax and Worker test failures, then browser QA and purchasing interface integration. No live activation.

### Staff reservation syntax repair — 2026-11-26
Corrected double-escaped regex literal in staff-reservation-http.mjs that prevented module parsing (86d1c10); added content-type regression coverage. CI verification pending. Staff endpoint remains disabled by default. Next: verify full checkout suite and diagnose remaining Worker security failures.

### CI regression repair — 2026-11-26
Checkout run 45900140490 confirmed all application and test modules parse after staff regex repair. Detailed job logs identified owner prototype test incorrectly parsing ES module as classic script. Updated test to use Node module-mode syntax check, preserving other assertions. New CI pending; next verify workflows then continue purchasing controls. No live activation.

### Purchasing controls — 2026-11-26
Verified previous repair at 86aceb3: business foundation run 45900244362, checkout run 45900244285 and static audit run 45900244323 all succeeded. Hardened purchase reconciliation with mandatory requester/approver identity, eligible purchase states, over-receipt detection and safe integer totals (63154b9); four regression tests (1376f1f). New CI pending. Next independent task: connect purchasing evaluation to synthetic owner interface. No payment or production activation.

### Interactive purchasing dashboard — 2026-11-26
Connected synthetic owner purchasing view to evaluatePurchase (718e81d), showing approval queue count, received/invoiced amounts, reconciliation issues and readiness. Added static wiring regression test. Existing demo actions simulate full receipt and matching invoice only; partial receipts, independent invoice entry and browser QA remain pending. No real payments, orders or inventory changes. Next independent task: partial receipt and invoice entry in demo.

### Partial purchasing records — 2026-11-26
Implemented independent multiple receipt and invoice amounts in synthetic owner workspace (6bf36d3), validated positive dollar inputs, and added static regression coverage. Uses browser prompts and in-memory arrays; no actual inventory quantity changes or payment execution. CI and browser verification pending. Next: inline entry forms and transaction history with correction controls.

### Verified handover — 2026-11-26
All completed code is committed. At 86ef5b1, business foundation run 45901018467, checkout integration run 45901018490 and static audit run 45901018541 succeeded; latest work-order static audit 45901028809 succeeded. No additional implementation occurred after partial purchasing. Next: replace browser prompts with inline validated receipt/invoice forms, transaction history and correction records; test and commit. Then continue vendor summaries, staff scheduling, appointment management, membership credits and QR check-in within approved scope. Browser QA and production integrations remain pending. Defer approval-dependent tasks; do not activate live payments, clinical workflows or PHI storage. Each continuation must fetch current repository files and latest commits, implement actual code, test, commit and update both plans. If blocked, attempt recovery and report actual failure rather than assume access is unavailable.

### Inline purchasing entry — 2026-11-26
Committed inline receipt/invoice forms and per-order amount history (6038e38). Synthetic only; correction records, browser QA and CI verification remain pending. Next: append-only correction controls and vendor summaries. No live activation.

### Purchasing corrections — 2026-11-26
Synthetic owner dashboard now records reasoned voids separately from original receipts/invoices, excludes voided entries from reconciliation, and rejects duplicate voids (b902419). Regression coverage committed (5fb1d6d); CI and browser QA pending. Next independent task: vendor-level purchasing summaries. No durable database audit or live payment activation.

### Vendor purchasing summaries — 2026-11-26
Implemented organization/vendor grouped commitments, pending approvals, received/invoiced totals, unreceived amounts and ready-for-review amounts (82026ed, 95d2adf), with regression tests. Synthetic dashboard only. Invoice totals are not unpaid balances; actual AP requires vendor payment records. CI/browser verification pending. Next: vendor payment record design and staff scheduling interface. No production activation.

### Accounts payable projection — 2026-11-26
Implemented read-only vendor invoice balances from scoped settled payment records (0b24fa3), five regression tests (2b65412), and synthetic purchasing dashboard balance view. Demo has no payment records yet; next add simulated settlement entry and staff scheduling. No live payment execution, database migration, or verified CI/browser run.

### Vendor settlement interface — 2026-11-26
Synthetic payment entry, partial settlement, balance validation, payment history and paid-invoice void protection committed (e6456e0). No actual payment execution; payment reversals and persistent records remain unimplemented. Next independent task: staff scheduling workspace. CI/browser verification pending.

### Staff scheduling workspace — 2026-11-26
Added synthetic shift entry, shared time review validation, overlap rejection and scheduled hours totals (22c3580). Explicit UTC prototype, not local business calendar or payroll. Regression assertions committed; CI/browser verification pending. Next: business timezone handling, shift edits/cancellation and calendar filtering. No live staff records.

### Pacific staff scheduling — 2026-11-26
Added America/Los_Angeles wall-clock conversion, UTC storage and local display (8b60ac3, d741cc5). Ambiguous fall-back and nonexistent spring-forward inputs rejected rather than guessed. Regression tests committed; CI/browser QA pending. Next shift editing/cancellation and weekly calendar. Synthetic only.

### Shift editing and cancellation — 2026-11-26
Added Pacific-time shift editing, reason-required cancellation, validation against the proposed schedule and in-memory before/after history (c8e6921). Cancelled shifts excluded from planned hours. Regression assertions committed; CI/browser verification pending. Next weekly calendar filtering and availability. No persistent audit or live staff records.

### Weekly staff calendar — 2026-11-26
Added Monday–Sunday Pacific-date grouping, previous/next week and date navigation, overnight shift display and midnight-exclusive end handling (3f38808, 3a7554a). Four regression tests committed. Synthetic only; CI/browser verification pending. Next monthly calendar and employee availability. Weekly display does not change all-schedule hours totals.

### Monthly staff calendar — 2026-11-26
Monthly grouping, week/month toggle, adjacent-month shading and clamped navigation implemented (f86114b, 6a4233c). Added leap-year and rollover tests; execution and browser QA pending. Next employee availability and time-off requests. Synthetic records only.

### Staff availability — 2026-11-26
Recurring Pacific weekday windows, add/remove controls, existing conflict count and new/edit shift checks committed (ea1349f, eddcb95). Missing rules mean unrestricted; configured staff require full coverage. Four regression tests committed; execution/browser QA pending. Next time-off requests and approval. Synthetic only.

### Staff leave — 2026-11-26
Added sample full-day leave requests, approval/rejection, approval blocked by existing shifts, and new/edit shift leave checks (e07ef33, be57d9b). Four tests committed. Next calendar absence display and staff portal integration. Synthetic only; CI/browser QA pending.

### Calendar absence display — 2026-11-26
Approved leave projected onto weekly/monthly calendar dates with duplicate employee suppression and separate visual labels (e7387ac, a6b11be). Pending/rejected requests excluded. Regression assertion committed; CI/browser QA pending. Next staff self-service integration. Synthetic only.

### Employee self-service — 2026-11-26
Added sample identity switching, individual shift and leave views, and employee leave submission into shared owner approval queue (1f376a4). Same in-memory sandbox, explicitly not authentication or access control. Regression assertion committed; execution/browser QA pending. Next clock-in/out prototype and authenticated adapter integration.

### Staff time clock — 2026-11-26
Added sample append-only clock events, clock in/out, unpaid breaks, transition validation and worked-time history (f885625, 093cdde). Tests committed; execution/browser QA pending. Uses browser time and synthetic in-memory records, not payroll or production timekeeping. Next owner actual-hours review and timesheet submission.

### Owner timekeeping oversight — 2026-11-26
Added employee clock status, all-record scheduled/completed hours and variance, and completed session details (4949546, 8ba7ca6). Open sessions excluded from worked totals. Regression tests committed; execution/browser QA pending. Next pay-period filtering and timesheet submission. Synthetic only; not payroll or attendance determination.

### Staff reporting period — 2026-11-26
Added inclusive Pacific start-date filters and all-record reset for scheduled/completed hours and session detail (a261b61, 6a070df). Current status remains unfiltered. Overnight sessions assigned entirely to start date for operational reporting only, not payroll allocation. Regression test committed; CI/browser QA pending. Next timesheet submission and approval.

### Timesheet submission and review — 2026-11-26
Added employee completed-session snapshots, overlap prevention, owner approval/rejection with reason and final decision protection (e173ad8, 0909fc3). Rejected periods may be resubmitted. Tests committed; execution/browser QA pending. Next snapshot detail, correction workflow and reconciliation of late clock entries. Synthetic only; not payroll-ready.

### Timesheet reconciliation — 2026-11-26
Added expandable submitted session details, reconciliation against current completed clock records, added/missing session counts and variance, and stale approval guard in owner demo (4b3f78d, 9179922). Original snapshot preserved; stale pending records must be rejected and resubmitted. Regression test committed; CI/browser QA pending. Next correction request workflow. Synthetic only.

### Clock correction requests — 2026-11-26
Added employee issue/date/explanation submission, personal status, owner acceptance/rejection with note (7f69fe9, fc07295). Acceptance queues correction only; no hours changed. Tests committed; execution/browser QA pending. Next audited application of corrected events and timesheet reconciliation. Synthetic only.

### Missed punch application — 2026-11-26
Accepted missed-in/out requests can insert a linked corrected event using Pacific local time and mandatory audit note; original events retained, full staff chronology validated, duplicate application rejected (dc46dcf, 64cf246). Existing timesheet reconciliation detects changed completed sessions. Break/other corrections and approved-timesheet amendments remain pending. Tests committed; execution/browser QA pending. Synthetic only.

### Missing break correction — 2026-11-26
Added audited missing unpaid break insertion with two linked events, chronology validation, owner Pacific-time inputs and duplicate application protection (4679c03, 7b8cbdc). Existing break replacement/removal and approved-timesheet amendments remain pending. Tests committed; execution/browser QA pending. Synthetic only.

### Existing timestamp correction — 2026-11-26
Added audited replacement of an existing employee clock event with original and replacement snapshots, validated chronology and owner form for accepted other requests (162da6a, 32a236c). Tests committed; execution/browser QA pending. Next approved timesheet amendments and break removal. Synthetic only.

### Erroneous break removal — 2026-11-26
Added removal of completed break pairs from effective clock history with original pair retained in correction audit, required note, request date and chronology checks, and owner controls (363de27, dbaef8e). Tests committed; execution/browser QA pending. Next approved timesheet amendments. Synthetic only.

### Approved timesheet amendments — 2026-11-26
Added versioned amendment proposals for stale approved timesheets, mandatory reason, duplicate prevention, original snapshot preservation and effective approved version selection (7e60ced, 447083f). Pending amendments do not supersede approvals. Tests committed; execution/browser QA pending. Next approved-hours export with reconciliation safeguards. Synthetic only.

### Approved hours export — 2026-11-26
Added operational CSV download of effective approved timesheets with date validation, partial-period, pending-review and stale-snapshot guards (9fac318, 2de8dff). Does not establish completeness of all employee hours or calculate payroll. Tests committed; execution/browser QA pending. Next completeness checks and historical pay rates.

### Approved hours export completeness — 2026-11-26
Export now checks every employee represented in clock history for uncovered completed sessions, duplicate approved session coverage and open clocks (e391402). Open clocks block export conservatively even outside the selected period. Cannot detect unrecorded work. Regression tests committed; execution/browser QA pending. Next historical pay-rate configuration.
