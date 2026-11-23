import test from "node:test";
import assert from "node:assert/strict";
import {createNeonCatalogLoader} from "../lib/neon-catalog-loader.mjs";
test("does not approve service items even if database unexpectedly returns them",async()=>{
 const load=createNeonCatalogLoader({approvedSkus:["service_1","addon_1"],query:async()=>({rows:[
  {sku:"service_1",kind:"service",active:true,price_cents:"10000"},
  {sku:"addon_1",kind:"addon",active:true,checkout_approved:true,requires_clinical_review:false,price_cents:"2500"}
 ]})});
 const catalog=await load();assert.deepEqual(catalog.items.map(x=>x.code),["addon_1"]);
});
test("empty allowlist prevents database access",async()=>{
 const load=createNeonCatalogLoader({query:async()=>{throw Error("Unexpected query")}});
 assert.equal((await load()).status,"disabled");
});
test("inactive, unlisted and invalid prices are rejected",async()=>{
 const load=createNeonCatalogLoader({approvedSkus:["addon_1"],query:async()=>({rows:[
  {sku:"addon_1",kind:"addon",active:false,price_cents:"2500"},
  {sku:"addon_2",kind:"addon",active:true,checkout_approved:true,requires_clinical_review:false,price_cents:"2500"},
  {sku:"addon_1",kind:"addon",active:true,checkout_approved:true,requires_clinical_review:false,price_cents:"NaN"}
 ]})});
 assert.equal((await load()).items.length,0);
});

test("catalog excludes prices exceeding the maximum checkout total",async()=>{
 const load=createNeonCatalogLoader({approvedSkus:["addon_1","addon_2"],query:async()=>({rows:[
  {sku:"addon_1",kind:"addon",active:true,checkout_approved:true,requires_clinical_review:false,price_cents:"100000000"},
  {sku:"addon_2",kind:"addon",active:true,checkout_approved:true,requires_clinical_review:false,price_cents:"99999999"}
 ]})});
 const catalog=await load();
 assert.deepEqual(catalog.items.map(x=>x.code),["addon_2"]);
});
