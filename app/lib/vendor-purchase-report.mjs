// Vendor commitments and reconciliation, not accounts payable: payment records are not inputs.
export function summarizeVendorPurchases(rows){
 if(!Array.isArray(rows))throw new TypeError("Expected purchase rows");
 const vendors=new Map(),seen=new Set();
 const add=(row,key,n)=>{if(!Number.isSafeInteger(n)||n<0||!Number.isSafeInteger(row[key]+n))throw new RangeError("Invalid vendor amount");row[key]+=n};
 for(const {request,report} of rows){
  if(!request||!report||typeof request.id!=="string"||!request.id||seen.has(request.id)||typeof request.vendor_id!=="string"||!request.vendor_id||typeof request.organization_id!=="string"||!request.organization_id||report.purchase_id!==request.id)throw new TypeError("Invalid purchase row");
  seen.add(request.id);
  const key=JSON.stringify([request.organization_id,request.vendor_id]);
  if(!vendors.has(key))vendors.set(key,{organization_id:request.organization_id,vendor_id:request.vendor_id,pending_cents:0,committed_cents:0,received_cents:0,invoiced_cents:0,unreceived_cents:0,ready_review_cents:0,order_count:0});
  const v=vendors.get(key);
  if(request.status==="submitted"){add(v,"pending_cents",request.total_cents);continue}
  if(!["approved","ordered","received","invoiced"].includes(request.status)||report.approval_satisfied!==true)continue;
  add(v,"order_count",1);add(v,"committed_cents",request.total_cents);add(v,"received_cents",report.received_cents);add(v,"invoiced_cents",report.invoiced_cents);
  add(v,"unreceived_cents",Math.max(0,request.total_cents-report.received_cents));
  if(report.ready_for_payment===true)add(v,"ready_review_cents",report.invoiced_cents);
 }
 return [...vendors.values()].sort((a,b)=>a.organization_id.localeCompare(b.organization_id)||a.vendor_id.localeCompare(b.vendor_id));
}
