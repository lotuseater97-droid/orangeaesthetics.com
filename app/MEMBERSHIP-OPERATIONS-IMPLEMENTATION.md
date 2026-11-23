# Orange Aesthetics membership operations
Status: pure, tested business projections; not connected to live Stripe subscriptions, patient records or a database.

## Implemented
- Member-scoped subscription status and billing-period validation.
- Credits available only when a subscription is active, payment is verified and its billing period is current.
- Existing benefit-history projections are reused for redemptions and approved adjustments; no duplicate credit ledger.
- Renewal-approaching, ended-period and payment-review alerts.
- Membership-specific negative tests: payment failure, out-of-period credits, member isolation and duplicate subscriptions.

## Legal/product decision required
The existing benefit-history policy has an explicit legal gate for credit expiration. This module does **not** change the underlying contractual expiration/rollover policy. It prevents redemption outside an active verified subscription period, even when an unexpired historical grant remains on the ledger. Any rollover/paused/canceled-member access rules need attorney approval and explicit implementation before launch.

## Live implementation
Use verified Stripe webhook events and authoritative database subscription periods; never treat client checkout redirects as payment proof. Persist unique provider event IDs and subscription-period credit grants transactionally. Do not place PHI in Stripe metadata. Secure member-scoped reads with database RLS and verified server authorization; audit grant/redemption/reversal events. Do not activate member credits based solely on these pure functions.
