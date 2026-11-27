import {businessLocalTime} from "./business-local-time.mjs";
const date=s=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+"T00:00:00Z"))&&new Date(s+"T00:00:00Z").toISOString().slice(0,10)===s;
export function leaveConflicts(shifts,requests){
 if(!Array.isArray(shifts)||!Array.isArray(requests))throw new TypeError("Expected arrays");
 const seen=new Set();
 for(const r of requests){
 if(!r||!r.id||seen.has(r.id)||!r.staff_id||!date(r.start)||!date(r.end)||r.end<r.start||!["pending","approved","rejected"].includes(r.status))throw new TypeError("Invalid leave request");
 seen.add(r.id);
 }
 return shifts.flatMap(s=>{
 const a=Date.parse(s.clock_in),b=Date.parse(s.clock_out);
 if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a)throw new RangeError("Invalid shift");
 const first=businessLocalTime(a).slice(0,10),last=businessLocalTime(b-1).slice(0,10);
 return requests.filter(r=>r.status==="approved"&&r.staff_id===s.staff_id&&r.start<=last&&r.end>=first).map(r=>({shift_id:s.id,leave_id:r.id,code:"APPROVED_LEAVE"}));
 });
}

export function calendarAbsences(days,requests){
 if(!Array.isArray(days))throw new TypeError("Expected calendar days");
 leaveConflicts([],requests);
 return days.map(day=>{
 if(!date(day.date))throw new TypeError("Invalid calendar date");
 const absentStaff=[...new Set(requests.filter(r=>r.status==="approved"&&r.start<=day.date&&r.end>=day.date).map(r=>r.staff_id))].sort();
 return {...day,absentStaff};
 });
}
