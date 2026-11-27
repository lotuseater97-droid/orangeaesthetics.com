import {staffHoursReport} from "./staff-hours-report.mjs";
export function submitTimesheet(records,staff_id,period,events){
 if(!staff_id||!period)throw new TypeError("Staff and period required");
 const report=staffHoursReport([staff_id],[],events,period)[0];
 if(report.status!=="out"||!report.completed.length)throw new Error("Complete clock sessions before submitting");
 if(records.some(r=>r.staff_id===staff_id&&r.status!=="rejected"&&r.start<=period.end&&r.end>=period.start))throw new Error("Overlapping timesheet");
 return [...records,{id:"TS-"+(records.length+1),staff_id,start:period.start,end:period.end,status:"pending",sessions:report.completed.map(s=>({...s})),worked_minutes:report.worked_minutes}];
}
export function decideTimesheet(records,id,decision,reason){
 if(!["approved","rejected"].includes(decision)||typeof reason!=="string"||!reason.trim()||reason.length>120)throw new Error("Decision and reason required");
 if(!records.some(r=>r.id===id&&r.status==="pending"))throw new Error("Pending timesheet required");
 return records.map(r=>r.id===id?{...r,status:decision,reason:reason.trim()}:r);
}

export function reconcileTimesheet(record,events){
 const report=staffHoursReport([record.staff_id],[],events,{start:record.start,end:record.end})[0];
 const key=s=>JSON.stringify([s.clock_in,s.clock_out,s.unpaid_break_minutes,s.worked_minutes]);
 const submitted=new Set(record.sessions.map(key)),current=new Set(report.completed.map(key));
 const added=report.completed.filter(s=>!submitted.has(key(s)));
 const missing=record.sessions.filter(s=>!current.has(key(s)));
 return {added,missing,variance_minutes:report.worked_minutes-record.worked_minutes,stale:added.length>0||missing.length>0,clock_status:report.status};
}
