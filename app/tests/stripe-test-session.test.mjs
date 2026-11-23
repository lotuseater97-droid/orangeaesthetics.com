import test from "node:test";
import assert from "node:assert/strict";
import {createStripeTestSessionAdapter} from "../lib/stripe-test-session.mjs";
const id="00000000-0000-4000-8000-000000000002";
const params={mode:"payment",line_items:[{price_data:{currency:"usd",unit_amount:9900,product_data:{name:"test_item"}},quantity:1}],success_url:"https://orangeaesthetics.com/checkout/success",cancel_url:"https://orangeaesthetics.com/checkout/cancel",client_reference_id:id,metadata:{order_id:id}};
test("posts form-encoded Stripe test session with stable idempotency",async()=>{let call;const fn=createStripeTestSessionAdapter({secretKey:"sk_test_example",fetchImpl:async(...args)=>{call=args;return {ok:true,json:async()=>({id:"cs_test_abc",url:"https://checkout.stripe.com/c/pay/test"})}}}});const r=await fn(params,{idempotencyKey:"checkout-"+id});assert.equal(r.id,"cs_test_abc");assert.equal(call[1].headers["idempotency-key"],"checkout-"+id);assert.equal(new URLSearchParams(call[1].body).get("line_items[0][price_data][unit_amount]"),"9900")});
test("rejects live keys",()=>assert.throws(()=>createStripeTestSessionAdapter({secretKey:"sk_live_example"})));
test("rejects client supplied extra line items",async()=>{const fn=createStripeTestSessionAdapter({secretKey:"sk_test_example",fetchImpl:async()=>{throw Error("unexpected network")}});await assert.rejects(fn({...params,line_items:[...params.line_items,...params.line_items]},{idempotencyKey:"checkout-"+id}))});
test("Stripe error does not leak response body",async()=>{const fn=createStripeTestSessionAdapter({secretKey:"sk_test_example",fetchImpl:async()=>({ok:false})});await assert.rejects(fn(params,{idempotencyKey:"checkout-"+id}),/unavailable/)});

test("rejects forged Stripe checkout response URLs",async()=>{
 for(const url of ["https://checkout.stripe.com.evil.test/c/pay/fake","https://checkout.stripe.com@evil.test/c/pay/fake","http://checkout.stripe.com/c/pay/fake","https://checkout.stripe.com/other","https://checkout.stripe.com/c/pay/fake#fragment"]){
  const fn=createStripeTestSessionAdapter({secretKey:"sk_test_example",fetchImpl:async()=>({ok:true,json:async()=>({id:"cs_test_abc",url})})});
  await assert.rejects(fn(params,{idempotencyKey:"checkout-"+id}),/Invalid Stripe response/,url);
 }
});

test("rejects idempotency key for a different order before contacting Stripe",async()=>{
 let contacted=false;
 const fn=createStripeTestSessionAdapter({secretKey:"sk_test_example",fetchImpl:async()=>{contacted=true;throw Error("unexpected network")}});
 await assert.rejects(fn(params,{idempotencyKey:"checkout-00000000-0000-4000-8000-000000000003"}),/Invalid checkout fields/);
 assert.equal(contacted,false);
});
test("rejects malformed order UUID in idempotency key",async()=>{
 let contacted=false;
 const fn=createStripeTestSessionAdapter({secretKey:"sk_test_example",fetchImpl:async()=>{contacted=true;throw Error("unexpected network")}});
 await assert.rejects(fn(params,{idempotencyKey:"checkout-zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz"}),/Invalid checkout request/);
 assert.equal(contacted,false);
});
