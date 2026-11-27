export function clockEvent(events,staff_id,action,instant){
 if(!Array.isArray(events)||typeof staff_id!=="string"||!staff_id||!["in","break-start","break-end","out"].includes(action))throw new TypeError("Invalid clock event");
 const time=Date.parse(instant);if(!Number.isFinite(time))throw new RangeError("Invalid clock time");
 const own=events.filter(e=>e.staff_id===staff_id),last=own.at(-1);
 const allowed={out:["in"],in:["break-start","out"],"break-start":["break-end"],"break-end":["break-start","out"]};
 if(!allowed[last?.action??"out"]?.includes(action)||last&&time<=Date.parse(last.instant))throw new RangeError("Invalid clock transition");
 return [...events,{staff_id,action,instant:new Date(time).toISOString()}];
}
export function clockSummary(events,staff_id){
 let start=null,breakStart=null,breakMs=0;const completed=[];
 for(const e of events.filter(e=>e.staff_id===staff_id)){
 const t=Date.parse(e.instant);
 if(e.action==="in"){start=t;breakMs=0}
 if(e.action==="break-start")breakStart=t;
 if(e.action==="break-end"){breakMs+=t-breakStart;breakStart=null}
 if(e.action==="out"){completed.push({clock_in:new Date(start).toISOString(),clock_out:e.instant,unpaid_break_minutes:breakMs/60000,worked_minutes:(t-start-breakMs)/60000});start=null}
 }
 return {status:start===null?"out":breakStart===null?"working":"break",completed};
}
