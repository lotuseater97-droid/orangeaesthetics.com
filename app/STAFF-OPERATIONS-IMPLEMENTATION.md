# Orange Aesthetics staff operations
Status: pure calculations only. No payroll provider, staff accounts, GPS tracking or tax reporting connected.

## Implemented
- Net time worked from start/end timestamps and explicitly supplied unpaid break minutes.
- Detection of overlapping shifts, duplicate records, invalid break durations and exceptionally long shifts.
- Mileage totals from approved business trips only; missing business purposes flagged for review.

## Production controls
- Employees submit time and mileage; managers approve corrections with reason and immutable audit history.
- Preserve original time entries and adjustment records; no silent changes to clock-in/out.
- Restrict staff records to authorized owner/manager and the relevant employee.
- Store the applicable business timezone, original time zone offset and DST context.
- Wage, overtime, meal/rest breaks, reimbursement, record retention, tax treatment and employee classification require jurisdiction-specific review. These functions are **not** a payroll engine and do not decide overtime or legal compliance.
- Do not collect continuous GPS location; use trip distance and business purpose only.
- Integrate with a dedicated Orange Aesthetics backend after authentication, RLS, backup and audit controls are ready.
