// Private, fail-closed owner catalog approval HTTP endpoint.
import {randomUUID} from "node:crypto";
import {OwnerApprovalDenied} from "./owner-catalog-approval.mjs";
export function createOwnerCatalogHttpHandler({approveCatalog,origin,enabled=false}={}){
 if(typeof approveCatalog!=="function"||typeof origin!=="string"||new URL(origin).origin!==origin||!origin.startsWith("https://"))throw new TypeError("Trusted owner endpoint configuration required");
 const reply=(status,message)=>({status,headers:{"content-type":"application/json","cache-control":"no-store","x-content-type-options":"nosniff"},body:JSON.stringify({message})});
 return async function handle({method,headers,rawBody}={}){
  if(!enabled)return reply(503,"Owner approvals unavailable");
  if(method!=="POST")return reply(405,"Method not allowed");
  const get=k=>headers?.get?.(k)??headers?.[k]??headers?.[k.toLowerCase()];
  if(get("origin")!==origin)return reply(403,"Origin not allowed");
  if(!/^application\/json(?:\s*;|\s*$)/i.test(get("content-type")??""))return reply(415,"JSON required");
  if(typeof rawBody!=="string"||Buffer.byteLength(rawBody)>2048)return reply(413,"Request too large");
  let body;try{body=JSON.parse(rawBody)}catch{return reply(400,"Invalid JSON")}
  if(!body||typeof body!=="object"||Array.isArray(body)||Object.keys(body).sort().join(",")!=="approved,itemId,requiresClinicalReview")return reply(400,"Invalid fields");
  if(typeof body.itemId!=="string"||typeof body.approved!=="boolean"||typeof body.requiresClinicalReview!=="boolean")return reply(400,"Invalid fields");
  try{const result=await approveCatalog({headers,itemId:body.itemId,approved:body.approved,requiresClinicalReview:body.requiresClinicalReview,requestId:randomUUID()});if(result?.applied!==true)return reply(503,"Approval not confirmed");return reply(200,"Approval recorded")}
  catch(error){return error instanceof OwnerApprovalDenied?reply(403,"Approval denied"):reply(503,"Approval unavailable")}
 };
}
