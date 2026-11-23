// Canonical request identity for a durable, organization-scoped idempotency store.
// Use the result with a DB unique key (organization_id, idempotency_key).
import {createHash} from "node:crypto";
const id=x=>typeof x==="string"&&/^[a-zA-Z0-9_-]{1,128}$/.test(x);
function canonical(value){
 if(value===null||typeof value==="boolean"||typeof value==="string")return JSON.stringify(value);
 if(typeof value==="number"){if(!Number.isSafeInteger(value))throw new TypeError("Only safe integers supported");return JSON.stringify(value)}
 if(Array.isArray(value))return "["+value.map(canonical).join(",")+"]";
 if(value&&typeof value==="object"&&Object.getPrototypeOf(value)===Object.prototype){
  return "{"+Object.keys(value).sort().map(k=>JSON.stringify(k)+":"+canonical(value[k])).join(",")+"}";
 }
 throw new TypeError("Unsupported canonical value");
}
export function fingerprintOperation({organization_id,operation,kind,record_id=null,payload=null,to=null}){
 if(!id(organization_id)||!["create","transition"].includes(operation)||!["invoice","expense"].includes(kind))throw new TypeError("Invalid operation identity");
 if(operation==="create"&&(record_id!==null||to!==null||!payload||typeof payload!=="object"))throw new TypeError("Invalid create request");
 if(operation==="transition"&&(!id(record_id)||typeof to!=="string"||!to||payload!==null))throw new TypeError("Invalid transition request");
 const body=canonical({version:1,organization_id,operation,kind,record_id,payload,to});
 return createHash("sha256").update(body,"utf8").digest("hex");
}
export function evaluateIdempotencyRecord({existing,expectedFingerprint}){
 if(typeof expectedFingerprint!=="string"||!/^[0-9a-f]{64}$/.test(expectedFingerprint))throw new TypeError("Invalid fingerprint");
 if(existing===null)return {claimed:true};
 if(!existing||existing.fingerprint!==expectedFingerprint)return {claimed:false,reason:"KEY_REUSED_FOR_DIFFERENT_REQUEST"};
 if(existing.status!=="committed"||!existing.result||typeof existing.result.id!=="string"||!existing.result.id)return {claimed:false,reason:"INCOMPLETE_RECORD"};
 return {replayed:true,result:existing.result};
}
