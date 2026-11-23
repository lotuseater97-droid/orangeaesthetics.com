import test from "node:test";
import assert from "node:assert/strict";
import {createCheckoutService} from "../lib/checkout-service.mjs";
const member="00000000-0000-4000-8000-000000000001",order="00000000-0000-4000-8000-000000000002";
const catalog={status:"approved",items:[{code:"test_item",active:true,payment_eligible:true,requires_clinical_review:false,price_cents:9900,currency:"usd"}]};
function setup(enabled=true){const calls=[];const start=createCheckoutService({enabled,approvedOrigin:"https://orangeaesthetics.com",reserveOrder:async x=>{calls.push(["reserve",x]);return {id:order,status:"pending",memberId:member,totalAmount:9900,currency:"USD"}},createStripeSession:async (x,y)=>{calls.push(["stripe",x,y]);return {id:"cs_test_123",url:"https://checkout.stripe.com/c/pay/cs_test_123"}},attachCheckout:async x=>{calls.push(["attach",x]);return true}});return {start,calls}}
test("creates test checkout after trusted reservation",async()=>{const {start,calls}=setup();const r=await start({verifiedMemberId:member,sku:"test_item",quantity:1,catalog});assert.match(r.url,/checkout.stripe.com/);assert.equal(calls.length,3);assert.equal(calls[1][2].idempotencyKey,"checkout-"+order);assert.equal(calls[2][1].checkoutId,"cs_test_123")});
test("no checkout without verified member",async()=>{const {start,calls}=setup();await assert.rejects(start({verifiedMemberId:"user-supplied",sku:"test_item",quantity:1,catalog}));assert.equal(calls.length,0)});
test("disabled checkout fails closed",async()=>{const {start,calls}=setup(false);await assert.rejects(start({verifiedMemberId:member,sku:"test_item",quantity:1,catalog}));assert.equal(calls.length,0)});
test("clinical-review items cannot be sold online",async()=>{const {start,calls}=setup();await assert.rejects(start({verifiedMemberId:member,sku:"test_item",quantity:1,catalog:{...catalog,items:[{...catalog.items[0],requires_clinical_review:true}]}}));assert.equal(calls.length,0)});
test("mismatched reserved order blocks Stripe",async()=>{let invoked=false;const start=createCheckoutService({enabled:true,approvedOrigin:"https://orangeaesthetics.com",reserveOrder:async()=>({id:order,status:"pending",memberId:member,totalAmount:100,currency:"USD"}),createStripeSession:async()=>{invoked=true},attachCheckout:async()=>{}});await assert.rejects(start({verifiedMemberId:member,sku:"test_item",quantity:1,catalog}));assert.equal(invoked,false)});

test("payment URL withheld when checkout attachment is not confirmed",async()=>{
 const start=createCheckoutService({enabled:true,approvedOrigin:"https://orangeaesthetics.com",reserveOrder:async()=>({id:order,status:"pending",memberId:member,totalAmount:9900,currency:"USD"}),createStripeSession:async()=>({id:"cs_test_123",url:"https://checkout.stripe.com/c/pay/cs_test_123"}),attachCheckout:async()=>false});
 await assert.rejects(start({verifiedMemberId:member,sku:"test_item",quantity:1,catalog}),/attachment not confirmed/);
});

test("rejects non-Stripe checkout redirects before database attachment",async()=>{
 for(const url of ["https://checkout.stripe.com.evil.test/c/pay/fake","https://checkout.stripe.com@evil.test/c/pay/fake","http://checkout.stripe.com/c/pay/fake","https://checkout.stripe.com/other","https://checkout.stripe.com/c/pay/fake#fragment"]){
  let attached=false;
  const start=createCheckoutService({enabled:true,approvedOrigin:"https://orangeaesthetics.com",reserveOrder:async()=>({id:order,status:"pending",memberId:member,totalAmount:9900,currency:"USD"}),createStripeSession:async()=>({id:"cs_test_123",url}),attachCheckout:async()=>{attached=true;return true}});
  await assert.rejects(start({verifiedMemberId:member,sku:"test_item",quantity:1,catalog}),/Invalid Stripe test session/);
  assert.equal(attached,false,url);
 }
});
