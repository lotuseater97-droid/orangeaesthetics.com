import test from "node:test";
import assert from "node:assert/strict";
import {submitTimesheet,decideTimesheet} from "../lib/staff-timesheets.mjs";
import {clockEvent} from "../lib/staff-clock.mjs";
const period={start:"2026-11-26",end:"2026-11-26"};
const open=clockEvent([],"a","in","2026-11-26T17:00:00Z");
const events=clockEvent(open,"a","out","2026-11-26T23:00:00Z");
test("submission snapshots completed hours and rejects overlap",()=>{
 const records=submitTimesheet([],"a",period,events);
 assert.equal(records[0].worked_minutes,360);
 assert.throws(()=>submitTimesheet(records,"a",period,events));
 assert.throws(()=>submitTimesheet([],"a",period,open));
});
test("decision is immutable and final; rejection allows resubmission",()=>{
 const pending=submitTimesheet([],"a",period,events);
 const approved=decideTimesheet(pending,"TS-1","approved","Reviewed");
 assert.equal(pending[0].status,"pending");
 assert.throws(()=>decideTimesheet(approved,"TS-1","rejected","Changed"));
 const rejected=decideTimesheet(pending,"TS-1","rejected","Review needed");
 assert.equal(submitTimesheet(rejected,"a",period,events).length,2);
});
