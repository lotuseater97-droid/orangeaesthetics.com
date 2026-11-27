import {businessLocalTime} from "./business-local-time.mjs";
export function reportingPeriod(kind,instant=new Date().toISOString()){
 const date=businessLocalTime(instant).slice(0,10);
 const d=new Date(date+"T00:00:00Z"),y=d.getUTCFullYear(),m=d.getUTCMonth();
 const fmt=v=>v.toISOString().slice(0,10);
 const make=(month,day)=>new Date(Date.UTC(y,month,day));
 if(kind==="week"){const start=new Date(d);start.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);const end=new Date(start);end.setUTCDate(start.getUTCDate()+6);return {start:fmt(start),end:fmt(end)}}
 if(kind==="month")return {start:fmt(make(m,1)),end:fmt(make(m+1,0))};
 if(kind==="quarter"){const q=Math.floor(m/3)*3;return {start:fmt(make(q,1)),end:fmt(make(q+3,0))}}
 if(kind==="year")return {start:fmt(make(0,1)),end:fmt(make(12,0))};
 throw new Error("Unknown reporting period");
}
