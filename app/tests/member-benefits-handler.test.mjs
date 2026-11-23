import test from "node:test";
import assert from "node:assert/strict";
import {createMemberBenefitsHandler} from "../lib/member-benefits-handler.mjs";
const member="00000000-0000-4000-8000-000000000001";
const grant="00000000-0000-4000-8000-000000000002";
const row={id:grant,sku:"test_addon",granted_quantity:3,redeemed_quantity:"1",expires_at:null};
function build({enabled=true,identity={id:member,active:true},rows=[row]}={}){
 let calls=0,params,sql;
 const handle=createMemberBenefitsHandler({enabled,verifySession:async()=>identity,query:async(q,p)=>{calls++;params=p;sql=q;return {rows}}});
 return {handle,inspect:()=>({calls,params,sql})};
}
test("disabled benefits do not access database",async()=>{const s=build({enabled:false});assert.equal((await s.handle({method:"GET"})).status,503);assert.equal(s.inspect().calls,0)});
test("benefits are scoped to verified member and completed redemptions",async()=>{
 const s=build();const result=await s.handle({method:"GET"});
 assert.equal(result.status,200);
 assert.deepEqual(s.inspect().params,[member]);
 assert.match(s.inspect().sql,/r.status='completed'/);
 assert.match(s.inspect().sql,/g.member_id=\$1/);
 assert.deepEqual(JSON.parse(result.body),{benefits:[{id:grant,sku:"test_addon",granted:3,redeemed:1,remaining:2,expired:false,expiresAt:null}]});
});
test("expired grants have no available balance",async()=>{
 const s=build({rows:[{...row,expires_at:"2000-01-01T00:00:00Z"}]});
 const result=JSON.parse((await s.handle({method:"GET"})).body);
 assert.equal(result.benefits[0].remaining,0);
 assert.equal(result.benefits[0].expired,true);
});
test("rejects inactive identities and supplied request bodies",async()=>{
 const s=build({identity:{id:member,active:false}});
 assert.equal((await s.handle({method:"GET"})).status,401);
 assert.equal((await s.handle({method:"GET",rawBody:'{"memberId":"other"}'})).status,400);
 assert.equal(s.inspect().calls,0);
});
test("fails closed on inconsistent redemption totals",async()=>{
 const s=build({rows:[{...row,redeemed_quantity:"4"}]});
 assert.equal((await s.handle({method:"GET"})).status,503);
});
test("returns no patient information from extra database columns",async()=>{
 const s=build({rows:[{...row,patient_name:"Private"}]});
 const response=await s.handle({method:"GET"});
 assert.equal(response.status,200);
 assert.doesNotMatch(response.body,/Private|patient_name/);
});

test("rejects missing quantities rather than converting null to zero",async()=>{
 for(const field of ["granted_quantity","redeemed_quantity"]){
  for(const invalid of [null,"",false]){
   const s=build({rows:[{...row,[field]:invalid}]});
   assert.equal((await s.handle({method:"GET"})).status,503);
  }
 }
});
