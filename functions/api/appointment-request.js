// Cloudflare Pages Function. Contact-only intake; no PHI or private recipient in source.
const allowed = new Set(["Injectables","Skin rejuvenation","Laser","IV wellness","Membership","Other consultation"]);
const json=(status,message)=>new Response(JSON.stringify({message}),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
export async function onRequestPost({request,env}) {
  if (!env.APPOINTMENT_NOTIFICATION_ENDPOINT || !env.APPOINTMENT_NOTIFICATION_TOKEN) return json(503,"Appointment requests are not configured");
  let endpoint;try{endpoint=new URL(env.APPOINTMENT_NOTIFICATION_ENDPOINT)}catch{return json(503,"Notification endpoint is invalid")}
  if(endpoint.protocol!=="https:" || endpoint.username || endpoint.password) return json(503,"Secure notification endpoint required");
  const origin=request.headers.get("origin");
  if(origin){let parsed;try{parsed=new URL(origin)}catch{return json(403,"Invalid origin")};if(parsed.origin!==new URL(request.url).origin)return json(403,"Invalid origin")}
  if(!(request.headers.get("content-type")||"").toLowerCase().startsWith("application/json"))return json(415,"JSON required");
  if(Number(request.headers.get("content-length")||0)>4096)return json(413,"Request too large");
  let data;try{const body=await request.text();if(body.length>4096)return json(413,"Request too large");data=JSON.parse(body)}catch{return json(400,"Invalid request")}
  if(!data || typeof data!=="object" || Array.isArray(data))return json(400,"Invalid request");
  if(data.website)return json(200,"Received");
  const fields=["name","email","phone","service"];if(fields.some(key=>typeof data[key]!=="string"))return json(400,"Missing fields");
  const name=data.name.trim(),email=data.email.trim(),phone=data.phone.trim(),service=data.service;
  if(name.length<2||name.length>100||email.length>200||!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)||phone.length<7||phone.length>35||!allowed.has(service))return json(400,"Invalid fields");
  // An approved endpoint must be configured as a server secret. No patient clinical details.
  try{
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);
    try{
      const result=await fetch(endpoint.href,{method:"POST",redirect:"error",signal:controller.signal,headers:{"authorization":"Bearer "+env.APPOINTMENT_NOTIFICATION_TOKEN,"content-type":"application/json"},body:JSON.stringify({name,email,phone,service,source:"Orange Aesthetics appointment request"})});
      if(!result.ok)return json(502,"Delivery unavailable");return json(200,"Received");
    }finally{clearTimeout(timeout)}
  }catch{return json(502,"Delivery unavailable")}
}
