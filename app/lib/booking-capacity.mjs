// Pure capacity planning for future authenticated scheduling. Not a live calendar.
const time=v=>{if(typeof v!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(v))throw new TypeError("Timestamp must include an explicit timezone");const datePart=v.slice(0,10);const [year,month,day]=datePart.split("-").map(Number);const calendar=new Date(Date.UTC(year,month-1,day));if(calendar.getUTCFullYear()!==year||calendar.getUTCMonth()+1!==month||calendar.getUTCDate()!==day)throw new TypeError("Invalid calendar date");const hours=Number(v.slice(11,13)),minutes=Number(v.slice(14,16)),seconds=Number(v.slice(17,19));if(hours>23||minutes>59||seconds>59)throw new TypeError("Invalid clock time");if(!v.endsWith("Z")){const offset=v.slice(-6),oh=Number(offset.slice(1,3)),om=Number(offset.slice(4));if(oh>23||om>59)throw new TypeError("Invalid timezone offset");}const n=Date.parse(v);if(!Number.isFinite(n))throw new TypeError("Invalid timestamp");return n};
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
 for(const a of appointments){if(!a||typeof a!=="object"||Array.isArray(a))throw new TypeError("Invalid appointment record");if(["cancelled","declined","no_show"].includes(a.status))continue;if(!["confirmed","under_review"].includes(a.status))throw new RangeError("Unknown appointment status");if((a.provider_id===provider_id||a.room_id===room_id)&&overlaps(expanded,a))conflicts.push({kind:"appointment",id:a.id})}
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
export function availableSlots({window_start,window_end,duration_minutes,step_minutes=15,provider_id,room_id,appointments=[],closures=[],buffers_minutes=0,now,min_notice_minutes=60,max_days_ahead=180}){
 const start=time(window_start),end=time(window_end);
 if(end<=start||end-start>24*3600000)throw new RangeError("Invalid operating window");
 if(!Number.isSafeInteger(duration_minutes)||duration_minutes<5||duration_minutes>480)throw new RangeError("Invalid appointment duration");
 if(!Number.isSafeInteger(step_minutes)||step_minutes<5||step_minutes>120)throw new RangeError("Invalid slot increment");
 if(typeof provider_id!=="string"||!provider_id||typeof room_id!=="string"||!room_id)throw new TypeError("Missing resources");
 if(!Number.isSafeInteger(buffers_minutes)||buffers_minutes<0||buffers_minutes>120)throw new RangeError("Invalid buffer");
 if(!Array.isArray(appointments)||!Array.isArray(closures))throw new TypeError("Invalid scheduling collections");
 for(const item of appointments)if(!item||typeof item!=="object"||Array.isArray(item))throw new TypeError("Invalid appointment record");
 for(const item of closures)if(!item||typeof item!=="object"||Array.isArray(item))throw new TypeError("Invalid closure record");
 if(now!==undefined){time(now);if(!Number.isSafeInteger(min_notice_minutes)||min_notice_minutes<0||!Number.isSafeInteger(max_days_ahead)||max_days_ahead<1)throw new RangeError("Invalid booking policy");}
 const duration=duration_minutes*60000,step=step_minutes*60000,slots=[];
 for(let at=start;at+duration<=end;at+=step){
  const candidate={start_at:new Date(at).toISOString(),end_at:new Date(at+duration).toISOString()};
  if(now!==undefined&&!requestWindow({requested_at:candidate.start_at,now,min_notice_minutes,max_days_ahead}).allowed)continue;
  if(evaluateSlot({...candidate,provider_id,room_id,appointments,closures,buffers_minutes}).available)slots.push(candidate);
 }
 return slots;
}

/**
 * Suggest available slots across an explicitly approved set of provider/room pairs.
 * Each result retains its resource identity; this does not reserve capacity.
 */
export function availableResourceSlots({resources,max_results=100,...options}){
 if(!Array.isArray(resources)||resources.length===0||resources.length>100)throw new RangeError("Invalid resource list");
 if(!Number.isSafeInteger(max_results)||max_results<1||max_results>1000)throw new RangeError("Invalid result limit");
 const seen=new Set(),results=[];
 for(const resource of resources){
  if(!resource||typeof resource!=="object"||Array.isArray(resource))throw new TypeError("Invalid resource");
  const {provider_id,room_id}=resource;
  if(typeof provider_id!=="string"||!provider_id.trim()||typeof room_id!=="string"||!room_id.trim())throw new TypeError("Missing resources");
  const key=JSON.stringify([provider_id,room_id]);
  if(seen.has(key))throw new RangeError("Duplicate resource pair");
  seen.add(key);
  for(const slot of availableSlots({...options,provider_id,room_id}))results.push({...slot,provider_id,room_id});
 }
 return results.sort((a,b)=>a.start_at.localeCompare(b.start_at)||a.provider_id.localeCompare(b.provider_id)||a.room_id.localeCompare(b.room_id)).slice(0,max_results);
}
