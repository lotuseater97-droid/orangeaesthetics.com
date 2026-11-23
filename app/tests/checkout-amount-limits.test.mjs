import test from "node:test";
import assert from "node:assert/strict";
import {validateCheckoutRequest} from "../lib/checkout-policy.mjs";
const base={sku:"test_item",quantity:1,enabled:true,catalog:{status:"approved",items:[{code:"test_item",active:true,payment_eligible:true,requires_clinical_review:false,price_cents:9900,currency:"usd"}]}};
test("approved small checkout calculates exact cents",()=>assert.equal(validateCheckoutRequest(base).totalAmount,9900));
test("rejects order exceeding the checkout amount ceiling",()=>assert.throws(()=>validateCheckoutRequest({...base,quantity:10,catalog:{...base.catalog,items:[{...base.catalog.items[0],price_cents:10000000}]}}),/exceeds checkout limit/));
test("rejects unsafe integer multiplication",()=>assert.throws(()=>validateCheckoutRequest({...base,quantity:10,catalog:{...base.catalog,items:[{...base.catalog.items[0],price_cents:Number.MAX_SAFE_INTEGER}]}}),/exceeds checkout limit/));
test("rejects disabled checkout before catalog evaluation",()=>assert.throws(()=>validateCheckoutRequest({...base,enabled:false}),/Checkout disabled/));

test('rejects catalog items without explicit clinical-review clearance',()=>{
 for(const value of [undefined,null,'false',0]){
  const item={...base.catalog.items[0],requires_clinical_review:value};
  assert.throws(()=>validateCheckoutRequest({...base,catalog:{...base.catalog,items:[item]}}),/not eligible/);
 }
});
