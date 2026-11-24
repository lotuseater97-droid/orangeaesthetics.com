import test from "node:test";
import assert from "node:assert/strict";
import {insertReservation,ReservationConflictError} from "../lib/reservation-store.mjs";
const id="123e4567-e89b-42d3-a456-426614174000";
const options={organization_id:id,appointment_id:id,provider_id:id,room_id:id,starts_at:"2026-12-01T10:00:00Z",ends_at:"2026-12-01T11:00:00Z"};
test("reservation adapter uses bound parameters and returns database row",async()=>{
 let call;
 const row={id,status:"under_review"};
 const result=await insertReservation({...options,query:async(sql,params)=>{call={sql,params};return {rows:[row]}}});
 assert.equal(result,row);
 assert.match(call.sql,/VALUES \(\$1,\$2,\$3,\$4,\$5,\$6,\$7\)/);
 assert.deepEqual(call.params,[id,id,id,id,options.starts_at,options.ends_at,"under_review"]);
});
test("database uniqueness and overlap violations map to conflicts",async()=>{
 for(const [code,constraint] of [["23P01","oa_provider_no_overlap"],["23P01","oa_room_no_overlap"],["23505","oa_one_reservation_per_appointment"]]){
  await assert.rejects(insertReservation({...options,query:async()=>{throw {code,constraint}}}),ReservationConflictError);
 }
});
test("invalid reservation requests never query database",async()=>{
 let calls=0;const query=async()=>{calls++;return {rows:[{}]}};
 for(const invalid of [{organization_id:"bad"},{status:"cancelled"},{ends_at:options.starts_at},{ends_at:"2026-12-01T19:00:00Z"},{starts_at:"not-a-date"}]){
  await assert.rejects(insertReservation({...options,...invalid,query}));
 }
 assert.equal(calls,0);
});

test("malformed calendar, clock and offset values never reach persistence",async()=>{
 let calls=0;
 const query=async()=>{calls++;return {rows:[{}]}};
 for(const starts_at of ["2026-02-30T10:00:00Z","2026-12-01T24:00:00Z","2026-12-01T10:60:00Z","2026-12-01T10:00:60Z","2026-12-01T10:00:00+24:00","2026-12-01T10:00:00+01:60","2026-12-01T10:00:00","2026-12-01T10:00:00x000Z"]){
  await assert.rejects(insertReservation({...options,starts_at,query}),RangeError);
 }
 assert.equal(calls,0);
});

test("unrelated database constraint violations retain their original errors",async()=>{
 for(const error of [{code:"23505",constraint:"unrelated_unique_key"},{code:"23P01",constraint:"other_exclusion"},{code:"23503",constraint:"oa_appointment_fk"}]){
  await assert.rejects(insertReservation({...options,query:async()=>{throw error}}),caught=>caught===error);
 }
});

test("malformed database insert responses are not treated as successful bookings",async()=>{
 for(const response of [null,{}, {rows:[]},{rows:[null]},{rows:["invalid"]},{rows:[[]]},{rows:[{},{}]}]){
  await assert.rejects(insertReservation({...options,query:async()=>response}),/Reservation insert returned no record/);
 }
});

test("mismatched returned reservation scope and lifecycle state fail closed",async()=>{
 for(const field of ["organization_id","appointment_id","provider_id","room_id","status"]){
  const value=field==="status"?"confirmed":"123e4567-e89b-42d3-a456-426614174001";
  await assert.rejects(insertReservation({...options,query:async()=>({rows:[{id,[field]:value}]})}),new RegExp("mismatched "+field));
 }
 const matching={id,...options,status:"under_review"};
 assert.deepEqual(await insertReservation({...options,query:async()=>({rows:[matching]})}),matching);
});
