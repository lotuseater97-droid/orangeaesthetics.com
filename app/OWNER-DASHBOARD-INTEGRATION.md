# Owner dashboard server integration

`owner-dashboard-backend.mjs` now composes the session/membership boundary, protected read service and parameterized SQL query adapter. This replaces three disconnected pieces with one callable server-side read service.

The integration tests verify both layers: SQL queries scope the organization and staff assignment **before** LIMIT, and the response layer rejects tenant or assignment leaks and strips non-allowlisted fields.

## Remaining production work
This is still **not** a deployed API. The supplied `verifySession`, `lookupMembership` and `query` callbacks must be implemented against a dedicated Orange Aesthetics database and secure session provider. The backend must validate session revocation, apply rate limits, handle pagination, add appropriate database indexes and protect audit logs. No production website, Silver Iris data or existing Supabase project was changed.

## Explicit active organization binding
A verified session must now carry an explicit `organization_id` as well as `user_id`. The backend passes both identities to `lookupMembership({user_id,organization_id})` and rejects membership records belonging to a different organization. This avoids accidentally selecting an arbitrary organization when a staff member has access to more than one business.

`staff-membership-sql.mjs` provides a parameterized lookup against `oa_team_members`, requiring an active row for both IDs. The session provider must establish the active organization through a trusted selection flow and must not accept an unverified browser-supplied organization as authority. Membership changes and session revocation require server-side revalidation.
