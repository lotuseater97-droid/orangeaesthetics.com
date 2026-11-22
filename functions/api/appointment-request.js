// Cloudflare Pages Function. Requires a configured, approved notification service.
// No recipient address is stored in public source or sent to the browser.
const allowed = new Set(["Injectables","Skin rejuvenation","Laser","IV wellness","Membership","Other consultation"]);
export async function onRequestPost({request,env}) {
  const json=(status,message)=>new Response(JSON.stringify({message}),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
  if (!env.APPOINTMENT_NOTIFICATION_ENDPOINT || !env.APPOINTMENT_NOTIFICATION_TOKEN) return json(503,"Appointment requests are not configured");
  const origin=request.headers.get("origin");if(origin && new URL(origin).host !== new URL(request.url).host)return json(403,"Invalid origin");
  if(Number(request.headers.get("content-length")||0)>4096)return json(413,"Request too large");
  let data;try{data=await request.json()}catch{return json(400,"Invalid request")}
  if(data.website)return json(200,"Received");
  const fields=["name","email","phone","service"];if(fields.some(key=>typeof data[key]!=="string"))return json(400,"Missing fields");
  const name=data.name.trim(),email=data.email.trim(),phone=data.phone.trim(),service=data.service;
  if(name.length<2||name.length>100||email.length>200||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||phone.length<7||phone.length>35||!allowed.has(service))return json(400,"Invalid fields");
  // This endpoint must be configured to deliver to a private recipient via a trusted provider.
  // Only contact details and broad service category. Do not include clinical information.
  const result=await fetch(env.APPOINTMENT_NOTIFICATION_ENDPOINT,{method:"POST",headers:{"authorization":"Bearer "+env.APPOINTMENT_NOTIFICATION_TOKEN,"content-type":"application/json"},body:JSON.stringify({name,email,phone,service,source:"Orange Aesthetics appointment request"})});
  if(!result.ok)return json(502,"Delivery unavailable");return json(200,"Received");
}
