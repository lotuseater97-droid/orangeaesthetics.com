// Parameterized PostgreSQL read plans matching business-schema.staging.sql.
// Execute only from an authenticated server; no browser database credentials.
import {BusinessError} from "./business-api.mjs";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const plans=Object.freeze({
 appointments:{table:"public.oa_appointments",columns:"id, organization_id, assigned_to, requested_at, service_code, status",order:"requested_at DESC, id DESC",assigned:true},
 tasks:{table:"public.oa_tasks",columns:"id, organization_id, assigned_to, title, status, due_at",order:"due_at DESC NULLS LAST, id DESC",assigned:true},
 invoices:{table:"public.oa_invoices",columns:"id, organization_id, status, currency, total_cents, balance_cents",order:"created_at DESC, id DESC"},
 expenses:{table:"public.oa_expenses",columns:"id, organization_id, category, amount_cents, status, incurred_on",order:"incurred_on DESC, id DESC"}
});
export function buildOwnerReadQuery({organization_id,actor_id,role,collection,limit=50}){
 if(!uuid.test(organization_id||"")||!uuid.test(actor_id||""))throw new BusinessError("VALIDATION","Invalid server identity");
 if(!["owner","manager","clinician","ma"].includes(role))throw new BusinessError("FORBIDDEN","Invalid staff role");
 if(!Number.isSafeInteger(limit)||limit<1||limit>100)throw new BusinessError("VALIDATION","Invalid limit");
 if(collection==="inventory"){
  if(!["owner","manager","clinician","ma"].includes(role))throw new BusinessError("FORBIDDEN","Permission denied");
  return {text:`SELECT i.id, i.organization_id, i.sku, i.description, i.reorder_threshold, COALESCE(SUM(m.quantity_delta), 0)::bigint AS on_hand
FROM public.oa_inventory_items AS i
LEFT JOIN public.oa_inventory_movements AS m ON m.organization_id = i.organization_id AND m.item_id = i.id
WHERE i.organization_id = $1
GROUP BY i.id, i.organization_id, i.sku, i.description, i.reorder_threshold
ORDER BY i.sku ASC, i.id ASC LIMIT $2`,values:[organization_id,limit]};
 }
 const plan=Object.hasOwn(plans,collection)?plans[collection]:null;
 if(!plan)throw new BusinessError("VALIDATION","Unknown collection");
 if(!plan.assigned&&!["owner","manager"].includes(role))throw new BusinessError("FORBIDDEN","Financial read restricted");
 const scoped=plan.assigned&&["clinician","ma"].includes(role);
 return {text:`SELECT ${plan.columns} FROM ${plan.table} WHERE organization_id = $1${scoped?" AND assigned_to = $2":""} ORDER BY ${plan.order} LIMIT $${scoped?3:2}`,values:scoped?[organization_id,actor_id,limit]:[organization_id,limit]};
}
export function createOwnerSqlListAdapter({query}){
 if(typeof query!=="function")throw new TypeError("Trusted SQL executor required");
 return async args=>{
  const plan=buildOwnerReadQuery(args);
  const response=await query(plan.text,plan.values);
  if(!response||!Array.isArray(response.rows))throw new BusinessError("INTERNAL","Invalid SQL response");
  return response.rows;
 };
}
