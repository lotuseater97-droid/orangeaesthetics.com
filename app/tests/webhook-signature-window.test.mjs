import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {verifyStripeSignature} from '../lib/webhook-signature.mjs';
const secret='whsec_test_timestamp_guard';
const body='{"id":"evt_timestamp","type":"checkout.session.completed"}';
const now=1800000000;
const sign=(t)=>createHmac('sha256',secret).update(`${t}.${body}`).digest('hex');
test('accepts signed Stripe payload within the allowed timestamp window',()=>{
 assert.equal(verifyStripeSignature(body,`t=${now-300},v1=${sign(now-300)}`,secret,now),true);
 assert.equal(verifyStripeSignature(body,`t=${now+300},v1=${sign(now+300)}`,secret,now),true);
});
test('rejects expired and future-dated signatures even when HMAC is correct',()=>{
 for(const t of [now-301,now+301])assert.equal(verifyStripeSignature(body,`t=${t},v1=${sign(t)}`,secret,now),false);
});
test('accepts a valid v1 among invalid signatures and rejects invalid-only headers',()=>{
 const good=sign(now),bad='0'.repeat(64);
 assert.equal(verifyStripeSignature(body,`t=${now},v1=${bad},v1=${good}`,secret,now),true);
 assert.equal(verifyStripeSignature(body,`t=${now},v1=${bad}`,secret,now),false);
});
test('rejects tampering, unsupported signature version and malformed timestamp',()=>{
 const header=`t=${now},v1=${sign(now)}`;
 assert.equal(verifyStripeSignature(body+' ',header,secret,now),false);
 assert.equal(verifyStripeSignature(body,`t=${now},v0=${sign(now)}`,secret,now),false);
 assert.equal(verifyStripeSignature(body,`t=notatime,v1=${sign(now)}`,secret,now),false);
});
