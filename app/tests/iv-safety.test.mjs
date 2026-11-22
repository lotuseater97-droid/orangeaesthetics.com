import test from "node:test";import assert from "node:assert/strict";import {evaluateIvSelection} from "../lib/iv-safety.mjs";
const base={status:"approved",formulationVersion:"v1",items:[{id:"hydration",type:"base"},{id:"glutathione",type:"addon"},{id:"nad",type:"base"}],rules:[]};
const check=(selected,policy=base,clinicalClearance=true)=>evaluateIvSelection({selected,policy,clinicalClearance,formulationVersion:"v1"});
test("draft policy blocks all selections",()=>assert.equal(check(["hydration"],{...base,status:"draft"}).allowed,false));
test("patient clearance is mandatory",()=>assert.equal(check(["hydration"],base,false).allowed,false));
test("unreviewed combinations are blocked",()=>assert.equal(check(["hydration","glutathione"]).allowed,false));
test("multiple base infusions are blocked",()=>assert.equal(check(["hydration","nad"]).allowed,false));
test("approved documented pair can reach clinician order state",()=>{const policy={...base,rules:[{a:"hydration",b:"glutathione",status:"approved",formulationVersion:"v1",administration:"same_bag",reviewedBy:"Pharmacy reviewer",sourceReference:"reviewed-source",effectiveDate:"2026-11-21"}]};assert.equal(check(["hydration","glutathione"],policy).status,"eligible_for_clinician_order")});
test("sequential-only pair cannot be automatically combined",()=>{const policy={...base,rules:[{a:"hydration",b:"glutathione",status:"approved",formulationVersion:"v1",administration:"sequential_only",reviewedBy:"Pharmacy reviewer",sourceReference:"reviewed-source",effectiveDate:"2026-11-21"}]};assert.equal(check(["hydration","glutathione"],policy).allowed,false)});
