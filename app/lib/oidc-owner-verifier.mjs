// Private owner verifier: OIDC signature/issuer/audience/expiry plus live DB role.
// Never trust an owner role claim from a browser or unsigned token.
import {createRemoteJWKSet,jwtVerify} from "jose";
export function createOidcOwnerVerifier({issuer,audience,jwksUrl,query}={}){
 if(typeof issuer!=="string"||typeof audience!=="string"||typeof jwksUrl!=="string"||typeof query!=="function")throw new TypeError("OIDC owner configuration incomplete");
 const issuerUrl=new URL(issuer),keyUrl=new URL(jwksUrl);
 if(issuerUrl.protocol!=="https:"||keyUrl.protocol!=="https:"||issuerUrl.username||keyUrl.username||keyUrl.search||keyUrl.hash||keyUrl.origin!==issuerUrl.origin)throw new Error("Invalid OIDC owner issuer or JWKS URL");
 const jwks=createRemoteJWKSet(keyUrl,{timeoutDuration:5000,cooldownDuration:30000});
 return async function verifyOwner({headers}={}){
  const auth=headers?.get?.("authorization")??headers?.authorization;
  if(typeof auth!=="string"||!/^Bearer [A-Za-z0-9_.-]+$/.test(auth))return null;
  let payload;
  try{({payload}=await jwtVerify(auth.slice(7),jwks,{issuer,audience,algorithms:["RS256","ES256"],clockTolerance:5,maxTokenAge:"1h"}))}catch{return null}
  if(typeof payload.sub!=="string"||payload.sub.length<3||payload.sub.length>255)return null;
  const result=await query("SELECT role,active FROM orange_app.staff_roles WHERE auth_subject=$1 AND role='owner' AND active=true LIMIT 1",[payload.sub]);
  return result?.rows?.[0]?.role==="owner"&&result.rows[0].active===true?{subject:payload.sub,role:"owner"}:null;
 };
}
