# Expired-benefit preservation and recovery design

**Status:** design/pure policy only; no deployed database or expiration job. 90-day expiration is a proposed business rule and MUST NOT be enforced until California legal signoff.

## Accounting model
Every paid-cycle grant has immutable ID, member/subscription, plan version, quantity, issued_at, valid_from, proposed_expires_at, payment confirmation reference, and terms version. Do not delete grants or change their original expiration timestamp. Maintain append-only events: grant_issued, benefit_redeemed, benefit_expired, expiration_overridden, benefit_restored, benefit_refunded, benefit_adjusted. Every event carries unique ID, event time, actor, reason, source, and idempotency key; server authorizes and audits all changes. Store minimum necessary member references in HIPAA-reviewed infrastructure only.

## Member view
Available count = unredeemed paid entitlements still within approved eligibility dates, plus approved restorations. Exclude expired original entitlements from available count, but show them in member history as expired (with applicable terms). When expiration has not been legally approved, do not enforce it; show proposed dates only in internal test fixtures, not as enforceable customer terms.

## Owner/compliance view
Report issued, redeemed, expired, restored, refunded and outstanding quantities by member, grant, plan, date and terms version. Retain expired grants and original payment evidence for disputes and retrospective recalculation. Use role-restricted exports with audit logs; no PHI in routine analytics or payment metadata. Never permanently erase history through a scheduled cleanup; apply legally required retention and privacy deletion rules.

## Redemption and recovery
- Select oldest **expiring eligible grant first** (earliest expires_at, then grant ID), with row locks and idempotent atomic redemption. Never consume expired grants automatically.
- An expiration event changes usability, not ownership of payment or historical evidence. Do not rewrite original grant to hide expiration.
- If counsel determines expiration unenforceable for affected grants, generate a dry-run impact report grouped by terms version/date/plan, approve remediation, then append restoration/extension/refund events. Preserve original expiration and reason for adjustment. Prevent double restoration and reconcile already refunded/redeemed credits.
- Refunds, chargebacks, cancellation, service unavailability and medical ineligibility need separate policies. A purchased gift card/prepaid value ledger must not inherit this 90-day expiration rule.
- Create tests for boundary at exactly 90 days, timezones/DST, two benefits per Elite month, FIFO, simultaneous scans, replay, reversal, legal hold and retrospective restoration.

## Launch gate
Counsel-approved contract and benefit classification; verified Orange Aesthetics entity and clinical authority; tested renewal/cancellation/consent, durable backups and recovery; protected database and MFA; complete test suite. No live expiration or member data until then.
