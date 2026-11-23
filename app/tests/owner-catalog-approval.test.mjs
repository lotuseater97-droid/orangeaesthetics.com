import test from "node:test";
import assert from "node:assert/strict";
import {createOwnerCatalogApproval} from "../lib/owner-catalog-approval.mjs";
const id="00000000-0000-4000-8000-000000000001";
test("verified owner can request audited approval",async()=>{
 let params;
 const run=createOwnerCatalogApproval({verifyOwner:async()=>({subject:"oidc|owner1",role:"owner"}),query:async(sql,args)=>{assert.match(sql,/set_catalog_checkout_approval/);params=args;return {rows:[{applied:true}]}}});
 assert.deepEqual(await run({headers:{},itemId:id,approved:true,requiresClinicalReview:false,requestId:"request-123"}),{applied:true});
 assert.deepEqual(params,["oidc|owner1",id,true,false,"request-123"]);
});
test("rejects nonowner before database call",async()=>{
 const run=createOwnerCatalogApproval({verifyOwner:async()=>({subject:"oidc|staff1",role:"staff"}),query:async()=>{throw Error("Database should not be called")}});
 await assert.rejects(run({itemId:id,approved:true,requiresClinicalReview:false,requestId:"request-123"}),/Owner authentication/);
});
test("rejects clinical review approval before database call",async()=>{
 const run=createOwnerCatalogApproval({verifyOwner:async()=>({subject:"oidc|owner1",role:"owner"}),query:async()=>{throw Error("Database should not be called")}});
 await assert.rejects(run({itemId:id,approved:true,requiresClinicalReview:true,requestId:"request-123"}),/Invalid approval/);
});
