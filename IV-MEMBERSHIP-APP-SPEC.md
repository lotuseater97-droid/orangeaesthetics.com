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
