import test from "node:test";
import assert from "node:assert/strict";
import {createStaffReservation} from "../lib/staff-reservation-service.mjs";
const id="123e4567-e89b-42d3-a456-426614174000";
const request={actor:{id},organization_id:id,appointment_id:id,provider_id:id,room_id:id,starts_at:"2026-12-01T10:00:00Z",ends_at:"2026-12-01T11:00:00Z"};
test("authorized validated reservation uses transactional query",async()=>{
 let calls=[];
 const row={id,status:"under_review"};
 const result=await createStaffReservation({...request,authorize:async a=>{calls.push(a.action);return true},validateBooking:async()=>{calls.push("validate");return true},transaction:async work=>{calls.push("transaction");return work(async(sql,params)=>{calls.push("insert");assert.equal(params.length,7);return {rows:[row]}})}});
 assert.equal(result,row);assert.deepEqual(calls,["reservation:create","validate","transaction","insert"]);
});
test("unauthorized and invalid bookings cannot begin transactions",async()=>{
 for(const [allowed,valid,expected] of [[false,true,403],[true,false,422]]){
  let transactions=0;
  await assert.rejects(createStaffReservation({...request,authorize:async()=>allowed,validateBooking:async()=>valid,transaction:async()=>{transactions++}}),e=>e.status===expected);
  assert.equal(transactions,0);
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
 for(const actor of [{},{id:""},{id:"   "},{id:42},null]){
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
