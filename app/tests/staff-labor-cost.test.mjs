import test from "node:test";
import assert from "node:assert/strict";
import {baseLaborCost,summarizeLaborCosts} from "../lib/staff-labor-cost.mjs";
import {addPayRate} from "../lib/staff-pay-rates.mjs";
import {clockEvent} from "../lib/staff-clock.mjs";
test("historical base cost and missing rate handling",()=>{
 const shifts=[{staff_id:"a",clock_in:"2026-11-26T17:00:00Z",clock_out:"2026-11-27T01:00:00Z",unpaid_break_minutes:30}];
 const events=clockEvent(clockEvent([],"a","in",shifts[0].clock_in),"a","out",shifts[0].clock_out);
 const rates=addPayRate([],"a","2026-11-01",2000,"Initial");
 const result=baseLaborCost(["a"],shifts,events,rates)[0];
 assert.equal(result.scheduled.cents,15000);assert.equal(result.actual.cents,16000);assert.equal(result.variance_cents,1000);
 assert.equal(baseLaborCost(["a"],shifts,events,[])[0].actual.cents,null);
});

test("business totals distinguish incomplete from zero",()=>{
 const row=(staff_id,s,a)=>({staff_id,scheduled:{cents:s},actual:{cents:a}});
 const partial=summarizeLaborCosts([row("a",100,200),row("b",null,300)]);
 assert.equal(partial.scheduled.total_cents,null);assert.equal(partial.scheduled.known_cents,100);
 assert.deepEqual(partial.scheduled.missing_staff,["b"]);assert.equal(partial.actual.total_cents,500);
 assert.equal(partial.variance_cents,null);
 assert.equal(summarizeLaborCosts([row("a",100,200),row("b",50,300)]).variance_cents,350);
 assert.throws(()=>summarizeLaborCosts([row("a",0,0),row("a",0,0)]));
});
