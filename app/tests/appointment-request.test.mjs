import test from "node:test";
import assert from "node:assert/strict";
import {onRequestPost} from "../../functions/api/appointment-request.js";
const endpoint="https://notifications.example.test/submit";
const env={APPOINTMENT_NOTIFICATION_ENDPOINT:endpoint,APPOINTMENT_NOTIFICATION_TOKEN:"test-secret"};
const base={name:"Jane Example",email:"jane@example.com",phone:"7145550101",service:"IV wellness",website:""};
const request=(data,headers={})=>new Request("https://orangeaesthetics.com/api/appointment-request",{method:"POST",headers:{"content-type":"application/json",origin:"https://orangeaesthetics.com",...headers},body:JSON.stringify(data)});
async function withFetch(mock,fn){const previous=globalThis.fetch;globalThis.fetch=mock;try{return await fn()}finally{globalThis.fetch=previous}}
test("accepts a valid contact-only request and forwards only allowed fields",async()=>{let sent;await withFetch(async(_url,options)=>{sent=JSON.parse(options.body);return new Response("",{status:200})},async()=>{const res=await onRequestPost({request:request(base),env});assert.equal(res.status,200)});assert.equal(sent.email,base.email);assert.equal(sent.service,base.service);assert.equal(Object.hasOwn(sent,"website"),false)});
test("rejects extra fields including medical notes",async()=>{const res=await onRequestPost({request:request({...base,medicalHistory:"private"}),env});assert.equal(res.status,400)});
test("rejects invalid email",async()=>{const res=await onRequestPost({request:request({...base,email:"not-an-email"}),env});assert.equal(res.status,400)});
test("rejects newline injection",async()=>{const res=await onRequestPost({request:request({...base,name:"Jane\nCc: someone"}),env});assert.equal(res.status,400)});
test("rejects unsafe control and bidirectional characters",async()=>{
  for(const [field,value] of [["name","Jane\tExample"],["name","Jane\u0000Example"],["email","jane\u202E@example.com"],["phone","714\u20665550101"]]){
    const res=await onRequestPost({request:request({...base,[field]:value}),env});
    assert.equal(res.status,400,field+" should reject unsafe characters");
  }
});
test("rejects mismatched origin",async()=>{const res=await onRequestPost({request:request(base,{origin:"https://evil.example"}),env});assert.equal(res.status,403)});
test("rejects cross-site browser fetch metadata even without an Origin header",async()=>{
  for(const site of ["cross-site","same-site","unexpected"]){
    const res=await onRequestPost({request:request(base,{"sec-fetch-site":site,origin:""}),env});
    assert.equal(res.status,403,site);
  }
  await withFetch(async()=>new Response("",{status:202}),async()=>{
    const res=await onRequestPost({request:request(base,{"sec-fetch-site":"same-origin"}),env});
    assert.equal(res.status,200);
  });
});
test("fails closed without provider configuration",async()=>{const res=await onRequestPost({request:request(base),env:{}});assert.equal(res.status,503)});
test("fails closed for missing, blank, or malformed notification credentials",async()=>{
  for(const override of [
    {APPOINTMENT_NOTIFICATION_TOKEN:""},
    {APPOINTMENT_NOTIFICATION_TOKEN:"   "},
    {APPOINTMENT_NOTIFICATION_TOKEN:"bad\nheader"},
    {APPOINTMENT_NOTIFICATION_TOKEN:123},
    {APPOINTMENT_NOTIFICATION_ENDPOINT:"   "}
  ]){
    const res=await onRequestPost({request:request(base),env:{...env,...override}});
    assert.equal(res.status,503);
  }
});
test("rejects insecure notification destination",async()=>{const res=await onRequestPost({request:request(base),env:{...env,APPOINTMENT_NOTIFICATION_ENDPOINT:"http://notifications.example.test"}});assert.equal(res.status,503)});
test("rejects notification destinations with query tokens, fragments, or IP hosts",async()=>{
  for(const destination of [
    "https://notifications.example.test/submit?token=secret",
    "https://notifications.example.test/submit#fragment",
    "https://127.0.0.1/submit",
    "https://[::1]/submit",
    "https://localhost/submit"
  ]){
    const res=await onRequestPost({request:request(base),env:{...env,APPOINTMENT_NOTIFICATION_ENDPOINT:destination}});
    assert.equal(res.status,503,destination);
  }
});
test("returns delivery error without claiming receipt",async()=>{await withFetch(async()=>new Response("",{status:500}),async()=>{const res=await onRequestPost({request:request(base),env});assert.equal(res.status,502)})});

test("notification forwarding uses bearer authorization and blocks redirects",async()=>{
  let observed;
  await withFetch(async(url,options)=>{
    observed={url,options};
    return new Response("",{status:307,headers:{location:"https://untrusted.example.test/receive"}});
  },async()=>{
    const res=await onRequestPost({request:request(base),env});
    assert.equal(res.status,502,"a redirect must not count as successful delivery");
  });
  assert.equal(observed.url,endpoint);
  assert.equal(observed.options.redirect,"error");
  assert.equal(observed.options.headers.authorization,"Bearer test-secret");
  assert.equal(observed.options.headers["content-type"],"application/json");
  assert.equal(JSON.parse(observed.options.body).source,"Orange Aesthetics appointment request");
});
test("provider acceptance status 202 is treated as receipt, not confirmed booking",async()=>{
  await withFetch(async()=>new Response("",{status:202}),async()=>{
    const res=await onRequestPost({request:request(base),env});
    assert.equal(res.status,200);
    assert.deepEqual(await res.json(),{message:"Received"});
  });
});
test("provider timeout or network failure does not claim receipt",async()=>{
  await withFetch(async()=>{throw new Error("network unavailable")},async()=>{
    const res=await onRequestPost({request:request(base),env});
    assert.equal(res.status,502);
    assert.deepEqual(await res.json(),{message:"Delivery unavailable"});
  });
});

test("invalid requests are rejected even when notification service is unconfigured",async()=>{
  assert.equal((await onRequestPost({request:request(base,{"content-type":"text/plain"}),env:{}})).status,415);
  assert.equal((await onRequestPost({request:request(base,{origin:"https://untrusted.example"}),env:{}})).status,403);
  assert.equal((await onRequestPost({request:new Request("https://orangeaesthetics.com/api/appointment-request",{method:"POST",headers:{"content-type":"application/json"},body:"{invalid"}),env:{}})).status,400);
  assert.equal((await onRequestPost({request:request(base),env:{}})).status,503);
});
