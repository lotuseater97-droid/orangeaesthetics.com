// Durable, transaction-scoped financial idempotency. Must run on one pinned pg connection.
import {BusinessError} from "./business-api.mjs";
import {fingerprintOperation,evaluateIdempotencyRecord} from "./idempotency-fingerprint.mjs";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const keyPattern=/^[-_a-zA-Z0-9]{12,128}$/;
export function createPostgresIdempotencyAdapter({query}){
 if(typeof query!=="function")throw new TypeError("Transaction-scoped query required");
 const pending=new Map();
 return Object.freeze({
  async claimIdempotency(input){
   const {organization_id,key}=input??{};
   if(!uuid.test(organization_id||"")||!keyPattern.test(key||""))throw new BusinessError("VALIDATION","Invalid idempotency identity");
   const fingerprint=fingerprintOperation(input);
   // ON CONFLICT DO NOTHING waits for any uncommitted competing insert. The following
   // SELECT therefore observes the committed winner at READ COMMITTED isolation.
   const inserted=await query("INSERT INTO public.oa_idempotency_keys (organization_id, key, request_hash, status) VALUES ($1,$2,$3,'pending') ON CONFLICT (organization_id,key) DO NOTHING RETURNING id",[organization_id,key,fingerprint]);
   if(!inserted||!Array.isArray(inserted.rows)||inserted.rows.length>1)throw new BusinessError("INTERNAL","Invalid claim response");
   if(inserted.rows.length===1){
    pending.set(organization_id+"\0"+key,fingerprint);
    return {claimed:true};
   }
   const existing=await query("SELECT request_hash AS fingerprint, status, result_json AS result FROM public.oa_idempotency_keys WHERE organization_id=$1 AND key=$2",[organization_id,key]);
   if(!existing||!Array.isArray(existing.rows)||existing.rows.length!==1)throw new BusinessError("CONFLICT","Idempotency claim unavailable");
   const decision=evaluateIdempotencyRecord({existing:existing.rows[0],expectedFingerprint:fingerprint});
   if(decision.replayed)return decision;
   throw new BusinessError("CONFLICT","Idempotency key already used or incomplete");
  },
  async finishIdempotency({organization_id,key,result}){
   if(!uuid.test(organization_id||"")||!keyPattern.test(key||"")||!result||!uuid.test(result.id||""))throw new BusinessError("VALIDATION","Invalid idempotency completion");
   const scope=organization_id+"\0"+key;
   const fingerprint=pending.get(scope);
   if(!fingerprint)throw new BusinessError("CONFLICT","No matching claim in transaction");
   const updated=await query("UPDATE public.oa_idempotency_keys SET status='committed', result_ref=$1, result_json=$2::jsonb WHERE organization_id=$3 AND key=$4 AND request_hash=$5 AND status='pending' RETURNING id",[result.id,JSON.stringify(result),organization_id,key,fingerprint]);
   if(!updated||!Array.isArray(updated.rows)||updated.rows.length!==1)throw new BusinessError("CONFLICT","Idempotency finalization failed");
   pending.delete(scope);
  }
 });
}
