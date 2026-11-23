import test from "node:test";import assert from "node:assert/strict";import {createBusinessService} from "../lib/business-service.mjs";
const expense={vendor_id:"vendor1",category:"supplies",amount_cents:1500,incurred_on:"2026-11-22"};
const make=(membership={active:true,organization_id:"orange",role:"owner"})=>{
 const calls=[];const records=new Map([["inv1",{id:"inv1",organization_id:"orange",status:"issued"}],["foreign",{id:"foreign",organization_id:"other",status:"issued"}]]);
 const service=createBusinessService({resolveSession:async token=>token==="valid_session"?{active:true,user_id:"owner1"}:null,resolveMembership:async()=>membership,repository:{create:async op=>{calls.push(["create",op]);return {id:"new1"}},get:async({id})=>records.get(id),transition:async op=>{calls.push(["transition",op]);return {id:op.record_id,status:op.to}}},audit:async event=>calls.push(["audit",event])});
 return {service,calls};
};
test("creates expense with server-derived organization",async()=>{const {service,calls}=make();await service.create({sessionToken:"valid_session",kind:"expense",payload:expense,idempotency_key:"expense_20261122_123"});assert.equal(calls[0][1].identity.organization_id,"orange");assert.equal(calls[1][0],"audit")});
test("rejects unverified session",async()=>assert.rejects(()=>make().service.create({sessionToken:"fake_session",kind:"expense",payload:expense,idempotency_key:"expense_20261122_123"}),{code:"UNAUTHENTICATED"}));
test("rejects inactive membership",async()=>assert.rejects(()=>make({active:false,organization_id:"orange",role:"owner"}).service.create({sessionToken:"valid_session",kind:"expense",payload:expense,idempotency_key:"expense_20261122_123"}),{code:"FORBIDDEN"}));
test("rejects staff finance permissions",async()=>assert.rejects(()=>make({active:true,organization_id:"orange",role:"ma"}).service.create({sessionToken:"valid_session",kind:"expense",payload:expense,idempotency_key:"expense_20261122_123"}),{code:"FORBIDDEN"}));
test("rejects client organization spoofing",async()=>assert.rejects(()=>make().service.create({sessionToken:"valid_session",kind:"expense",payload:{...expense,organization_id:"other"},idempotency_key:"expense_20261122_123"}),{code:"VALIDATION"}));
test("changes invoice status for own organization",async()=>{const {service,calls}=make();const result=await service.changeStatus({sessionToken:"valid_session",kind:"invoice",id:"inv1",to:"paid",idempotency_key:"invoice_20261122_123"});assert.equal(result.status,"paid");assert.equal(calls[1][0],"audit")});
test("rejects cross-organization record even if repository returns it",async()=>assert.rejects(()=>make().service.changeStatus({sessionToken:"valid_session",kind:"invoice",id:"foreign",to:"paid",idempotency_key:"invoice_20261122_123"}),{code:"NOT_FOUND"}));
test("rejects unsupported record kind",async()=>assert.rejects(()=>make().service.changeStatus({sessionToken:"valid_session",kind:"patient",id:"inv1",to:"paid"}),{code:"VALIDATION"}));
