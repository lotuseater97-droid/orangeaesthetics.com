// Deterministic, synthetic-data-safe business calculations. Not a persistence or payment API.
const money=n=>{if(!Number.isSafeInteger(n)||n<0)throw new RangeError("Invalid cents");return n};
export function financialSummary({payments=[],expenses=[],invoices=[],inventory=[]}={}){
 const collected=payments.filter(p=>p.status==="succeeded").reduce((n,p)=>n+money(p.amount_cents),0);
 const refunded=payments.filter(p=>p.status==="refunded").reduce((n,p)=>n+money(p.amount_cents),0);
 const spent=expenses.filter(e=>e.status==="approved"||e.status==="paid").reduce((n,e)=>n+money(e.amount_cents),0);
 const receivable=invoices.filter(i=>!["void","draft"].includes(i.status)).reduce((n,i)=>n+money(i.balance_cents),0);
 const undeposited=payments.filter(p=>p.status==="succeeded"&&["cash","check"].includes(p.method)&&!p.deposited_at).reduce((n,p)=>n+money(p.amount_cents),0);
 const lowStock=inventory.filter(i=>Number.isSafeInteger(i.on_hand)&&Number.isSafeInteger(i.reorder_threshold)&&i.on_hand<=i.reorder_threshold).map(i=>i.sku);
 return {collected_cents:collected,refunded_cents:refunded,net_collected_cents:collected-refunded,expenses_cents:spent,receivable_cents:receivable,undeposited_cents:undeposited,low_stock_skus:lowStock};
}
export function outstandingWork({appointments=[],leads=[],invoices=[],tasks=[]},today){const at=new Date(today);if(Number.isNaN(at.getTime()))throw new TypeError("Invalid date");return {pending_appointments:appointments.filter(a=>a.status==="requested").length,new_leads:leads.filter(l=>l.status==="new").length,overdue_invoices:invoices.filter(i=>i.status!=="paid"&&i.status!=="void"&&i.due_at&&new Date(i.due_at)<at&&i.balance_cents>0).length,open_tasks:tasks.filter(t=>["open","in_progress"].includes(t.status)).length}}
export function stockOnHand(movements,itemId){return movements.filter(m=>m.item_id===itemId).reduce((n,m)=>{if(!Number.isSafeInteger(m.quantity_delta))throw new RangeError("Invalid stock movement");return n+m.quantity_delta},0)}
export function classifyInquiry(status){const allowed=new Set(["new","contacted","qualified","converted","closed"]);if(!allowed.has(status))throw new RangeError("Invalid inquiry state");return status}
