import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../worker.mjs';

test('public assets receive browser security headers without losing response metadata',async()=>{
  const env={ASSETS:{fetch:async()=>new Response('sample',{status:200,headers:{'content-type':'text/html; charset=utf-8','cache-control':'public, max-age=60','x-custom':'kept'}})}};
  const response=await worker.fetch(new Request('https://orangeaesthetics.com/index.html'),env);
  assert.equal(response.status,200);
  assert.equal(await response.text(),'sample');
  assert.equal(response.headers.get('content-type'),'text/html; charset=utf-8');
  assert.equal(response.headers.get('cache-control'),'public, max-age=60');
  assert.equal(response.headers.get('x-custom'),'kept');
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  assert.equal(response.headers.get('referrer-policy'),'strict-origin-when-cross-origin');
  assert.equal(response.headers.get('x-frame-options'),'DENY');
});

test('asset not-found responses retain status and gain security headers',async()=>{
  const env={ASSETS:{fetch:async()=>new Response('missing',{status:404})}};
  const response=await worker.fetch(new Request('https://orangeaesthetics.com/nonexistent.html'),env);
  assert.equal(response.status,404);
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
});
