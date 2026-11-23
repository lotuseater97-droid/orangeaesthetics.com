import test from "node:test";import assert from "node:assert/strict";import {createOwnerDashboardBackend} from "../lib/owner-dashboard-backend.mjs";
const org="123e4567-e89b-42d3-a456-426614174000",user="123e4567-e89b-42d3-a456-426614174001";
const make=(role="owner",rows=[{id:"a1",organization_id:org,assigned_to:user,status:"confirmed",service_code:"consult"}])=>{
 const sql=[];
 const backend=createOwnerDashboardBackend({verifySession:async()=>({active:true,user_id:user,organization_id:org}),lookupMembership:async()=>({active:true,organization_id:org,role}),query:async(text,values)=>{sql.push({text,values});return {rows}}});
 return {backend,sql};
};
test("owner end-to-end read uses SQL tenant scope and field allowlist",async()=>{const {backend,sql}=make("owner",[{id:"a1",organization_id:org,assigned_to:user,status:"confirmed",diagnosis:"do not expose"}]);const [record]=await backend.list({sessionToken:"verified_session_123",collection:"appointments"});assert.deepEqual(record,{id:"a1",status:"confirmed"});assert.deepEqual(sql[0].values,[org,50])});
test("MA end-to-end read applies SQL assignment filter",async()=>{const {backend,sql}=make("ma");const [record]=await backend.list({sessionToken:"verified_session_123",collection:"appointments"});assert.equal(record.id,"a1");assert.deepEqual(sql[0].values,[org,user,50])});
test("MA cannot request invoices and no SQL executes",async()=>{const {backend,sql}=make("ma");await assert.rejects(()=>backend.list({sessionToken:"verified_session_123",collection:"invoices"}),{code:"FORBIDDEN"});assert.equal(sql.length,0)});
test("cross tenant SQL leak rejected after query",async()=>{const {backend}=make("owner",[{id:"a1",organization_id:"123e4567-e89b-42d3-a456-426614174999"}]);await assert.rejects(()=>backend.list({sessionToken:"verified_session_123",collection:"appointments"}),{code:"INTERNAL"})});
test("staff assignment leak rejected after query",async()=>{const {backend}=make("ma",[{id:"a1",organization_id:org,assigned_to:"123e4567-e89b-42d3-a456-426614174999"}]);await assert.rejects(()=>backend.list({sessionToken:"verified_session_123",collection:"appointments"}),{code:"INTERNAL"})});
test("invalid verified session denied before query",async()=>{let called=false;const backend=createOwnerDashboardBackend({verifySession:async()=>({active:false,user_id:user}),lookupMembership:async()=>{called=true;return null},query:async()=>({rows:[]})});await assert.rejects(()=>backend.list({sessionToken:"verified_session_123",collection:"appointments"}),{code:"UNAUTHENTICATED"});assert.equal(called,false)});
test("inactive membership denied",async()=>{const backend=createOwnerDashboardBackend({verifySession:async()=>({active:true,user_id:user,organization_id:org}),lookupMembership:async()=>({active:false,organization_id:org,role:"owner"}),query:async()=>({rows:[]})});await assert.rejects(()=>backend.list({sessionToken:"verified_session_123",collection:"appointments"}),{code:"FORBIDDEN"})});

test("missing active organization fails closed before membership lookup",async()=>{
 let lookupCalled=false;
 const backend=createOwnerDashboardBackend({verifySession:async()=>({active:true,user_id:user}),lookupMembership:async()=>{lookupCalled=true;return {active:true,organization_id:org,role:"owner"}},query:async()=>({rows:[]})});
 await assert.rejects(()=>backend.list({sessionToken:"verified_session_123",collection:"appointments"}),{code:"FORBIDDEN"});
 assert.equal(lookupCalled,false);
});
test("membership for another organization is rejected",async()=>{
 const other="123e4567-e89b-42d3-a456-426614174999";
 const backend=createOwnerDashboardBackend({verifySession:async()=>({active:true,user_id:user,organization_id:org}),lookupMembership:async()=>({active:true,organization_id:other,role:"owner"}),query:async()=>({rows:[]})});
 await assert.rejects(()=>backend.list({sessionToken:"verified_session_123",collection:"appointments"}),{code:"FORBIDDEN"});
});
test("membership lookup receives both verified user and organization",async()=>{
 let lookupArgs;
 const backend=createOwnerDashboardBackend({verifySession:async()=>({active:true,user_id:user,organization_id:org}),lookupMembership:async args=>{lookupArgs=args;return {active:true,organization_id:org,role:"owner"}},query:async()=>({rows:[]})});
 await backend.list({sessionToken:"verified_session_123",collection:"appointments"});
 assert.deepEqual(lookupArgs,{user_id:user,organization_id:org});
});
