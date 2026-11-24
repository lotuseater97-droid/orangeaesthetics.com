// Server-only staff lifecycle orchestration. Not an HTTP endpoint.
import {transitionReservation} from "./reservation-transitions.mjs";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function transitionStaffReservation({actor,organization_id,reservation_id,from_status,to_status,authorize,transaction}){
 if(typeof authorize!=="function"||typeof transaction!=="function")throw new TypeError("Trusted authorization and transaction required");
 if(!actor||typeof actor!=="object"||Array.isArray(actor)||typeof actor.id!=="string"||!uuid.test(actor.id))throw new TypeError("Valid authenticated actor required");
 if(typeof organization_id!=="string"||!uuid.test(organization_id)||typeof reservation_id!=="string"||!uuid.test(reservation_id))throw new TypeError("Valid reservation scope required");
 const scope={actor,organization_id,action:"reservation:transition"};
 if(await authorize(scope)!==true)throw Object.assign(new Error("Reservation access denied"),{status:403});
 return transaction(async client=>{
  const query=typeof client==="function"?client:(typeof client?.query==="function"?client.query.bind(client):undefined);
  if(typeof query!=="function")throw new TypeError("Transactional query required");
  // Recheck active staff membership inside the same transaction, locking membership
  // when supported by the trusted authorization adapter.
  if(await authorize({...scope,query})!==true)throw Object.assign(new Error("Reservation access denied"),{status:403});
  return transitionReservation({query,organization_id,reservation_id,from_status,to_status});
 });
}
