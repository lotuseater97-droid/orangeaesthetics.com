// Transaction-scoped, tenant-bound business status transitions and audit inserts.
// This deliberately does not implement financial creates or idempotency yet.
import {BusinessError} from "./business-api.mjs";
const tables=Object.freeze({inquiry:"public.oa_inquiries",appointment:"public.oa_appointments",invoice:"public.oa_invoices",expense:"public.oa_expenses"});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const requireUuid=(value)=>{if(!uuid.test(value||""))throw new BusinessError("VALIDATION","Invalid record identity")};
const requireKind=kind=>{if(!Object.hasOwn(tables,kind))throw new BusinessError("VALIDATION","Unsupported record type");return tables[kind]};
const one=(result)=>{if(!result||!Array.isArray(result.rows)||result.rows.length>1)throw new BusinessError("INTERNAL","Invalid database result");return result.rows[0]??null};
export function createPostgresTransitionAdapter({query}){
 if(typeof query!=="function")throw new TypeError("Transaction-scoped query required");
 return Object.freeze({
  async getForUpdate({kind,id,organization_id}){
   const table=requireKind(kind);requireUuid(id);requireUuid(organization_id);
   return one(await query(`SELECT id, organization_id, status FROM ${table} WHERE organization_id = $1 AND id = $2 FOR UPDATE`,[organization_id,id]));
  },
  async transition(prepared){
   const {kind,record_id,identity,from,to}=prepared??{};
   const table=requireKind(kind);requireUuid(record_id);requireUuid(identity?.organization_id);
   if(typeof from!=="string"||typeof to!=="string")throw new BusinessError("VALIDATION","Invalid transition");
   const record=one(await query(`UPDATE ${table} SET status = $1 WHERE organization_id = $2 AND id = $3 AND status = $4 RETURNING id, organization_id, status`,[to,identity.organization_id,record_id,from]));
   if(!record)throw new BusinessError("CONFLICT","Record changed before transition");
   return record;
  },
  async audit({actor_id,organization_id,kind,operation,record_id}){
   requireKind(kind);requireUuid(actor_id);requireUuid(organization_id);requireUuid(record_id);
   if(!["create","transition"].includes(operation))throw new BusinessError("VALIDATION","Invalid audit operation");
   const result=await query("INSERT INTO public.oa_audit_events (organization_id, actor_id, entity_type, entity_id, action) VALUES ($1, $2, $3, $4, $5) RETURNING id",[organization_id,actor_id,kind,record_id,operation]);
   if(!one(result)?.id)throw new BusinessError("INTERNAL","Audit persistence failed");
  }
 });
}
