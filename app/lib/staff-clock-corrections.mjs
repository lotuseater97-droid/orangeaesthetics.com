import {clockEvent} from "./staff-clock.mjs";
import {businessLocalTime} from "./business-local-time.mjs";
export function requestClockCorrection(records,staff_id,input){
 const reason=String(input.reason??"").trim(),kind=input.kind;
 if(!staff_id||!["missed-in","missed-out","break","other"].includes(kind)||!reason||reason.length>240)throw new Error("Invalid correction");
 const date=input.date;
 if(typeof date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+"T00:00:00Z"))||new Date(date+"T00:00:00Z").toISOString().slice(0,10)!==date)throw new Error("Invalid date");
 return [...records,{id:"CR-"+(records.length+1),staff_id,date,kind,reason,status:"pending"}];
}
export function reviewClockCorrection(records,id,decision,note){
 if(!["accepted-for-correction","rejected"].includes(decision)||typeof note!=="string"||!note.trim()||note.length>240)throw new Error("Invalid decision");
 if(!records.some(r=>r.id===id&&r.status==="pending"))throw new Error("Pending request required");
 return records.map(r=>r.id===id?{...r,status:decision,review_note:note.trim()}:r);
}

export function applyClockCorrection(records,events,id,action,instant,note){
 const request=records.find(r=>r.id===id&&r.status==="accepted-for-correction");
 if(!request||typeof note!=="string"||!note.trim()||note.length>240)throw new Error("Accepted request and audit note required");
 if(!["missed-in","missed-out"].includes(request.kind)||action!==(request.kind==="missed-in"?"in":"out"))throw new Error("Unsupported correction");
 const time=Date.parse(instant);
 if(!Number.isFinite(time)||businessLocalTime(new Date(time).toISOString()).slice(0,10)!==request.date)throw new Error("Correction date mismatch");
 const inserted={staff_id:request.staff_id,action,instant:new Date(time).toISOString(),correction_id:id};
 const own=[...events.filter(e=>e.staff_id===request.staff_id),inserted].sort((a,b)=>Date.parse(a.instant)-Date.parse(b.instant));
 let validated=[];for(const e of own)validated=clockEvent(validated,e.staff_id,e.action,e.instant);
 const effective=[...events,inserted].sort((a,b)=>Date.parse(a.instant)-Date.parse(b.instant));
 return {events:effective,records:records.map(r=>r.id===id?{...r,status:"applied",application_note:note.trim(),inserted}:r)};
}
