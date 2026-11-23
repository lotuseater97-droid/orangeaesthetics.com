import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {createStripeWebhookHandler} from '../lib/stripe-webhook-handler.mjs';

const secret='whsec_synthetic_lifecycle_secret';
const orderId='00000000-0000-4000-8000-000000000002';
const sessionId='cs_test_syntheticlifecycle';
const makeEvent=(eventId='evt_lifecycle1',amount=9900)=>({id:eventId,type:'checkout.session.completed',livemode:false,data:{object:{object:'checkout.session',id:sessionId,mode:'payment',payment_status:'paid',status:'complete',currency:'usd',amount_total:amount}}});
const sign=(event)=>{const rawBody=JSON.stringify(event),timestamp=Math.floor(Date.now()/1000),digest=createHmac('sha256',secret).update(`${timestamp}.${rawBody}`).digest('hex');return {method:'POST',headers:{'stripe-signature':`t=${timestamp},v1=${digest}`},rawBody};};

test('signed Stripe lifecycle reconciles once, rejects tampering, and treats retries as idempotent',async()=>{
 const state={paid:false,paymentEvents:new Set(),grants:0,audits:0,dbCalls:0};
 const execute=async(sql,[eventId,checkoutId,amount,currency])=>{
  assert.match(sql,/orange_app\.confirm_paid_checkout\(\$1,\$2,\$3,\$4\)/);
  state.dbCalls++;
  if(checkoutId!==sessionId||amount!==9900||currency!=='USD')throw Error('Order mismatch');
  if(!state.paid){state.paid=true;state.paymentEvents.add(eventId);state.grants++;state.audits++;}
  return {rows:[{order_id:orderId}]};
 };
 const handle=createStripeWebhookHandler({secret,execute,expectedLivemode:false});
 const first=sign(makeEvent());
 assert.equal((await handle(first)).status,200);
 assert.equal((await handle(first)).status,200);
 assert.equal((await handle(sign(makeEvent('evt_lifecycle2')))).status,200);
 assert.deepEqual({paid:state.paid,events:state.paymentEvents.size,grants:state.grants,audits:state.audits},{paid:true,events:1,grants:1,audits:1});
 assert.equal(state.dbCalls,3);
 const tampered={...first,rawBody:first.rawBody.replace('"amount_total":9900','"amount_total":9901')};
 assert.equal((await handle(tampered)).status,400);
 assert.equal(state.dbCalls,3);
 assert.equal((await handle(sign(makeEvent('evt_wrongamount',9901)))).status,503);
 assert.equal(state.dbCalls,4);
 assert.equal(state.grants,1);
});
