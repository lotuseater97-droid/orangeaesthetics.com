import {staffHoursReport} from "./staff-hours-report.mjs";
import {payRateOn} from "./staff-pay-rates.mjs";
import {businessLocalTime} from "./business-local-time.mjs";
export function baseLaborCost(staffIds,shifts,events,rates,period=null){
 const reports=staffHoursReport(staffIds,shifts,events,period);
 const date=t=>businessLocalTime(t).slice(0,10);
 const included=s=>!period||(date(s.clock_in)>=period.start&&date(s.clock_in)<=period.end);
 function estimate(id,sessions){
 let total=0;const unresolved=[];
 for(const s of sessions){
 const start=date(s.clock_in),end=date(s.clock_out);
 const rate=payRateOn(rates,id,start);
 if(!rate||rates.some(r=>r.staff_id===id&&r.effective_date>start&&r.effective_date<=end)){unresolved.push(s.clock_in);continue}
 const minutes=(Date.parse(s.clock_out)-Date.parse(s.clock_in))/60000-s.unpaid_break_minutes;
 if(!Number.isFinite(minutes)||minutes<0)throw new Error("Invalid session duration");
 total+=minutes*rate.hourly_cents/60;
 }
 return {cents:unresolved.length?null:Math.round(total),unresolved};
 }
 return reports.map(r=>{
 const scheduled=estimate(r.staff_id,shifts.filter(s=>s.staff_id===r.staff_id&&included(s)));
 const actual=estimate(r.staff_id,r.completed);
 return {staff_id:r.staff_id,scheduled,actual,variance_cents:scheduled.cents===null||actual.cents===null?null:actual.cents-scheduled.cents};
 });
}

export function summarizeLaborCosts(rows){
 if(new Set(rows.map(r=>r.staff_id)).size!==rows.length)throw new Error("Duplicate employee");
 const summarize=kind=>{
 const missing=rows.filter(r=>r[kind].cents===null).map(r=>r.staff_id);
 const known=rows.reduce((sum,r)=>sum+(r[kind].cents??0),0);
 return {known_cents:known,total_cents:missing.length?null:known,missing_staff:missing};
 };
 const scheduled=summarize("scheduled"),actual=summarize("actual");
 return {scheduled,actual,employee_count:rows.length,variance_cents:scheduled.total_cents===null||actual.total_cents===null?null:actual.total_cents-scheduled.total_cents};
}
