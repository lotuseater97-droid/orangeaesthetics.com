# Orange Aesthetics & Wellness — MASTER PLAN

**Updated:** 2026-11-22  
**Repository:** `lotuseater97-droid/orangeaesthetics.com`  
**Status:** Development. **NOT a live payment, member, staff or owner application.**

> This is the project source of truth. Read it before making changes. Update it and the relevant detailed specification after each meaningful implementation. Do not describe prototypes as production functionality.

## 1. Vision
One coherent Orange Aesthetics platform: public marketing website, guest service browsing and payment, recurring IV memberships, self-service member area, staff check-in and redemption, NEOCUTIS skincare sales, and a private Silver Iris Farms-style owner command center. Mobile-first, elegant coastal-luxury brand; no unnecessary app installation.

## 2. Fixed owner decisions
- **Payments:** Stripe chosen as primary provider. Stripe account creation/onboarding and connection **pending**. Hosted Checkout/Billing/Customer Portal/Terminal where appropriate; verify merchant eligibility and privacy restrictions first.
- **IV plans:** Wellness $99/mo; Performance $199/mo; Elite $399/mo. Benefits are drafts and contractual terms require final approval before billing. NAD+ separate.
- **Weight management:** initial evaluation at Pacific Urgent Care; lab testing through regular insurance where covered; clinician-authorized injections in clinic. **Never display public weight-loss medication prices**. Keep clinical data in compliant clinical systems.
- **Skincare:** NEOCUTIS product catalog with *advertised reference retail prices*, not verified inventory, acquisition cost, authorized online resale, or final sales price.
- **Partner:** Flourish Longer is independent; link to its separate booking and payment experience. No shared charges or revenue split.
- **Brand:** ivory #FAF8F3, sea glass #435D60, sage #A9C3BB, champagne #D6B68C, bronze #A77B61. Headline: “Feel beautiful. Live well.” No navy.
- **Location:** 1520 E Lincoln Ave, Orange, CA 92865; phone (714) 921-3870.

## 3. Current implementation truth
| Area | State | Verified reality |
|---|---|---|
| Marketing site and treatment pages | Built but untested | Static HTML/CSS in GitHub; live domain/Cloudflare deployment not verified |
| IV menu and membership pricing pages | Built but untested | Informational only |
| NEOCUTIS catalog | Built but untested | Reference prices, browser-only planning bag; no orders |
| Guest IV browsing | Built but untested | No payments |
| Medical weight-management information | Built but untested | No public weight-loss pricing |
| Member area | Prototype | `member-preview.html`; fictional data, no login, credits or billing |
| Staff check-in | Prototype | `staff-preview.html`; no scanner, staff login, real check-ins or redemption |
| Owner dashboard | Prototype | `owner-preview.html`; fictional data, no accounting integration |
| Stripe payments/Billing/Terminal | Scaffold only | Event classification and raw-body HMAC signature verification helpers drafted; no deployed endpoint, Stripe SDK connection, secrets, products or checkout |
| Protected backend/database | Schema draft only | Proposed SQL, pure ledger, checkout guardrails, owner metrics and test source in app/; no database, authentication, deployed API or applied migration |
| Domain/deployment | Unverified | Do not claim site is live until checked |

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
