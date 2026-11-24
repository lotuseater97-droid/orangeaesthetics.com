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
 const parseTimestamp=value=>{
  if(typeof value!=="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,3})?(?:Z|[+-][0-9]{2}:[0-9]{2})$/.test(value))throw new RangeError("Invalid reservation timestamp");
  const [year,month,day]=value.slice(0,10).split("-").map(Number);
  const calendar=new Date(Date.UTC(year,month-1,day));
  if(calendar.getUTCFullYear()!==year||calendar.getUTCMonth()+1!==month||calendar.getUTCDate()!==day)throw new RangeError("Invalid reservation date");
  const hour=Number(value.slice(11,13)),minute=Number(value.slice(14,16)),second=Number(value.slice(17,19));
  if(hour>23||minute>59||second>59)throw new RangeError("Invalid reservation time");
  if(!value.endsWith("Z")){const offset=value.slice(-6);if(Number(offset.slice(1,3))>23||Number(offset.slice(4))>59)throw new RangeError("Invalid reservation offset");}
  const timestamp=Date.parse(value);
  if(!Number.isFinite(timestamp))throw new RangeError("Invalid reservation timestamp");
  return timestamp;
 };
 const start=parseTimestamp(starts_at),end=parseTimestamp(ends_at);
 if(end<=start||end-start>8*3600000)throw new RangeError("Invalid reservation interval");
 try{
  const result=await query(`INSERT INTO public.oa_resource_reservations
   (organization_id,appointment_id,provider_id,room_id,starts_at,ends_at,status)
   VALUES ($1,$2,$3,$4,$5,$6,$7)
   RETURNING id,organization_id,appointment_id,provider_id,room_id,starts_at,ends_at,status`,
   [...ids,starts_at,ends_at,status]);
  if(!result||!Array.isArray(result.rows)||result.rows.length!==1||!result.rows[0]||typeof result.rows[0]!=="object"||Array.isArray(result.rows[0]))throw new Error("Reservation insert returned no record");
  return result.rows[0];
 }catch(error){
  if((error?.code==="23P01"&&["oa_provider_no_overlap","oa_room_no_overlap"].includes(error?.constraint))||(error?.code==="23505"&&error?.constraint==="oa_one_reservation_per_appointment"))throw new ReservationConflictError();
  throw error;
 }
}
