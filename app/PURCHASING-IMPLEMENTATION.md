# Orange Aesthetics vendor purchasing — development draft
Status: review-only rules, not a live procurement or accounts-payable system.

## Purchase approval flow
1. Staff submits a purchase request with vendor, organization, amount and justification.
2. An active manager approves within the configured threshold; an owner approves larger amounts. Requester cannot approve their own request.
3. Staff receives goods/services and records a receipt against the purchase order.
4. Finance records the vendor invoice and compares approved order, received value and billed value.
5. Only after independent review may an authorized user initiate payment through a separate secure financial integration.

## Controls
- Reject cross-organization approvals and inactive approvers.
- Flag missing receipts, mismatched bills and overbilling.
- Block canceled orders and orders lacking independent approval.
- Log approvals, rejected requests, revisions, receiving, invoice reconciliation and payment actions immutably.
- Keep vendor banking details in a protected provider vault, not in browser forms or ordinary CRM fields.
- The current amount-only three-way match is a preliminary check; production requires per-line item, quantity, SKU, tax, shipping, partial delivery, currency and tolerance handling.
- A matching purchase order is not permission to dispense or administer a clinical product.

## Remaining work
Secure Orange Aesthetics backend, authenticated role assignments, vendor database, atomic state transitions, approvals, payable integration, exception dashboard and audit trail.
