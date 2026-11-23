import test from "node:test";
import assert from "node:assert/strict";
import {createHmac} from "node:crypto";
import {createStripeWebhookHandler} from "../lib/stripe-webhook-handler.mjs";
const secret="whsec_test_secret_123456";
const event={id:"evt_123",type:"checkout.session.completed",livemode:false,data:{object:{object:"checkout.session",id:"cs_test_123",mode:"payment",payment_status:"paid",status:"complete",currency:"usd",amount_total:9900}}};
const signed=(e=event)=>{const rawBody=JSON.stringify(e),t=Math.floor(Date.now()/1000),sig=createHmac("sha256",secret).update(t+"."+rawBody).digest("hex");return {method:"POST",rawBody,headers:{"stripe-signature":`t=${t},v1=${sig}`}};};
test("valid signed test payment invokes parameterized Neon reconciliation",async()=>{let calls=[];const h=createStripeWebhookHandler({secret,execute:async(...args)=>{calls.push(args);return {rows:[{order_id:"order-test"}]}}});const res=await h(signed());assert.equal(res.status,200);assert.deepEqual(calls[0][1],["evt_123","cs_test_123",9900,"USD"]);});
test("unsigned events rejected before DB",async()=>{let calls=0;const h=createStripeWebhookHandler({secret,execute:async()=>{calls++}});assert.equal((await h({...signed(),headers:{}})).status,400);assert.equal(calls,0);});
test("live events rejected in test mode",async()=>{const h=createStripeWebhookHandler({secret,execute:async()=>{throw Error("should not call")}});assert.equal((await h(signed({...event,livemode:true}))).status,400);});
test("unpaid signed checkout ignored",async()=>{let calls=0;const h=createStripeWebhookHandler({secret,execute:async()=>{calls++}});assert.equal((await h(signed({...event,data:{object:{...event.data.object,payment_status:"unpaid"}}}))).status,200);assert.equal(calls,0);});
test("database failure returns retryable status",async()=>{const h=createStripeWebhookHandler({secret,execute:async()=>{throw Error("DB down")}});assert.equal((await h(signed())).status,503);});
test("oversized payload rejected",async()=>{const h=createStripeWebhookHandler({secret,execute:async()=>({rows:[]}),maxBytes:20});assert.equal((await h(signed())).status,413);});

test("tampered signed payment is rejected without reconciliation",async()=>{
 let calls=0;
 const h=createStripeWebhookHandler({secret,execute:async()=>{calls++;return {rows:[{order_id:"unexpected"}]}}});
 const request=signed();
 const altered={...request,rawBody:request.rawBody.replace('"amount_total":9900','"amount_total":9901')};
 assert.equal((await h(altered)).status,400);
 assert.equal(calls,0);
});
test("valid signature with wrong checkout currency is ignored",async()=>{
 let calls=0;
 const h=createStripeWebhookHandler({secret,execute:async()=>{calls++}});
 const request=signed({...event,data:{object:{...event.data.object,currency:"eur"}}});
 assert.equal((await h(request)).status,200);
 assert.equal(calls,0);
});
test("signed checkout with incomplete payment status cannot grant credits",async()=>{
 let calls=0;
 const h=createStripeWebhookHandler({secret,execute:async()=>{calls++}});
 const request=signed({...event,data:{object:{...event.data.object,status:"open"}}});
 assert.equal((await h(request)).status,200);
 assert.equal(calls,0);
});
test("missing database confirmation returns retryable error",async()=>{
 const h=createStripeWebhookHandler({secret,execute:async()=>({rows:[]})});
 assert.equal((await h(signed())).status,503);
});
