// Optional real-Neon development integration. Never supply a production URL.
// Required: NEON_DEV_DATABASE_URL and NEON_DEV_BRANCH_ID=br-nameless-wave-bfsa2x6n
// All synthetic writes are rolled back, including successful webhook reconciliation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHmac} from 'node:crypto';
import {createRequire} from 'node:module';
import {createStripeWebhookHandler} from '../lib/stripe-webhook-handler.mjs';

const devBranch='br-nameless-wave-bfsa2x6n';
const optedIn=process.env.ALLOW_ROLLBACK_DB_TEST==='true';
test('signed webhook reconciles a real Neon development transaction without persisting data',{skip:!optedIn?'Requires explicit rollback-test opt-in':false},async()=>{
 assert.ok(process.env.NEON_DEV_DATABASE_URL,'Missing Neon development connection');
 assert.equal(process.env.NEON_DEV_BRANCH_ID,devBranch,'Incorrect Neon development branch');
 const serverRequire=createRequire(new URL('../server/package.json',import.meta.url));
 const {Client}=serverRequire('pg');
 const url=new URL(process.env.NEON_DEV_DATABASE_URL);
 assert.equal(url.protocol,'postgresql:');
 assert.match(url.hostname,/\.neon\.tech$/);
 assert.equal(process.env.NEON_DEV_BRANCH_ID,devBranch);
 assert.equal(url.searchParams.get('sslmode') === 'disable',false,'TLS cannot be disabled');
 const client=new Client({connectionString:url.toString(),ssl:{rejectUnauthorized:true},connectionTimeoutMillis:5000,statement_timeout:10000});
 const secret='whsec_synthetic_integration_123456';
 const nonce=randomUUID().replaceAll('-','');
 const sku='synthetic_'+nonce.slice(0,32);
 const session='cs_test_'+nonce;
 const memberSubject='synthetic_'+nonce;
 const sign=(id,amount=9900)=>{
  const rawBody=JSON.stringify({id,type:'checkout.session.completed',livemode:false,data:{object:{object:'checkout.session',id:session,mode:'payment',payment_status:'paid',status:'complete',currency:'usd',amount_total:amount}}});
  const t=Math.floor(Date.now()/1000);
  const sig=createHmac('sha256',secret).update(t+'.'+rawBody).digest('hex');
  return {method:'POST',headers:{'stripe-signature':`t=${t},v1=${sig}`},rawBody};
 };
 await client.connect();
 try{
  await client.query('BEGIN');
  const m=await client.query("INSERT INTO orange_app.members(display_name,auth_subject,status) VALUES($1,$2,'active') RETURNING id",['Synthetic integration',memberSubject]);
  await client.query("INSERT INTO orange_app.catalog_items(sku,name,kind,price_cents,active,checkout_approved,requires_clinical_review) VALUES($1,'Synthetic addon','addon',9900,true,true,false)",[sku]);
  const reservation=await client.query('SELECT * FROM orange_app.reserve_checkout_order($1,$2,$3,$4)',[m.rows[0].id,sku,1,9900]);
  const order=reservation.rows[0].id;
  const attached=await client.query('SELECT orange_app.attach_checkout_session($1,$2,$3) AS attached',[order,m.rows[0].id,session]);
  assert.equal(attached.rows[0].attached,true);
  const handler=createStripeWebhookHandler({secret,execute:(sql,values)=>client.query(sql,values),expectedLivemode:false});
  assert.equal((await handler(sign('evt_'+nonce.slice(0,20)))).status,200);
  assert.equal((await handler(sign('evt_'+nonce.slice(0,20)))).status,200);
  assert.equal((await handler(sign('evt_'+nonce.slice(0,19)+'x'))).status,200);
  // A PostgreSQL exception aborts the current transaction until we roll back
  // to a savepoint; otherwise later assertions fail for the wrong reason.
  await client.query('SAVEPOINT before_rejected_payment');
  assert.equal((await handler(sign('evt_'+nonce.slice(0,19)+'y',9800))).status,503);
  await client.query('ROLLBACK TO SAVEPOINT before_rejected_payment');
  await client.query('RELEASE SAVEPOINT before_rejected_payment');
  const altered=sign('evt_'+nonce.slice(0,19)+'z');
  assert.equal((await handler({...altered,rawBody:altered.rawBody+' '})).status,400);
  const counts=await client.query("SELECT (SELECT count(*)::int FROM orange_app.payment_events WHERE order_id=$1) AS events,(SELECT count(*)::int FROM orange_app.benefit_grants WHERE order_item_id IN (SELECT id FROM orange_app.order_items WHERE order_id=$1)) AS grants,(SELECT count(*)::int FROM orange_app.audit_events WHERE action='checkout.paid' AND target_id=$1) AS audits",[order]);
  assert.deepEqual(counts.rows[0],{events:1,grants:1,audits:1});
 }finally{
  try{
   await client.query('ROLLBACK');
   // Verify that synthetic members, catalog and payment records did not persist.
   const remaining=await client.query("SELECT (SELECT count(*)::int FROM orange_app.members WHERE auth_subject=$1) AS members,(SELECT count(*)::int FROM orange_app.catalog_items WHERE sku=$2) AS catalog,(SELECT count(*)::int FROM orange_app.payment_events WHERE event_id=$3) AS payments",[memberSubject,sku,'evt_'+nonce.slice(0,20)]);
   assert.deepEqual(remaining.rows[0],{members:0,catalog:0,payments:0});
  }finally{await client.end();}
 }
});
