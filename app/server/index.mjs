// Private Node development runtime. Checkout remains disabled without real auth.
import {createServer} from "node:http";
import {Pool} from "pg";
import {createStripeWebhookHandler} from "../lib/stripe-webhook-handler.mjs";
import {createCheckoutHttpHandler} from "../lib/checkout-http-handler.mjs";
import {createCheckoutService} from "../lib/checkout-service.mjs";
import {createNeonCheckoutAdapters} from "../lib/neon-checkout-adapters.mjs";
import {createNeonCatalogLoader} from "../lib/neon-catalog-loader.mjs";
import {createStripeTestSessionAdapter} from "../lib/stripe-test-session.mjs";
import {createOidcMemberVerifier} from "../lib/oidc-member-verifier.mjs";
import {createOidcOwnerVerifier} from "../lib/oidc-owner-verifier.mjs";
import {createOwnerCatalogApproval} from "../lib/owner-catalog-approval.mjs";
import {createOwnerCatalogHttpHandler} from "../lib/owner-catalog-http-handler.mjs";

const {DATABASE_URL,STRIPE_WEBHOOK_SECRET,STRIPE_TEST_SECRET_KEY,PORT="8788",HOST="127.0.0.1",CHECKOUT_ORIGIN="https://orangeaesthetics.com"}=process.env;
if(!DATABASE_URL||!STRIPE_WEBHOOK_SECRET||process.env.STRIPE_LIVEMODE==="true"){
 throw new Error("Development runtime requires DATABASE_URL, STRIPE_WEBHOOK_SECRET and Stripe test mode");
}
// This is a local development runtime, not a publicly deployable webhook server.
// Reject accidental wildcard or LAN binding before opening a database connection.
if(!["127.0.0.1","::1","localhost"].includes(HOST)){
 throw new Error("Development runtime must bind to loopback only");
}
if(!/^\\d+$/.test(String(PORT))||Number(PORT)<1||Number(PORT)>65535){
 throw new Error("Invalid development runtime port");
}
// Prevent the local test webhook runtime from modifying the production branch.
// This hostname is the Neon development compute, verified against its branch ID.
const developmentDatabaseHost="ep-young-rain-bfjamlfd.c-5.us-west-2.aws.neon.tech";
let databaseAddress;
try{databaseAddress=new URL(DATABASE_URL)}catch{throw new Error("Invalid development database URL")}
if(databaseAddress.protocol!=="postgresql:"||databaseAddress.hostname!==developmentDatabaseHost||
   databaseAddress.pathname!=="/neondb"||databaseAddress.port||
   databaseAddress.searchParams.get("sslmode")==="disable"){
 throw new Error("Development runtime requires the approved Neon development database");
}
const pool=new Pool({connectionString:DATABASE_URL,ssl:{rejectUnauthorized:true},max:3,connectionTimeoutMillis:5000,statement_timeout:10000});
const execute=(text,values)=>pool.query(text,values);
const webhook=createStripeWebhookHandler({secret:STRIPE_WEBHOOK_SECRET,execute,expectedLivemode:false});
const db=createNeonCheckoutAdapters({query:execute});
const loadCatalog=createNeonCatalogLoader({query:execute,approvedSkus:(process.env.CHECKOUT_APPROVED_SKUS??"").split(",").filter(Boolean)});
const createStripeSession=STRIPE_TEST_SECRET_KEY?createStripeTestSessionAdapter({secretKey:STRIPE_TEST_SECRET_KEY}):async()=>{throw new Error("Stripe test checkout not configured")};
const startCheckout=createCheckoutService({reserveOrder:db.reserveOrder,attachCheckout:db.attachCheckout,createStripeSession,approvedOrigin:CHECKOUT_ORIGIN,enabled:false});
const oidcReady=Boolean(process.env.OIDC_ISSUER&&process.env.OIDC_AUDIENCE&&process.env.OIDC_JWKS_URL);
const verifySession=oidcReady?createOidcMemberVerifier({issuer:process.env.OIDC_ISSUER,audience:process.env.OIDC_AUDIENCE,jwksUrl:process.env.OIDC_JWKS_URL,query:execute}):async()=>null;
const checkout=createCheckoutHttpHandler({
 // Explicit operator approval remains necessary even when OIDC is configured.
 verifySession,
 loadCatalog,startCheckout,origin:CHECKOUT_ORIGIN,enabled:false
});
const verifyOwner=oidcReady?createOidcOwnerVerifier({issuer:process.env.OIDC_ISSUER,audience:process.env.OIDC_AUDIENCE,jwksUrl:process.env.OIDC_JWKS_URL,query:execute}):async()=>null;
const approveCatalog=createOwnerCatalogApproval({query:execute,verifyOwner});
// Intentionally disabled until the owner identity provider and deployment are validated.
const ownerApproval=createOwnerCatalogHttpHandler({approveCatalog,origin:CHECKOUT_ORIGIN,enabled:false});
const server=createServer(async(req,res)=>{
 const handler=req.url==="/api/stripe/webhook"?webhook:req.url==="/api/checkout"?checkout:req.url==="/api/owner/catalog-approval"?ownerApproval:null;
 if(!handler){res.writeHead(404);res.end();return;}
 let bytes=0;const chunks=[],limit=req.url==="/api/stripe/webhook"?65536:2048;
 try{
  for await(const chunk of req){bytes+=chunk.length;if(bytes>limit){res.writeHead(413);res.end();return;}chunks.push(chunk);}
  const output=await handler({method:req.method,headers:req.headers,rawBody:Buffer.concat(chunks).toString("utf8")});
  res.writeHead(output.status,output.headers);res.end(output.body);
 }catch{res.writeHead(503,{"cache-control":"no-store"});res.end();}
});
server.listen(Number(PORT),HOST,()=>console.log("Development runtime listening on "+HOST+":"+PORT));
const stop=()=>server.close(()=>pool.end().finally(()=>process.exit(0)));
process.on("SIGINT",stop);process.on("SIGTERM",stop);
