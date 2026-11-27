import test from "node:test";
import assert from "node:assert/strict";
import {requestClockCorrection,reviewClockCorrection} from "../lib/staff-clock-corrections.mjs";
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
