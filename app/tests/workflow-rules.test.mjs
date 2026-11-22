import test from "node:test";import assert from "node:assert/strict";import {transition,allowedNext,requireIdempotencyKey} from "../lib/workflow-rules.mjs";
test("appointment requires review before confirmation",()=>{assert.throws(()=>transition("appointment","requested","confirmed"),RangeError);assert.equal(transition("appointment","under_review","confirmed").to,"confirmed")});
test("paid invoice cannot silently become draft",()=>assert.throws(()=>transition("invoice","paid","draft"),RangeError));
test("expense must be approved before paid",()=>{assert.throws(()=>transition("expense","submitted","paid"),RangeError);assert.deepEqual(allowedNext("expense","approved"),["paid"])});
test("invalid workflows fail closed",()=>assert.deepEqual(allowedNext("unknown","new"),[]));
test("idempotency key is required for financial writes",()=>{assert.throws(()=>requireIdempotencyKey("abc"),TypeError);assert.equal(requireIdempotencyKey("request_123456789"),"request_123456789")});
