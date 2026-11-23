// Verified Stripe event policy: call ONLY after raw-body signature verification.
// This module does not mutate orders, grant credits, or trust browser redirects.
export function paidCheckoutCandidate(event) {
 if(!event||event.type!=="checkout.session.completed"||typeof event.id!=="string"||
    !/^evt_[A-Za-z0-9]+$/.test(event.id)) return null;
 const session=event.data?.object;
 if(!session||session.object!=="checkout.session"||
    typeof session.id!=="string"||!/^cs_(?:test_|live_)?[A-Za-z0-9_]+$/.test(session.id)||
    (event.livemode===false&&!session.id.startsWith("cs_test_"))||
    (event.livemode===true&&session.id.startsWith("cs_test_"))||
    session.mode!=="payment"||session.payment_status!=="paid"||
    session.status!=="complete"||session.currency!=="usd"||
    !Number.isSafeInteger(session.amount_total)||session.amount_total<=0) return null;
 // Lookup MUST be by server-stored Stripe checkout ID, not metadata/customer email.
 return Object.freeze({eventId:event.id,checkoutId:session.id,amountCents:session.amount_total,currency:"USD"});
}
// Caller must atomically insert event ID (unique), lock order, verify matching
// checkout ID, amount, currency, and pending status, then mark paid and issue
// grants. Duplicate events must be idempotent. Refunds require separate logic.
