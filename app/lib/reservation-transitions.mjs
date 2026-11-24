// Server-only, transactional lifecycle transition for a previously authorized reservation.
// The caller must authenticate staff, authorize tenant scope, and supply a transaction query.
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const transitions={under_review:["confirmed","declined","cancelled"],confirmed:["completed","no_show","cancelled"]};
export class ReservationTransitionConflict extends Error{
 constructor(){super("Reservation state changed or is unavailable");this.name="ReservationTransitionConflict";this.status=409;}
}
export async function transitionReservation({query,organization_id,reservation_id,from_status,to_status}){
 if(typeof query!=="function")throw new TypeError("Trusted transactional query required");
 if(!uuid.test(organization_id||"")||!uuid.test(reservation_id||""))throw new TypeError("Invalid reservation scope");
 if(!Object.hasOwn(transitions,from_status)||!transitions[from_status].includes(to_status))throw new RangeError("Invalid reservation lifecycle transition");
 const result=await query(`UPDATE public.oa_resource_reservations
 SET status=$3 WHERE organization_id=$1 AND id=$2 AND status=$4
 RETURNING id,organization_id,appointment_id,provider_id,room_id,starts_at,ends_at,status`,
 [organization_id,reservation_id,to_status,from_status]);
 if(!result||!Array.isArray(result.rows)||result.rows.length>1)throw new Error("Invalid reservation transition response");
 if(result.rows.length===0)throw new ReservationTransitionConflict();
 if(!result.rows[0]||result.rows[0].id!==reservation_id||result.rows[0].organization_id!==organization_id||result.rows[0].status!==to_status)throw new Error("Invalid reservation transition result");
 return result.rows[0];
}
