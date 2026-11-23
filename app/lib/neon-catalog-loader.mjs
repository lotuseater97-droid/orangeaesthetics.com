// Server-owned allowlist. Medical services are NOT auto-approved for online checkout.
// Only explicitly approved nonclinical add-ons may be exposed in test checkout.
export function createNeonCatalogLoader({query,approvedSkus=[]}={}){
 if(typeof query!=="function"||!Array.isArray(approvedSkus))throw new TypeError("Catalog configuration required");
 const allowed=new Set(approvedSkus.filter(x=>typeof x==="string"&&/^[a-z0-9_]{3,80}$/.test(x)));
 return async function loadCatalog(){
  if(allowed.size===0)return {status:"disabled",items:[]};
  const result=await query("SELECT sku,price_cents,active,kind FROM orange_app.catalog_items WHERE active=true AND kind='addon' AND sku=ANY($1::text[])",[[...allowed]]);
  const items=(result?.rows??[]).filter(x=>allowed.has(x.sku)&&x.kind==="addon"&&x.active===true&&Number.isSafeInteger(Number(x.price_cents))&&Number(x.price_cents)>0)
   .map(x=>({code:x.sku,price_cents:Number(x.price_cents),active:true,payment_eligible:true,requires_clinical_review:false,currency:"usd"}));
  return {status:"approved",items};
 };
}
