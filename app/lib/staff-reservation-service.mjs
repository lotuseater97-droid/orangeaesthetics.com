// Server-only orchestration. This is not an HTTP endpoint or a production auth provider.
import {insertReservation} from "./reservation-store.mjs";
/** All callbacks must be trusted server-side implementations. The transaction callback
 * must provide a query bound to the SAME transaction and roll back on any error. */
export async function createStaffReservation({actor,organization_id,appointment_id,provider_id,room_id,starts_at,ends_at,status="under_review",authorize,validateBooking,transaction}){
 if(typeof authorize!=="function"||typeof validateBooking!=="function"||typeof transaction!=="function")throw new TypeError("Trusted authorization, booking validation and transaction are required");
 if(!actor||typeof actor!=="object"||Array.isArray(actor)||typeof actor.id!=="string"||!actor.id.trim())throw new TypeError("Authenticated actor required");
 if(typeof organization_id!=="string"||!organization_id.trim()||typeof appointment_id!=="string"||!appointment_id.trim())throw new TypeError("Organization and appointment identifiers required");
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 for(const value of [organization_id,appointment_id,provider_id,room_id])if(typeof value!=="string"||!uuid.test(value))throw new TypeError("Valid reservation resource identifiers required");
 if(!["under_review","confirmed"].includes(status))throw new RangeError("Invalid reservable status");
 // Deny before beginning a transaction; callbacks must not rely on user-supplied roles.
 const permitted=await authorize({actor,organization_id,action:"reservation:create"});
 if(permitted!==true)throw Object.assign(new Error("Reservation access denied"),{status:403});
 return transaction(async query=>{
  if(typeof query!=="function")throw new TypeError("Transactional query function required");
  // Booking policy must be checked against the same transaction snapshot as insertion.
  const valid=await validateBooking({query,actor,organization_id,appointment_id,provider_id,room_id,starts_at,ends_at,status});
  if(valid!==true)throw Object.assign(new Error("Reservation violates booking policy"),{status:422});
  return insertReservation({query,organization_id,appointment_id,provider_id,room_id,starts_at,ends_at,status});
 });
}
