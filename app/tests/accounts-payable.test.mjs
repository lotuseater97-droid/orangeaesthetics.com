import test from "node:test";
import assert from "node:assert/strict";
import {summarizeAccountsPayable as summarize} from "../lib/accounts-payable.mjs";
const invoice={id:"i1",organization_id:"org",vendor_id:"v1",amount_cents:1000,status:"open"};
const payment={id:"p1",organization_id:"org",vendor_id:"v1",invoice_id:"i1",amount_cents:300,status:"settled"};
const run=(invoices=[invoice],payments=[payment])=>summarize({organization_id:"org",invoices,payments});
test("partial settled payments reduce balance, pending and failed do not",()=>{
 const r=run([invoice],[payment,{...payment,id:"p2",status:"pending"},{...payment,id:"p3",status:"failed"}]);
 assert.equal(r.total_balance_cents,700);assert.equal(r.vendors[0].paid_cents,300);assert.equal(r.vendors[0].open_count,1);
});
test("fully settled invoice has no outstanding balance",()=>assert.equal(run([invoice],[{...payment,amount_cents:1000}]).vendors[0].open_count,0));
test("rejects duplicate and cross-tenant records",()=>{
 assert.throws(()=>run([invoice,invoice]));assert.throws(()=>run([invoice],[payment,payment]));assert.throws(()=>run([invoice],[{...payment,organization_id:"other"}]));assert.throws(()=>run([invoice],[{...payment,vendor_id:"other"}]));
});
test("rejects overpayment, orphan payment and settlement on void invoice",()=>{
 assert.throws(()=>run([invoice],[{...payment,amount_cents:1001}]));assert.throws(()=>run([]));assert.throws(()=>run([{...invoice,status:"void"}]));assert.equal(run([{...invoice,status:"void"}],[]).total_balance_cents,0);
});
test("rejects unsafe aggregate balances",()=>assert.throws(()=>run([{...invoice,amount_cents:Number.MAX_SAFE_INTEGER},{...invoice,id:"i2"}],[]),RangeError));
