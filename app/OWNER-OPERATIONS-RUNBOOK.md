# Orange Aesthetics owner operating runbook — development draft
Status: not a live app. Do not use synthetic previews as actual business records.

## Daily
- Review new inquiries and appointment requests; avoid clinical detail in ordinary CRM.
- Review assigned tasks, staff coverage and supply reorder alerts.
- Confirm appointments only in the actual scheduling system; requests are not confirmed bookings.
- Match cash/check collections to physical receipts and prepare deposit records.

## Weekly
- Reconcile issued invoices with succeeded payments, refunds and current balances.
- Resolve orphan payments, cross-organization links, overpayments and missing deposits before exporting financial reports.
- Review vendor bills, expense approvals, reorder thresholds, inventory adjustments and membership redemption exceptions.
- Check failed notifications, access events and backup status.

## Monthly
- Export allowlisted invoice, payment, expense and inventory registers; review CSVs for accuracy.
- Reconcile bank deposits, Stripe payouts and cash/check against accounting statements.
- Review revenue by service, operating expenses, membership liability, aging receivables and refunds.
- Confirm role access for departed staff; retain audit events and restore-test backups.

## Launch prerequisites
A dedicated Orange Aesthetics database, protected authentication, per-record authorization, transaction-safe financial posting, audited server-side API, verified payment integrations, privacy/clinical review and tested backups. Existing modules are pure computation only.
