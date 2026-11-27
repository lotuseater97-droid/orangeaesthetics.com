import test from "node:test";
import assert from "node:assert/strict";
import {laborExpenseCsv} from "../lib/staff-labor-export.mjs";
test("export marks missing costs and escapes employee formula",()=>{
 const csv=laborExpenseCsv([{staff_id:"=example",scheduled:{cents:null},actual:{cents:12000},variance_cents:null}],{start:"2026-11-01",end:"2026-11-30"});
 assert.match(csv,/"'=example"/);
 assert.match(csv,/"","120.00","","INCOMPLETE"/);
 assert.match(csv,/PARTIAL_SUBTOTAL_NOT_PAYROLL/);
});
