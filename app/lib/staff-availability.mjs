import {businessLocalTime} from "./business-local-time.mjs";
// Recurring availability in Pacific wall time. Missing rules mean unrestricted.
const minute=s=>{if(typeof s!=="string"||!/^([01]\d|2[0-3]):[0-5]\d$/.test(s))throw new TypeError("Invalid availability time");return Number(s.slice(0,2))*60+Number(s.slice(3))};
export function availabilityConflicts(shifts,rules){
 if(!Array.isArray(shifts)||!Array.isArray(rules))throw new TypeError("Expected schedule arrays");
 const byStaff=new Map();
 for(const r of rules){
  if(!r||typeof r.staff_id!=="string"||!r.staff_id||!Number.isInteger(r.weekday)||r.weekday<0||r.weekday>6)throw new TypeError("Invalid availability rule");
  const start=minute(r.start),end=r.end==="24:00"?1440:minute(r.end);
  if(end<=start)throw new RangeError("Availability must end after start");
  if(!byStaff.has(r.staff_id))byStaff.set(r.staff_id,[]);
  byStaff.get(r.staff_id).push({weekday:r.weekday,start,end});
 }
 const conflicts=[];
 for(const s of shifts){
  const start=Date.parse(s.clock_in),end=Date.parse(s.clock_out);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>48*3600000||start%60000||end%60000)throw new RangeError("Invalid shift interval");
  const windows=byStaff.get(s.staff_id);if(!windows)continue;
  // Check each elapsed minute, including repeated fall-back minutes.
  for(let t=start;t<end;t+=60000){
   const local=businessLocalTime(t),weekday=new Date(local.slice(0,10)+"T00:00:00Z").getUTCDay(),m=minute(local.slice(11));
   if(!windows.some(w=>w.weekday===weekday&&w.start<=m&&m<w.end)){conflicts.push({shift_id:s.id,staff_id:s.staff_id,code:"OUTSIDE_AVAILABILITY"});break}
  }
 }
 return conflicts;
}
