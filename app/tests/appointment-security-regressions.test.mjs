import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestPost} from '../../functions/api/appointment-request.js';

const env={APPOINTMENT_NOTIFICATION_ENDPOINT:'https://notify.example.test/submit',APPOINTMENT_NOTIFICATION_TOKEN:'test'};
const url='https://orangeaesthetics.com/api/appointment-request';
const valid={name:'Jane Example',email:'jane@example.com',phone:'7145550101',service:'IV wellness',website:''};
function req(body,headers={}) {return new Request(url,{method:'POST',headers:{'content-type':'application/json',...headers},body});}
test('rejects invalid JSON media types',async()=>{
  for(const type of ['application/jsonp','application/json; charset=iso-8859-1','text/json']){
    assert.equal((await onRequestPost({request:req(JSON.stringify(valid),{'content-type':type}),env})).status,415,type);
  }
});
test('rejects invalid content lengths',async()=>{
  for(const value of ['-1','abc','Infinity','4097']){
    const status=(await onRequestPost({request:req(JSON.stringify(valid),{'content-length':value}),env})).status;
    assert.equal(status,value==='4097'?413:400,value);
  }
});
test('rejects malformed UTF-8 bytes',async()=>{
  const response=await onRequestPost({request:req(new Uint8Array([0x7b,0xff,0x7d])),env});
  assert.equal(response.status,400);
});
test('rejects a nonstring honeypot field',async()=>{
  const response=await onRequestPost({request:req(JSON.stringify({...valid,website:{}})),env});
  assert.equal(response.status,400);
});
test('stops reading oversized streamed bodies',async()=>{
  let reads=0;
  const stream=new ReadableStream({pull(controller){reads++;controller.enqueue(new Uint8Array(3000));if(reads>5)controller.close();}});
  const request=new Request(url,{method:'POST',headers:{'content-type':'application/json'},body:stream,duplex:'half'});
  const response=await onRequestPost({request,env});
  assert.equal(response.status,413);
  assert.ok(reads<6,'oversized input should not be fully consumed');
});


test('appointment API error responses include browser security headers',async()=>{
  const response=await onRequestPost({request:req('{not json'),env});
  assert.equal(response.status,400);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  assert.equal(response.headers.get('referrer-policy'),'strict-origin-when-cross-origin');
  assert.equal(response.headers.get('x-frame-options'),'DENY');
});
