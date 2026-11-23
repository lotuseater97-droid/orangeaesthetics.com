# Orange Aesthetics inventory operations
Status: pure inventory calculations only; not connected to live stock or purchasing.

## Business workflows
- Maintain product SKU, description, reorder threshold, supplier, pack size and optional lot/expiry data.
- Receive purchases as signed inventory movements, consume supplies on approved operations, and reconcile physical counts through auditable adjustments.
- Alert for low/negative stock, expiring/expired lots and movements referencing missing items.
- Suggest reorder quantities rounded to supplier pack sizes.
- Separate retail skincare from medical supplies; clinical medication handling requires additional controls, regulatory review, storage-temperature monitoring, authorized dispensing and recall processes.
- Use immutable movement history and authorized, reason-coded corrections; never silently overwrite historical counts.

## Production prerequisites
Dedicated database and authenticated staff access; transaction-safe stock updates; lot-to-receipt linkage; verified vendor records; reconciliation of physical counts; notification queue and audited inventory adjustments. No medical treatment may be authorized by this inventory module.
