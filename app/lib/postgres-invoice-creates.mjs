// Transaction-scoped invoice header and immutable line snapshots.
import {BusinessError} from "./business-api.mjs";
import {createInvoicePricing} from "./invoice-pricing.mjs";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function createPostgresInvoiceCreateAdapter({query}){
 if(typeof query!=="function")throw new TypeError("Transaction-scoped query required");
 const price=createInvoicePricing({query});
 return Object.freeze({async createInvoice(prepared){
  if(prepared?.operation!=="create"||prepared.kind!=="invoice")throw new BusinessError("VALIDATION","Invalid invoice operation");
  const org=prepared.identity?.organization_id,data=prepared.data;
  if(!uuid.test(org||"")||!data||!uuid.test(data.customer_id||"")||data.currency!=="USD"||Object.keys(data).some(k=>!["customer_id","currency","line_items","due_on"].includes(k)))throw new BusinessError("VALIDATION","Invalid invoice");
  const due=data.due_on??null;
  if(due!==null&&!/^\d{4}-\d{2}-\d{2}$/.test(due))throw new BusinessError("VALIDATION","Invalid invoice due date");
  const priced=await price({organization_id:org,line_items:data.line_items});
  const header=await query("INSERT INTO public.oa_invoices (organization_id,contact_id,status,currency,total_cents,balance_cents,due_at) VALUES ($1,$2,'draft','USD',$3,$3,$4::date) RETURNING id,organization_id,status,total_cents,balance_cents,currency",[org,data.customer_id,priced.total_cents,due]);
  if(!header||!Array.isArray(header.rows)||header.rows.length!==1||!uuid.test(header.rows[0]?.id||"")||header.rows[0].organization_id!==org||header.rows[0].status!=="draft"||Number(header.rows[0].total_cents)!==priced.total_cents||Number(header.rows[0].balance_cents)!==priced.total_cents)throw new BusinessError("INTERNAL","Invoice header persistence failed");
  const invoice=header.rows[0];
  for(let i=0;i<priced.items.length;i++){
   const item=priced.items[i];
   const inserted=await query("INSERT INTO public.oa_invoice_lines (organization_id,invoice_id,line_number,service_code,description,quantity,unit_price_cents,total_cents) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",[org,invoice.id,i+1,item.code,item.description,item.quantity,item.unit_price_cents,item.total_cents]);
   if(!inserted||!Array.isArray(inserted.rows)||inserted.rows.length!==1||!uuid.test(inserted.rows[0]?.id||""))throw new BusinessError("INTERNAL","Invoice line persistence failed");
  }
  return {id:invoice.id,organization_id:org,status:"draft",currency:"USD",total_cents:priced.total_cents,balance_cents:priced.total_cents};
 }});
}
