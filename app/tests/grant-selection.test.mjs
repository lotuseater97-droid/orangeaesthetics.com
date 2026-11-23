import test from "node:test";
import assert from "node:assert/strict";
import {chooseEligibleGrant} from "../lib/grant-selection.mjs";

const now="2026-11-22T12:00:00Z", memberId="m1";
const active=(id="s1",other={})=>({id,member_id:memberId,state:"active",payment_verified:true,period_start:"2026-11-01T00:00:00Z",period_end:"2026-12-01T00:00:00Z",...other});
const grant=(id,expires_at,other={})=>({id,member_id:memberId,subscription_id:"s1",status:"paid",quantity:1,valid_from:"2026-11-01T00:00:00Z",expires_at,...other});
const select=(grants,redemptions=[],other={})=>chooseEligibleGrant({grants,redemptions,now,memberId,subscriptions:[active()],...other});

test("earliest expiring eligible grant is selected",()=>assert.equal(select([grant("later","2027-01-01T00:00:00Z"),grant("first","2026-12-01T00:00:00Z")]),"first"));
test("unpaid, expired and fully spent grants excluded",()=>assert.equal(select([grant("unpaid","2026-12-01T00:00:00Z",{status:"unpaid"}),grant("expired","2026-11-01T00:00:00Z"),grant("spent","2026-12-01T00:00:00Z")],[{grant_id:"spent",status:"confirmed"}]),null));
test("quantities are counted instead of number of redemptions",()=>assert.equal(select([grant("multi","2026-12-01T00:00:00Z",{quantity:3})],[{grant_id:"multi",status:"confirmed",quantity:2}]),"multi"));
test("fully consumed multi-credit grant is rejected",()=>assert.equal(select([grant("multi","2026-12-01T00:00:00Z",{quantity:2})],[{grant_id:"multi",status:"confirmed",quantity:2}]),null));
test("invalid timestamps and missing member scope fail closed",()=>{assert.throws(()=>select([] ,[],{now:"invalid"}));assert.equal(select([grant("bad","invalid")]),null);assert.throws(()=>chooseEligibleGrant({grants:[],redemptions:[],now}));});
test("other members cannot use credits even with matching subscription",()=>assert.equal(select([grant("other","2026-11-23T00:00:00Z",{member_id:"m2"}),grant("mine","2026-11-30T00:00:00Z")]),"mine"));
test("unpaid and inactive subscriptions cannot authorize credits",()=>{const grants=[grant("g1","2026-11-30T00:00:00Z")];assert.equal(select(grants,[],{subscriptions:[active("s1",{payment_verified:false})]}),null);assert.equal(select(grants,[],{subscriptions:[active("s1",{state:"past_due"})]}),null);});
test("approved reversals restore a spent grant",()=>{const grants=[grant("g1","2026-11-30T00:00:00Z")],redemptions=[{id:"r1",grant_id:"g1",status:"confirmed",reversed:true}];assert.equal(select(grants,redemptions),null);assert.equal(select(grants,redemptions,{reversals:[{redemption_id:"r1",approved:true}]}),"g1");});
test("member scope without subscriptions throws",()=>assert.throws(()=>chooseEligibleGrant({grants:[],redemptions:[],now,memberId})));
