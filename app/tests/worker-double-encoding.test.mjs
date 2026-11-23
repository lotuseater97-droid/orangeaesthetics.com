import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../worker.mjs';

test('double-encoded internal paths never reach asset storage', async () => {
  let assetCalls = 0;
  const env = {ASSETS: {fetch: async () => { assetCalls++; return new Response('asset'); }}};
  for (const path of [
    '/%2561pp/schema.sql',
    '/app%252Fconfig.js',
    '/%252egithub/workflows/static-audit.yml',
    '/%2577orker.mjs',
    '/index%252ehtml',
    '/index%ZZ.html'
  ]) {
    const response = await worker.fetch(new Request('https://orangeaesthetics.com' + path), env);
    assert.ok([400,404].includes(response.status), `${path}: ${response.status}`);
  }
  assert.equal(assetCalls, 0);
});

test('ordinary public asset requests still pass', async () => {
  let calls=0;
  const env={ASSETS:{fetch:async()=>{calls++;return new Response('ok')}}};
  assert.equal((await worker.fetch(new Request('https://orangeaesthetics.com/index.html'),env)).status,200);
  assert.equal(calls,1);
});
