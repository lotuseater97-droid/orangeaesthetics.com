// Deterministic purchase approval checks; never issues purchase orders or payments.
const money=n=>Number.isSafeInteger(n)&&n>=0;
const sumMoney=(rows,label)=>rows.reduce((sum,r)=>{if(!money(r.amount_cents)||!Number.isSafeInteger(sum+r.amount_cents))throw new RangeError("Invalid "+label+" total");return sum+r.amount_cents},0);
const roles=new Set(["owner","manager"]);
export function evaluatePurchase({request,approvals=[],receipts=[],invoices=[],policy={}}){
 if(!request||typeof request.id!=="string"||!request.id||typeof request.organization_id!=="string"||!request.organization_id||typeof request.vendor_id!=="string"||!request.vendor_id||typeof request.requested_by!=="string"||!request.requested_by||!money(request.total_cents)||!Array.isArray(approvals)||!Array.isArray(receipts)||!Array.isArray(invoices))throw new TypeError("Invalid purchase input");
 const threshold=policy.manager_limit_cents??50000;
 if(!money(threshold))throw new RangeError("Invalid approval limit");
 const issues=[];
 if(request.status==="cancelled")issues.push("CANCELLED");
 if(!["submitted","approved","ordered","received","invoiced"].includes(request.status))issues.push("INVALID_PURCHASE_STATE");
 const validApprovals=approvals.filter(a=>a.purchase_id===request.id&&a.organization_id===request.organization_id&&a.decision==="approved"&&roles.has(a.role)&&typeof a.actor_id==="string"&&a.actor_id.length>0&&a.actor_id!==request.requested_by&&a.active_staff===true);
 const ownerApproved=validApprovals.some(a=>a.role==="owner");
 const managerApproved=validApprovals.some(a=>a.role==="manager");
 if(!(ownerApproved||(request.total_cents<=threshold&&managerApproved)))issues.push("APPROVAL_REQUIRED");
 const received=receipts.filter(r=>r.purchase_id===request.id&&r.organization_id===request.organization_id);
 const billed=invoices.filter(i=>i.purchase_id===request.id&&i.organization_id===request.organization_id);
 const receivedCents=sumMoney(received,"receipt");
 const invoicedCents=sumMoney(billed,"invoice");
 if(receivedCents>request.total_cents)issues.push("OVER_RECEIVED");
 if(receivedCents<request.total_cents)issues.push("RECEIPT_INCOMPLETE");
 if(invoicedCents!==receivedCents)issues.push("THREE_WAY_MISMATCH");
 if(invoicedCents>request.total_cents)issues.push("OVER_BILLED");
 return {purchase_id:request.id,approval_satisfied:!issues.includes("APPROVAL_REQUIRED"),ready_for_payment:issues.length===0,received_cents:receivedCents,invoiced_cents:invoicedCents,issues};
}
export function purchaseApprovalQueue(requests=[],approvals=[],policy={}){
 if(!Array.isArray(requests)||!Array.isArray(approvals))throw new TypeError("Invalid queue");
 return requests.filter(r=>r.status==="submitted").map(r=>{const x=evaluatePurchase({request:r,approvals,policy});return {purchase_id:r.id,amount_cents:r.total_cents,needs_approval:!x.approval_satisfied}}).filter(r=>r.needs_approval);
}
