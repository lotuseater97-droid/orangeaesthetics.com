import {staffHoursReport} from "./staff-hours-report.mjs";
import {effectiveApprovedTimesheets,reconcileTimesheet} from "./staff-timesheets.mjs";
const csv=v=>'"'+String(v).replace(/^[\s]*[=+@-]/,m=>"'"+m).replaceAll('"','""')+'"';
export function approvedHoursExport(records,events,period){
 if(!period||![period.start,period.end].every(d=>typeof d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d+"T00:00:00Z"))&&new Date(d+"T00:00:00Z").toISOString().slice(0,10)===d)||period.start>period.end)throw new Error("Valid export period required");
 const overlaps=r=>r.start<=period.end&&r.end>=period.start;
 const selected=effectiveApprovedTimesheets(records).filter(overlaps);
 if(records.some(r=>r.status==="pending"&&overlaps(r)))throw new Error("Pending timesheet review");
 if(!selected.length)throw new Error("No approved timesheets");
 for(const r of selected){
 if(r.start<period.start||r.end>period.end)throw new Error("Partial timesheet period");
 if(reconcileTimesheet(r,events).stale)throw new Error("Unreconciled approved timesheet");
 }
 const staffIds=[...new Set(events.map(e=>e.staff_id))];
 const reports=staffHoursReport(staffIds,[],events,period);
 const key=s=>JSON.stringify([s.clock_in,s.clock_out,s.unpaid_break_minutes,s.worked_minutes]);
 for(const report of reports){
 if(report.status!=="out")throw new Error("Open employee clock session");
 const covered=selected.filter(r=>r.staff_id===report.staff_id).flatMap(r=>r.sessions.map(key));
 if(new Set(covered).size!==covered.length)throw new Error("Duplicate approved session");
 if(report.completed.some(s=>!covered.includes(key(s))))throw new Error("Completed hours missing approved timesheet");
 }
 return [["employee","timesheet_id","period_start","period_end","worked_minutes","worked_hours"],...selected.map(r=>[r.staff_id,r.id,r.start,r.end,r.worked_minutes,(r.worked_minutes/60).toFixed(4)])].map(row=>row.map(csv).join(",")).join("\r\n")+"\r\n";
}
