// Read-only, tenant-scoped reconciliation against the staged payment schema.
// This module never settles a charge, changes invoice status, or issues refunds.
import {BusinessError} from "./business-api.mjs";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const cents=value=>{const n=typeof value==="string"&&/^\d+$/.test(value)?Number(value):value;if(!Number.isSafeInteger(n)||n<0)throw new BusinessError("INTERNAL","Invalid stored money");return n};
export function createPostgresPaymentReconciliation({query}){
 if(typeof query!=="function")throw new TypeError("Trusted server query required");
 return Object.freeze({async inspectInvoice({organization_id,invoice_id}){
  if(!uuid.test(organization_id||"")||!uuid.test(invoice_id||""))throw new BusinessError("VALIDATION","Invalid invoice identity");
  const header=await query("SELECT id,organization_id,status,total_cents,balance_cents FROM public.oa_invoices WHERE organization_id=$1 AND id=$2",[organization_id,invoice_id]);
  if(!header||!Array.isArray(header.rows)||header.rows.length>1)throw new BusinessError("INTERNAL","Invalid invoice response");
  if(header.rows.length===0)throw new BusinessError("NOT_FOUND","Invoice not available");
  const invoice=header.rows[0];
  if(invoice.organization_id!==organization_id||invoice.id!==invoice_id)throw new BusinessError("INTERNAL","Tenant isolation violation");
  const payments=await query("SELECT id,organization_id,invoice_id,status,amount_cents,method,deposited_at FROM public.oa_payments WHERE organization_id=$1 AND invoice_id=$2 ORDER BY created_at,id",[organization_id,invoice_id]);
  if(!payments||!Array.isArray(payments.rows))throw new BusinessError("INTERNAL","Invalid payments response");
  const total=cents(invoice.total_cents),storedBalance=cents(invoice.balance_cents);
  if(storedBalance>total)throw new BusinessError("INTERNAL","Invalid invoice balance");
  let succeeded=0,refunded=0,undeposited=0;
  const seen=new Set(),discrepancies=[];
  for(const p of payments.rows){
   if(!uuid.test(p.id||"")||seen.has(p.id)||p.organization_id!==organization_id||p.invoice_id!==invoice_id)throw new BusinessError("INTERNAL","Payment isolation or identity violation");
   seen.add(p.id);
   const amount=cents(p.amount_cents);
   if(amount===0)throw new BusinessError("INTERNAL","Invalid payment amount");
   if(p.status==="succeeded"){succeeded+=amount;if(["cash","check"].includes(p.method)&&!p.deposited_at)undeposited+=amount}
   else if(p.status==="refunded")refunded+=amount;
   else if(!["pending","failed"].includes(p.status))discrepancies.push("UNKNOWN_PAYMENT_STATUS");
  }
  if(![succeeded,refunded,undeposited].every(Number.isSafeInteger))throw new BusinessError("INTERNAL","Payment totals exceed safe range");
  // Current schema marks a fully refunded payment as refunded rather than preserving
  // its earlier succeeded state. We cannot infer lifetime settlements from this data.
  if(refunded>0)discrepancies.push("REFUND_HISTORY_AMBIGUOUS");
  const expected=total-succeeded;
  if(!Number.isSafeInteger(expected)||expected<0)discrepancies.push("OVERPAID");
  if(refunded===0&&expected!==storedBalance)discrepancies.push("BALANCE_MISMATCH");
  if(invoice.status==="paid"&&storedBalance!==0)discrepancies.push("PAID_WITH_BALANCE");
  if(invoice.status==="draft"&&succeeded>0)discrepancies.push("DRAFT_HAS_SETTLED_PAYMENT");
  return Object.freeze({invoice_id,organization_id,total_cents:total,stored_balance_cents:storedBalance,observed_succeeded_cents:succeeded,observed_refunded_cents:refunded,undeposited_cents:undeposited,payment_count:seen.size,discrepancies,balanced:discrepancies.length===0});
 }});
}
