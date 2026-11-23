// Private Node development runtime. Checkout remains disabled without real auth.
import {createServer} from "node:http";
import {Pool} from "pg";
import {createStripeWebhookHandler} from "../lib/stripe-webhook-handler.mjs";
import {createCheckoutHttpHandler} from "../lib/checkout-http-handler.mjs";
import {createCheckoutService} from "../lib/checkout-service.mjs";
import {createNeonCheckoutAdapters} from "../lib/neon-checkout-adapters.mjs";
import {createNeonCatalogLoader} from "../lib/neon-catalog-loader.mjs";
import {createStripeTestSessionAdapter} from "../lib/stripe-test-session.mjs";

const {DATABASE_URL,STRIPE_WEBHOOK_SECRET,STRIPE_TEST_SECRET_KEY,PORT="8788",HOST="127.0.0.1",CHECKOUT_ORIGIN="https://orangeaesthetics.com"}=process.env;
if(!DATABASE_URL||!STRIPE_WEBHOOK_SECRET||process.env.STRIPE_LIVEMODE==="true"){
 throw new Error("Development runtime requires DATABASE_URL, STRIPE_WEBHOOK_SECRET and Stripe test mode");
}
const pool=new Pool({connectionString:DATABASE_URL,ssl:{rejectUnauthorized:true},max:3,connectionTimeoutMillis:5000,statement_timeout:10000});
const execute=(text,values)=>pool.query(text,values);
const webhook=createStripeWebhookHandler({secret:STRIPE_WEBHOOK_SECRET,execute,expectedLivemode:false});
const db=createNeonCheckoutAdapters({query:execute});
const loadCatalog=createNeonCatalogLoader({query:execute,approvedSkus:(process.env.CHECKOUT_APPROVED_SKUS??"").split(",").filter(Boolean)});
const createStripeSession=STRIPE_TEST_SECRET_KEY?createStripeTestSessionAdapter({secretKey:STRIPE_TEST_SECRET_KEY}):async()=>{throw new Error("Stripe test checkout not configured")};
const startCheckout=createCheckoutService({reserveOrder:db.reserveOrder,attachCheckout:db.attachCheckout,createStripeSession,approvedOrigin:CHECKOUT_ORIGIN,enabled:false});
const checkout=createCheckoutHttpHandler({
 // Authentication deliberately fails closed until verified OIDC/JWT provider and
 // DB auth_subject-to-member mapping are implemented. No development bypass.
 verifySession:async()=>{throw new Error("Authentication provider not configured")},
 loadCatalog,startCheckout,origin:CHECKOUT_ORIGIN,enabled:false
});
const server=createServer(async(req,res)=>{
 const handler=req.url==="/api/stripe/webhook"?webhook:req.url==="/api/checkout"?checkout:null;
 if(!handler){res.writeHead(404);res.end();return;}
 let bytes=0;const chunks=[],limit=req.url==="/api/checkout"?2048:65536;
 try{
  for await(const chunk of req){bytes+=chunk.length;if(bytes>limit){res.writeHead(413);res.end();return;}chunks.push(chunk);}
  const output=await handler({method:req.method,headers:req.headers,rawBody:Buffer.concat(chunks).toString("utf8")});
  res.writeHead(output.status,output.headers);res.end(output.body);
 }catch{res.writeHead(503,{"cache-control":"no-store"});res.end();}
});
server.listen(Number(PORT),HOST,()=>console.log("Development runtime listening on "+HOST+":"+PORT));
const stop=()=>server.close(()=>pool.end().finally(()=>process.exit(0)));
process.on("SIGINT",stop);process.on("SIGTERM",stop);
