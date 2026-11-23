import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// Unlike source-pattern assertions, these launch the real server entrypoint.
// The expected startup rejection must occur before any database connection.
const entry=fileURLToPath(new URL('../server/index.mjs',import.meta.url));
const approved='postgresql://test:test@ep-young-rain-bfjamlfd.c-5.us-west-2.aws.neon.tech/neondb?sslmode=require';
const base={
 DATABASE_URL:approved,
 STRIPE_WEBHOOK_SECRET:'whsec_synthetic_startup_guard',
 STRIPE_LIVEMODE:'false',
 PORT:'8788',
 HOST:'127.0.0.1'
};
function mustReject(name,overrides,message){
 test(name,()=>{
  const result=spawnSync(process.execPath,[entry],{
   env:{...process.env,...base,...overrides},
   encoding:'utf8',
   timeout:5000
  });
  assert.equal(result.status,1,'startup must reject invalid configuration');
  assert.match(result.stderr,new RegExp(message));
  assert.doesNotMatch(result.stdout,/Development runtime listening/);
 });
}
mustReject('server refuses wildcard network binding',{HOST:'0.0.0.0'},'Development runtime must bind to loopback only');
mustReject('server refuses LAN network binding',{HOST:'192.168.1.10'},'Development runtime must bind to loopback only');
mustReject('server refuses invalid port',{PORT:'not-a-port'},'Invalid development runtime port');
mustReject('server refuses production database hostname',{DATABASE_URL:'postgresql://test:test@production.example.com/neondb'},'Development runtime requires the approved Neon development database');
mustReject('server refuses Neon pooler hostname',{DATABASE_URL:'postgresql://test:test@ep-young-rain-bfjamlfd-pooler.c-5.us-west-2.aws.neon.tech/neondb'},'Development runtime requires the approved Neon development database');
mustReject('server refuses disabled database TLS',{DATABASE_URL:approved.replace('sslmode=require','sslmode=disable')},'Development runtime requires the approved Neon development database');
mustReject('server refuses Stripe live mode',{STRIPE_LIVEMODE:'true'},'Development runtime requires DATABASE_URL');
