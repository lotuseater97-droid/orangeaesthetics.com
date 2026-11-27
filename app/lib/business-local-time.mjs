// Business wall-clock conversion independent of browser timezone.
const formatter=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
export function businessLocalTime(instant){
 const p=Object.fromEntries(formatter.formatToParts(new Date(instant)).map(x=>[x.type,x.value]));
 return p.year+"-"+p.month+"-"+p.day+"T"+p.hour+":"+p.minute;
}
export function parseBusinessLocalTime(value){
 if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw new TypeError("Invalid local time");
 const base=Date.parse(value+":00Z");
 if(!Number.isFinite(base)||new Date(base).toISOString().slice(0,16)!==value)throw new RangeError("Invalid calendar time");
 const matches=[];
 for(let offset=0;offset<=14*60;offset+=15){
  const candidate=base+offset*60000;
  if(businessLocalTime(candidate)===value)matches.push(candidate);
 }
 if(matches.length!==1)throw new RangeError(matches.length?"Ambiguous daylight saving time":"Nonexistent local time");
 return new Date(matches[0]).toISOString();
}
