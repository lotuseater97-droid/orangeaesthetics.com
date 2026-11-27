import test from "node:test";
import assert from "node:assert/strict";
import {approvedHoursExport} from "../lib/staff-hours-export.mjs";
import {submitTimesheet,decideTimesheet} from "../lib/staff-timesheets.mjs";
import {clockEvent} from "../lib/staff-clock.mjs";
const period={start:"2026-11-26",end:"2026-11-26"};
const events=clockEvent(clockEvent([],"a","in","2026-11-26T17:00:00Z"),"a","out","2026-11-26T23:00:00Z");
test("approved export and pending rejection",()=>{
 const pending=submitTimesheet([],"a",period,events);
 assert.throws(()=>approvedHoursExport(pending,events,period));
 const approved=decideTimesheet(pending,"TS-1","approved","Reviewed");
 assert.match(approvedHoursExport(approved,events,period),/"360","6.0000"/);
 assert.throws(()=>approvedHoursExport(approved,[],period));
});
