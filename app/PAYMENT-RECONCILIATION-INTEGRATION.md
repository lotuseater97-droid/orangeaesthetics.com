# Payment reconciliation: read-only PostgreSQL inspection

The new `postgres-payment-reconciliation.mjs` reads an invoice and its payments with explicit organization and invoice filters, converts PostgreSQL bigint strings to safe integer cents, detects mismatched balances, duplicate/cross-tenant records, unpaid balances on paid invoices, draft invoices with settled payments, and undeposited cash/checks. It makes no writes.

**Important schema limitation:** `oa_payments.status='refunded'` overwrites the prior succeeded state and has no independent refund event amount. Therefore a refunded payment cannot establish lifetime successful settlements or partial refunds. The inspector explicitly reports `REFUND_HISTORY_AMBIGUOUS` instead of guessing the balance. Before enabling live payment mutation, add an append-only financial event ledger, verified processor event mapping, idempotency, and real database concurrency tests.

This is an analytical backend component, not a payment processor or a production deployment. Tests use mocked PostgreSQL responses.
