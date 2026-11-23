// Server-owned invoice pricing: never accept client-supplied prices or totals.
import {BusinessError} from "./business-api.mjs";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function createInvoicePricing({query}){
 if(typeof query!=="function")throw new TypeError("Trusted transaction query required");
 return async function priceInvoice({organization_id,line_items}){
  if(!uuid.test(organization_id||"")||!Array.isArray(line_items)||line_items.length<1||line_items.length>50)throw new BusinessError("VALIDATION","Invalid invoice items");
  if(line_items.some(item=>!item||typeof item.code!=="string"||!/^[A-Za-z0-9_-]{1,64}$/.test(item.code)||!Number.isSafeInteger(item.quantity)||item.quantity<1||item.quantity>100))throw new BusinessError("VALIDATION","Invalid invoice item");
  const codes=[...new Set(line_items.map(x=>x.code))];
  const result=await query("SELECT code,description,unit_price_cents FROM public.oa_service_prices WHERE organization_id=$1 AND code = ANY($2::text[]) AND active=TRUE FOR SHARE",[organization_id,codes]);
  if(!result||!Array.isArray(result.rows)||result.rows.length!==codes.length)throw new BusinessError("VALIDATION","Unknown or inactive invoice item");
  const prices=new Map();
  for(const row of result.rows){
   const cents=typeof row.unit_price_cents==="string"?Number(row.unit_price_cents):row.unit_price_cents;
   if(!codes.includes(row.code)||prices.has(row.code)||typeof row.description!=="string"||!row.description.trim()||!Number.isSafeInteger(cents)||cents<0)throw new BusinessError("INTERNAL","Invalid catalog price");
   prices.set(row.code,{description:row.description,unit_price_cents:cents});
  }
  const items=line_items.map(item=>{
   const p=prices.get(item.code);
   if(!p)throw new BusinessError("VALIDATION","Invoice item unavailable");
   const total=p.unit_price_cents*item.quantity;
   if(!Number.isSafeInteger(total))throw new BusinessError("VALIDATION","Invoice total exceeds safe range");
   return {code:item.code,description:p.description,quantity:item.quantity,unit_price_cents:p.unit_price_cents,total_cents:total};
  });
  const total_cents=items.reduce((sum,item)=>sum+item.total_cents,0);
  if(!Number.isSafeInteger(total_cents))throw new BusinessError("VALIDATION","Invoice total exceeds safe range");
  return Object.freeze({currency:"USD",total_cents,items});
 };
}
