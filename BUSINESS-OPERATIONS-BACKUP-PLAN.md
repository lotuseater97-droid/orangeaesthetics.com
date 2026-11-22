# Business operations, backup and disaster recovery architecture
**Status: specification and local validation helpers only. NOT deployed.** The public Cloudflare site is not a secure EHR, business database or backup repository.

## Business command center — protected app
Owner modules: dashboard; subscriptions and member credit audit; member/staff check-in; appointment queue; catalog/pricing/discount rules; payments/Stripe reconciliation; refunds/disputes; cash/expenses/receipts; vendors and purchase orders; retail stock, lot and reorder; payroll/time/mileage; tax-ready reports; marketing attribution; user/role administration; incident log; backup/restore and export center. Role-based least privilege; owner and staff MFA; clinical records and decisions in separately approved clinical system. Never place PHI in static Pages, GitHub, Stripe metadata, or generic downloads.

## Backup policy — preferred design
| Job | Cadence | Destination | Validation |
|---|---|---|---|
| Database point-in-time recovery | Continuous WAL/PITR if provider supports | Encrypted protected database backup service | PITR window monitored |
| Full database backup | Every 24 hours | Encrypted backup store separate from live database | Snapshot ID, byte count, checksum, success |
| Independent immutable/offsite copy | Weekly | Separate account/provider or immutable bucket with independent credentials | Verify checksum, access and retention lock |
| Business export package | Monthly (plus owner on-demand) | Server-generated, short-lived owner download, encrypted at rest | Signed manifest, counts, checksum; access logged |
| Recovery exercise | Quarterly | Isolated staging environment | Document RPO/RTO and actual restore result |
| Backup alerts | Every job | Private admin notification channel | Alert on missed/failed jobs; escalate unresolved failure |

Initial retention targets **subject to counsel/security review**: 35 daily copies, 13 weekly copies, 84 monthly archives; PITR 7–30 days if available. Retention must not override applicable medical, tax, employment or litigation-hold duties. Backups must support legal holds, retention expiry and privacy requirements.

## Export package (owner)
Separate financial and operational exports; do not include patient charts. ZIP bundle contains manifest.json, subscriptions.csv (minimal pseudonymous IDs), benefit_grants.csv, benefit_redemptions.csv, benefit_history_events.csv, orders.csv, payment_reconciliation.csv, expenses.csv, inventory.csv, staff_time.csv, vendors.csv, and a README with schema versions and report definitions. Include only tables actually approved for export. Sensitive member-identifying exports, if needed, require a separate encrypted HIPAA-reviewed workflow. No card numbers, passwords, authentication tokens, full clinical notes, or raw QR tokens.

Manifest must identify export_id, generated_at UTC, covered period, schema version, row counts and SHA-256 digest of each exported file. An export is successful only after all checksums verify. Never claim a download succeeded merely because a button was clicked. Keep an owner-visible history of jobs and audit who downloaded what.

## Security and recovery
- Database encrypted at rest and in transit; backup keys separate from production DB credentials; key rotation and recovery escrow, least-privilege backup service account.
- Immutable backup copies; no production app credentials may delete both live data and offsite backups. Never commit backup bytes, credentials, secrets or patient data to GitHub.
- Backup job ledger: job ID, type, started/finished, status, destination class, checksum/manifest pointer, failure reason, retention expiration, verified_at, restored_at. No public endpoints.
- Restoration requires owner + authorized administrator approval, staged test, recovery point selection, audit trail, and controlled cutover. Restore historical ledger without duplicate grants, payments or redemptions.
- Retain original expired grants and all financial events; legal restoration creates new auditable adjustment, not a rewrite of original expiration.
- Test disaster cases: accidental deletion, ransomware, missing backup, compromised key, duplicate Stripe webhooks, failed restore, database corruption and legal credit reinstatement.
- Target objectives to validate: RPO <=24h for daily-only backup (prefer <=1h with PITR); RTO <=24h for initial business app. These are targets, not promises.

## Work order / dependencies
1. Choose dedicated protected backend, storage and signed BAAs as required; establish dev/staging/prod.
2. Implement authentication, staff/owner MFA, authorization and audited job endpoints.
3. Apply reviewed schema migrations, immutable benefit ledger and payment reconciliation.
4. Implement provider-native encrypted daily backups and independent weekly copies; alert on failures.
5. Implement server-side monthly CSV/ZIP exporter with checksums, short-lived owner-only signed download, and event log.
6. Run actual restoration drill before accepting live business records; repeat quarterly.
7. Add owner Backup Center showing latest success, failed jobs, last verified restore, retention and downloadable monthly packages.
8. Complete California counsel signoffs in LEGAL-COUNSEL-REVIEW.md and clinical/privacy review.

## Explicit non-goals
No automatic email of plaintext member records; no browser-generated authoritative backups; no backup downloads accessible from static HTML; no public member data; no claims of live backups before verified storage and restore.


## Cash-pay clinical record architecture — 2026-11-22
Owner confirms **100% cash-pay; no insurance claims** for Orange Aesthetics. Prefer existing Practice Fusion EHR for clinical charts and consents, but verify separate legal entity and account access with vendor and attorney before any cross-practice data access. Keep the Orange Aesthetics portal as the business/credit/payment/stock/owner system; no clinical chart duplication. Practice Fusion offers documented FHIR APIs and EHI export, but neither is confirmed configured or free; do not treat EHI export as a restorable EHR backup. Separate authorized clinical exports from ordinary daily/weekly business backups and monthly owner business ZIPs. Full vendor questions, public pricing and compliance gates: [PRACTICE-FUSION-CLINICAL-PLAN.md](PRACTICE-FUSION-CLINICAL-PLAN.md). Attorney issues L11-L15 in [LEGAL-COUNSEL-REVIEW.md](LEGAL-COUNSEL-REVIEW.md). **No actual EHR integration, records export, vendor account, BAA or clinical backup configured.**
