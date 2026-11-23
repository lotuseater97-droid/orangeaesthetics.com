import test from "node:test";
import assert from "node:assert/strict";
import {createCheckoutHttpHandler} from "../lib/checkout-http-handler.mjs";
const member="00000000-0000-4000-8000-000000000001";
const input={method:"POST",headers:{origin:"https://orangeaesthetics.com","content-type":"application/json"},rawBody:JSON.stringify({sku:"test_item",quantity:1})};
const make=(opts={})=>{let calls=0;const handler=createCheckoutHttpHandler({origin:"https://orangeaesthetics.com",enabled:true,verifySession:async()=>({id:member,active:true}),loadCatalog:async()=>({status:"approved",items:[]}),startCheckout:async x=>{calls++;assert.equal(x.verifiedMemberId,member);return {url:"https://checkout.stripe.com/c/test"}},...opts});return {handler,calls:()=>calls}};
test("verified member can initiate server-scoped checkout",async()=>{const x=make();const result=await x.handler(input);assert.equal(result.status,200);assert.equal(x.calls(),1)});
test("rejects member ID and price supplied by browser",async()=>{const x=make();assert.equal((await x.handler({...input,rawBody:JSON.stringify({sku:"test_item",quantity:1,memberId:member,price:1})})).status,400);assert.equal(x.calls(),0)});
test("rejects missing session",async()=>{const x=make({verifySession:async()=>null});assert.equal((await x.handler(input)).status,401);assert.equal(x.calls(),0)});
test("rejects cross origin",async()=>{const x=make();assert.equal((await x.handler({...input,headers:{...input.headers,origin:"https://evil.example"}})).status,403);assert.equal(x.calls(),0)});
test("disabled by default",async()=>{const x=createCheckoutHttpHandler({verifySession:async()=>null,loadCatalog:async()=>null,startCheckout:async()=>null,origin:"https://orangeaesthetics.com"});assert.equal((await x(input)).status,503)});

test("rejects JSON-like but invalid content types",async()=>{
 const x=make();
 assert.equal((await x.handler({...input,headers:{...input.headers,"content-type":"application/json-evil"}})).status,415);
 assert.equal(x.calls(),0);
});
test("rejects unsafe origin configuration at construction",()=>{
 const deps={verifySession:async()=>null,loadCatalog:async()=>null,startCheckout:async()=>null};
 for(const origin of ["http://orangeaesthetics.com","https://orangeaesthetics.com.evil.test/path","https://orangeaesthetics.com/path","not a url"]){
  assert.throws(()=>createCheckoutHttpHandler({...deps,origin}),/Trusted HTTPS origin/);
 }
});
