import test from "node:test";
import assert from "node:assert/strict";
import {summarizeVendorPurchases} from "../lib/vendor-purchase-report.mjs";
const row=(id,status="approved",org="a",total=100)=>({request:{id,status,organization_id:org,vendor_id:"vendor",total_cents:total},report:{purchase_id:id,approval_satisfied:true,received_cents:60,invoiced_cents:50,ready_for_payment:false}});
test("aggregates approved commitments separately from pending requests",()=>{
 const [v]=summarizeVendorPurchases([row("1"),row("2","submitted"),row("3","cancelled")]);
 assert.equal(v.committed_cents,100);assert.equal(v.pending_cents,100);assert.equal(v.received_cents,60);assert.equal(v.invoiced_cents,50);assert.equal(v.unreceived_cents,40);assert.equal(v.order_count,1);
});
test("keeps organizations separate",()=>assert.equal(summarizeVendorPurchases([row("1"),row("2","approved","b")]).length,2));
test("rejects duplicates and unsafe totals",()=>{
 assert.throws(()=>summarizeVendorPurchases([row("1"),row("1")]));
 assert.throws(()=>summarizeVendorPurchases([row("1","approved","a",Number.MAX_SAFE_INTEGER),row("2")]),RangeError);
});
test("excludes unapproved commitments and counts ready review",()=>{
 const a=row("1");a.report.approval_satisfied=false;
 const b=row("2");b.report.ready_for_payment=true;b.report.received_cents=100;b.report.invoiced_cents=100;
 const [v]=summarizeVendorPurchases([a,b]);assert.equal(v.committed_cents,100);assert.equal(v.ready_review_cents,100);
});
