# Owner dashboard server integration

`owner-dashboard-backend.mjs` now composes the session/membership boundary, protected read service and parameterized SQL query adapter. This replaces three disconnected pieces with one callable server-side read service.

The integration tests verify both layers: SQL queries scope the organization and staff assignment **before** LIMIT, and the response layer rejects tenant or assignment leaks and strips non-allowlisted fields.

## Remaining production work
This is still **not** a deployed API. The supplied `verifySession`, `lookupMembership` and `query` callbacks must be implemented against a dedicated Orange Aesthetics database and secure session provider. The backend must validate session revocation, apply rate limits, handle pagination, add appropriate database indexes and protect audit logs. No production website, Silver Iris data or existing Supabase project was changed.
