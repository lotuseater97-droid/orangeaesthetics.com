import test from "node:test";
import assert from "node:assert/strict";
import {createNeonCheckoutAdapters} from "../lib/neon-checkout-adapters.mjs";
const member="00000000-0000-4000-8000-000000000001",order="00000000-0000-4000-8000-000000000002";
test("reservation uses parameterized SQL and maps Neon row",async()=>{let args;const a=createNeonCheckoutAdapters({query:async(...x)=>{args=x;return {rows:[{id:order,status:"pending",member_id:member,total_cents:"9900",currency:"USD"}]}}});const r=await a.reserveOrder({memberId:member,sku:"test_item",quantity:1,unitAmount:9900,currency:"USD"});assert.equal(r.totalAmount,9900);assert.deepEqual(args[1],[member,"test_item",1,9900])});
test("session attach checks database confirmation",async()=>{const a=createNeonCheckoutAdapters({query:async()=>({rows:[{attached:true}]})});assert.equal(await a.attachCheckout({orderId:order,memberId:member,checkoutId:"cs_test_123"}),true)});
test("failed attach rejects",async()=>{const a=createNeonCheckoutAdapters({query:async()=>({rows:[{attached:false}]})});await assert.rejects(a.attachCheckout({orderId:order,memberId:member,checkoutId:"cs_test_123"}))});
test("non-USD reservation fails before database",async()=>{let called=false;const a=createNeonCheckoutAdapters({query:async()=>{called=true}});await assert.rejects(a.reserveOrder({currency:"EUR"}));assert.equal(called,false)});

test("missing attach confirmation rejects",async()=>{
 const a=createNeonCheckoutAdapters({query:async()=>({rows:[]})});
 await assert.rejects(a.attachCheckout({orderId:order,memberId:member,checkoutId:"cs_test_123"}),/not attached/);
});

test("rejects oversized or unsafe Neon bigint totals",async()=>{
 for(const amount of ["100000000","9007199254740993","-1","NaN"]){
  const a=createNeonCheckoutAdapters({query:async()=>({rows:[{id:order,status:"pending",member_id:member,total_cents:amount,currency:"USD"}]})});
  await assert.rejects(a.reserveOrder({memberId:member,sku:"test_item",quantity:1,unitAmount:9900,currency:"USD"}),/Invalid reserved order amount/,amount);
 }
});
test("accepts exact maximum safe checkout amount from Neon",async()=>{
 const a=createNeonCheckoutAdapters({query:async()=>({rows:[{id:order,status:"pending",member_id:member,total_cents:"99999999",currency:"USD"}]})});
 assert.equal((await a.reserveOrder({memberId:member,sku:"test_item",quantity:1,unitAmount:99999999,currency:"USD"})).totalAmount,99999999);
});
