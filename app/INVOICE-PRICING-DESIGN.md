# Invoice pricing: trusted catalog and immutable line snapshots

The invoice pricing service looks up prices from an organization-scoped catalog using a transaction-scoped SQL query. It rejects unknown or inactive codes, invalid prices, and unsafe arithmetic; no client-provided price is accepted. The proposed invoice-line schema snapshots the description, quantity, unit price and line total so subsequent catalog price changes cannot rewrite past invoices.

This is **not invoice creation**. The migration is review-only and has not been applied. The pricing function is a building block for a future transaction that inserts invoice header and line rows, checks sums and balances, audits the action, and finalizes idempotency atomically. Real database tests and tax/discount/payment policy review are still required.
