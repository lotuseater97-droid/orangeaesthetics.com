import test from "node:test";import assert from "node:assert/strict";import {createOwnerReadService} from "../lib/owner-read-service.mjs";
const actor={user_id:"u1",organization_id:"orange",role:"owner"};
const make=(a=actor,rows=[{id:"a1",organization_id:"orange",requested_at:"2026-11-22T09:00:00Z",service_code:"consult",status:"requested",diagnosis:"NEVER RETURN",email:"hidden"}])=>createOwnerReadService({resolveActor:async()=>a,listRecords:async()=>rows});
test("owner sees allowlisted appointment fields only",async()=>{const [row]=await make().list({sessionToken:"valid",collection:"appointments"});assert.deepEqual(row,{id:"a1",requested_at:"2026-11-22T09:00:00Z",service_code:"consult",status:"requested"});assert.equal("diagnosis" in row,false)});
test("unknown collection denied",async()=>assert.rejects(()=>make().list({sessionToken:"valid",collection:"patients"}),{code:"VALIDATION"}));
test("missing actor denied",async()=>assert.rejects(()=>make(null).list({sessionToken:"valid",collection:"appointments"}),{code:"UNAUTHENTICATED"}));
test("MA cannot read financial invoices",async()=>assert.rejects(()=>make({...actor,role:"ma"}).list({sessionToken:"valid",collection:"invoices"}),{code:"FORBIDDEN"}));
test("cross-organization repository leak fails closed",async()=>assert.rejects(()=>make(actor,[{id:"x",organization_id:"other"}]).list({sessionToken:"valid",collection:"appointments"}),{code:"INTERNAL"}));
test("limit validation blocks bulk reads",async()=>assert.rejects(()=>make().list({sessionToken:"valid",collection:"appointments",limit:1000}),{code:"VALIDATION"}));
test("repository cannot return more than requested",async()=>assert.rejects(()=>make(actor,[{id:"a",organization_id:"orange"},{id:"b",organization_id:"orange"}]).list({sessionToken:"valid",collection:"appointments",limit:1}),{code:"INTERNAL"}));
test("owner can view allowlisted financial totals",async()=>{const [row]=await make(actor,[{id:"i1",organization_id:"orange",status:"issued",currency:"USD",total_cents:10000,balance_cents:4000,customer_email:"private"}]).list({sessionToken:"valid",collection:"invoices"});assert.equal(row.balance_cents,4000);assert.equal("customer_email" in row,false)});

test("MA can view only assigned appointments",async()=>{
 const ma={user_id:"staff1",organization_id:"orange",role:"ma"};
 const [row]=await make(ma,[{id:"a1",organization_id:"orange",assigned_to:"staff1",status:"confirmed",service_code:"consult"}]).list({sessionToken:"valid",collection:"appointments"});
 assert.equal(row.id,"a1");assert.equal("assigned_to" in row,false);
});
test("MA cannot view another staff member appointment even if repository leaks it",async()=>{
 const ma={user_id:"staff1",organization_id:"orange",role:"ma"};
 await assert.rejects(()=>make(ma,[{id:"a2",organization_id:"orange",assigned_to:"staff2"}]).list({sessionToken:"valid",collection:"appointments"}),{code:"INTERNAL"});
});
test("clinician cannot view unassigned tasks",async()=>{
 const clinician={user_id:"clin1",organization_id:"orange",role:"clinician"};
 await assert.rejects(()=>make(clinician,[{id:"t1",organization_id:"orange",assigned_to:null}]).list({sessionToken:"valid",collection:"tasks"}),{code:"INTERNAL"});
});
test("manager can read inventory after capability alignment",async()=>{
 const manager={user_id:"manager1",organization_id:"orange",role:"manager"};
 const [row]=await make(manager,[{id:"stock1",organization_id:"orange",sku:"SKU-1",on_hand:5}]).list({sessionToken:"valid",collection:"inventory"});
 assert.equal(row.on_hand,5);
});
