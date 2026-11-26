import test from "node:test";import assert from "node:assert/strict";import {reviewTimeEntries,mileageSummary} from "../lib/staff-operations.mjs";
const a={id:"a",staff_id:"s1",clock_in:"2026-11-22T08:00:00Z",clock_out:"2026-11-22T16:00:00Z",unpaid_break_minutes:30};
test("computes worked minutes net of unpaid break",()=>assert.equal(reviewTimeEntries([a]).staff[0].total_minutes,450));
test("detects overlapping shifts",()=>assert.ok(reviewTimeEntries([a,{...a,id:"b",clock_in:"2026-11-22T15:00:00Z",clock_out:"2026-11-22T18:00:00Z"}]).issues.some(x=>x.code==="OVERLAPPING_SHIFTS")));
test("allows adjacent shifts",()=>assert.equal(reviewTimeEntries([a,{...a,id:"b",clock_in:a.clock_out,clock_out:"2026-11-22T18:00:00Z"}]).issues.length,0));
test("rejects duplicate time entry",()=>assert.throws(()=>reviewTimeEntries([a,a]),TypeError));
test("rejects break longer than shift",()=>assert.throws(()=>reviewTimeEntries([{...a,unpaid_break_minutes:1000}]),RangeError));
test("flags exceptionally long shift for review",()=>assert.ok(reviewTimeEntries([{...a,clock_out:"2026-11-23T12:00:00Z"}]).issues.some(x=>x.code==="LONG_SHIFT")));
test("mileage includes approved trips only",()=>assert.equal(mileageSummary([{id:"t1",staff_id:"s1",miles:12.5,business_purpose:"Supply pickup",approved:true},{id:"t2",staff_id:"s1",miles:9,business_purpose:"Meeting",approved:false}]).approved_miles,12.5));
test("mileage missing purpose flagged",()=>assert.ok(mileageSummary([{id:"t1",staff_id:"s1",miles:2,business_purpose:"",approved:true}]).issues.some(x=>x.code==="MISSING_PURPOSE")));
test("mileage rejects invalid distance",()=>assert.throws(()=>mileageSummary([{id:"t1",staff_id:"s1",miles:-1,business_purpose:"Travel",approved:true}]),RangeError));

test("nested shifts cannot hide a later overlap with the outer shift",()=>{const result=reviewTimeEntries([a,{...a,id:"b",clock_in:"2026-11-22T09:00:00Z",clock_out:"2026-11-22T10:00:00Z",unpaid_break_minutes:0},{...a,id:"c",clock_in:"2026-11-22T11:00:00Z",clock_out:"2026-11-22T12:00:00Z",unpaid_break_minutes:0}]);assert.deepEqual(result.issues.map(x=>x.entry_ids),[["a","b"],["a","c"]]);});
