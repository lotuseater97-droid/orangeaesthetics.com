import test from "node:test";
import assert from "node:assert/strict";
import {staffHoursReport} from "../lib/staff-hours-report.mjs";
import {clockEvent} from "../lib/staff-clock.mjs";
test("owner report separates scheduled and completed hours",()=>{
 const shifts=[{staff_id:"a",clock_in:"2026-11-26T17:00:00Z",clock_out:"2026-11-27T01:00:00Z",unpaid_break_minutes:30}];
 let events=clockEvent([],"a","in","2026-11-26T17:00:00Z");
 events=clockEvent(events,"a","out","2026-11-26T23:00:00Z");
 events=clockEvent(events,"b","in","2026-11-26T17:00:00Z");
 const [a,b]=staffHoursReport(["a","b"],shifts,events);
 assert.equal(a.scheduled_minutes,450);assert.equal(a.worked_minutes,360);assert.equal(a.variance_minutes,-90);
 assert.equal(b.status,"working");assert.equal(b.worked_minutes,0);
});
test("duplicate roster rejected",()=>assert.throws(()=>staffHoursReport(["a","a"],[],[])));

test("period uses inclusive Pacific start dates for overnight sessions",()=>{
 const shift={staff_id:"a",clock_in:"2026-11-27T06:00:00Z",clock_out:"2026-11-27T10:00:00Z",unpaid_break_minutes:0};
 let events=clockEvent([],"a","in",shift.clock_in);events=clockEvent(events,"a","out",shift.clock_out);
 const report=d=>staffHoursReport(["a"],[shift],events,{start:d,end:d})[0];
 assert.equal(report("2026-11-26").worked_minutes,240);
 assert.equal(report("2026-11-27").scheduled_minutes,0);
 assert.throws(()=>report("2026-02-30"));
 assert.throws(()=>staffHoursReport(["a"],[],[],{start:"2026-12-01",end:"2026-11-01"}));
});
