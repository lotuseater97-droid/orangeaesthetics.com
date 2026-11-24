// Server-only reservation persistence adapter. Not a public API or deployed booking endpoint.
// Caller must authenticate the actor, authorize organization/staff scope, validate
// service and operating hours, and supply a transactional PostgreSQL query client.
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const requiredUuid=(value,name)=>{if(typeof value!=="string"||!uuid.test(value))throw new TypeError("Invalid "+name);return value;};
export class ReservationConflictError extends Error{
 constructor(){super("The requested appointment slot is unavailable");this.name="ReservationConflictError";this.status=409;}
}
export async function insertReservation({query,organization_id,appointment_id,provider_id,room_id,starts_at,ends_at,status="under_review"}){
 if(typeof query!=="function")throw new TypeError("A trusted database query function is required");
 const ids=[organization_id,appointment_id,provider_id,room_id];
 ["organization_id","appointment_id","provider_id","room_id"].forEach((name,i)=>requiredUuid(ids[i],name));
 if(!["under_review","confirmed"].includes(status))throw new RangeError("Invalid reservable status");
 const start=Date.parse(starts_at),end=Date.parse(ends_at);
 if(typeof starts_at!=="string"||typeof ends_at!=="string"||!/^\\d{4}-\\d{2}-\\d{2}T/.test(starts_at)||!/(Z|[+-]\\d{2}:\\d{2})$/.test(starts_at)||!/(Z|[+-]\\d{2}:\\d{2})$/.test(ends_at)||!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>8*3600000)throw new RangeError("Invalid reservation interval");
 try{
  const result=await query(`INSERT INTO public.oa_resource_reservations
   (organization_id,appointment_id,provider_id,room_id,starts_at,ends_at,status)
   VALUES ($1,$2,$3,$4,$5,$6,$7)
   RETURNING id,organization_id,appointment_id,provider_id,room_id,starts_at,ends_at,status`,
   [...ids,starts_at,ends_at,status]);
  if(!result||!Array.isArray(result.rows)||result.rows.length!==1)throw new Error("Reservation insert returned no record");
  return result.rows[0];
 }catch(error){
  if(error?.code==="23P01"||error?.code==="23505")throw new ReservationConflictError();
  throw error;
 }
}
