// Server-only Stripe TEST Checkout Sessions adapter. Never import into browser code.
export function createStripeTestSessionAdapter({secretKey,fetchImpl=fetch}={}){
 if(typeof secretKey!=="string"||!/^sk_test_[A-Za-z0-9]+$/.test(secretKey))throw new Error("Stripe test secret required");
 if(typeof fetchImpl!=="function")throw new TypeError("Fetch implementation required");
 return async function createStripeSession(params,{idempotencyKey}={}){
  if(params?.mode!=="payment"||!Array.isArray(params.line_items)||params.line_items.length!==1||
     !/^checkout-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey??""))throw new Error("Invalid checkout request");
  const line=params.line_items[0],price=line.price_data;
  if(!Number.isSafeInteger(price?.unit_amount)||price.unit_amount<=0||
     price.currency!=="usd"||!Number.isSafeInteger(line.quantity)||line.quantity<1||line.quantity>10||
     !Number.isSafeInteger(price.unit_amount*line.quantity)||price.unit_amount*line.quantity>99999999||
     !/^[a-z0-9_]{3,80}$/.test(price.product_data?.name??"")||
     !/^https:\/\//.test(params.success_url??"")||!/^https:\/\//.test(params.cancel_url??"")||
     !/^[0-9a-f-]{36}$/i.test(params.client_reference_id??"")||
     params.metadata?.order_id!==params.client_reference_id||
     idempotencyKey!=="checkout-"+params.client_reference_id)throw new Error("Invalid checkout fields");
  const body=new URLSearchParams();
  body.set("mode","payment");
  body.set("line_items[0][price_data][currency]","usd");
  body.set("line_items[0][price_data][unit_amount]",String(price.unit_amount));
  body.set("line_items[0][price_data][product_data][name]",price.product_data.name);
  body.set("line_items[0][quantity]",String(line.quantity));
  body.set("success_url",params.success_url);
  body.set("cancel_url",params.cancel_url);
  body.set("client_reference_id",params.client_reference_id);
  body.set("metadata[order_id]",params.client_reference_id);
  const result=await fetchImpl("https://api.stripe.com/v1/checkout/sessions",{
   method:"POST",redirect:"error",
   headers:{"authorization":"Bearer "+secretKey,"content-type":"application/x-www-form-urlencoded","idempotency-key":idempotencyKey},
   body:body.toString(),signal:AbortSignal.timeout(10000)
  });
  if(!result.ok)throw new Error("Stripe test checkout unavailable");
  const data=await result.json();
  let checkoutUrl;
  try{checkoutUrl=new URL(data?.url)}catch{throw new Error("Invalid Stripe response")}
  if(typeof data?.id!=="string"||!/^cs_test_[A-Za-z0-9_]+$/.test(data.id)||
     checkoutUrl.protocol!=="https:"||checkoutUrl.hostname!=="checkout.stripe.com"||
     checkoutUrl.username||checkoutUrl.password||checkoutUrl.port||checkoutUrl.hash||
     !checkoutUrl.pathname.startsWith("/c/pay/"+data.id))throw new Error("Invalid Stripe response");
  return {id:data.id,url:data.url};
 };
}
