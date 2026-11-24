// Trusted server-side reservation authorization backed by current team membership.
// Preflight and transaction-phase checks both read the database, never client role claims.
import {createStaffMembershipSqlLookup} from "./staff-membership-sql.mjs";
import {allowed} from "./business-navigation.mjs";
export function createReservationAuthorizer({preflightQuery}){
 if(typeof preflightQuery!=="function")throw new TypeError("Trusted preflight database query required");
 return async ({actor,organization_id,action,query})=>{
  if(action!=="reservation:create"||!actor||typeof actor.id!=="string")return false;
  const executor=query===undefined?preflightQuery:query;
  if(typeof executor!=="function")return false;
  const membership=await createStaffMembershipSqlLookup({query:executor})({user_id:actor.id,organization_id});
  return membership?.active===true&&membership.organization_id===organization_id&&allowed(membership.role,"appointments.manage");
 };
}
