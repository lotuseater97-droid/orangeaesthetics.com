import test from "node:test";
import assert from "node:assert/strict";
import {createOwnerCatalogHttpHandler} from "../lib/owner-catalog-http-handler.mjs";
const origin="https://orangeaesthetics.com";
const payload={itemId:"00000000-0000-4000-8000-000000000001",approved:true,requiresClinicalReview:false,requestId:"request-123"};
const request=(body=payload,overrides={})=>({method:"POST",headers:{origin,"content-type":"application/json",authorization:"Bearer synthetic"},rawBody:JSON.stringify(body),...overrides});
test("disabled endpoint refuses all requests",async()=>{
 const handle=createOwnerCatalogHttpHandler({origin,approveCatalog:async()=>{throw Error("should not call")}});
 assert.equal((await handle(request())).status,503);
});
test("valid request delegates to trusted owner adapter without client identity",async()=>{
 let received;
 const handle=createOwnerCatalogHttpHandler({origin,enabled:true,approveCatalog:async args=>{received=args;return {applied:true}}});
 const response=await handle(request());
 assert.equal(response.status,200);
 assert.deepEqual(received.itemId,payload.itemId);
 assert.equal(received.headers.authorization,"Bearer synthetic");
 assert.equal(received.approved,true);
 assert.equal(received.requiresClinicalReview,false);
});
test("rejects method, origin, type, malformed JSON and extraneous fields",async()=>{
 let calls=0;
 const handle=createOwnerCatalogHttpHandler({origin,enabled:true,approveCatalog:async()=>{calls++}});
 const bad=[
  request(payload,{method:"GET"}),
  request(payload,{headers:{origin:"https://evil.example","content-type":"application/json"}}),
  request(payload,{headers:{origin,"content-type":"text/plain"}}),
  request(payload,{rawBody:"{"}),
  request({...payload,actorSubject:"forged"}),
  request({...payload,approved:"true"}),
  request(payload,{rawBody:"x".repeat(2049)})
 ];
 for(const input of bad)assert.notEqual((await handle(input)).status,200);
 assert.equal(calls,0);
});
test("owner verification failure denies request without leaking errors",async()=>{
 const handle=createOwnerCatalogHttpHandler({origin,enabled:true,approveCatalog:async()=>{throw Error("private database detail")}});
 const response=await handle(request());
 assert.equal(response.status,403);
 assert.doesNotMatch(response.body,/private database detail/);
});
