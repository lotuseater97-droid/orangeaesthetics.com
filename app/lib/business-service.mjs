// Server-side orchestration contract. No HTTP, authentication provider or database implementation.
// Call only from a trusted server with verified session and organization membership adapters.
import {prepareCreate,prepareTransition,BusinessError} from "./business-api.mjs";
const kinds=new Set(["inquiry","appointment","expense","invoice"]);
const validId=x=>typeof x==="string"&&/^[a-zA-Z0-9_-]{1,128}$/.test(x);
export function createBusinessService({resolveSession,resolveMembership,repository,audit}){
 if(typeof resolveSession!=="function"||typeof resolveMembership!=="function"||!repository||typeof repository.create!=="function"||typeof repository.get!=="function"||typeof repository.transition!=="function"||typeof audit!=="function")throw new TypeError("Missing trusted adapters");
 async function actorFor(sessionToken){
  if(!validId(sessionToken))throw new BusinessError("UNAUTHENTICATED","Valid session required");
  const session=await resolveSession(sessionToken);
  if(!session||session.active!==true||!validId(session.user_id))throw new BusinessError("UNAUTHENTICATED","Valid session required");
  const membership=await resolveMembership(session.user_id);
  if(!membership||membership.active!==true||!validId(membership.organization_id)||!["owner","manager","clinician","ma"].includes(membership.role))throw new BusinessError("FORBIDDEN","Active staff membership required");
  // No role, organization or permission is ever taken from the request body.
  return {user_id:session.user_id,organization_id:membership.organization_id,role:membership.role,permissions:[]};
 }
 async function create({sessionToken,kind,payload,idempotency_key}){
  const actor=await actorFor(sessionToken);
  const operation=prepareCreate({actor,kind,payload,idempotency_key});
  const result=await repository.create(operation);
  await audit({operation:"create",kind,record_id:result.id,actor_id:actor.user_id,organization_id:actor.organization_id});
  return result;
 }
 async function changeStatus({sessionToken,kind,id,to,idempotency_key}){
  if(!kinds.has(kind)||!validId(id))throw new BusinessError("VALIDATION","Invalid record");
  const actor=await actorFor(sessionToken);
  const record=await repository.get({kind,id,organization_id:actor.organization_id});
  if(!record||record.organization_id!==actor.organization_id)throw new BusinessError("NOT_FOUND","Record not available");
  const operation=prepareTransition({actor,kind,record,to,idempotency_key});
  const result=await repository.transition(operation);
  await audit({operation:"transition",kind,record_id:id,actor_id:actor.user_id,organization_id:actor.organization_id,from:operation.from,to:operation.to});
  return result;
 }
 return Object.freeze({create,changeStatus});
}
