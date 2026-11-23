// Standalone private Node webhook runtime. Not deployed by Cloudflare's assets-only Worker.
// Launch only with Stripe TEST webhook secret and a dedicated restricted Neon role.
import {createServer} from "node:http";
import {Pool} from "pg";
import {createStripeWebhookHandler} from "../lib/stripe-webhook-handler.mjs";
const {DATABASE_URL,STRIPE_WEBHOOK_SECRET,PORT="8788",HOST="127.0.0.1"}=process.env;
if(!DATABASE_URL||!STRIPE_WEBHOOK_SECRET||process.env.STRIPE_LIVEMODE==="true"){
 throw new Error("Development webhook requires DATABASE_URL, STRIPE_WEBHOOK_SECRET, and Stripe test mode");
}
const pool=new Pool({connectionString:DATABASE_URL,ssl:{rejectUnauthorized:true},max:3,connectionTimeoutMillis:5000,statement_timeout:10000});
const execute=async(text,values)=>pool.query(text,values);
const handle=createStripeWebhookHandler({secret:STRIPE_WEBHOOK_SECRET,execute,expectedLivemode:false});
const server=createServer(async(req,res)=>{
 if(req.url!=="/api/stripe/webhook"){res.writeHead(404);res.end();return;}
 let bytes=0;const chunks=[];
 try{
  for await(const chunk of req){
   bytes+=chunk.length;
   if(bytes>65536){res.writeHead(413);res.end();return;}
   chunks.push(chunk);
  }
  const output=await handle({method:req.method,headers:req.headers,rawBody:Buffer.concat(chunks).toString("utf8")});
  res.writeHead(output.status,output.headers);res.end(output.body);
 }catch{res.writeHead(503,{"cache-control":"no-store"});res.end();}
});
server.listen(Number(PORT),HOST,()=>console.log("Development webhook listening on "+HOST+":"+PORT));
const stop=()=>server.close(()=>pool.end().finally(()=>process.exit(0)));
process.on("SIGINT",stop);process.on("SIGTERM",stop);
