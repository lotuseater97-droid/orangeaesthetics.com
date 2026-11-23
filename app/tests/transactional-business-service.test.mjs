import test from "node:test";import assert from "node:assert/strict";import {createTransactionalBusinessService} from "../lib/transactional-business-service.mjs";
const key="expense_20261122_001";
const payload={vendor_id:"v1",category:"supplies",amount_cents:2000,incurred_on:"2026-11-22"};
const build=(overrides={})=>{const events=[];const tx={claimIdempotency:async()=>{events.push("claim");return {claimed:true}},getForUpdate:async()=>({id:"inv1",organization_id:"orange",status:"issued"}),create:async()=>{events.push("write");return {id:"new1"}},transition:async()=>{events.push("transition");return {id:"inv1",status:"paid"}},audit:async()=>{events.push("audit")},finishIdempotency:async()=>{events.push("finish")},...overrides};const service=createTransactionalBusinessService({verifySession:async()=>({active:true,user_id:"user1",organization_id:"orange"}),lookupStaff:async()=>({active:true,organization_id:"orange",role:"owner"}),withTransaction:async cb=>{events.push("begin");const result=await cb(tx);events.push("commit");return result}});return {service,events}};
test("financial write, audit and idempotency finish share one transaction",async()=>{const {service,events}=build();await service.write({token:"verified_session_123",kind:"expense",operation:"create",payload,idempotency_key:key});assert.deepEqual(events,["begin","claim","write","audit","finish","commit"])});
test("audit failure prevents transaction success",async()=>{const {service,events}=build({audit:async()=>{throw Error("audit down")}});await assert.rejects(()=>service.write({token:"verified_session_123",kind:"expense",operation:"create",payload,idempotency_key:key}),/audit down/);assert.equal(events.includes("commit"),false)});
test("duplicate financial request returns prior result without writing",async()=>{const {service,events}=build({claimIdempotency:async()=>({replayed:true,result:{id:"old1"}})});const r=await service.write({token:"verified_session_123",kind:"expense",operation:"create",payload,idempotency_key:key});assert.equal(r.id,"old1");assert.equal(events.includes("write"),false)});
test("conflicting idempotency claim fails closed",async()=>{const {service}=build({claimIdempotency:async()=>({claimed:false})});await assert.rejects(()=>service.write({token:"verified_session_123",kind:"expense",operation:"create",payload,idempotency_key:key}),{code:"CONFLICT"})});
test("invoice transition locks record before update",async()=>{const {service,events}=build();await service.write({token:"verified_session_123",kind:"invoice",operation:"transition",id:"inv1",to:"paid",idempotency_key:"invoice_20261122_001"});assert.deepEqual(events,["begin","claim","transition","audit","finish","commit"])});
test("cross tenant record blocked",async()=>{const {service}=build({getForUpdate:async()=>({id:"inv1",organization_id:"other",status:"issued"})});await assert.rejects(()=>service.write({token:"verified_session_123",kind:"invoice",operation:"transition",id:"inv1",to:"paid",idempotency_key:"invoice_20261122_001"}),{code:"NOT_FOUND"})});
test("rejects invalid session token",async()=>assert.rejects(()=>build().service.write({token:"short",kind:"expense",operation:"create",payload,idempotency_key:key}),{code:"UNAUTHENTICATED"}));
test("rejects missing audit adapter",async()=>assert.rejects(()=>build({audit:null}).service.write({token:"verified_session_123",kind:"expense",operation:"create",payload,idempotency_key:key}),TypeError));

test("invoice retry replays before checking a now-changed record",async()=>{
 let locked=false;
 const {service}=build({claimIdempotency:async()=>({replayed:true,result:{id:"inv1",status:"paid"}}),getForUpdate:async()=>{locked=true;throw Error("should not lock replay")}});
 const result=await service.write({token:"verified_session_123",kind:"invoice",operation:"transition",id:"inv1",to:"paid",idempotency_key:"invoice_20261122_001"});
 assert.equal(result.status,"paid");assert.equal(locked,false);
});
test("invalid transition target cannot retrieve a prior result",async()=>{
 const {service}=build({claimIdempotency:async()=>({replayed:true,result:{id:"inv1"}})});
 await assert.rejects(()=>service.write({token:"verified_session_123",kind:"invoice",operation:"transition",id:"inv1",to:"",idempotency_key:"invoice_20261122_001"}),{code:"VALIDATION"});
});
test("financial retry requires valid idempotency key before claim",async()=>{
 const {service}=build();
 await assert.rejects(()=>service.write({token:"verified_session_123",kind:"invoice",operation:"transition",id:"inv1",to:"paid",idempotency_key:"x"}),TypeError);
});

test("financial write rejects a verified session without active organization",async()=>{
 let membershipCalled=false,transactionCalled=false;
 const service=createTransactionalBusinessService({
  verifySession:async()=>({active:true,user_id:"user1"}),
  lookupStaff:async()=>{membershipCalled=true;return {active:true,organization_id:"orange",role:"owner"}},
  withTransaction:async()=>{transactionCalled=true}
 });
 await assert.rejects(()=>service.write({token:"verified_session_123",kind:"expense",operation:"create",payload,idempotency_key:key}),{code:"FORBIDDEN"});
 assert.equal(membershipCalled,false);assert.equal(transactionCalled,false);
});
test("financial write rejects membership belonging to another organization",async()=>{
 let transactionCalled=false;
 const service=createTransactionalBusinessService({
  verifySession:async()=>({active:true,user_id:"user1",organization_id:"orange"}),
  lookupStaff:async()=>({active:true,organization_id:"other",role:"owner"}),
  withTransaction:async()=>{transactionCalled=true}
 });
 await assert.rejects(()=>service.write({token:"verified_session_123",kind:"expense",operation:"create",payload,idempotency_key:key}),{code:"FORBIDDEN"});
 assert.equal(transactionCalled,false);
});
test("write membership lookup uses both verified identities",async()=>{
 let args;
 const service=createTransactionalBusinessService({
  verifySession:async()=>({active:true,user_id:"user1",organization_id:"orange"}),
  lookupStaff:async input=>{args=input;return {active:true,organization_id:"orange",role:"owner"}},
  withTransaction:async cb=>cb({claimIdempotency:async()=>({claimed:true}),create:async()=>({id:"new1"}),getForUpdate:async()=>null,transition:async()=>null,audit:async()=>{},finishIdempotency:async()=>{}})
 });
 await service.write({token:"verified_session_123",kind:"expense",operation:"create",payload,idempotency_key:key});
 assert.deepEqual(args,{user_id:"user1",organization_id:"orange"});
});
