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
test("rejects newline injection",async()=>{const res=await onRequestPost({request:request({...base,name:"Jane\\nCc: someone"}),env});assert.equal(res.status,400)});
test("rejects mismatched origin",async()=>{const res=await onRequestPost({request:request(base,{origin:"https://evil.example"}),env});assert.equal(res.status,403)});
test("fails closed without provider configuration",async()=>{const res=await onRequestPost({request:request(base),env:{}});assert.equal(res.status,503)});
test("rejects insecure notification destination",async()=>{const res=await onRequestPost({request:request(base),env:{...env,APPOINTMENT_NOTIFICATION_ENDPOINT:"http://notifications.example.test"}});assert.equal(res.status,503)});
test("returns delivery error without claiming receipt",async()=>{await withFetch(async()=>new Response("",{status:500}),async()=>{const res=await onRequestPost({request:request(base),env});assert.equal(res.status,502)})});
