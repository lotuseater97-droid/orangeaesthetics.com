import test from "node:test";
import assert from "node:assert/strict";
import {transitionReservation,ReservationTransitionConflict} from "../lib/reservation-transitions.mjs";
const id="123e4567-e89b-42d3-a456-426614174000";
const base={organization_id:id,reservation_id:id,from_status:"under_review",to_status:"confirmed"};
test("transition uses bound tenant scope and expected previous status",async()=>{
 let params,sql;
 const row={id,organization_id:id,status:"confirmed"};
 assert.equal(await transitionReservation({...base,query:async(s,p)=>{sql=s;params=p;return {rows:[row]}}}),row);
 assert.deepEqual(params,[id,id,"confirmed","under_review"]);
 assert.match(sql,/status=\$4/);
});
test("stale reservation returns conflict",async()=>{
 await assert.rejects(transitionReservation({...base,query:async()=>({rows:[]})}),ReservationTransitionConflict);
});
test("illegal transitions fail before database query",async()=>{
 let calls=0;const query=async()=>{calls++;return {rows:[]}};
 for(const [from_status,to_status] of [["confirmed","under_review"],["completed","confirmed"],["under_review","completed"],["cancelled","confirmed"]]){
  await assert.rejects(transitionReservation({...base,from_status,to_status,query}),RangeError);
 }
 assert.equal(calls,0);
});
test("terminal states can be reached from confirmed bookings",async()=>{
 for(const to_status of ["completed","no_show","cancelled"]){
  const row={id,organization_id:id,status:to_status};
  assert.equal(await transitionReservation({...base,from_status:"confirmed",to_status,query:async()=>({rows:[row]})}),row);
 }
});
test("invalid returned tenant and status fail closed",async()=>{
 for(const row of [{id,organization_id:"wrong",status:"confirmed"},{id,organization_id:id,status:"under_review"},null]){
  await assert.rejects(transitionReservation({...base,query:async()=>({rows:[row]})}));
 }
});
