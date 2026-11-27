import test from "node:test";
import assert from "node:assert/strict";
import {baseLaborCost} from "../lib/staff-labor-cost.mjs";
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
