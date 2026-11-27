import {businessLocalTime} from "./business-local-time.mjs";
import {clockSummary} from "./staff-clock.mjs";
export function staffHoursReport(staffIds,shifts,events,period=null){
 if(!Array.isArray(staffIds)||new Set(staffIds).size!==staffIds.length||!Array.isArray(shifts)||!Array.isArray(events))throw new TypeError("Invalid report input");
 if(period){for(const d of [period.start,period.end]){if(typeof d!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(Date.parse(d+"T00:00:00Z"))||new Date(d+"T00:00:00Z").toISOString().slice(0,10)!==d)throw new RangeError("Invalid period")}if(period.end<period.start)throw new RangeError("Invalid period order")}
 const included=s=>!period||(()=>{const d=businessLocalTime(s.clock_in).slice(0,10);return d>=period.start&&d<=period.end})();
 return staffIds.map(staff_id=>{
 const clock=clockSummary(events,staff_id);
 const scheduled_minutes=shifts.filter(s=>s.staff_id===staff_id&&included(s)).reduce((sum,s)=>{
 const minutes=(Date.parse(s.clock_out)-Date.parse(s.clock_in))/60000-s.unpaid_break_minutes;
 if(!Number.isFinite(minutes)||minutes<0)throw new RangeError("Invalid scheduled hours");
 return sum+minutes;
 },0);
 const completed=clock.completed.filter(included);
 const worked_minutes=completed.reduce((sum,s)=>sum+s.worked_minutes,0);
 return {staff_id,status:clock.status,scheduled_minutes,worked_minutes,variance_minutes:worked_minutes-scheduled_minutes,completed};
 });
}
