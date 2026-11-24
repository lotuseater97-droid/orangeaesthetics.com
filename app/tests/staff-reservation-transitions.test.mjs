import test from "node:test";
import assert from "node:assert/strict";
import {transitionStaffReservation} from "../lib/staff-reservation-transitions.mjs";
const id="123e4567-e89b-42d3-a456-426614174000";
const base={actor:{id},organization_id:id,reservation_id:id,from_status:"under_review",to_status:"confirmed"};
test("staff transition reauthorizes inside transaction and writes tenant-scoped state",async()=>{
 const events=[];const row={id,organization_id:id,status:"confirmed"};
 const result=await transitionStaffReservation({...base,authorize:async ({query})=>{events.push(query?"inside-auth":"outside-auth");return true},transaction:async fn=>{events.push("begin");const result=await fn({query:async(sql,params)=>{events.push("update");assert.ok(sql.includes("organization_id=$1"));assert.deepEqual(params,[id,id,"confirmed","under_review"]);return {rows:[row]}}});events.push("commit");return result}});
 assert.equal(result,row);assert.deepEqual(events,["outside-auth","begin","inside-auth","update","commit"]);
});
test("denied actor cannot start a transaction",async()=>{
 let started=false;await assert.rejects(transitionStaffReservation({...base,authorize:async()=>false,transaction:async()=>{started=true}}),{status:403});assert.equal(started,false);
});
test("revoked membership prevents update inside transaction",async()=>{
 let writes=0;let checks=0;
 await assert.rejects(transitionStaffReservation({...base,authorize:async()=>++checks===1,transaction:async fn=>fn({query:async()=>{writes++}})}),{status:403});assert.equal(checks,2);assert.equal(writes,0);
});
test("invalid actor and missing trusted dependencies fail closed",async()=>{
 for(const options of [{actor:{id:"bad"}},{actor:null},{authorize:null},{transaction:null}])await assert.rejects(transitionStaffReservation({...base,authorize:async()=>true,transaction:async()=>{},...options}));
});
