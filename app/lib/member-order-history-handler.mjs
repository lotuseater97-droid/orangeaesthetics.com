// Private read-only member order history. Authentication supplies the member ID.
// No browser-supplied member identifiers or patient/clinical fields are accepted.
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const reply=(status,message)=>({status,headers:{"content-type":"application/json","cache-control":"no-store","x-content-type-options":"nosniff"},body:JSON.stringify({message})});
export function createMemberOrderHistoryHandler({verifySession,query,enabled=false}={}){
 if(typeof verifySession!=="function"||typeof query!=="function")throw new TypeError("Trusted member order history dependencies required");
 return async function handle({method,headers,rawBody}={}){
  if(!enabled)return reply(503,"Member history unavailable");
  if(method!=="GET")return reply(405,"Method not allowed");
  if(rawBody!==undefined&&rawBody!=="")return reply(400,"Request body not allowed");
  let member;
  try{member=await verifySession({headers})}catch{return reply(503,"Authentication unavailable")}
  if(!member||member.active!==true||!uuid.test(member.id??""))return reply(401,"Authentication required");
  try{
   const result=await query(
    "SELECT id,status,total_cents,currency,created_at FROM orange_app.orders WHERE member_id=$1 ORDER BY created_at DESC,id DESC LIMIT 20",
    [member.id]
   );
   if(!Array.isArray(result?.rows))throw new Error("Missing order rows");
   const orders=result.rows.map(row=>{
    const amount=Number(row.total_cents);
    if(row.total_cents===null||row.total_cents===undefined||typeof row.total_cents==='boolean'||String(row.total_cents).trim()==='')throw new Error('Missing order total');
    if(!uuid.test(row.id??"")||!Number.isSafeInteger(amount)||amount<0||amount>99999999||
       typeof row.status!=="string"||!/^[a-z_]{1,32}$/.test(row.status)||
       typeof row.currency!=="string"||row.currency.trim()!=="USD")throw new Error("Invalid order row");
    if(row.created_at===null||row.created_at===undefined||row.created_at===''||typeof row.created_at==='boolean')throw new Error('Missing order date');
    const date=row.created_at instanceof Date?row.created_at:new Date(row.created_at);
    if(!Number.isFinite(date.getTime()))throw new Error("Invalid order date");
    return {id:row.id,status:row.status,totalCents:amount,currency:"USD",createdAt:date.toISOString()};
   });
   return {status:200,headers:{"content-type":"application/json","cache-control":"no-store","x-content-type-options":"nosniff"},body:JSON.stringify({orders})};
  }catch{return reply(503,"Member history unavailable")}
 };
}
