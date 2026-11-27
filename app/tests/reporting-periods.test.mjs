import test from "node:test";
import assert from "node:assert/strict";
import {reportingPeriod} from "../lib/reporting-periods.mjs";
test("Pacific calendar boundaries",()=>{
 const t="2027-01-01T03:00:00Z";
 assert.deepEqual(reportingPeriod("week",t),{start:"2026-12-28",end:"2027-01-03"});
 assert.deepEqual(reportingPeriod("month",t),{start:"2026-12-01",end:"2026-12-31"});
 assert.deepEqual(reportingPeriod("quarter",t),{start:"2026-10-01",end:"2026-12-31"});
 assert.deepEqual(reportingPeriod("year",t),{start:"2026-01-01",end:"2026-12-31"});
 assert.deepEqual(reportingPeriod("month","2028-02-15T12:00:00Z"),{start:"2028-02-01",end:"2028-02-29"});
 assert.throws(()=>reportingPeriod("invalid",t));
});
