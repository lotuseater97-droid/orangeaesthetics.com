import test from "node:test";
import assert from "node:assert/strict";
import {createStaffReservation} from "../lib/staff-reservation-service.mjs";
const id="123e4567-e89b-42d3-a456-426614174000";
const request={actor:{id},organization_id:id,appointment_id:id,provider_id:id,room_id:id,starts_at:"2026-12-01T10:00:00Z",ends_at:"2026-12-01T11:00:00Z"};
test("authorized validated reservation uses transactional query",async()=>{
 let calls=[];
 const row={id,status:"under_review"};
 const result=await createStaffReservation({...request,authorize:async a=>{calls.push(a.action);return true},validateBooking:async()=>{calls.push("validate");return true},transaction:async work=>{calls.push("transaction");return work(async(sql,params)=>{calls.push("insert");assert.equal(params.length,7);return {rows:[row]}})}});
 assert.equal(result,row);assert.deepEqual(calls,["reservation:create","transaction","reservation:create","validate","insert"]);
});
test("unauthorized bookings cannot begin transactions and invalid bookings cannot insert",async()=>{
 for(const [allowed,valid,expected] of [[false,true,403],[true,false,422]]){
  let transactions=0;
  let inserts=0;
  await assert.rejects(createStaffReservation({...request,authorize:async()=>allowed,validateBooking:async()=>valid,transaction:async work=>{transactions++;return work(async()=>{inserts++;return {rows:[{}]}})}}),e=>e.status===expected);
  assert.equal(transactions,allowed?1:0);
  assert.equal(inserts,0);
 }
});
test("missing security callbacks fail closed",async()=>{
 await assert.rejects(createStaffReservation({...request,authorize:async()=>true,validateBooking:async()=>true}),TypeError);
 await assert.rejects(createStaffReservation({...request,authorize:async()=>true,transaction:async()=>{}}),TypeError);
});

test("transaction wrapper must supply a database query function",async()=>{
 await assert.rejects(createStaffReservation({...request,authorize:async()=>true,validateBooking:async()=>true,transaction:async work=>work(undefined)}),TypeError);
});
test("reservation insert failures propagate to transaction wrapper for rollback",async()=>{
 const failure=Object.assign(new Error("database unavailable"),{code:"08006"});
 let rolledBack=false;
 await assert.rejects(createStaffReservation({...request,authorize:async()=>true,validateBooking:async()=>true,transaction:async work=>{
  try{return await work(async()=>{throw failure})}catch(error){rolledBack=true;throw error}
 }}),error=>error===failure);
 assert.equal(rolledBack,true);
});

test("missing actor identifiers never reach authorization or persistence",async()=>{
 for(const actor of [{},{id:""},{id:"   "},{id:42},{id:"not-a-uuid"},{id:"00000000-0000-0000-0000-000000000000"},null]){
  let calls=0;
  await assert.rejects(createStaffReservation({...request,actor,authorize:async()=>{calls++;return true},validateBooking:async()=>{calls++;return true},transaction:async()=>{calls++}}),TypeError);
  assert.equal(calls,0);
 }
});

test("missing organization or appointment scope never invokes security callbacks",async()=>{
 for(const override of [{organization_id:undefined},{organization_id:"  "},{appointment_id:undefined},{appointment_id:"  "}]){
  let calls=0;
  await assert.rejects(createStaffReservation({...request,...override,authorize:async()=>{calls++;return true},validateBooking:async()=>{calls++;return true},transaction:async()=>{calls++}}),TypeError);
  assert.equal(calls,0);
 }
});

test("malformed reservation resource IDs fail before authorization callbacks",async()=>{
 for(const override of [{organization_id:"invalid"},{appointment_id:"invalid"},{provider_id:""},{provider_id:"not-a-uuid"},{room_id:null},{room_id:"  "}, {room_id:"not-a-uuid"}]){
  let calls=0;
  await assert.rejects(createStaffReservation({...request,...override,authorize:async()=>{calls++;return true},validateBooking:async()=>{calls++;return true},transaction:async()=>{calls++}}),TypeError);
  assert.equal(calls,0);
 }
});

test("nonreservable lifecycle states never invoke trusted booking callbacks",async()=>{
 for(const status of ["requested","cancelled","completed","no_show","declined",null,"pending"]){
  let calls=0;
  await assert.rejects(createStaffReservation({...request,status,authorize:async()=>{calls++;return true},validateBooking:async()=>{calls++;return true},transaction:async()=>{calls++}}),RangeError);
  assert.equal(calls,0);
 }
});

test("booking policy receives transactional query and is checked before insert",async()=>{
 const events=[];
 const query=async()=>{events.push("insert");return {rows:[{id}]}};
 await createStaffReservation({...request,authorize:async()=>true,validateBooking:async args=>{assert.equal(args.query,query);assert.equal(args.actor,request.actor);events.push("policy");return true},transaction:async work=>{events.push("begin");return work(query)}});
 assert.deepEqual(events,["begin","policy","insert"]);
});

test("staff reservations integrate with the PostgreSQL runner transaction client shape",async()=>{
 const events=[];
 const query=async(sql,params)=>{events.push("query");assert.match(sql,/INSERT INTO public\.oa_resource_reservations/);assert.equal(params.length,7);return {rows:[{id}]}};
 const row=await createStaffReservation({...request,authorize:async()=>true,validateBooking:async ({query:txQuery})=>{assert.equal(typeof txQuery,"function");events.push("policy");return true},transaction:async work=>work(Object.freeze({query}))});
 assert.equal(row.id,id);
 assert.deepEqual(events,["policy","query"]);
});

test("pg-compatible transaction clients retain their query receiver",async()=>{
 const row={id,status:"under_review"};
 const client={calls:0,async query(sql,params){assert.equal(this,client);this.calls++;return {rows:[row]}}};
 const result=await createStaffReservation({...request,authorize:async()=>true,validateBooking:async({query})=>{await query("SELECT 1");return true},transaction:async work=>work(client)});
 assert.equal(result,row);
 assert.equal(client.calls,2);
});

test("transactional reauthorization denies revoked access before booking policy or insert",async()=>{
 let checks=0,policyCalls=0,inserts=0;
 await assert.rejects(createStaffReservation({...request,
  authorize:async({query})=>{checks++;return !query},
  validateBooking:async()=>{policyCalls++;return true},
  transaction:async work=>work(async()=>{inserts++;return {rows:[{}]}})
 }),error=>error.status===403);
 assert.equal(checks,2);
 assert.equal(policyCalls,0);
 assert.equal(inserts,0);
});
