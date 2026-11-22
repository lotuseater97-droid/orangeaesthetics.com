# IV Membership Check-in Application — implementation specification

Status: DESIGN ONLY; NOT LIVE; NO REAL PATIENT DATA. Do not expose the staff app on the public static site before authentication, backend and HIPAA readiness.

## Product surfaces
1. Patient portal: login, membership tier, renewal date, current entitlements, prior redemptions, non-identifying QR token/card, receipts, payment method management via hosted processor.
2. Staff app: MFA login, role-based access (MA, clinician, manager), QR scanner with manual lookup fallback, two-identifier patient verification, membership status, available benefits, choose eligible treatment, confirm visit, immutable audit log, correction/reversal flow.
3. Admin: plans and eligibility, enroll/suspend/cancel, billing sync, discount rules, rollover/expiration, audit reports, check-in and revenue reports.

## Existing plans (confirm precise benefit definitions)
- Wellness $99/month: one Mini Myers, 15% discount, 30-day rollover.
- Performance $199/month: one qualifying drip, 20% discount.
- Elite $399/month: two qualifying drips, 25% discount, priority scheduling.
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
Use signed, replay-safe payment-provider webhooks to create monthly benefit grants only after authoritative billing status is confirmed. Unique event ID and period ID prevent duplicate grants. Define late payments, proration, pause, cancellation, refunds, 30-day rollover, expiration and discounts before implementation. Never use a browser timer as billing authority.

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
