import test from "node:test";
import assert from "node:assert/strict";
import {createStaffReservationHttpHandler} from "../lib/staff-reservation-http.mjs";
const id="123e4567-e89b-42d3-a456-426614174000";
const origin="https://orangeaesthetics.com";
const headers={origin,"content-type":"application/json"};
const actor={id,active:true,mfaVerified:true};
const creation={operation:"create",organization_id:id,appointment_id:id,provider_id:id,room_id:id,starts_at:"2026-12-01T10:00:00Z",ends_at:"2026-12-01T11:00:00Z",status:"under_review"};
const transition={operation:"transition",organization_id:id,reservation_id:id,from_status:"under_review",to_status:"confirmed"};
function handler(options={}){
 const calls=[];
 const fn=createStaffReservationHttpHandler({
  verifyStaff:async()=>{calls.push("verify");return actor},
  authorize:async({query})=>{calls.push(query?"authorize-tx":"authorize");return true},
  validateBooking:async()=>{calls.push("policy");return true},
  transaction:async work=>{calls.push("begin");return work(async(sql,params)=>{
   calls.push("sql");return {rows:[{id,organization_id:id,status:params.length===7?"under_review":"confirmed"}]};});},
  origin,enabled:true,...options
 });
 return {fn,calls};
}
const send=(fn,body,overrides={})=>fn({method:"POST",headers,rawBody:JSON.stringify(body),...overrides});
test("feature stays unavailable by default without contacting authorization",async()=>{
 let count=0;
 const fn=createStaffReservationHttpHandler({verifyStaff:async()=>{count++},authorize:async()=>true,validateBooking:async()=>true,transaction:async()=>{},origin});
 assert.equal((await send(fn,creation)).status,503);assert.equal(count,0);
});
test("staff can create reservation only after MFA, authorization and policy",async()=>{
 const {fn,calls}=handler();
 const res=await send(fn,creation);
 assert.equal(res.status,200);assert.deepEqual(calls,["verify","authorize","begin","authorize-tx","policy","sql"]);
 assert.deepEqual(JSON.parse(res.body),{message:"Reservation update recorded"});
 assert.equal(res.headers["cache-control"],"no-store");
});
test("staff can transition reservation through tenant-scoped transaction",async()=>{
 const {fn,calls}=handler();
 const res=await send(fn,transition);
 assert.equal(res.status,200);assert.deepEqual(calls,["verify","authorize","begin","authorize-tx","sql"]);
});
test("unverified MFA and revoked actor fail before authorization",async()=>{
 for(const identity of [null,{...actor,mfaVerified:false},{...actor,active:false},{...actor,id:"not-a-uuid"}]){
  const {fn,calls}=handler({verifyStaff:async()=>identity});
  assert.equal((await send(fn,creation)).status,401);assert.deepEqual(calls,[]);
 }
});
test("origin, content type, shape, and size are rejected before auth",async()=>{
 const {fn,calls}=handler();
 const bad=[
  {body:creation,overrides:{method:"GET"},status:405},
  {body:creation,overrides:{headers:{...headers,origin:"https://evil.example"}},status:403},
  {body:creation,overrides:{headers:{...headers,"content-type":"text/plain"}},status:415},
  {body:{...creation,extra:true},status:400},
  {body:{...creation,organization_id:"bad"},status:400},
  {body:{...creation,status:"completed"},status:400},
  {body:{...transition,to_status:"invalid"},status:400},
  {body:creation,overrides:{rawBody:"x".repeat(2049)},status:413},
  {body:creation,overrides:{rawBody:"{"},status:400}
 ];
 for(const item of bad)assert.equal((await send(fn,item.body,item.overrides)).status,item.status);
 assert.deepEqual(calls,[]);
});
test("access denials, conflicts and unexpected database errors are sanitized",async()=>{
 for(const [error,status] of [[Object.assign(new Error("secret"),{status:403}),403],[Object.assign(new Error("secret"),{status:409}),409],[new Error("secret"),503]]){
  const {fn}=handler({transaction:async()=>{throw error}});
  const result=await send(fn,creation);
  assert.equal(result.status,status);assert.doesNotMatch(result.body,/secret/);
 }
});
test("failed session verification returns unavailable without database work",async()=>{
 const {fn,calls}=handler({verifyStaff:async()=>{throw new Error("identity provider outage")}});
 assert.equal((await send(fn,creation)).status,503);assert.deepEqual(calls,[]);
});
