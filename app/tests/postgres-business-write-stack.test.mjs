import test from "node:test";import assert from "node:assert/strict";import {createPostgresBusinessWriteStack} from "../lib/postgres-business-write-stack.mjs";
const org="123e4567-e89b-42d3-a456-426614174000",user="123e4567-e89b-42d3-a456-426614174001",id="123e4567-e89b-42d3-a456-426614174002",key="expense_transition_001";
function setup({failAudit=false,existingClaim=false,otherOrg=false}={}){
 const calls=[];let released=0;
 const pool={connect:async()=>({query:async(text,values)=>{
  calls.push({text,values});
  if(text==="BEGIN"||text==="COMMIT"||text==="ROLLBACK"||text==="SELECT set_config($1,$2,true)")return {rows:[]};
  if(text.includes("INSERT INTO public.oa_idempotency_keys"))return {rows:existingClaim?[]:[{id}]};
  if(text.includes("SELECT request_hash AS fingerprint"))return {rows:[]};
  if(text.includes("FOR UPDATE"))return {rows:[{id,organization_id:otherOrg?"123e4567-e89b-42d3-a456-426614174999":org,status:"submitted"}]};
  if(text.includes("FROM public.oa_service_prices"))return {rows:[{code:"hydration",description:"Hydration",unit_price_cents:"5000"}]};
  if(text.includes("INSERT INTO public.oa_invoices"))return {rows:[{id,organization_id:org,status:"draft",total_cents:"10000",balance_cents:"10000"}]};
  if(text.includes("INSERT INTO public.oa_invoice_lines"))return {rows:[{id}]};
  if(text.includes("INSERT INTO public.oa_expenses"))return {rows:[{id,organization_id:org,status:"draft"}]};
  if(text.includes("UPDATE public.oa_expenses"))return {rows:[{id,organization_id:org,status:"approved"}]};
  if(text.includes("INSERT INTO public.oa_audit_events")){if(failAudit)throw Error("audit failure");return {rows:[{id}]}};
  if(text.includes("UPDATE public.oa_idempotency_keys"))return {rows:[{id}]};
  throw Error("Unexpected SQL: "+text);
 },release:()=>{released++}})};
 const service=createPostgresBusinessWriteStack({pool,verifySession:async()=>({active:true,user_id:user,organization_id:org}),queryMembership:async()=>({rows:[{active:true,organization_id:org,role:"owner"}]})});
 return {service,calls,get released(){return released}};
}
test("financial transition atomically claims, locks, updates, audits and finalizes",async()=>{
 const f=setup();const result=await f.service.transition({token:"verified_session_123",kind:"expense",id,to:"approved",idempotency_key:key});
 assert.equal(result.status,"approved");
 assert.deepEqual(f.calls.map(x=>x.text==="BEGIN"?"BEGIN":x.text==="COMMIT"?"COMMIT":x.text.startsWith("SELECT set_config(")?"timeout":x.text.includes("INSERT INTO public.oa_idempotency_keys")?"claim":x.text.includes("FOR UPDATE")?"lock":x.text.includes("UPDATE public.oa_expenses")?"update":x.text.includes("INSERT INTO public.oa_audit_events")?"audit":x.text.includes("UPDATE public.oa_idempotency_keys")?"finish":"other"),["BEGIN","timeout","claim","lock","update","audit","finish","COMMIT"]);
 assert.equal(f.released,1);
});
test("audit failure rolls back financial mutation and idempotency",async()=>{
 const f=setup({failAudit:true});await assert.rejects(()=>f.service.transition({token:"verified_session_123",kind:"expense",id,to:"approved",idempotency_key:key}),/audit failure/);
 assert.equal(f.calls.at(-1).text,"ROLLBACK");assert.equal(f.calls.some(x=>x.text==="COMMIT"),false);assert.equal(f.released,1);
});
test("cross-organization record is denied and transaction rolls back",async()=>{
 const f=setup({otherOrg:true});await assert.rejects(()=>f.service.transition({token:"verified_session_123",kind:"expense",id,to:"approved",idempotency_key:key}),{code:"NOT_FOUND"});
 assert.equal(f.calls.at(-1).text,"ROLLBACK");assert.equal(f.calls.some(x=>x.text.includes("UPDATE public.oa_expenses")),false);
});
test("incomplete competing idempotency record rolls back",async()=>{
 const f=setup({existingClaim:true});await assert.rejects(()=>f.service.transition({token:"verified_session_123",kind:"expense",id,to:"approved",idempotency_key:key}),{code:"CONFLICT"});
 assert.equal(f.calls.at(-1).text,"ROLLBACK");
});

test("expense creation claims, inserts, audits and finalizes atomically",async()=>{
 const f=setup();
 const result=await f.service.createExpense({token:"verified_session_123",payload:{vendor_id:id,category:"supplies",amount_cents:2500,incurred_on:"2026-11-22"},idempotency_key:"expense_creation_001"});
 assert.equal(result.status,"draft");
 const steps=f.calls.map(x=>x.text);
 assert.equal(steps[0],"BEGIN");assert.equal(steps.at(-1),"COMMIT");
 assert.ok(steps.findIndex(x=>x.includes("INSERT INTO public.oa_idempotency_keys"))<steps.findIndex(x=>x.includes("INSERT INTO public.oa_expenses")));
 assert.ok(steps.findIndex(x=>x.includes("INSERT INTO public.oa_expenses"))<steps.findIndex(x=>x.includes("INSERT INTO public.oa_audit_events")));
});
test("expense creation rejects unsupported memo and rolls back",async()=>{
 const f=setup();
 await assert.rejects(()=>f.service.createExpense({token:"verified_session_123",payload:{vendor_id:id,category:"supplies",amount_cents:2500,incurred_on:"2026-11-22",memo:"not in schema"},idempotency_key:"expense_creation_002"}),{code:"VALIDATION"});
 assert.equal(f.calls.at(-1).text,"ROLLBACK");
 assert.equal(f.calls.some(x=>x.text.includes("INSERT INTO public.oa_expenses")),false);
});

test("invoice creation atomically claims, prices, inserts header and lines, audits, finalizes",async()=>{
 const f=setup();
 const result=await f.service.createInvoice({token:"verified_session_123",payload:{customer_id:id,currency:"USD",line_items:[{code:"hydration",quantity:2}],due_on:"2026-12-01"},idempotency_key:"invoice_creation_001"});
 assert.equal(result.total_cents,10000);
 const texts=f.calls.map(x=>x.text);
 assert.equal(texts[0],"BEGIN");assert.equal(texts.at(-1),"COMMIT");
 const index=part=>texts.findIndex(x=>x.includes(part));
 assert.ok(index("INSERT INTO public.oa_idempotency_keys")<index("FROM public.oa_service_prices"));
 assert.ok(index("FROM public.oa_service_prices")<index("INSERT INTO public.oa_invoices"));
 assert.ok(index("INSERT INTO public.oa_invoices")<index("INSERT INTO public.oa_invoice_lines"));
 assert.ok(index("INSERT INTO public.oa_invoice_lines")<index("INSERT INTO public.oa_audit_events"));
 assert.ok(index("INSERT INTO public.oa_audit_events")<index("UPDATE public.oa_idempotency_keys"));
});
