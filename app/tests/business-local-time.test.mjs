import test from "node:test";
import assert from "node:assert/strict";
import {businessLocalTime,parseBusinessLocalTime} from "../lib/business-local-time.mjs";
test("winter and summer Pacific offsets",()=>{
 assert.equal(parseBusinessLocalTime("2026-11-26T09:00"),"2026-11-26T17:00:00.000Z");
 assert.equal(parseBusinessLocalTime("2026-07-01T09:00"),"2026-07-01T16:00:00.000Z");
 assert.equal(businessLocalTime("2026-11-27T01:00:00Z"),"2026-11-26T17:00");
});
test("rejects spring gap and autumn ambiguity",()=>{
 assert.throws(()=>parseBusinessLocalTime("2026-03-08T02:30"),/Nonexistent/);
 assert.throws(()=>parseBusinessLocalTime("2026-11-01T01:30"),/Ambiguous/);
});
test("rejects invalid calendar dates and normalizes midnight",()=>{
 assert.throws(()=>parseBusinessLocalTime("2026-02-30T09:00"));
 assert.equal(parseBusinessLocalTime("2026-11-26T00:00"),"2026-11-26T08:00:00.000Z");
});
