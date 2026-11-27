import test from "node:test";
import assert from "node:assert/strict";
import {submitTimesheet,decideTimesheet,reconcileTimesheet,proposeTimesheetAmendment,effectiveApprovedTimesheets} from "../lib/staff-timesheets.mjs";
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

test("late completed session invalidates submitted snapshot",()=>{
 const record=submitTimesheet([],"a",period,events)[0];
 assert.equal(reconcileTimesheet(record,events).stale,false);
 let later=clockEvent(events,"a","in","2026-11-27T00:00:00Z");
 later=clockEvent(later,"a","out","2026-11-27T01:00:00Z");
 const result=reconcileTimesheet(record,later);
 assert.equal(result.stale,true);assert.equal(result.added.length,1);assert.equal(result.variance_minutes,60);
 assert.equal(record.worked_minutes,360);
});

test("amendment preserves approval until replacement approved",()=>{
 const approved=decideTimesheet(submitTimesheet([],"a",period,events),"TS-1","approved","Reviewed");
 let later=clockEvent(events,"a","in","2026-11-27T00:00:00Z");
 later=clockEvent(later,"a","out","2026-11-27T01:00:00Z");
 const pending=proposeTimesheetAmendment(approved,"TS-1",later,"Late session");
 assert.equal(pending[1].worked_minutes,420);
 assert.equal(effectiveApprovedTimesheets(pending)[0].id,"TS-1");
 assert.throws(()=>proposeTimesheetAmendment(pending,"TS-1",later,"Duplicate"));
 const final=decideTimesheet(pending,"TS-2","approved","Reviewed correction");
 assert.deepEqual(effectiveApprovedTimesheets(final).map(r=>r.id),["TS-2"]);
 assert.equal(final[0].worked_minutes,360);
});
