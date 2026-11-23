// Fail-closed transaction orchestration contract for business writes.
// The transaction adapter must commit mutation, idempotency and audit atomically.
import {prepareCreate,prepareTransition,BusinessError} from "./business-api.mjs";
const id=x=>typeof x==="string"&&/^[a-zA-Z0-9_-]{1,128}$/.test(x);
const financial=new Set(["invoice","expense"]);
const types=new Set(["inquiry","appointment","invoice","expense"]);
export function createTransactionalBusinessService({verifySession,lookupStaff,withTransaction}){
 if(typeof verifySession!=="function"||typeof lookupStaff!=="function"||typeof withTransaction!=="function")throw new TypeError("Trusted adapters required");
 async function actor(token){
  if(typeof token!=="string"||token.length<12)throw new BusinessError("UNAUTHENTICATED","Verified session required");
  const s=await verifySession(token);
  if(!s||s.active!==true||!id(s.user_id))throw new BusinessError("UNAUTHENTICATED","Verified session required");
  const m=await lookupStaff(s.user_id);
  if(!m||m.active!==true||!id(m.organization_id)||!["owner","manager","clinician","ma"].includes(m.role))throw new BusinessError("FORBIDDEN","Staff access required");
  return {user_id:s.user_id,organization_id:m.organization_id,role:m.role,permissions:[]};
 }
 async function write({token,kind,operation,payload,id:recordId,to,idempotency_key}){
  if(!types.has(kind)||!["create","transition"].includes(operation))throw new BusinessError("VALIDATION","Unsupported operation");
  const a=await actor(token);
  // Transaction adapter owns row locking, durable idempotency uniqueness, and audit persistence.
  return withTransaction(async tx=>{
   if(!tx||typeof tx.create!=="function"||typeof tx.getForUpdate!=="function"||typeof tx.transition!=="function"||typeof tx.audit!=="function"||typeof tx.claimIdempotency!=="function")throw new TypeError("Incomplete transaction adapter");
   let prepared;
   if(operation==="create")prepared=prepareCreate({actor:a,kind,payload,idempotency_key});
   else{
    if(!id(recordId))throw new BusinessError("VALIDATION","Invalid record ID");
    const record=await tx.getForUpdate({kind,id:recordId,organization_id:a.organization_id});
    if(!record||record.organization_id!==a.organization_id)throw new BusinessError("NOT_FOUND","Record not available");
    prepared=prepareTransition({actor:a,kind,record,to,idempotency_key});
   }
   const key=prepared.idempotency_key;
   if(financial.has(kind)){
    // The adapter MUST compare a canonical request fingerprint on retries, returning
    // the committed result only for an identical request; conflicting reuse must fail.
    const claim=await tx.claimIdempotency({organization_id:a.organization_id,key,operation,kind,record_id:recordId??null,payload:prepared.data??null,to:prepared.to??null});
    if(claim?.replayed===true){if(!claim.result)throw new BusinessError("CONFLICT","Invalid replay");return claim.result}
    if(claim?.claimed!==true)throw new BusinessError("CONFLICT","Idempotency claim denied");
   }
   const result=operation==="create"?await tx.create(prepared):await tx.transition(prepared);
   if(!result||!id(result.id))throw new BusinessError("INTERNAL","Invalid repository result");
   await tx.audit({actor_id:a.user_id,organization_id:a.organization_id,kind,operation,record_id:result.id,from:prepared.from??null,to:prepared.to??null});
   if(financial.has(kind)){
    if(typeof tx.finishIdempotency!=="function")throw new TypeError("Idempotency finalization required");
    await tx.finishIdempotency({organization_id:a.organization_id,key,result});
   }
   return result;
  });
 }
 return Object.freeze({write});
}
