# Interactive owner workspace — local development preview

Open `app/prototypes/owner-interactive.html` in a browser after downloading or cloning this repository. It is intentionally excluded from the Cloudflare production assets by `.assetsignore`.

## What is interactive
- Today dashboard: updates its appointment, task, stock and outstanding-balance summaries from the current in-memory sample.
- Appointments: requested → under review → confirmed or declined; confirmed → completed.
- Tasks: add a task, mark complete, reopen.
- Inventory: receive one sample unit and see reorder indicators update.
- Finance and membership: read-only synthetic overview.

## What is not implemented
There is no login, API, database, saved state, payment processing, email delivery, real appointment confirmation or clinical information. Refreshing the page restores all sample data. Do not deploy this unprotected preview publicly or enter customer information.

## Integration path
1. Create a dedicated Orange Aesthetics backend and authentication provider; keep Silver Iris infrastructure separate.
2. Map each view to organization-scoped, role-authorized server endpoints.
3. Replace sample data with validated server responses and implement audited, idempotent mutations.
4. Require server-side transaction safety for scheduling, inventory and finances.
5. Add integration tests, access-control tests, monitoring and backup/restore checks before production rollout.

The original `app/prototypes/owner-business.html` remains available as a static design reference.
