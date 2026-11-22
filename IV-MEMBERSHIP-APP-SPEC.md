# IV Membership Check-in Application — implementation specification

Status: DESIGN ONLY; NOT LIVE; NO REAL PATIENT DATA. Do not expose the staff app on the public static site before authentication, backend and HIPAA readiness.

## Product surfaces
1. Patient portal: login, membership tier, renewal date, current entitlements, prior redemptions, non-identifying QR token/card, receipts, payment method management via hosted processor.
2. Staff app: MFA login, role-based access (MA, clinician, manager), QR scanner with manual lookup fallback, two-identifier patient verification, membership status, available benefits, choose eligible treatment, confirm visit, immutable audit log, correction/reversal flow.
3. Admin: plans and eligibility, enroll/suspend/cancel, billing sync, discount rules, rollover/expiration, audit reports, check-in and revenue reports.

## Existing plans (confirm precise benefit definitions)
- Wellness $99/month: one Mini PlenishIV (Mini Myers-style) monthly; 15% off eligible Orange Aesthetics services and retail skincare (including additional IV, injectables, laser and skin treatments). Owner prefers 90-day rollover of unused included IV benefits; enforce only after California legal approval and finalized contract.
- Performance $199/month: one qualifying drip, 20% off eligible Orange Aesthetics services and retail, proposed 90-day included IV entitlement expiry pending counsel approval.
- Elite $399/month: two qualifying drips, 25% off eligible Orange Aesthetics services and retail, priority scheduling, proposed 90-day included IV entitlement expiry pending counsel approval.
- NAD+ purchased separately with membership discount, subject to applicable terms.
- Clinical screening required; a successful QR scan never represents a completed medical procedure.

## Core data model
members(id, auth_user_id, external_ehr_id, display_name, status)
staff_roles(user_id, role, active)
plans(id, name, monthly_price_cents, discount_percent, version)
subscriptions(id, member_id, plan_id, status, billing_provider_ref, period_start, period_end)
benefit_grants(id, subscription_id, benefit_type, valid_from, expires_at, quantity)
redemptions(id, member_id, grant_id, service_code, confirmed_by, confirmed_at, status, idempotency_key)
checkin_events(id, member_id, scanned_by, occurred_at, result)
audit_events(id, actor_id, action, target_type, target_id, occurred_at, change_summary)
qr_credentials(id, member_id, token_hash, expires_at, revoked_at)
billing_events(id, provider_event_id unique, processed_at, status)

## Atomic redemption
Authenticated staff scans a random opaque QR token; server hashes it and resolves the member. UI shows minimum necessary info and asks staff to verify patient identity. Staff selects the *actual* eligible IV service and clicks Confirm. Backend transaction locks the benefit grant, checks membership active and quantity available, inserts one redemption with unique idempotency key, and updates available balance (prefer ledger derivation). Replays/double-scans must not double-charge. Errors or reversals create audit entries and never erase original events.

## Renewal
Use signed, replay-safe payment-provider webhooks to create monthly benefit grants only after authoritative billing status is confirmed. Unique event ID and period ID prevent duplicate grants. Define late payments, proration, pause, cancellation, refunds, proposed 90-day rollover, expiration and discounts before implementation. Never use a browser timer as billing authority.

## Security and HIPAA launch gate
- No PHI in GitHub, public static HTML, URL parameters, QR payload, third-party analytics, logs, or email.
- QR contains only high-entropy opaque short-lived or revocable token, not name, date of birth, MRN or treatment details.
- Staff MFA; separate patient auth; minimum-necessary access; audited role changes and redemption events; encryption and backups.
- RLS on all exposed Supabase tables with ownership and staff authorization policies; never expose service_role key.
- Confirm signed BAA and Supabase HIPAA add-on / High Compliance configuration before storing PHI; same for other vendors that handle PHI. Current accessible Supabase project belongs to a different collaboration and must NOT be reused.
- Payment processor handles card data. Membership system is not an EHR: if clinical chart updates are desired, scope a secure approved Practice Fusion integration or staff workflow separately.
- Complete security testing, staff training, incident response, retention policy and HIPAA review before launch.

## Delivery sequence
Phase 1: Confirm plan terms, choose compliant hosting and billing vendor, obtain BAA, build isolated backend and staff login.
Phase 2: Staff scan/check-in and ledger with fake test records, automated concurrent redemption tests and audit tests.
Phase 3: Patient portal, hosted billing, renewal webhooks, rollover rules, QA.
Phase 4: Integrate with public website via secure login links, launch with real patients after compliance review.

## Design principle
The public Orange Aesthetics site remains a premium aesthetics and wellness marketing site. Staff operations are a separate authenticated app, not a public QR endpoint.

## Expanded patient app: self-service purchases and seamless billing (approved product direction, implementation pending)
- Authenticated member can browse clinically appropriate **add-on services**, see member discount, current entitlements, applicable taxes/fees, and a full cost breakdown.
- A customer can select a one-time add-on (e.g. eligible IV upgrade, aesthetic service) or an explicitly recurring add-on. These must be separate choices: **never silently turn a one-time purchase into a monthly recurring charge**.
- Show two checkout choices: **Pay now** or **Add to monthly membership invoice** where supported and expressly authorized. For immediate treatment, use pay-now or require payment clearance before redemption. Monthly invoice consolidation does not imply a charge can be collected before consent.
- If customer chooses a recurring add-on, show new monthly total, effective date, next renewal date, cancellation policy and explicit consent. Persist consent text/version/time and price version.
- Saved payment method managed by compliant processor's hosted card-entry/tokenization flow; never collect or store card numbers or CVV in the Orange Aesthetics app.
- After confirmed successful charge (verified signed webhook), create purchase/entitlement ledger entry and reflect it in the member dashboard. Failed or pending payment does **not** grant a usable credit. If charge is refunded or disputed, update entitlements safely without destroying audit history.
- Appointment booking can be requested from the portal; buying a service is not clinical approval or a guaranteed appointment. At check-in, staff confirms identity, suitability/clinician clearance, service and available paid credits before redemption.
- For services from Kaja / Flourish Longer, **link out to her independent booking/payment system**, never add to Orange Aesthetics invoices.
- MA dashboard: member status, membership + add-on balances, purchase history, receipts, payment status, upcoming renewals, QR scan, visit confirmation, authorized refunds/corrections.
- Add tables: catalog_services(id, code, public_name, category, active, requires_clinical_approval); catalog_prices(id, service_id, cents, version, effective_from); orders(id, member_id, status, total_cents, idempotency_key); order_lines(id, order_id, service_id, price_id, quantity, member_discount_cents); payment_attempts(id, order_id, provider_payment_ref, status); consent_records(id, member_id, kind, terms_version, accepted_at); recurring_addons(id, subscription_id, service_id, status, next_bill_at, price_id); refunds(id, order_id, amount_cents, status); appointments(id, member_id, service_id, status). Use separate protected clinical system for treatment notes.
- Server is source of truth for prices, membership discounts, eligibility and charges. Atomic order finalization, webhook replay protection, concurrency-safe redemption, authorization for staff overrides, and clear proration/cancellation rules.
- **Payment processor HIPAA boundary**: Stripe's public terms restrict sending PHI through billing services and other third-party data. Do not put treatment names, diagnoses, patient identifiers linked to treatment, service details or medical notes into payment processor products, metadata, invoices, receipts, or analytics. Keep clinical catalog/order detail in the HIPAA-covered application and transmit only minimum necessary non-clinical billing references/amounts after legal/vendor review; or use an appropriately contracted healthcare billing platform with BAA. Stripe is NOT approved as a PHI repository by default.
- Customer portal must be hosted separately from the static marketing site and launched only after signed BAAs, HIPAA controls, staff MFA, patient access controls and a security review. No production patient data in this repository.

## Expanded scope: universal customer checkout (members AND nonmembers)
Decision: Orange Aesthetics must support **walk-in guest checkout, returning customer checkout, and IV member checkout** from the same web app. Native app download is optional; responsive web app/PWA is the initial delivery target.

### Guest walk-in workflow
1. Patient scans front-desk QR linking to a public service catalog (not an individual patient's QR). No login/download required.
2. Select service (IV, other eligible aesthetic service), review price and availability. Do not advertise unapproved prices.
3. Enter minimal contact details for order and receipt; collect medical intake and consent separately in HIPAA-covered authenticated workflow. Provide an accessible staff-assisted alternative.
4. Show exact charge and explicit authorization; redirect to compliant hosted checkout or secure embedded payment element. Never collect raw card data.
5. Backend verifies signed payment webhook and marks order **paid / awaiting clinical screening**, not **treatment complete**.
6. Staff dashboard displays queue with payment status and verifies identity. Clinician confirms eligibility/consent; MA records treatment completion only after service actually delivered.
7. Email/text receipt only if appropriate and without PHI. Guest can later claim their account with verified identity; do not reveal guest orders via unverified email lookup.

### Returning customers and members
- Returning customer signs in and sees their own purchase history, receipts, appointment requests, available prepaid treatments and optional saved payment method.
- Member can apply eligible monthly credits and discounts and purchase extra services. One-time purchases never become recurring charges without explicit separate opt-in.
- Staff can initiate checkout on behalf of walk-in customers with role-based permissions; payment method handled by secure processor terminal/checkout.
- In the app distinguish **order paid**, **clinical clearance**, **appointment confirmed**, **service performed**, and **membership benefit redeemed** as separate states.
- Offer cancellations, refunds, partial redemptions and package balances with immutable audit records.

### Technical additions
public service catalog; guest_order_intents; verified customer identities; orders/order_lines; payment_intents; webhook_events; clinical_clearance_reference; appointments; visit ledger; receipts; membership benefit ledger; consent_records; staff queue; role-based authorization; QR signage endpoint.
- Public QR for checkout contains only URL to service catalog; private member QR remains opaque, revocable, and distinct.
- Public marketing website should link to a separately secured checkout app after compliance review. No PHI on static pages, public URL query strings, payment metadata, or generic analytics.
- No live charging or patient record writes until HIPAA BAAs, payment processing, authorization, clinical workflows, refunds and QA are approved.
- An IV purchase is **not** medical approval to administer an infusion. Provide a clear screening and refund path if not eligible.

## New business lines: Neocutis retail store and in-clinic medical weight loss
### Neocutis retail
- Dedicated skincare storefront with categories, product details, ingredient/usage information grounded in approved brand materials, stock counts, cart, checkout, receipts, pickup/shipping options, return policy, taxes and inventory decrement.
- **Do not list unverified SKUs, invent prices, or use copyrighted manufacturer images without permission.** Confirm authorized retailer/reseller status, brand e-commerce restrictions, minimum advertised price and fulfillment rights before publishing products or accepting orders.
- Retail inventory and physical-product checkout should be distinguishable from clinical service payments; avoid PHI in retail payment processor metadata.
- Staff can sell products in-clinic through the same authorized checkout; customer sees order and fulfillment status.
### Medical weight loss — in-clinic weekly injections
- Patient-facing service page: request evaluation, view clinician-approved program information, schedule consultation and recurring weekly injection visits, pay approved consultation/program fees, receive reminders, view appointments and receipts.
- Practice policy: injections administered **in clinic**, not shipped for self-administration. Weekly scheduling applies when clinically appropriate for the selected prescribed medication; no promise of eligibility or automatic treatment after online payment.
- Clinician workflow: assessment, contraindication/medication review, informed consent, prescription and titration plan, follow-up monitoring, adverse-event escalation. Staff workflow: identity verification, ordered drug/dose verification, lot/expiration tracking, actual injection administration documentation only by appropriately authorized personnel under applicable rules, next appointment.
- Clinical records must be in a compliant EHR or securely integrated system; membership/order ledger is **not** a substitute for the medical chart.
- Never automatically titrate based on calendar or payment status. Never create an injection administration record merely because a visit is paid or booked.
- Confirm California scope/delegation, medication sourcing and storage, labeling, advertising rules, FDA status and restrictions on compounded GLP-1 products before offering them. Do not market compounded medication as FDA-approved or interchangeable with branded drugs.
- Clarify cancellation/no-show policy, medical ineligibility refunds, missed-dose handling by clinician, and whether weekly injections are paid per visit or under a monthly program.
### Integration
Customer app navigation: **IV Therapy | Aesthetics | Medical Weight Loss | Neocutis Shop | My Account**. Member and nonmember checkout. Separate purchase status, appointment status, clinical clearance, actual administration and retail fulfillment. Kaja/Flourish Longer remains an independent external partner.

## Weight-loss workflow clarification (2026-11-21)
- **Initial medical consultation takes place through Pacific Urgent Care & Family Medicine**, not an automatically purchased aesthetic injection visit. Clinic clinician evaluates eligibility and determines prescription.
- **Laboratory testing may be ordered through the patient's usual insurance** when medically appropriate and covered; do not promise coverage or a zero-cost laboratory visit. Clinical orders/results stay in the EHR, not retail checkout.
- After clinician approval, Orange Aesthetics portal supports payment for an approved in-clinic injection program and weekly appointment scheduling. App tracks financial entitlements and scheduling, while medication administration, lot, dose, assessment and clinical monitoring are charted in the approved clinical system.
- Historical supplier acquisition quotes are internal-only and must never appear on public treatment pages, patient checkout, or customer-facing program materials. Verify lawful sourcing separately.
- **Critical compliance gate**: these historical compounded GLP-1 products must not be listed for sale or prescribed/administered merely based on a historical catalog. Confirm current FDA restrictions, patient-specific clinical need, applicable federal/state compounding rules, source pharmacy licensure and lawful dispensing before offering any compounded product. Prefer lawful FDA-approved medications when clinically appropriate.

## Public weight-loss pricing policy (owner decision)
- **Do not display any medical weight-loss prices** on the public website, store, service menu, landing pages, or unauthenticated checkout.
- Weight-loss page should invite patients to arrange an initial consultation through the medical clinic. Labs may be billed to insurance when covered; do not promise coverage.
- After clinical evaluation and approval, individualized costs can be presented privately to the patient for explicit authorization in the secure portal. Do not list a general price menu.
- No historical pharmacy acquisition pricing in customer-visible content.

## Payment processor decision — Stripe (2026-11-21)
- Owner selected **Stripe** for simplicity and integration. Do not build Helcim/Square as the primary checkout.
- Use Stripe-hosted Checkout for approved one-time retail purchases and eligible nonclinical transactions; Stripe Billing subscriptions and customer portal for the three IV memberships, subject to finalized program terms.
- Use a dedicated authenticated server endpoint to create sessions from an allowlisted, server-priced catalog; never trust client amounts. No secret keys in GitHub or browser. Verify signed webhooks, deduplicate event IDs, reconcile payment state before credit fulfillment, and handle failed renewals, refunds and disputes.
- **PHI boundary:** Stripe is not the clinical chart. Never send diagnoses, prescriptions, clinical treatment details, labs, medical notes, appointment reasons, or other PHI in product names, Stripe metadata, descriptions, receipts, or customer records. Have counsel/compliance review whether each proposed transaction and data flow is permissible before launch; don't assume Stripe is a HIPAA BAA-covered clinical processor.
- Keep medical weight-loss prices off public pages. Do not activate medication-related payments until merchant underwriting, legal and compliance approval.
- Stripe account onboarding, verified bank payout details, product/price IDs, webhook signing secret and hosting secrets are not yet connected; the site is not processing real payments.

## Wellness discount scope decision — 2026-11-22
Owner selected 15% across eligible Orange Aesthetics services and retail, not only IV. Exclude independent partners and Pacific Urgent Care or insurance-billed services unless separately contracted and legally approved. Clarify stacking, retail brand permissions, clinical services, discounts on special offers and refund treatment in written terms. 90-day rollover remains a proposed policy pending California review; never automatically expire purchased value without signoff.


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
