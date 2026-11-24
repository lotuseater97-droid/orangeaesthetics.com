import test from "node:test";import assert from "node:assert/strict";import {overlaps,evaluateSlot,requestWindow} from "../lib/booking-capacity.mjs";
const base={start_at:"2026-12-01T10:00:00Z",end_at:"2026-12-01T11:00:00Z",provider_id:"provider-a",room_id:"room-a"};
test("back-to-back appointments do not overlap",()=>assert.equal(overlaps(base,{start_at:base.end_at,end_at:"2026-12-01T12:00:00Z"}),false));
test("provider double booking blocked",()=>assert.equal(evaluateSlot({...base,appointments:[{id:"a",...base,status:"confirmed"}]}).available,false));
test("room double booking blocked across providers",()=>assert.equal(evaluateSlot({...base,appointments:[{id:"a",...base,provider_id:"provider-b",status:"confirmed"}]}).available,false));
test("cancelled bookings do not block",()=>assert.equal(evaluateSlot({...base,appointments:[{id:"a",...base,status:"cancelled"}]}).available,true));
test("buffers prevent too-tight appointments",()=>assert.equal(evaluateSlot({...base,buffers_minutes:15,appointments:[{id:"a",...base,start_at:"2026-12-01T11:10:00Z",end_at:"2026-12-01T12:00:00Z",status:"confirmed"}]}).available,false));
test("closures block all resources",()=>assert.equal(evaluateSlot({...base,closures:[{id:"holiday",all_resources:true,start_at:"2026-12-01T00:00:00Z",end_at:"2026-12-02T00:00:00Z"}]}).available,false));
test("rejects inverted appointment window",()=>assert.throws(()=>evaluateSlot({...base,end_at:"2026-12-01T09:00:00Z"}),RangeError));
test("request window enforces notice",()=>assert.equal(requestWindow({requested_at:"2026-12-01T10:30:00Z",now:"2026-12-01T10:00:00Z"}).allowed,false));
test("request window permits valid future slot",()=>assert.equal(requestWindow({requested_at:"2026-12-02T10:00:00Z",now:"2026-12-01T10:00:00Z"}).allowed,true));

test("invalid existing appointment intervals fail closed",()=>{
 assert.throws(()=>evaluateSlot({...base,appointments:[{...base,id:"broken",status:"confirmed",end_at:base.start_at}]}),RangeError);
});
test("invalid closure intervals fail closed",()=>{
 assert.throws(()=>evaluateSlot({...base,closures:[{id:"broken",all_resources:true,start_at:base.end_at,end_at:base.start_at}]}),RangeError);
});
test("overlap comparison rejects zero-length intervals",()=>{
 assert.throws(()=>overlaps(base,{start_at:base.start_at,end_at:base.start_at}),RangeError);
});

test("available slots exclude occupied provider and room times",async()=>{
 const {availableSlots}=await import("../lib/booking-capacity.mjs");
 const slots=availableSlots({window_start:"2026-12-01T10:00:00Z",window_end:"2026-12-01T12:00:00Z",duration_minutes:30,step_minutes:30,provider_id:"provider-a",room_id:"room-a",appointments:[{...base,id:"taken",status:"confirmed"}]});
 assert.deepEqual(slots.map(s=>s.start_at),["2026-12-01T11:00:00.000Z","2026-12-01T11:30:00.000Z"]);
});
test("available slots respect closures and invalid durations",async()=>{
 const {availableSlots}=await import("../lib/booking-capacity.mjs");
 const options={window_start:"2026-12-01T10:00:00Z",window_end:"2026-12-01T11:00:00Z",duration_minutes:30,provider_id:"provider-a",room_id:"room-a"};
 assert.deepEqual(availableSlots({...options,closures:[{id:"closed",all_resources:true,start_at:options.window_start,end_at:options.window_end}]}),[]);
 assert.throws(()=>availableSlots({...options,duration_minutes:0}),RangeError);
 assert.throws(()=>availableSlots({...options,step_minutes:0}),RangeError);
});

test("available slots honor notice and booking horizon when a clock is supplied",async()=>{
 const {availableSlots}=await import("../lib/booking-capacity.mjs");
 const options={window_start:"2026-12-01T10:00:00Z",window_end:"2026-12-01T12:00:00Z",duration_minutes:30,step_minutes:30,provider_id:"provider-a",room_id:"room-a"};
 const slots=availableSlots({...options,now:"2026-12-01T10:00:00Z",min_notice_minutes:60});
 assert.deepEqual(slots.map(slot=>slot.start_at),["2026-12-01T11:00:00.000Z","2026-12-01T11:30:00.000Z"]);
 assert.deepEqual(availableSlots({...options,now:"2026-11-01T10:00:00Z",max_days_ahead:1}),[]);
 assert.throws(()=>availableSlots({...options,now:"2026-12-01T10:00:00Z",min_notice_minutes:-1}),RangeError);
});

test("invalid booking policy is rejected even if operating window has no fitting slots",async()=>{
 const {availableSlots}=await import("../lib/booking-capacity.mjs");
 const options={window_start:"2026-12-01T10:00:00Z",window_end:"2026-12-01T10:10:00Z",duration_minutes:30,provider_id:"provider-a",room_id:"room-a",now:"2026-12-01T09:00:00Z"};
 assert.throws(()=>availableSlots({...options,min_notice_minutes:-1}),RangeError);
 assert.throws(()=>availableSlots({...options,max_days_ahead:0}),RangeError);
 assert.throws(()=>availableSlots({...options,now:"invalid"}),TypeError);
});

test("slot generation validates resources and buffers even with no candidates",async()=>{
 const {availableSlots}=await import("../lib/booking-capacity.mjs");
 const options={window_start:"2026-12-01T10:00:00Z",window_end:"2026-12-01T10:10:00Z",duration_minutes:30,provider_id:"provider-a",room_id:"room-a"};
 assert.throws(()=>availableSlots({...options,provider_id:""}),TypeError);
 assert.throws(()=>availableSlots({...options,room_id:null}),TypeError);
 assert.throws(()=>availableSlots({...options,buffers_minutes:-1}),RangeError);
 assert.throws(()=>availableSlots({...options,buffers_minutes:121}),RangeError);
});

test("slot planning rejects malformed scheduling collections before iteration",async()=>{
 const {availableSlots}=await import("../lib/booking-capacity.mjs");
 const options={window_start:"2026-12-01T10:00:00Z",window_end:"2026-12-01T10:10:00Z",duration_minutes:30,provider_id:"provider-a",room_id:"room-a"};
 assert.throws(()=>availableSlots({...options,appointments:null}),TypeError);
 assert.throws(()=>availableSlots({...options,closures:{}}),TypeError);
});

test("multi-resource suggestions preserve resource identities and exclude occupied pairs",async()=>{
 const {availableResourceSlots}=await import("../lib/booking-capacity.mjs");
 const resources=[{provider_id:"provider-a",room_id:"room-a"},{provider_id:"provider-b",room_id:"room-b"}];
 const slots=availableResourceSlots({resources,window_start:"2026-12-01T10:00:00Z",window_end:"2026-12-01T10:30:00Z",duration_minutes:30,appointments:[{...base,id:"occupied",status:"confirmed"}]});
 assert.deepEqual(slots.map(s=>[s.provider_id,s.room_id]),[["provider-b","room-b"]]);
 assert.throws(()=>availableResourceSlots({resources:[resources[0],resources[0]],window_start:"2026-12-01T10:00:00Z",window_end:"2026-12-01T10:30:00Z",duration_minutes:30}),RangeError);
 assert.throws(()=>availableResourceSlots({resources:[],window_start:"2026-12-01T10:00:00Z",window_end:"2026-12-01T10:30:00Z",duration_minutes:30}),RangeError);
});

test("multi-resource suggestions can be capped after chronological ordering",async()=>{
 const {availableResourceSlots}=await import("../lib/booking-capacity.mjs");
 const options={resources:[{provider_id:"provider-b",room_id:"room-b"},{provider_id:"provider-a",room_id:"room-a"}],window_start:"2026-12-01T10:00:00Z",window_end:"2026-12-01T11:00:00Z",duration_minutes:30,step_minutes:30};
 const slots=availableResourceSlots({...options,max_results:2});
 assert.deepEqual(slots.map(s=>s.provider_id),["provider-a","provider-b"]);
 assert.ok(slots.every(s=>s.start_at==="2026-12-01T10:00:00.000Z"));
 assert.throws(()=>availableResourceSlots({...options,max_results:0}),RangeError);
 assert.throws(()=>availableResourceSlots({...options,max_results:1001}),RangeError);
});

test("slot planning rejects malformed records before checking candidates",async()=>{
 const {availableSlots}=await import("../lib/booking-capacity.mjs");
 const options={window_start:"2026-12-01T10:00:00Z",window_end:"2026-12-01T10:10:00Z",duration_minutes:30,provider_id:"provider-a",room_id:"room-a"};
 for(const item of [null,undefined,1,"bad",[]]){
  assert.throws(()=>availableSlots({...options,appointments:[item]}),TypeError);
  assert.throws(()=>availableSlots({...options,closures:[item]}),TypeError);
 }
});

test("unknown appointment status cannot silently free provider capacity",()=>{
 for(const status of ["pending","rescheduled",null,undefined]){
  assert.throws(()=>evaluateSlot({...base,appointments:[{...base,id:"unknown",status}]}),RangeError);
 }
});

test("scheduling timestamps require an explicit timezone",()=>{
 for(const invalid of ["2026-12-01T10:00:00","2026-12-01","12/01/2026 10:00",1733047200000]){
  assert.throws(()=>evaluateSlot({...base,start_at:invalid}),TypeError);
 }
 assert.equal(overlaps(base,{start_at:"2026-12-01T11:00:00+00:00",end_at:"2026-12-01T12:00:00+00:00"}),false);
});

test("rejects impossible calendar dates rather than normalizing them",()=>{
 for(const requested_at of ["2026-02-30T10:00:00Z","2026-04-31T10:00:00Z","2025-02-29T10:00:00Z"]){
  assert.throws(()=>requestWindow({requested_at,now:"2026-01-01T10:00:00Z"}),TypeError);
 }
 assert.equal(requestWindow({requested_at:"2028-02-29T10:00:00Z",now:"2028-02-28T10:00:00Z"}).allowed,true);
});

test("rejects impossible clock times and timezone offsets",()=>{
 for(const requested_at of ["2026-12-01T24:00:00Z","2026-12-01T10:60:00Z","2026-12-01T10:00:60Z","2026-12-01T10:00:00+24:00","2026-12-01T10:00:00+01:60"]){
  assert.throws(()=>requestWindow({requested_at,now:"2026-12-01T09:00:00Z"}),TypeError);
 }
 assert.equal(requestWindow({requested_at:"2026-12-01T10:00:00-08:00",now:"2026-12-01T09:00:00-08:00"}).allowed,true);
});

test("appointment lifecycle statuses match the staged business schema",()=>{
 for(const status of ["requested","completed","cancelled","declined","no_show"]){
  assert.deepEqual(evaluateSlot({...base,appointments:[{...base,id:"prior",status}]}),{available:true,conflicts:[]});
 }
 for(const status of ["under_review","confirmed"]){
  assert.equal(evaluateSlot({...base,appointments:[{...base,id:"held",status}]}).available,false);
 }
});

test("direct capacity checks reject malformed closures",()=>{
 for(const item of [null,undefined,1,"invalid",[]]){
  assert.throws(()=>evaluateSlot({...base,closures:[item]}),TypeError);
 }
});

test("whitespace-only provider and room identifiers are rejected",async()=>{
 const {availableSlots}=await import("../lib/booking-capacity.mjs");
 for(const resource of [{provider_id:"   "},{room_id:"  "}]){
  assert.throws(()=>evaluateSlot({...base,...resource}),TypeError);
  assert.throws(()=>availableSlots({window_start:base.start_at,window_end:base.end_at,duration_minutes:30,provider_id:base.provider_id,room_id:base.room_id,...resource}),TypeError);
 }
});
