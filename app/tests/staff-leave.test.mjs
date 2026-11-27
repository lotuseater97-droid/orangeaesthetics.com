import test from "node:test";
import assert from "node:assert/strict";
import {leaveConflicts,calendarAbsences} from "../lib/staff-leave.mjs";
const shift={id:"s",staff_id:"a",clock_in:"2026-11-27T06:00:00Z",clock_out:"2026-11-27T10:00:00Z"};
const leave={id:"l",staff_id:"a",start:"2026-11-26",end:"2026-11-26",status:"approved"};
test("overnight shift conflicts with either leave day",()=>{
 assert.equal(leaveConflicts([shift],[leave]).length,1);
 assert.equal(leaveConflicts([shift],[{...leave,start:"2026-11-27",end:"2026-11-27"}]).length,1);
});
test("pending rejected and other staff leave do not block",()=>{
 for(const r of [{...leave,status:"pending"},{...leave,status:"rejected"},{...leave,staff_id:"b"}])assert.deepEqual(leaveConflicts([shift],[r]),[]);
});
test("midnight end excludes next date",()=>assert.deepEqual(leaveConflicts([{...shift,clock_out:"2026-11-27T08:00:00Z"}],[{...leave,start:"2026-11-27",end:"2026-11-27"}]),[]));
test("invalid and duplicate requests rejected",()=>{
 assert.throws(()=>leaveConflicts([],[leave,leave]));
 assert.throws(()=>leaveConflicts([],[{...leave,start:"2026-02-30"}]));
});

test("calendar displays approved inclusive absences once per employee",()=>{
 const days=[{date:"2026-11-26",shifts:[]},{date:"2026-11-27",shifts:[]}];
 const result=calendarAbsences(days,[leave,{...leave,id:"l2"},{...leave,id:"l3",staff_id:"b",status:"pending"}]);
 assert.deepEqual(result.map(d=>d.absentStaff),[["a"],[]]);
 assert.equal(days[0].absentStaff,undefined);
});
