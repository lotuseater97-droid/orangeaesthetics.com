import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../worker.mjs';
const env={ASSETS:{fetch:async()=>new Response('asset')}};
for(const [path,method,allow] of [
  ['/api/appointment-request','GET','POST'],
  ['/index.html','POST','GET, HEAD']
]){
  test(`405 response for ${method} ${path} includes security headers`,async()=>{
    const response=await worker.fetch(new Request('https://orangeaesthetics.com'+path,{method}),env);
    assert.equal(response.status,405);
    assert.equal(response.headers.get('allow'),allow);
    assert.equal(response.headers.get('cache-control'),'no-store');
    assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  });
}
