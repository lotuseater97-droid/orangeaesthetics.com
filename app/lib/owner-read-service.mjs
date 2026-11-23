// Protected, organization-scoped read model for an eventual owner dashboard.
// No database or HTTP transport; caller must supply trusted server adapters.
import {requireActor,BusinessError} from "./business-api.mjs";
const collections=Object.freeze({appointments:{capability:"appointments.read",fields:["id","requested_at","service_code","status"]},tasks:{capability:"tasks.read",fields:["id","title","status","due_at"]},invoices:{capability:"business.read",fields:["id","status","currency","total_cents","balance_cents"]},expenses:{capability:"business.read",fields:["id","category","amount_cents","status","incurred_on"]},inventory:{capability:"inventory.read",fields:["id","sku","description","reorder_threshold","on_hand"]}});
const canRead=(actor,capability)=>{try{requireActor(actor,capability);return true}catch(e){if(e instanceof BusinessError&&e.code==="FORBIDDEN")return false;throw e}};
export function createOwnerReadService({resolveActor,listRecords}){
 if(typeof resolveActor!=="function"||typeof listRecords!=="function")throw new TypeError("Trusted server adapters required");
 async function list({sessionToken,collection,limit=50}){
  if(!Object.hasOwn(collections,collection))throw new BusinessError("VALIDATION","Unsupported collection");
  if(!Number.isSafeInteger(limit)||limit<1||limit>100)throw new BusinessError("VALIDATION","Invalid limit");
  const actor=await resolveActor(sessionToken);
  if(!actor||!actor.user_id||!actor.organization_id)throw new BusinessError("UNAUTHENTICATED","Verified session required");
  const config=collections[collection];
  if(!canRead(actor,config.capability))throw new BusinessError("FORBIDDEN","Permission denied");
  const records=await listRecords({organization_id:actor.organization_id,collection,limit,actor_id:actor.user_id,role:actor.role});
  if(!Array.isArray(records)||records.length>limit)throw new BusinessError("INTERNAL","Invalid repository response");
  return Object.freeze(records.map(record=>{
   // Defense in depth even if the repository query is accidentally unscoped.
   if(!record||record.organization_id!==actor.organization_id)throw new BusinessError("INTERNAL","Tenant isolation violation");
   if((collection==="appointments"||collection==="tasks")&&["ma","clinician"].includes(actor.role)&&record.assigned_to!==actor.user_id)throw new BusinessError("INTERNAL","Assignment isolation violation");
   const out={};for(const field of config.fields)if(Object.hasOwn(record,field))out[field]=record[field];
   return Object.freeze(out);
  }));
 }
 return Object.freeze({list});
}
