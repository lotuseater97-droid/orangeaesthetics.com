import test from "node:test";
import assert from "node:assert/strict";
import {paidCheckoutCandidate} from "../lib/paid-checkout-policy.mjs";
const event=(overrides={})=>({id:"evt_123",type:"checkout.session.completed",livemode:false,data:{object:{object:"checkout.session",id:"cs_test_123",mode:"payment",payment_status:"paid",status:"complete",currency:"usd",amount_total:9900,...overrides}}});
test("paid completed checkout produces minimal reconciliation candidate",()=>assert.deepEqual(paidCheckoutCandidate(event()),{eventId:"evt_123",checkoutId:"cs_test_123",amountCents:9900,currency:"USD"}));
for(const changes of [{payment_status:"unpaid"},{status:"open"},{mode:"subscription"},{currency:"eur"},{amount_total:0},{amount_total:NaN},{id:"bad"},{object:"payment_intent"}]){
 test("reject unsafe checkout "+JSON.stringify(changes),()=>assert.equal(paidCheckoutCandidate(event(changes)),null));
}
test("ignore unrelated events",()=>assert.equal(paidCheckoutCandidate({...event(),type:"invoice.paid"}),null));
test("ignore malformed payloads",()=>assert.equal(paidCheckoutCandidate({}),null));
