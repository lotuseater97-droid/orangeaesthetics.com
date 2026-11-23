// Private Neon checkout adapters. Database role must have narrowly scoped EXECUTE
// privileges only. Never accept a member ID from a browser without verified auth.
export function createNeonCheckoutAdapters({query}={}){
 if(typeof query!=="function")throw new TypeError("Neon query adapter required");
 return {
  async reserveOrder({memberId,sku,quantity,unitAmount,currency}){
   if(currency!=="USD")throw new Error("Unsupported currency");
   const result=await query("SELECT * FROM orange_app.reserve_checkout_order($1,$2,$3,$4)",[memberId,sku,quantity,unitAmount]);
   const row=result?.rows?.[0];
   if(!row)throw new Error("Order reservation failed");
   const totalAmount=Number(row.total_cents);
   if(!Number.isSafeInteger(totalAmount)||totalAmount<1||totalAmount>99999999)throw new Error("Invalid reserved order amount");
   return {id:row.id,status:row.status,memberId:row.member_id,totalAmount,currency:row.currency?.trim()};
  },
  async attachCheckout({orderId,checkoutId,memberId}){
   const result=await query("SELECT orange_app.attach_checkout_session($1,$2,$3) AS attached",[orderId,memberId,checkoutId]);
   if(result?.rows?.[0]?.attached!==true)throw new Error("Checkout session not attached");
   return true;
  }
 };
}
