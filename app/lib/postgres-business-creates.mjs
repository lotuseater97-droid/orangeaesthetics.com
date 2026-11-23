// Schema-aligned expense creation. Invoices require priced line-item infrastructure.
import {BusinessError} from "./business-api.mjs";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const date=/^\d{4}-\d{2}-\d{2}$/;
export function createPostgresBusinessCreateAdapter({query}){
 if(typeof query!=="function")throw new TypeError("Transaction-scoped query required");
 return Object.freeze({async create(prepared){
  if(prepared?.operation!=="create"||prepared.kind!=="expense")throw new BusinessError("VALIDATION","Only schema-aligned expense creation is enabled");
  const org=prepared.identity?.organization_id,data=prepared.data;
  if(!uuid.test(org||"")||!data||!uuid.test(data.vendor_id||"")||typeof data.category!=="string"||!data.category.trim()||data.category.length>250||!Number.isSafeInteger(data.amount_cents)||data.amount_cents<0||!date.test(data.incurred_on||"")||Object.keys(data).some(k=>!["vendor_id","category","amount_cents","incurred_on"].includes(k)))throw new BusinessError("VALIDATION","Invalid schema-aligned expense");
  const result=await query("INSERT INTO public.oa_expenses (organization_id,vendor_id,category,amount_cents,incurred_on,status) VALUES ($1,$2,$3,$4,$5,'draft') RETURNING id,organization_id,status",[org,data.vendor_id,data.category,data.amount_cents,data.incurred_on]);
  if(!result||!Array.isArray(result.rows)||result.rows.length!==1||!uuid.test(result.rows[0]?.id||"")||result.rows[0].organization_id!==org)throw new BusinessError("INTERNAL","Expense insert failed");
  return result.rows[0];
 }});
}
