# Parameterized owner dashboard SQL read adapter

`app/lib/owner-read-sql.mjs` translates the previously created owner-read contract into parameterized PostgreSQL queries aligned with `app/business-schema.staging.sql`. No database was changed.

- Every query includes an organization filter.
- Clinician and MA appointment/task queries include `assigned_to = verified_user_id` **in SQL before LIMIT**.
- Invoice and expense reads are owner/manager only.
- Inventory on-hand totals are aggregated from movements with a tenant-scoped join.
- Collection names, table names, field names and ORDER BY expressions are static allowlists; all runtime values use positional parameters.
- The adapter accepts a trusted server `query(text, values)` executor; do not expose database credentials to the browser.

## Production integration requirements
Use a real dedicated Orange database and verified server session; enforce actual role membership at the server and database layer. Add DB indexes for organization/assignment/sort paths and test explain plans at realistic volumes. Add cursor pagination and query timeouts. The staging schema is not yet deployed; test against real PostgreSQL before release. Keep PHI out of the business dashboard.

The UUID validation intentionally matches the schema's UUID identity types. Earlier pure service tests use synthetic string IDs; real integration fixtures must use UUIDs.
