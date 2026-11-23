import test from "node:test";
import assert from "node:assert/strict";
import {createMemberOrderHistoryHandler} from "../lib/member-order-history-handler.mjs";
const member="00000000-0000-4000-8000-000000000001";
const order="00000000-0000-4000-8000-000000000002";
const row={id:order,status:"paid",total_cents:"9900",currency:"USD",created_at:new Date("2026-11-23T10:00:00Z")};
test("history is disabled by default without authentication or database access",async()=>{
 let invoked=false;
 const handle=createMemberOrderHistoryHandler({verifySession:async()=>{invoked=true;return {id:member,active:true}},query:async()=>{invoked=true;return {rows:[row]}}});
 assert.equal((await handle({method:"GET"})).status,503);
 assert.equal(invoked,false);
});
test("authenticated history uses only server-verified member ID",async()=>{
 let params,sql;
 const handle=createMemberOrderHistoryHandler({enabled:true,verifySession:async()=>({id:member,active:true}),query:async(q,p)=>{sql=q;params=p;return {rows:[row]}}});
 const result=await handle({method:"GET",headers:{authorization:"Bearer synthetic"}});
 assert.equal(result.status,200);
 assert.deepEqual(params,[member]);
 assert.match(sql,/WHERE member_id=\$1/);
 assert.match(sql,/LIMIT 20/);
 assert.deepEqual(JSON.parse(result.body),{orders:[{id:order,status:"paid",totalCents:9900,currency:"USD",createdAt:"2026-11-23T10:00:00.000Z"}]});
 assert.equal(result.headers["cache-control"],"no-store");
});
test("unauthenticated and inactive accounts cannot query orders",async()=>{
 for(const identity of [null,{id:member,active:false},{id:"invalid",active:true}]){
  let queried=false;
  const handle=createMemberOrderHistoryHandler({enabled:true,verifySession:async()=>identity,query:async()=>{queried=true;return {rows:[]}}});
  assert.equal((await handle({method:"GET"})).status,401);
  assert.equal(queried,false);
 }
});
test("history rejects POST and GET bodies before authentication",async()=>{
 let verified=false;
 const handle=createMemberOrderHistoryHandler({enabled:true,verifySession:async()=>{verified=true;return {id:member,active:true}},query:async()=>({rows:[]})});
 assert.equal((await handle({method:"POST"})).status,405);
 assert.equal((await handle({method:"GET",rawBody:'{"memberId":"other"}'})).status,400);
 assert.equal(verified,false);
});
test("history fails closed on database errors and malformed rows",async()=>{
 for(const query of [async()=>{throw Error("offline")},async()=>({rows:[{...row,total_cents:"NaN"}]})]){
  const handle=createMemberOrderHistoryHandler({enabled:true,verifySession:async()=>({id:member,active:true}),query});
  assert.equal((await handle({method:"GET"})).status,503);
 }
});
test("history does not disclose clinical details or member identity",async()=>{
 const handle=createMemberOrderHistoryHandler({enabled:true,verifySession:async()=>({id:member,active:true}),query:async()=>({rows:[{...row,patient_name:"Private",medical_history:"Private"}]})});
 const response=await handle({method:"GET"});
 assert.equal(response.status,200);
 assert.doesNotMatch(response.body,/Private|memberId|patient_name|medical_history/);
});

test("rejects missing or boolean order totals rather than converting them to zero",async()=>{
 for(const invalid of [null,"",false]){
  const handle=createMemberOrderHistoryHandler({enabled:true,verifySession:async()=>({id:member,active:true}),query:async()=>({rows:[{...row,total_cents:invalid}]})});
  assert.equal((await handle({method:"GET"})).status,503);
 }
});

test("rejects absent order timestamps instead of treating null as 1970",async()=>{
 for(const invalid of [null,undefined,"",false]){
  const handle=createMemberOrderHistoryHandler({enabled:true,verifySession:async()=>({id:member,active:true}),query:async()=>({rows:[{...row,created_at:invalid}]})});
  assert.equal((await handle({method:"GET"})).status,503);
 }
});

test("rejects scientific notation, fractional and padded order totals",async()=>{
 for(const invalid of ["1e2","99.5"," 9900","09900","-1"]){
  const handle=createMemberOrderHistoryHandler({enabled:true,verifySession:async()=>({id:member,active:true}),query:async()=>({rows:[{...row,total_cents:invalid}]})});
  assert.equal((await handle({method:"GET"})).status,503);
 }
});

test("rejects coerced epoch dates and malformed order timestamp types",async()=>{
 for(const invalid of [0,1,"0","1","1970",[],{}]){
  const handle=createMemberOrderHistoryHandler({enabled:true,verifySession:async()=>({id:member,active:true}),query:async()=>({rows:[{...row,created_at:invalid}]})});
  assert.equal((await handle({method:"GET"})).status,503);
 }
});
