// Exports business-only, explicitly allowlisted fields. No clinical data.
const schemas=Object.freeze({
 invoices:["id","status","currency","total_cents","balance_cents","due_at"],
 payments:["id","invoice_id","amount_cents","method","status","deposited_at"],
 expenses:["id","vendor_id","category","amount_cents","incurred_on","status"],
 inventory:["sku","description","on_hand","reorder_threshold"],
 tasks:["id","title","status","due_at"]
});
function escapeCell(value){if(value==null)return "";let s=String(value);if(/[\r\n]/.test(s))throw new TypeError("Multiline export field not allowed");if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
export function businessCsv(kind,rows){if(!Object.hasOwn(schemas,kind))throw new RangeError("Unsupported export");if(!Array.isArray(rows)||rows.length>100000)throw new RangeError("Invalid rows");const columns=schemas[kind];return [columns.join(","),...rows.map(row=>{if(!row||typeof row!=="object")throw new TypeError("Invalid row");return columns.map(c=>escapeCell(row[c])).join(",")})].join("\r\n")+"\r\n"}
export function exportKinds(){return Object.keys(schemas)}
