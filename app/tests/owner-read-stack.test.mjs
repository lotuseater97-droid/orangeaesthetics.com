import test from "node:test";import assert from "node:assert/strict";import {createOwnerReadStack} from "../lib/owner-read-stack.mjs";
const org="123e4567-e89b-42d3-a456-426614174000",user="123e4567-e89b-42d3-a456-426614174001",other="123e4567-e89b-42d3-a456-426614174999";
const endpoint="https://orange.example/api/owner/records?collection=appointments";
function setup({role="ma",membershipOrg=org,rows=[{id:"a1",organization_id:org,assigned_to:user,status:"confirmed",service_code:"consult",private_note:"hidden"}],sessionOrg=org}={}){
 const sql=[];
 const handler=createOwnerReadStack({
  verifySession:async()=>({active:true,user_id:user,organization_id:sessionOrg}),
  extractVerifiedToken:async()=>"verified_session_123",
  query:async(text,values)=>{
   sql.push({text,values});
   if(text.includes("oa_team_members"))return {rows:[{active:true,organization_id:membershipOrg,role}]};
   return {rows};
  }
 });
 return {handler,sql};
}
test("full HTTP read stack checks membership then assignment-scoped query",async()=>{
 const {handler,sql}=setup();
 const response=await handler({method:"GET",url:endpoint});
 assert.equal(response.status,200);
 assert.deepEqual(JSON.parse(response.body),{collection:"appointments",records:[{id:"a1",status:"confirmed",service_code:"consult"}]});
 assert.equal(sql.length,2);
 assert.match(sql[0].text,/oa_team_members/);
 assert.deepEqual(sql[0].values,[user,org]);
 assert.match(sql[1].text,/assigned_to = \$2/);
 assert.deepEqual(sql[1].values,[org,user,50]);
});
test("other-organization membership prevents any business query",async()=>{
 const {handler,sql}=setup({membershipOrg:other});
 const response=await handler({method:"GET",url:endpoint});
 assert.equal(response.status,403);
 assert.equal(sql.length,1);
});
test("cross-organization data leakage fails closed through HTTP",async()=>{
 const {handler}=setup({rows:[{id:"a2",organization_id:other,assigned_to:user}]});
 const response=await handler({method:"GET",url:endpoint});
 assert.equal(response.status,500);
 assert.deepEqual(JSON.parse(response.body),{error:"INTERNAL"});
});
test("other staff assignment fails closed through HTTP",async()=>{
 const {handler}=setup({rows:[{id:"a2",organization_id:org,assigned_to:other}]});
 const response=await handler({method:"GET",url:endpoint});
 assert.equal(response.status,500);
});
test("financial collection denied for MA before business SQL",async()=>{
 const {handler,sql}=setup();
 const response=await handler({method:"GET",url:endpoint.replace("appointments","invoices")});
 assert.equal(response.status,403);
 assert.equal(sql.length,1);
});
test("owner can read invoices with organization-scoped query",async()=>{
 const {handler,sql}=setup({role:"owner",rows:[{id:"i1",organization_id:org,total_cents:5000,balance_cents:3000,status:"issued",currency:"USD",contact_id:"private"}]});
 const response=await handler({method:"GET",url:endpoint.replace("appointments","invoices")});
 assert.equal(response.status,200);
 assert.deepEqual(JSON.parse(response.body).records,[{id:"i1",status:"issued",currency:"USD",total_cents:5000,balance_cents:3000}]);
 assert.deepEqual(sql[1].values,[org,50]);
});
test("invalid active organization prevents SQL lookup",async()=>{
 const {handler,sql}=setup({sessionOrg:"untrusted"});
 const response=await handler({method:"GET",url:endpoint});
 assert.equal(response.status,403);
 assert.equal(sql.length,0);
});
