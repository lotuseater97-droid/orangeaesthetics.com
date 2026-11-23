# Orange Aesthetics — Communication workflow
Status: prepared notification commands only; no email provider or live send configured.

## Transactional notifications
- Appointment request received (customer)
- Appointment needs review (staff)
- Appointment confirmed (customer)
- Invoice available and receipt available (customer)
- Inventory reorder review and task assignment (staff)

`app/lib/notification-outbox.mjs` validates type, recipient, approved non-clinical fields, customer email consent/lawful-basis flag, and idempotency key. It returns a command only. It never sends email or writes to a database.

## Secure deployment design
1. On successful authoritative transaction, write outbox event **in the same database transaction** as the business record.
2. Worker polls or receives queue events, verifies delivery eligibility and uses a dedicated email provider; store only minimal identifiers and provider delivery status.
3. Use unique organization-scoped idempotency keys and exponential retry with dead-letter queue. Avoid duplicate messages on webhook retries.
4. Do not put diagnosis, treatment details, patient identifiers, billing amounts or sensitive membership details in message subjects, URLs or logs.
5. Provide separate consent/opt-out flows for marketing. These templates are strictly transactional, not promotions. Verify applicable laws, provider agreements and privacy requirements.
6. Restrict staff recipients to current active roles; suppress notifications when a contact opts out or email bounces. Configure domain SPF, DKIM and DMARC before live sending.
7. Monitor failed deliveries and escalation; manual phone fallback for time-sensitive appointment requests.

## Remaining dependencies
Dedicated Orange Aesthetics database, authenticated API, real transport provider, consent model, operational settings, bounce/webhook processing, monitoring and test delivery verification.
