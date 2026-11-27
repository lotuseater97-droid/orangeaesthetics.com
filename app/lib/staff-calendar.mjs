import {businessLocalTime} from "./business-local-time.mjs";
const dateValue=s=>{if(typeof s!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(s))throw new TypeError("Invalid date");const d=new Date(s+"T00:00:00Z");if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==s)throw new RangeError("Invalid date");return d};
export function moveCalendarDate(date,days){const d=dateValue(date);if(!Number.isSafeInteger(days)||Math.abs(days)>3660)throw new RangeError("Invalid date movement");d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
export function weeklySchedule(date,shifts){
 const d=dateValue(date),start=moveCalendarDate(date,-((d.getUTCDay()+6)%7));
 if(!Array.isArray(shifts))throw new TypeError("Expected shifts");
 const normalized=shifts.map(s=>{const a=Date.parse(s.clock_in),b=Date.parse(s.clock_out);if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a)throw new RangeError("Invalid shift");return {...s,localStart:businessLocalTime(a),localEnd:businessLocalTime(b),lastDate:businessLocalTime(b-1).slice(0,10)}});
 return Array.from({length:7},(_,i)=>{const date=moveCalendarDate(start,i);return {date,shifts:normalized.filter(s=>s.localStart.slice(0,10)<=date&&s.lastDate>=date).sort((a,b)=>Date.parse(a.clock_in)-Date.parse(b.clock_in))}});
}
