// Pure capacity planning for future authenticated scheduling. Not a live calendar.
const time=v=>{const n=Date.parse(v);if(!Number.isFinite(n))throw new TypeError("Invalid timestamp");return n};
export function overlaps(a,b){
 const aStart=time(a.start_at),aEnd=time(a.end_at),bStart=time(b.start_at),bEnd=time(b.end_at);
 if(aEnd<=aStart||bEnd<=bStart)throw new RangeError("Invalid interval");
 return aStart<bEnd&&bStart<aEnd;
}
export function evaluateSlot({start_at,end_at,provider_id,room_id,appointments=[],closures=[],buffers_minutes=0}){
 const start=time(start_at),end=time(end_at);
 if(end<=start||end-start>8*3600000)throw new RangeError("Invalid slot duration");
 if(!Number.isSafeInteger(buffers_minutes)||buffers_minutes<0||buffers_minutes>120)throw new RangeError("Invalid buffer");
 if(typeof provider_id!=="string"||!provider_id||typeof room_id!=="string"||!room_id)throw new TypeError("Missing resources");
 const expanded={start_at:new Date(start-buffers_minutes*60000).toISOString(),end_at:new Date(end+buffers_minutes*60000).toISOString()};
 const conflicts=[];
 for(const a of appointments){if(["cancelled","declined","no_show"].includes(a.status))continue;if(!["confirmed","under_review"].includes(a.status))continue;if((a.provider_id===provider_id||a.room_id===room_id)&&overlaps(expanded,a))conflicts.push({kind:"appointment",id:a.id})}
 for(const c of closures){if((c.provider_id===provider_id||c.room_id===room_id||c.all_resources===true)&&overlaps(expanded,c))conflicts.push({kind:"closure",id:c.id})}
 return {available:conflicts.length===0,conflicts}
}
export function requestWindow({requested_at,now,min_notice_minutes=60,max_days_ahead=180}){
 const requested=time(requested_at),current=time(now);
 if(!Number.isSafeInteger(min_notice_minutes)||min_notice_minutes<0||!Number.isSafeInteger(max_days_ahead)||max_days_ahead<1)throw new RangeError("Invalid booking policy");
 return {allowed:requested>=current+min_notice_minutes*60000&&requested<=current+max_days_ahead*86400000};
}

/**
 * Generate candidate appointment times inside a preapproved operating window.
 * Pure planning only: caller must recheck availability transactionally before booking.
 */
export function availableSlots({window_start,window_end,duration_minutes,step_minutes=15,provider_id,room_id,appointments=[],closures=[],buffers_minutes=0}){
 const start=time(window_start),end=time(window_end);
 if(end<=start||end-start>24*3600000)throw new RangeError("Invalid operating window");
 if(!Number.isSafeInteger(duration_minutes)||duration_minutes<5||duration_minutes>480)throw new RangeError("Invalid appointment duration");
 if(!Number.isSafeInteger(step_minutes)||step_minutes<5||step_minutes>120)throw new RangeError("Invalid slot increment");
 const duration=duration_minutes*60000,step=step_minutes*60000,slots=[];
 for(let at=start;at+duration<=end;at+=step){
  const candidate={start_at:new Date(at).toISOString(),end_at:new Date(at+duration).toISOString()};
  if(evaluateSlot({...candidate,provider_id,room_id,appointments,closures,buffers_minutes}).available)slots.push(candidate);
 }
 return slots;
}
