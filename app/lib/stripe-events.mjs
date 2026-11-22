// Only call this classifier AFTER Stripe webhook signature verification.
// Browser redirects, unsigned payloads and payment-intent creation are not proof of payment.
const recognized = new Set(["checkout.session.completed","invoice.paid","invoice.payment_failed","customer.subscription.updated","customer.subscription.deleted","charge.refunded","charge.dispute.created"]);
export function classifyVerifiedEvent(event) { if (!event || typeof event.id !== "string" || typeof event.type !== "string" || !event.data?.object) throw new TypeError("Malformed Stripe event"); return {eventId:event.id,type:event.type,action:recognized.has(event.type)?event.type:"ignore",requiresReconciliation:true}; }
export function mayGrantMembershipCredit({eventType, invoicePaid, subscriptionActive, periodKey, alreadyGranted}) { return eventType === "invoice.paid" && invoicePaid === true && subscriptionActive === true && typeof periodKey === "string" && periodKey.length > 0 && alreadyGranted === false; }
