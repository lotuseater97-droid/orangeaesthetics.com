// Business-only staff time and mileage review. Not payroll, tax, or labor-law compliance.
const ms=v=>{if(typeof v!=="string"||!/^\d{4}-\d{2}-\d{2}T/.test(v))throw new TypeError("Timestamp must be ISO formatted");const t=Date.parse(v);if(!Number.isFinite(t))throw new TypeError("Invalid timestamp");return t};
const positive=(v)=>Number.isSafeInteger(v)&&v>=0;
export function reviewTimeEntries(entries=[]){
 if(!Array.isArray(entries))throw new TypeError("Expected time entries");
 const seen=new Set(),byStaff=new Map(),issues=[];
 for(const e of entries){
  if(!e||typeof e.id!=="string"||!e.id||seen.has(e.id)||typeof e.staff_id!=="string"||!e.staff_id)throw new TypeError("Invalid or duplicate time entry");
  seen.add(e.id);
  const start=ms(e.clock_in),end=ms(e.clock_out);
  if(end<=start)throw new RangeError("Invalid shift interval");
  if(!positive(e.unpaid_break_minutes)||e.unpaid_break_minutes>(end-start)/60000)throw new RangeError("Invalid break");
  const minutes=(end-start)/60000-e.unpaid_break_minutes;
  if(minutes>24*60)issues.push({code:"LONG_SHIFT",entry_id:e.id});
  const row=byStaff.get(e.staff_id)||{staff_id:e.staff_id,total_minutes:0,entries:[]};
  row.total_minutes+=minutes;row.entries.push({id:e.id,start,end});byStaff.set(e.staff_id,row);
 }
 for(const row of byStaff.values()){
  row.entries.sort((a,b)=>a.start-b.start);
  let latest=row.entries[0];
  for(const entry of row.entries.slice(1)){
   if(entry.start<latest.end)issues.push({code:"OVERLAPPING_SHIFTS",staff_id:row.staff_id,entry_ids:[latest.id,entry.id]});
   if(entry.end>latest.end)latest=entry;
  }
 }
 return {staff:[...byStaff.values()].map(({staff_id,total_minutes})=>({staff_id,total_minutes})),issues};
}
export function mileageSummary(trips=[]){
 if(!Array.isArray(trips))throw new TypeError("Expected trips");
 const seen=new Set();let total_miles=0;const issues=[];
 for(const t of trips){
  if(!t||typeof t.id!=="string"||!t.id||seen.has(t.id)||typeof t.staff_id!=="string"||!t.staff_id)throw new TypeError("Invalid trip");
  seen.add(t.id);
  if(typeof t.miles!=="number"||!Number.isFinite(t.miles)||t.miles<0||t.miles>2000)throw new RangeError("Invalid mileage");
  if(typeof t.business_purpose!=="string"||!t.business_purpose.trim())issues.push({code:"MISSING_PURPOSE",trip_id:t.id});
  if(t.approved===true)total_miles+=t.miles;
 }
 return {approved_miles:Math.round(total_miles*100)/100,issues};
}
