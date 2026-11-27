import test from "node:test";
import assert from "node:assert/strict";
import {addPayRate,payRateOn} from "../lib/staff-pay-rates.mjs";
test("effective dates preserve historical rates",()=>{
 const a=addPayRate([],"a","2026-11-01",2500,"Initial");
 const b=addPayRate(a,"a","2026-12-01",2700,"Raise");
 assert.equal(a.length,1);assert.equal(payRateOn(b,"a","2026-11-30").hourly_cents,2500);
 assert.equal(payRateOn(b,"a","2026-12-01").hourly_cents,2700);
 assert.equal(payRateOn(b,"b","2026-12-01"),null);
 assert.throws(()=>addPayRate(b,"a","2026-12-01",2800,"Duplicate"));
 assert.throws(()=>addPayRate(b,"a","2026-02-30",2800,"Invalid"));
});
