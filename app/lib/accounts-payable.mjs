// Read-only accounts payable projection from authoritative, already scoped records.
// No payment initiation, bank connection, or mutation.
export function summarizeAccountsPayable({organization_id,invoices,payments}){
 const id=x=>typeof x==="string"&&x.trim().length>0;
 const money=x=>Number.isSafeInteger(x)&&x>0;
 const add=(a,b)=>{if(!Number.isSafeInteger(a+b))throw new RangeError("Unsafe payable total");return a+b};
 if(!id(organization_id)||!Array.isArray(invoices)||!Array.isArray(payments))throw new TypeError("Invalid payable input");
 const bills=new Map(),seen=new Set(),vendors=new Map();
 for(const i of invoices){
  if(!i||i.organization_id!==organization_id||!id(i.id)||!id(i.vendor_id)||bills.has(i.id)||!money(i.amount_cents)||!["open","void"].includes(i.status))throw new TypeError("Invalid vendor invoice");
  bills.set(i.id,{...i,paid_cents:0});
 }
 for(const p of payments){
  const bill=p&&bills.get(p.invoice_id);
  if(!bill||p.organization_id!==organization_id||p.vendor_id!==bill.vendor_id||!id(p.id)||seen.has(p.id)||!money(p.amount_cents)||!["pending","failed","settled","void"].includes(p.status))throw new TypeError("Invalid vendor payment");
  seen.add(p.id);
  if(p.status==="settled"){if(bill.status==="void")throw new RangeError("Settled payment on void invoice");bill.paid_cents=add(bill.paid_cents,p.amount_cents)}
 }
 const detail=[];
 for(const b of bills.values()){
  if(b.status==="void")continue;
  if(b.paid_cents>b.amount_cents)throw new RangeError("Vendor invoice overpaid");
  const balance_cents=b.amount_cents-b.paid_cents;
  detail.push({invoice_id:b.id,vendor_id:b.vendor_id,amount_cents:b.amount_cents,paid_cents:b.paid_cents,balance_cents});
  if(!vendors.has(b.vendor_id))vendors.set(b.vendor_id,{vendor_id:b.vendor_id,invoiced_cents:0,paid_cents:0,balance_cents:0,open_count:0});
  const v=vendors.get(b.vendor_id);
  v.invoiced_cents=add(v.invoiced_cents,b.amount_cents);v.paid_cents=add(v.paid_cents,b.paid_cents);v.balance_cents=add(v.balance_cents,balance_cents);v.open_count+=Number(balance_cents>0);
 }
 return {organization_id,invoices:detail,vendors:[...vendors.values()].sort((a,b)=>a.vendor_id.localeCompare(b.vendor_id)),total_balance_cents:detail.reduce((n,b)=>add(n,b.balance_cents),0)};
}
