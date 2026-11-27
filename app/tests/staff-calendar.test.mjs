import test from "node:test";
import assert from "node:assert/strict";
import {weeklySchedule,moveCalendarDate,monthlySchedule,moveCalendarMonth} from "../lib/staff-calendar.mjs";
test("Monday through Sunday with year rollover",()=>{
 const week=weeklySchedule("2027-01-01",[]);
 assert.equal(week[0].date,"2026-12-28");assert.equal(week[6].date,"2027-01-03");
 assert.equal(moveCalendarDate("2026-12-31",7),"2027-01-07");
});
test("overnight shifts appear on both Pacific dates",()=>{
 const week=weeklySchedule("2026-11-26",[{id:"s",clock_in:"2026-11-27T06:00:00Z",clock_out:"2026-11-27T10:00:00Z"}]);
 assert.deepEqual(week.filter(d=>d.shifts.length).map(d=>d.date),["2026-11-26","2026-11-27"]);
});
test("midnight end does not occupy next day",()=>{
 const week=weeklySchedule("2026-11-26",[{id:"s",clock_in:"2026-11-27T06:00:00Z",clock_out:"2026-11-27T08:00:00Z"}]);
 assert.deepEqual(week.filter(d=>d.shifts.length).map(d=>d.date),["2026-11-26"]);
});
test("invalid dates and intervals rejected",()=>{
 assert.throws(()=>weeklySchedule("2026-02-30",[]));assert.throws(()=>weeklySchedule("2026-11-26",[{clock_in:"bad",clock_out:"bad"}]));
});

test("monthly calendar includes every date exactly once",()=>{
 const days=monthlySchedule("2028-02-15",[]).flat();
 assert.equal(days.filter(d=>d.inMonth).length,29);
 assert.equal(new Set(days.map(d=>d.date)).size,days.length);
 assert.equal(days.length%7,0);
});
test("month navigation clamps end of month and rolls year",()=>{
 assert.equal(moveCalendarMonth("2028-01-31",1),"2028-02-29");
 assert.equal(moveCalendarMonth("2026-12-31",1),"2027-01-31");
 assert.equal(moveCalendarMonth("2027-03-31",-1),"2027-02-28");
});
