import test from "node:test";
import assert from "node:assert/strict";
import {summarizeOwnerPeriod} from "../lib/owner-period-report.mjs";
const period={start:"2026-11-01",end:"2026-11-30"};
const row=(business_date,amount_cents)=>({business_date,amount_cents});
test("inclusive period filters all financial categories",()=>{
 const r=summarizeOwnerPeriod({...period,charges:[row("2026-10-31",900),row(period.start,1000),row(period.end,2000),row("2026-12-01",900)],refunds:[row(period.end,100)],fees:[row(period.start,50)],expenses:[row(period.end,500)]});
 assert.equal(r.gross_cents,3000);assert.equal(r.net_cash_before_other_costs_cents,2350);assert.deepEqual(r.counts,{charges:2,refunds:1,fees:1,expenses:1});
});
test("empty period returns zero",()=>assert.equal(summarizeOwnerPeriod(period).gross_cents,0));
test("rejects reversed and impossible dates",()=>{for(const start of ["2026-12-01","2026-02-30","2026-11-01T00:00:00Z"])assert.throws(()=>summarizeOwnerPeriod({...period,start}),RangeError)});
test("rejects malformed record dates",()=>assert.throws(()=>summarizeOwnerPeriod({...period,charges:[row("2026-11-31",100)]}),RangeError));
test("single day and leap day are supported",()=>assert.equal(summarizeOwnerPeriod({start:"2028-02-29",end:"2028-02-29",charges:[row("2028-02-29",123)]}).gross_cents,123));
