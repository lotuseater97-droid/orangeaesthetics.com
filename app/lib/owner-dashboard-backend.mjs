// Composes the protected owner read service with its parameterized SQL adapter.
// Not an HTTP endpoint. Session resolver MUST be server-owned and verified.
import {createOwnerReadService} from "./owner-read-service.mjs";
import {createOwnerSqlListAdapter} from "./owner-read-sql.mjs";
import {BusinessError} from "./business-api.mjs";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function createOwnerDashboardBackend({verifySession,lookupMembership,query}){
 if(typeof verifySession!=="function"||typeof lookupMembership!=="function"||typeof query!=="function")throw new TypeError("Trusted server adapters required");
 const resolveActor=async token=>{
  if(typeof token!=="string"||token.length<12)throw new BusinessError("UNAUTHENTICATED","Verified session required");
  const session=await verifySession(token);
  if(!session||session.active!==true||!uuid.test(session.user_id||""))throw new BusinessError("UNAUTHENTICATED","Verified session required");
  const membership=await lookupMembership(session.user_id);
  if(!membership||membership.active!==true||!uuid.test(membership.organization_id||"")||!["owner","manager","clinician","ma"].includes(membership.role))throw new BusinessError("FORBIDDEN","Active staff membership required");
  return {user_id:session.user_id,organization_id:membership.organization_id,role:membership.role,permissions:[]};
 };
 return createOwnerReadService({resolveActor,listRecords:createOwnerSqlListAdapter({query})});
}
