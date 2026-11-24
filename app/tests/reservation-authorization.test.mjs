import test from "node:test";
import assert from "node:assert/strict";
import {createReservationAuthorizer} from "../lib/reservation-authorization.mjs";
const id="123e4567-e89b-42d3-a456-426614174000";
const request={actor:{id},organization_id:id,action:"reservation:create"};
test("checks live membership again with transactional query",async()=>{
 const seen=[];
 const preflightQuery=async(sql,params)=>{seen.push("preflight");assert.deepEqual(params,[id,id]);return {rows:[{organization_id:id,role:"manager",active:true}]}};
 const txQuery=async(sql,params)=>{seen.push("transaction");assert.deepEqual(params,[id,id]);return {rows:[{organization_id:id,role:"manager",active:true}]}};
 const authorize=createReservationAuthorizer({preflightQuery});
 assert.equal(await authorize(request),true);
 assert.equal(await authorize({...request,query:txQuery}),true);
 assert.deepEqual(seen,["preflight","transaction"]);
});
test("denies revoked, cross-tenant, and insufficient-role membership",async()=>{
 for(const row of [null,{organization_id:id,role:"manager",active:false},{organization_id:id,role:"member",active:true},{organization_id:"999e4567-e89b-42d3-a456-426614174000",role:"owner",active:true}]){
  const authorize=createReservationAuthorizer({preflightQuery:async()=>({rows:row?[row]:[]})});
  assert.equal(await authorize(request),false);
 }
});
test("ignores forged actor role and denies unknown actions",async()=>{
 const authorize=createReservationAuthorizer({preflightQuery:async()=>({rows:[{organization_id:id,role:"member",active:true}]})});
 assert.equal(await authorize({...request,actor:{id,role:"owner"}}),false);
 assert.equal(await authorize({...request,action:"reservation:delete"}),false);
 assert.equal(await authorize({...request,query:null}),false);
 assert.throws(()=>createReservationAuthorizer({}),TypeError);
});
