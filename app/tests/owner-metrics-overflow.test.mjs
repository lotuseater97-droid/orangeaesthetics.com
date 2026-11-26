import test from "node:test";
import assert from "node:assert/strict";
import {summarizeMoney,inventoryOnHand} from "../lib/owner-metrics.mjs";
const max=Number.MAX_SAFE_INTEGER;
test("owner cash summary calculates exact cents",()=>assert.equal(summarizeMoney({charges:[{amount_cents:10000}],refunds:[{amount_cents:1000}],fees:[{amount_cents:300}],expenses:[{amount_cents:2000}]}).net_cash_before_other_costs_cents,6700));
test("aggregate charges cannot exceed safe integer precision",()=>assert.throws(()=>summarizeMoney({charges:[{amount_cents:max},{amount_cents:1}]}),RangeError));
test("net cash cannot underflow safe integer precision",()=>assert.throws(()=>summarizeMoney({refunds:[{amount_cents:max}],fees:[{amount_cents:1}]}),RangeError));
test("inventory aggregation rejects overflow",()=>assert.throws(()=>inventoryOnHand([{quantity_delta:max},{quantity_delta:1}]),RangeError));
test("negative net cash and signed inventory adjustments remain supported",()=>{assert.equal(summarizeMoney({expenses:[{amount_cents:500}]}).net_cash_before_other_costs_cents,-500);assert.equal(inventoryOnHand([{quantity_delta:10},{quantity_delta:-3}]),7)});
