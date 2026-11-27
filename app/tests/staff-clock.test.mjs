import test from "node:test";
import assert from "node:assert/strict";
import {clockEvent,clockSummary} from "../lib/staff-clock.mjs";
const at=h=>"2026-11-26T"+h+":00Z";
test("worked time excludes unpaid breaks",()=>{
 let e=[];for(const [action,t] of [["in","17:00"],["break-start","19:00"],["break-end","19:30"],["out","23:00"]])e=clockEvent(e,"a",action,at(t));
 assert.equal(clockSummary(e,"a").completed[0].worked_minutes,330);
 assert.equal(clockSummary(e,"a").status,"out");
 assert.equal(clockSummary(e,"b").completed.length,0);
});
test("reject invalid transitions and timestamps",()=>{
 const e=clockEvent([],"a","in",at("17:00"));
 assert.throws(()=>clockEvent(e,"a","in",at("18:00")));
 assert.throws(()=>clockEvent(e,"a","out",at("16:00")));
 const b=clockEvent(e,"a","break-start",at("18:00"));
 assert.throws(()=>clockEvent(b,"a","out",at("19:00")));
 assert.equal(clockSummary(b,"a").status,"break");
});
