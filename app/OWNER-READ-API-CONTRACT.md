# Owner dashboard read service (not deployed)

`app/lib/owner-read-service.mjs` is the first shared server-side **read** contract for the interactive dashboard. It defines collection-specific fields, requires a trusted verified actor, applies capability checks, limits returned row counts and fails closed if a repository returns a row from another organization.

## Available collections
- Appointments: id, requested time, service code, status
- Tasks: id, title, status, due time
- Invoices: id, status, currency, total, balance
- Expenses: id, category, amount, status, incurred date
- Inventory: id, SKU, description, reorder threshold, on-hand quantity

No clinical chart, freeform diagnosis, contact email or card data is included. Financial collections require business-read permission; inventory requires inventory-read permission.

## Required integration work
Server session verification and staff membership lookup must be implemented with real authentication; SQL repository queries must filter by organization and use approved sort/pagination; database grants and RLS must remain default-deny until audited. The current `app/prototypes/owner-interactive.html` still uses invented records, not this service.

Do not publish private endpoints or enable browser access until the dedicated Orange database and negative authorization tests are available.
