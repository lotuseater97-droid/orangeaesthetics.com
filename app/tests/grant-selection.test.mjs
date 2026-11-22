import test from "node:test";import assert from "node:assert/strict";import {chooseEligibleGrant} from "../lib/grant-selection.mjs";
const now="2026-11-22T12:00:00Z";
const grant=(id,expires_at,other={})=>({id,status:"paid",quantity:1,valid_from:"2026-11-01T00:00:00Z",expires_at,...other});
test("earliest expiring paid unspent grant is selected",()=>assert.equal(chooseEligibleGrant({grants:[grant("later","2027-01-01T00:00:00Z"),grant("first","2026-12-01T00:00:00Z")],redemptions:[],now}),"first"));
test("unpaid, expired and fully spent grants are excluded",()=>assert.equal(chooseEligibleGrant({grants:[grant("unpaid","2026-12-01T00:00:00Z",{status:"unpaid"}),grant("expired","2026-11-01T00:00:00Z"),grant("spent","2026-12-01T00:00:00Z")],redemptions:[{grant_id:"spent",status:"confirmed"}],now}),null));
test("multiple credits allow only remaining quantity",()=>assert.equal(chooseEligibleGrant({grants:[grant("multi","2026-12-01T00:00:00Z",{quantity:2})],redemptions:[{grant_id:"multi",status:"confirmed"}],now}),"multi"));
test("invalid timestamps and inputs fail closed",()=>{assert.throws(()=>chooseEligibleGrant({grants:[],redemptions:[],now:"invalid"}));assert.equal(chooseEligibleGrant({grants:[grant("bad","invalid")],redemptions:[],now}),null)});
