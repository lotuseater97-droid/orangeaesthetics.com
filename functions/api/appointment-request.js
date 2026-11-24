// Cloudflare Pages Function. Contact-only intake; no PHI or private recipient in source.
const allowed = new Set(["Injectables","Skin rejuvenation","Laser","IV wellness","Membership","Other consultation"]);
const json=(status,message)=>new Response(JSON.stringify({message}),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin","x-frame-options":"DENY"}});
export async function onRequestPost({request,env}) {
  const origin=request.headers.get("origin");
  if(origin){let parsed;try{parsed=new URL(origin)}catch{return json(403,"Invalid origin")};if(parsed.origin!==new URL(request.url).origin)return json(403,"Invalid origin")}
  if(!/^application\/json(?:\s*;\s*charset\s*=\s*(?:utf-8|"utf-8"))?\s*$/i.test(request.headers.get("content-type")||""))return json(415,"JSON required");
  const lengthHeader=request.headers.get("content-length");
  if(lengthHeader!==null){const length=Number(lengthHeader);if(!Number.isSafeInteger(length)||length<0)return json(400,"Invalid content length");if(length>4096)return json(413,"Request too large");}
  let data;
  try {
    if (!request.body) return json(400,"Invalid request");
    const reader=request.body.getReader();
    const chunks=[];let size=0;
    try {
      while (true) {
        const {done,value}=await reader.read();
        if(done)break;
        size+=value.byteLength;
        if(size>4096){await reader.cancel();return json(413,"Request too large");}
        chunks.push(value);
      }
    }finally{reader.releaseLock();}
    const bytes=new Uint8Array(size);let offset=0;
    for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    data=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
  }catch{return json(400,"Invalid request")}
  if(!data || typeof data!=="object" || Array.isArray(data))return json(400,"Invalid request");
  if(Object.prototype.hasOwnProperty.call(data,"website")&&typeof data.website!=="string")return json(400,"Invalid fields");
  if(data.website)return json(200,"Received");
  // Contact-only form: reject extra fields so medical notes are not forwarded by accident.
  if(Object.keys(data).some(key=>!["name","email","phone","service","website"].includes(key)))return json(400,"Unsupported fields");
  const fields=["name","email","phone","service"];if(fields.some(key=>typeof data[key]!=="string"))return json(400,"Missing fields");
  const name=data.name.trim(),email=data.email.trim(),phone=data.phone.trim(),service=data.service;
  const phoneDigits=phone.replace(/\D/g,"");
  const phoneCharactersValid=/^[+0-9().\s-]+$/.test(phone);
  if(name.length<2||name.length>100||email.length>200||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||phone.length<7||phone.length>35||!phoneCharactersValid||phoneDigits.length<7||phoneDigits.length>15||!allowed.has(service)||/[\x00-\x1f\x7f-\x9f\u202a-\u202e\u2066-\u2069]/u.test(name+email+phone))return json(400,"Invalid fields");
  if (typeof env.APPOINTMENT_NOTIFICATION_ENDPOINT!=="string" || typeof env.APPOINTMENT_NOTIFICATION_TOKEN!=="string" || !env.APPOINTMENT_NOTIFICATION_ENDPOINT.trim() || !env.APPOINTMENT_NOTIFICATION_TOKEN.trim() || /[\r\n]/.test(env.APPOINTMENT_NOTIFICATION_TOKEN)) return json(503,"Appointment requests are not configured");
  let endpoint;try{endpoint=new URL(env.APPOINTMENT_NOTIFICATION_ENDPOINT)}catch{return json(503,"Notification endpoint is invalid")}
  if(endpoint.protocol!=="https:" || endpoint.username || endpoint.password || endpoint.port || endpoint.search || endpoint.hash || !endpoint.hostname.includes(".") || endpoint.hostname==="localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(endpoint.hostname) || endpoint.hostname.startsWith("[") ) return json(503,"Secure notification endpoint required");
  // An approved endpoint must be configured as a server secret. No patient clinical details.
  try{
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);
    try{
      const result=await fetch(endpoint.href,{method:"POST",redirect:"error",signal:controller.signal,headers:{"authorization":"Bearer "+env.APPOINTMENT_NOTIFICATION_TOKEN,"content-type":"application/json"},body:JSON.stringify({name,email,phone,service,source:"Orange Aesthetics appointment request"})});
      if(!result.ok)return json(502,"Delivery unavailable");return json(200,"Received");
    }finally{clearTimeout(timeout)}
  }catch{return json(502,"Delivery unavailable")}
}
