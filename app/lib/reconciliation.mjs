// Pure reconciliation checks; not a payment processor or authoritative ledger.
const cents=(v)=>{if(!Number.isSafeInteger(v)||v<0)throw new RangeError("Invalid cents");return v};
export function reconcileInvoices(invoices=[],payments=[]){
 if(!Array.isArray(invoices)||!Array.isArray(payments))throw new TypeError("Expected arrays");
 const byId=new Map();const discrepancies=[];
 for(const invoice of invoices){if(!invoice?.id||byId.has(invoice.id))throw new TypeError("Duplicate or missing invoice ID");cents(invoice.total_cents);cents(invoice.balance_cents);if(invoice.balance_cents>invoice.total_cents)throw new RangeError("Balance exceeds total");byId.set(invoice.id,{invoice,settled:0,refunded:0})}
 const seen=new Set();
 for(const payment of payments){if(!payment?.id||seen.has(payment.id))throw new TypeError("Duplicate or missing payment ID");seen.add(payment.id);cents(payment.amount_cents);const row=byId.get(payment.invoice_id);if(!row){discrepancies.push({code:"ORPHAN_PAYMENT",payment_id:payment.id});continue}if(payment.organization_id!==row.invoice.organization_id){discrepancies.push({code:"CROSS_ORG_PAYMENT",payment_id:payment.id});continue}if(payment.status==="succeeded")row.settled+=payment.amount_cents;else if(payment.status==="refunded")row.refunded+=payment.amount_cents;else if(!["pending","failed"].includes(payment.status))discrepancies.push({code:"UNKNOWN_PAYMENT_STATUS",payment_id:payment.id})}
 for(const {invoice,settled,refunded} of byId.values()){if(refunded>settled)discrepancies.push({code:"REFUND_EXCEEDS_SETTLEMENT",invoice_id:invoice.id});const expected=invoice.total_cents-settled+refunded;if(expected!==invoice.balance_cents)discrepancies.push({code:"BALANCE_MISMATCH",invoice_id:invoice.id,expected_cents:expected,actual_cents:invoice.balance_cents});if(expected<0)discrepancies.push({code:"OVERPAID",invoice_id:invoice.id})}
 return {invoice_count:byId.size,payment_count:seen.size,discrepancies,balanced:discrepancies.length===0}
}
export function depositSummary(payments=[]){const pending=[];let total=0;for(const p of payments){if(p.status==="succeeded"&&["cash","check"].includes(p.method)&&!p.deposited_at){total+=cents(p.amount_cents);pending.push(p.id)}}return {undeposited_cents:total,payment_ids:pending}}
