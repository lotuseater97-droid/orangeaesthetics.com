// Framework-neutral HTTP boundary for the protected owner dashboard read service.
// Do not deploy without a verified session provider, rate limiting and CSRF/origin review.
import {BusinessError} from "./business-api.mjs";
const allowed=new Set(["appointments","tasks","invoices","expenses","inventory"]);
const statusFor=code=>({UNAUTHENTICATED:401,FORBIDDEN:403,NOT_FOUND:404,VALIDATION:400,CONFLICT:409})[code]??500;
const json=(status,body)=>({status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"},body:JSON.stringify(body)});
export function createOwnerReadHttpHandler({backend,extractVerifiedToken,allowedOrigin}){
 if(!backend||typeof backend.list!=="function"||typeof extractVerifiedToken!=="function")throw new TypeError("Trusted HTTP adapters required");
 if(typeof allowedOrigin!=="string"||!/^https:\/\/[^/]+$/.test(allowedOrigin))throw new TypeError("Explicit HTTPS origin required");
 return async request=>{
  if(!request||request.method!=="GET")return json(405,{error:"METHOD_NOT_ALLOWED"});
  // Caller must supply a trusted URL parser and an absolute request URL.
  let url;
  try{url=new URL(request.url)}catch{return json(400,{error:"VALIDATION"})}
  if(url.origin!==allowedOrigin)return json(403,{error:"FORBIDDEN"});
  if(url.pathname!=="/api/owner/records")return json(404,{error:"NOT_FOUND"});
  // Reject cross-site browser requests even for read-only business data.
  const headers=request.headers;
  const header=name=>headers?.get?.(name)??headers?.[name]??headers?.[name.toLowerCase()]??null;
  const origin=header("origin");
  if(origin!==null&&origin!==allowedOrigin)return json(403,{error:"FORBIDDEN"});
  const site=header("sec-fetch-site");
  if(site!==null&&!["same-origin","none"].includes(site))return json(403,{error:"FORBIDDEN"});
  const params=url.searchParams;
  if([...params.keys()].some(k=>!["collection","limit"].includes(k))||params.getAll("collection").length!==1||params.getAll("limit").length>1)return json(400,{error:"VALIDATION"});
  const collection=params.get("collection");
  if(!allowed.has(collection))return json(400,{error:"VALIDATION"});
  const rawLimit=params.get("limit");
  if(rawLimit!==null&&!/^[1-9][0-9]{0,2}$/.test(rawLimit))return json(400,{error:"VALIDATION"});
  const limit=rawLimit===null?50:Number(rawLimit);
  if(limit>100)return json(400,{error:"VALIDATION"});
  try{
   const token=await extractVerifiedToken(request);
   if(typeof token!=="string"||token.length<12)throw new BusinessError("UNAUTHENTICATED","Verified session required");
   const records=await backend.list({sessionToken:token,collection,limit});
   return json(200,{collection,records});
  }catch(error){
   const code=error instanceof BusinessError?error.code:"INTERNAL";
   return json(statusFor(code),{error:statusFor(code)===500?"INTERNAL":code});
  }
 };
}
