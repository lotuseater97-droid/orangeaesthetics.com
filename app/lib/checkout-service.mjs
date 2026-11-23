// Development-only checkout orchestration. NOT a public HTTP endpoint.
// verifiedMemberId MUST come from a validated server session, never a request body.
// reserveOrder must atomically create a pending Neon order + line item from the
// server-approved catalog. attachCheckout must persist the Stripe session ID.
// Stripe session creation is a network side effect: orphan sessions must expire;
// retries must use a stable, server-generated idempotency key.
import {validateCheckoutRequest} from "./checkout-policy.mjs";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function createCheckoutService({reserveOrder,attachCheckout,createStripeSession,approvedOrigin,enabled=false}={}){
 if(typeof reserveOrder!=="function"||typeof attachCheckout!=="function"||typeof createStripeSession!=="function")throw new TypeError("Missing trusted checkout adapters");
 if(typeof approvedOrigin!=="string"||!/^https:\/\//.test(approvedOrigin))throw new TypeError("HTTPS origin required");
 const origin=new URL(approvedOrigin);
 if(origin.origin!==approvedOrigin||origin.username||origin.password)throw new TypeError("Invalid approved origin");
 return async function startCheckout({verifiedMemberId,sku,quantity,catalog}={}){
  if(!uuid.test(verifiedMemberId??""))throw new Error("Authenticated member required");
  const item=validateCheckoutRequest({sku,quantity,catalog,enabled});
  if(!Number.isSafeInteger(item.totalAmount)||item.totalAmount<=0)throw new Error("Invalid order total");
  const order=await reserveOrder({memberId:verifiedMemberId,sku:item.code,quantity:item.quantity,unitAmount:item.unitAmount,currency:"USD"});
  if(!order||!uuid.test(order.id??"")||order.status!=="pending"||order.memberId!==verifiedMemberId||
     order.totalAmount!==item.totalAmount||order.currency!=="USD")throw new Error("Order reservation mismatch");
  const session=await createStripeSession({
   mode:"payment",line_items:[{price_data:{currency:"usd",unit_amount:item.unitAmount,product_data:{name:item.code}},quantity:item.quantity}],
   success_url:origin.origin+"/checkout/success?session_id={CHECKOUT_SESSION_ID}",
   cancel_url:origin.origin+"/checkout/cancel",
   client_reference_id:order.id,
   // No patient names, treatment details, medical history or email in metadata.
   metadata:{order_id:order.id}
  },{idempotencyKey:"checkout-"+order.id});
  let paymentUrl;
  try{paymentUrl=new URL(session?.url)}catch{throw new Error("Invalid Stripe test session")}
  if(typeof session?.id!=="string"||!/^cs_test_[A-Za-z0-9_]+$/.test(session.id)||
     paymentUrl.protocol!=="https:"||paymentUrl.hostname!=="checkout.stripe.com"||
     paymentUrl.username||paymentUrl.password||paymentUrl.port||paymentUrl.hash||
     paymentUrl.pathname!=="/c/pay/"+session.id)throw new Error("Invalid Stripe test session");
  const attached=await attachCheckout({orderId:order.id,checkoutId:session.id,memberId:verifiedMemberId});
  if(attached!==true)throw new Error("Checkout session attachment not confirmed");
  return Object.freeze({url:session.url});
 };
}
