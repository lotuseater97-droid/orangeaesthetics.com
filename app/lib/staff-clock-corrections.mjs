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
