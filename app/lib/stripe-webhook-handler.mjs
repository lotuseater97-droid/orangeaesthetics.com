// Server-only Node.js webhook handler factory. Not deployed by the assets-only Worker.
// Supply a verified server-side database executor: async (sql, params) => { rows }.
// The executor must use a private, TLS-protected Neon connection and a dedicated
// least-privilege role. Never expose it or the Stripe secret to a browser.
import {parseVerifiedStripeEvent} from "./webhook-signature.mjs";
import {paidCheckoutCandidate} from "./paid-checkout-policy.mjs";

const reply=(status,message)=>({status,headers:{"content-type":"application/json","cache-control":"no-store"},body:JSON.stringify({message})});
export function createStripeWebhookHandler({secret,execute,expectedLivemode=false,maxBytes=65536}={}){
 if(typeof secret!=="string"||secret.length<8||typeof execute!=="function")throw new TypeError("Missing server webhook configuration");
 return async function handle({method,headers,rawBody}={}){
  if(method!=="POST")return reply(405,"Method not allowed");
  if(typeof rawBody!=="string"||Buffer.byteLength(rawBody,"utf8")>maxBytes)return reply(413,"Payload too large");
  const signature=headers?.["stripe-signature"]??headers?.get?.("stripe-signature");
  let event;
  try{event=parseVerifiedStripeEvent(rawBody,signature,secret)}catch{return reply(400,"Invalid webhook signature or event")}
  // Fail closed on environment mismatch. Never mix Stripe test and live events.
  if(event.livemode!==expectedLivemode)return reply(400,"Stripe environment mismatch");
  const candidate=paidCheckoutCandidate(event);
  if(!candidate)return reply(200,"Event ignored");
  try{
   // One atomic database call; no member ID, product, or amount from metadata.
   const result=await execute(
    "SELECT orange_app.confirm_paid_checkout($1,$2,$3,$4) AS order_id",
    [candidate.eventId,candidate.checkoutId,candidate.amountCents,candidate.currency]
   );
   if(!result?.rows?.[0]?.order_id)throw new Error("Missing order confirmation");
   return reply(200,"Payment reconciled");
  }catch{
   // Retryable non-2xx. Avoid logging event payloads or treatment details.
   return reply(503,"Payment reconciliation unavailable");
  }
 };
}
