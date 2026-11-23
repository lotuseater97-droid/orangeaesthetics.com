// Server-only composition: HTTP -> verified session -> active membership -> SQL -> allowlisted JSON.
// This is NOT a deployed route; callers must provide trustworthy adapters.
import {createOwnerReadHttpHandler} from "./owner-read-http.mjs";
import {createOwnerDashboardBackend} from "./owner-dashboard-backend.mjs";
import {createStaffMembershipSqlLookup} from "./staff-membership-sql.mjs";
export function createOwnerReadStack({verifySession,extractVerifiedToken,query,allowedOrigin}){
 if(typeof verifySession!=="function"||typeof extractVerifiedToken!=="function"||typeof query!=="function")throw new TypeError("Trusted server adapters required");
 const lookupMembership=createStaffMembershipSqlLookup({query});
 const backend=createOwnerDashboardBackend({verifySession,lookupMembership,query});
 return createOwnerReadHttpHandler({backend,extractVerifiedToken,allowedOrigin});
}
