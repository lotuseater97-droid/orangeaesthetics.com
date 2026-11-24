import test from "node:test";import assert from "node:assert/strict";import {createStaffMembershipSqlLookup} from "../lib/staff-membership-sql.mjs";
const user="123e4567-e89b-42d3-a456-426614174001",org="123e4567-e89b-42d3-a456-426614174000";
test("lookup binds verified user and organization and requires active membership",async()=>{let sql;const lookup=createStaffMembershipSqlLookup({query:async(text,values)=>{sql={text,values};return {rows:[{organization_id:org,role:"owner",active:true}]}}});const row=await lookup({user_id:user,organization_id:org});assert.equal(row.role,"owner");assert.match(sql.text,/user_id = \$1 AND organization_id = \$2 AND active = TRUE/);assert.deepEqual(sql.values,[user,org])});
test("missing membership returns null",async()=>{const lookup=createStaffMembershipSqlLookup({query:async()=>({rows:[]})});assert.equal(await lookup({user_id:user,organization_id:org}),null)});
test("malformed identities rejected before query",async()=>{let called=false;const lookup=createStaffMembershipSqlLookup({query:async()=>{called=true;return {rows:[]}}});await assert.rejects(()=>lookup({user_id:"bad",organization_id:org}),{code:"FORBIDDEN"});assert.equal(called,false)});
test("unexpected duplicate rows rejected",async()=>{const lookup=createStaffMembershipSqlLookup({query:async()=>({rows:[{},{}]})});await assert.rejects(()=>lookup({user_id:user,organization_id:org}),{code:"INTERNAL"})});

test("malformed and cross-tenant membership rows are rejected",async()=>{
 for(const row of [null,"owner",[],{}, {organization_id:org,role:42,active:true},{organization_id:org,role:"owner",active:"true"}]){
  const lookup=createStaffMembershipSqlLookup({query:async()=>({rows:[row]})});
  await assert.rejects(()=>lookup({user_id:user,organization_id:org}),{code:"INTERNAL"});
 }
});

test("cross-tenant membership is denied as absent",async()=>{
 const lookup=createStaffMembershipSqlLookup({query:async()=>({rows:[{organization_id:"123e4567-e89b-42d3-a456-426614174099",role:"owner",active:true}]})});
 assert.equal(await lookup({user_id:user,organization_id:org}),null);
});

test("membership lookup does not hide duplicate active rows with LIMIT 1",async()=>{
 let sql="";
 const lookup=createStaffMembershipSqlLookup({query:async text=>{sql=text;return {rows:[{organization_id:org,role:"owner",active:true},{organization_id:org,role:"staff",active:true}]}}});
 await assert.rejects(()=>lookup({user_id:user,organization_id:org}),{code:"INTERNAL"});
 assert.doesNotMatch(sql,/LIMIT\s+1\b/i);
});
