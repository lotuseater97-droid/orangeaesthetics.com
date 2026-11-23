// Synthetic end-to-end checkout wiring test. No network, secrets or patient data.
import test from "node:test";
import assert from "node:assert/strict";
import {createCheckoutHttpHandler} from "../lib/checkout-http-handler.mjs";
import {createCheckoutService} from "../lib/checkout-service.mjs";
import {createNeonCheckoutAdapters} from "../lib/neon-checkout-adapters.mjs";
import {createNeonCatalogLoader} from "../lib/neon-catalog-loader.mjs";
import {createStripeTestSessionAdapter} from "../lib/stripe-test-session.mjs";

const member="00000000-0000-4000-8000-000000000001";
const order="00000000-0000-4000-8000-000000000002";
const calls=[];
const query=async(sql,values)=>{
 calls.push({sql,values});
 if(sql.includes("FROM orange_app.catalog_items"))return {rows:[{sku:"test_item",price_cents:"9900",active:true,kind:"addon"}]};
 if(sql.includes("reserve_checkout_order"))return {rows:[{id:order,status:"pending",member_id:member,total_cents:"9900",currency:"USD"}]};
 if(sql.includes("attach_checkout_session"))return {rows:[{attached:true}]};
 throw Error("Unexpected SQL");
};
const stripe=createStripeTestSessionAdapter({secretKey:"sk_test_synthetic",fetchImpl:async(url,options)=>{
 assert.equal(url,"https://api.stripe.com/v1/checkout/sessions");
 assert.equal(options.headers["idempotency-key"],"checkout-"+order);
 return {ok:true,json:async()=>({id:"cs_test_synthetic",url:"https://checkout.stripe.com/c/pay/synthetic"})};
}});
const db=createNeonCheckoutAdapters({query});
const startCheckout=createCheckoutService({reserveOrder:db.reserveOrder,attachCheckout:db.attachCheckout,createStripeSession:stripe,approvedOrigin:"https://orangeaesthetics.com",enabled:true});
const handler=createCheckoutHttpHandler({verifySession:async()=>({id:member,active:true}),loadCatalog:createNeonCatalogLoader({query,approvedSkus:["test_item"]}),startCheckout,origin:"https://orangeaesthetics.com",enabled:true});
test("synthetic authenticated checkout reaches Stripe test session and persists it",async()=>{
 const response=await handler({method:"POST",headers:{origin:"https://orangeaesthetics.com","content-type":"application/json"},rawBody:JSON.stringify({sku:"test_item",quantity:1})});
 assert.equal(response.status,200, response.body);
 assert.equal(JSON.parse(response.body).url,"https://checkout.stripe.com/c/pay/synthetic");
 assert.equal(calls.length,3);
 assert.deepEqual(calls[2].values,[order,member,"cs_test_synthetic"]);
});
