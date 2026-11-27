const validDate=d=>typeof d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d+"T00:00:00Z"))&&new Date(d+"T00:00:00Z").toISOString().slice(0,10)===d;
export function addPayRate(records,staff_id,effective_date,hourly_cents,reason){
 if(!staff_id||!validDate(effective_date)||!Number.isSafeInteger(hourly_cents)||hourly_cents<=0||typeof reason!=="string"||!reason.trim()||reason.length>240)throw new Error("Invalid pay rate");
 if(records.some(r=>r.staff_id===staff_id&&r.effective_date===effective_date))throw new Error("Rate already exists for date");
 return [...records,{id:"PR-"+(records.length+1),staff_id,effective_date,hourly_cents,reason:reason.trim()}];
}
export function payRateOn(records,staff_id,date){
 if(!validDate(date))throw new Error("Invalid lookup date");
 return records.filter(r=>r.staff_id===staff_id&&r.effective_date<=date).sort((a,b)=>b.effective_date.localeCompare(a.effective_date))[0]??null;
}
