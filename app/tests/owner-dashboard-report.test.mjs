import test from "node:test";
import assert from "node:assert/strict";
import {buildOwnerDashboardReport} from "../lib/owner-dashboard-report.mjs";
const period={start:"2026-11-01",end:"2026-11-30",today:"2026-11-26"};
test("dashboard reconciles paid expenses and inventory alerts",()=>{
 const r=buildOwnerDashboardReport({...period,charges:[{business_date:"2026-11-02",amount_cents:10000}],expenses:[{id:"a",category:"Supplies",status:"paid",paid_on:"2026-11-02",amount_cents:2000},{id:"b",category:"Rent",status:"approved",amount_cents:3000}],items:[{id:"i",sku:"DEMO",reorder_threshold:5}],movements:[{id:"m",item_id:"i",quantity_delta:2}]});
 assert.equal(r.financial.net_cash_before_other_costs_cents,8000);
 assert.equal(r.financial.expenses_cents,r.expenseReport.total_cents);
 assert.equal(r.inventory.low_stock_count,1);assert.equal(r.inventory.as_of,period.today);
});
test("empty dashboard is valid",()=>{const r=buildOwnerDashboardReport(period);assert.equal(r.financial.gross_cents,0);assert.equal(r.inventory.low_stock_count,0)});
test("duplicate expenses fail closed",()=>{const e={id:"a",status:"approved"};assert.throws(()=>buildOwnerDashboardReport({...period,expenses:[e,e]}),TypeError)});
