// Read-only member benefit balances. No PHI, no browser-supplied member IDs.
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const respond=(status,body)=>({status,headers:{"content-type":"application/json","cache-control":"no-store","x-content-type-options":"nosniff"},body:JSON.stringify(body)});
export function createMemberBenefitsHandler({verifySession,query,enabled=false}={}){
 if(typeof verifySession!=="function"||typeof query!=="function")throw new TypeError("Trusted benefits dependencies required");
 return async function handle({method,headers,rawBody}={}){
  if(!enabled)return respond(503,{message:"Member benefits unavailable"});
  if(method!=="GET")return respond(405,{message:"Method not allowed"});
  if(rawBody!==undefined&&rawBody!=="")return respond(400,{message:"Request body not allowed"});
  let member;
  try{member=await verifySession({headers})}catch{return respond(503,{message:"Authentication unavailable"})}
  if(!member||member.active!==true||!uuid.test(member.id??""))return respond(401,{message:"Authentication required"});
  try{
   const result=await query(
    `SELECT g.id,g.quantity AS granted_quantity,g.expires_at,c.sku,
       COALESCE(SUM(r.quantity),0) AS redeemed_quantity
       FROM orange_app.benefit_grants g
       JOIN orange_app.catalog_items c ON c.id=g.catalog_item_id
       LEFT JOIN orange_app.redemptions r ON r.grant_id=g.id AND r.member_id=g.member_id AND r.status='completed'
       WHERE g.member_id=$1
       GROUP BY g.id,g.quantity,g.expires_at,c.sku,g.created_at
       ORDER BY g.created_at DESC,g.id DESC LIMIT 100`,
    [member.id]
   );
   if(!Array.isArray(result?.rows))throw Error("Invalid benefits result");
   const benefits=result.rows.map(row=>{
    const granted=Number(row.granted_quantity),redeemed=Number(row.redeemed_quantity);
    const integerQuantity=value=>(typeof value==='string'&&/^(0|[1-9][0-9]*)$/.test(value))||(typeof value==='number'&&Number.isSafeInteger(value));
    if(!integerQuantity(row.granted_quantity)||!integerQuantity(row.redeemed_quantity))throw Error('Invalid benefit quantity');
    if(!uuid.test(row.id??"")||typeof row.sku!=="string"||!/^[a-z0-9_]{3,80}$/.test(row.sku)||
       !Number.isSafeInteger(granted)||granted<1||!Number.isSafeInteger(redeemed)||redeemed<0||redeemed>granted)throw Error("Invalid benefit");
    let expiresAt=null;
    if(row.expires_at!==null&&row.expires_at!==undefined){
     const date=row.expires_at instanceof Date?row.expires_at:new Date(row.expires_at);
     if(!Number.isFinite(date.getTime()))throw Error("Invalid expiration");
     expiresAt=date.toISOString();
    }
    const expired=expiresAt!==null&&Date.parse(expiresAt)<=Date.now();
    return {id:row.id,sku:row.sku,granted,redeemed,remaining:expired?0:granted-redeemed,expired,expiresAt};
   });
   return respond(200,{benefits});
  }catch{return respond(503,{message:"Member benefits unavailable"})}
 };
}
