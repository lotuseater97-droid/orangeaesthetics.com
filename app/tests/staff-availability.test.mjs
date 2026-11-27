import test from "node:test";
import assert from "node:assert/strict";
import {availabilityConflicts} from "../lib/staff-availability.mjs";
const shift={id:"s",staff_id:"a",clock_in:"2026-11-26T17:00:00Z",clock_out:"2026-11-26T18:00:00Z"};
const rule={staff_id:"a",weekday:4,start:"09:00",end:"10:00"};
test("Pacific window covers shift exactly",()=>assert.deepEqual(availabilityConflicts([shift],[rule]),[]));
test("partial coverage and wrong day conflict",()=>{
 assert.equal(availabilityConflicts([shift],[{...rule,end:"09:30"}]).length,1);
 assert.equal(availabilityConflicts([shift],[{...rule,weekday:5}]).length,1);
});
test("adjacent windows cover a continuous shift",()=>assert.deepEqual(availabilityConflicts([shift],[{...rule,end:"09:30"},{...rule,start:"09:30"}]),[]));
test("unconfigured staff unrestricted and invalid rules rejected",()=>{
 assert.deepEqual(availabilityConflicts([shift],[{...rule,staff_id:"b"}]),[]);
 assert.throws(()=>availabilityConflicts([],[{...rule,end:"08:00"}]));
});
