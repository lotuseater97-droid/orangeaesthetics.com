// Server-only HTTP checkout handler. No trust in request-provided member IDs,
// prices, catalog, or identity. Remains disabled without verified auth integration.
export function createCheckoutHttpHandler({verifySession,loadCatalog,startCheckout,enabled=false,origin}={}){
 if(typeof verifySession!=="function"||typeof loadCatalog!=="function"||typeof startCheckout!=="function")throw new TypeError("Trusted server adapters required");
 if(typeof origin!=="string")throw new TypeError("Trusted HTTPS origin required");
 let allowedOrigin;try{allowedOrigin=new URL(origin)}catch{throw new TypeError("Trusted HTTPS origin required")}
 if(allowedOrigin.protocol!=="https:"||allowedOrigin.origin!==origin||allowedOrigin.username||allowedOrigin.password)throw new TypeError("Trusted HTTPS origin required");
 return async function handle({method,headers,rawBody}={}){
  const reply=(status,message,extra={})=>({status,headers:{"content-type":"application/json","cache-control":"no-store","x-content-type-options":"nosniff"},body:JSON.stringify({message,...extra})});
  if(!enabled)return reply(503,"Checkout unavailable");
  if(method!=="POST")return reply(405,"Method not allowed");
  const get=k=>headers?.get?.(k)??headers?.[k]??headers?.[k.toLowerCase()];
  if(get("origin")!==origin)return reply(403,"Origin not allowed");
  if(!/^application\/json(?:\s*;|\s*$)/i.test(get("content-type")??""))return reply(415,"JSON required");
  if(typeof rawBody!=="string"||Buffer.byteLength(rawBody)>2048)return reply(413,"Request too large");
  let body;try{body=JSON.parse(rawBody)}catch{return reply(400,"Invalid JSON")}
  if(!body||Array.isArray(body)||typeof body!=="object"||Object.keys(body).some(k=>!["sku","quantity"].includes(k)))return reply(400,"Invalid fields");
  if(typeof body.sku!=="string"||!Number.isSafeInteger(body.quantity))return reply(400,"Invalid item");
  let member;
  try{member=await verifySession({headers})}catch{return reply(401,"Authentication required")}
  if(!member||typeof member.id!=="string"||member.active!==true)return reply(401,"Authentication required");
  try{
   const catalog=await loadCatalog();
   const result=await startCheckout({verifiedMemberId:member.id,sku:body.sku,quantity:body.quantity,catalog});
   return reply(200,"Checkout created",{url:result.url});
  }catch{return reply(503,"Checkout unavailable")}
 };
}
