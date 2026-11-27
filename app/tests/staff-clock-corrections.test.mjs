import test from "node:test";
import assert from "node:assert/strict";
import {requestClockCorrection,reviewClockCorrection,applyClockCorrection} from "../lib/staff-clock-corrections.mjs";
const input={date:"2026-11-26",kind:"missed-out",reason:"Forgot to clock out"};
test("request and review preserve original records",()=>{
 const pending=requestClockCorrection([],"a",input);
 const reviewed=reviewClockCorrection(pending,"CR-1","accepted-for-correction","Verify hours");
 assert.equal(pending[0].status,"pending");assert.equal(reviewed[0].staff_id,"a");
 assert.throws(()=>reviewClockCorrection(reviewed,"CR-1","rejected","Changed"));
});
test("invalid date, reason and decision rejected",()=>{
 assert.throws(()=>requestClockCorrection([],"a",{...input,date:"2026-02-30"}));
 assert.throws(()=>requestClockCorrection([],"a",{...input,reason:" "}));
 assert.throws(()=>reviewClockCorrection([],"CR-1","rejected","No"));
});

test("missed punch application preserves original events and rejects duplicate application",()=>{
 const accepted=reviewClockCorrection(requestClockCorrection([],"a",input),"CR-1","accepted-for-correction","Verified");
 const original=[{staff_id:"a",action:"in",instant:"2026-11-26T17:00:00Z"}];
 const result=applyClockCorrection(accepted,original,"CR-1","out","2026-11-27T01:00:00Z","Confirmed");
 assert.equal(original.length,1);assert.equal(result.events.length,2);assert.equal(result.records[0].status,"applied");assert.equal(result.events[1].correction_id,"CR-1");
 assert.throws(()=>applyClockCorrection(result.records,result.events,"CR-1","out","2026-11-27T01:00:00Z","Again"));
 assert.throws(()=>applyClockCorrection(accepted,original,"CR-1","out","2026-11-26T16:00:00Z","Invalid"));
});
