// Private appointment mutation transport. Production routes remain disabled until
// staff OIDC, MFA, tenant mapping and reservation migrations are verified.
import {createStaffReservation} from "./staff-reservation-service.mjs";
import {transitionStaffReservation} from "./staff-reservation-transitions.mjs";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const reply=(status,message)=>({status,headers:{"content-type":"application/json","cache-control":"no-store","x-content-type-options":"nosniff"},body:JSON.stringify({message})});
const exact=(value,keys)=>value&&typeof value==="object"&&!Array.isArray(value)&&Object.keys(value).sort().join(",")===keys.slice().sort().join(",");
export function createStaffReservationHttpHandler({verifyStaff,authorize,validateBooking,transaction,origin,enabled=false}={}){
 if(typeof verifyStaff!=="function"||typeof authorize!=="function"||typeof validateBooking!=="function"||typeof transaction!=="function")throw new TypeError("Trusted staff reservation dependencies required");
 if(typeof origin!=="string"||!origin.startsWith("https://")||new URL(origin).origin!==origin)throw new TypeError("Trusted origin required");
 if(typeof enabled!=="boolean")throw new TypeError("Invalid endpoint gate");
 return async function handle({method,headers,rawBody}={}){
  if(!enabled)return reply(503,"Staff reservations unavailable");
  if(method!=="POST")return reply(405,"Method not allowed");
  const get=k=>headers?.get?.(k)??headers?.[k]??headers?.[k.toLowerCase()];
  if(get("origin")!==origin)return reply(403,"Origin not allowed");
  if(!/^application\/json(?:\s*;|\s*$)/i.test(get("content-type")??""))return reply(415,"JSON required");
  if(typeof rawBody!=="string"||Buffer.byteLength(rawBody,"utf8")>2048)return reply(413,"Request too large");
  let request;
  try{request=JSON.parse(rawBody)}catch{return reply(400,"Invalid JSON")}
  const create=exact(request,["operation","organization_id","appointment_id","provider_id","room_id","starts_at","ends_at","status"])&&request.operation==="create";
  const transition=exact(request,["operation","organization_id","reservation_id","from_status","to_status"])&&request.operation==="transition";
  if(!create&&!transition)return reply(400,"Invalid request fields");
  for(const key of create?["organization_id","appointment_id","provider_id","room_id"]:["organization_id","reservation_id"])if(typeof request[key]!=="string"||!uuid.test(request[key]))return reply(400,"Invalid identifiers");
  if(create&&(typeof request.starts_at!=="string"||typeof request.ends_at!=="string"||!["under_review","confirmed"].includes(request.status)))return reply(400,"Invalid reservation");
  if(transition&&(!["under_review","confirmed"].includes(request.from_status)||!["confirmed","declined","cancelled","completed","no_show"].includes(request.to_status)))return reply(400,"Invalid status");
  let actor;
  try{actor=await verifyStaff({headers})}catch{return reply(503,"Authentication unavailable")}
  if(!actor||typeof actor.id!=="string"||!uuid.test(actor.id)||actor.active!==true||actor.mfaVerified!==true)return reply(401,"Staff authentication and MFA required");
  try{
   const args={...request,actor,authorize,transaction};
   if(create)await createStaffReservation({...args,validateBooking});
   else await transitionStaffReservation(args);
   // Return no appointment identifiers or records in a mutation response.
   return reply(200,"Reservation update recorded");
  }catch(error){
   if(error?.status===403)return reply(403,"Reservation access denied");
   if(error?.status===409)return reply(409,"Reservation conflict");
   if(error?.status===422||error instanceof RangeError||error instanceof TypeError)return reply(422,"Invalid reservation");
   return reply(503,"Reservation unavailable");
  }
 };
}
