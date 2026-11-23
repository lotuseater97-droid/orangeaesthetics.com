// Server-only OIDC bearer authentication. Do not use browser-provided member IDs.
// JWKS is fetched over HTTPS and signatures, issuer, audience, expiry are verified
// by jose. The database lookup enforces current active member status.
import {createRemoteJWKSet,jwtVerify} from "jose";
export function createOidcMemberVerifier({issuer,audience,jwksUrl,query}={}){
 if(typeof issuer!=="string"||typeof audience!=="string"||typeof jwksUrl!=="string"||typeof query!=="function")throw new TypeError("OIDC configuration incomplete");
 const issuerUrl=new URL(issuer),keyUrl=new URL(jwksUrl);
 if(issuerUrl.protocol!=="https:"||keyUrl.protocol!=="https:"||issuerUrl.username||keyUrl.username||
    keyUrl.search||keyUrl.hash||keyUrl.origin!==issuerUrl.origin)throw new Error("Invalid OIDC issuer or JWKS URL");
 const jwks=createRemoteJWKSet(keyUrl,{timeoutDuration:5000,cooldownDuration:30000});
 return async function verifySession({headers}={}){
  const auth=headers?.get?.("authorization")??headers?.authorization;
  if(typeof auth!=="string"||!/^Bearer [A-Za-z0-9_.-]+$/.test(auth))return null;
  const token=auth.slice(7);
  let payload;
  try{({payload}=await jwtVerify(token,jwks,{issuer,audience,algorithms:["RS256","ES256"],clockTolerance:5,maxTokenAge:"1h"}))}catch{return null}
  if(typeof payload.sub!=="string"||payload.sub.length<3||payload.sub.length>255)return null;
  const result=await query("SELECT id,status FROM orange_app.members WHERE auth_subject=$1 AND status='active' LIMIT 1",[payload.sub]);
  const member=result?.rows?.[0];
  return member?.status==="active"&&typeof member.id==="string"?{id:member.id,active:true}:null;
 };
}
