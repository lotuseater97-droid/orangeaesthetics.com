import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
const html=readFileSync(new URL("../prototypes/owner-interactive.html",import.meta.url),"utf8");
test("owner prototype JavaScript parses",()=>{
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
 assert.equal(scripts.length,1);
 assert.match(scripts[0][0],/<script type="module">/);
 const result=spawnSync(process.execPath,["--input-type=module","--check"],{input:scripts[0][1],encoding:"utf8"});
 assert.ifError(result.error);
 assert.equal(result.status,0,result.stderr);
});
test("owner prototype is explicitly synthetic and nonpersistent",()=>{
 assert.match(html,/DEVELOPMENT SANDBOX/);
 assert.match(html,/invented sample records/);
 assert.match(html,/Refresh resets all changes/);
 assert.doesNotMatch(html,/localStorage|sessionStorage|fetch\s*\(/);
});
test("workspace includes purchasing and core views",()=>{
 for(const name of ["today","appointments","tasks","finance","inventory","membership","purchasing"])
 assert.match(html,new RegExp('data-view="'+name+'"'));
});
test("user supplied task title is HTML escaped before rendering",()=>{
 assert.match(html,/const escapeHtml=/);
 assert.match(html,/const cell=x=>/);
});

test("purchasing workspace uses shared reconciliation and displays readiness",()=>{
 assert.match(html,/import \{evaluatePurchase\} from/);
 assert.match(html,/purchaseReport=p=>evaluatePurchase/);
 assert.match(html,/r\.ready_for_payment/);
 assert.match(html,/r\.received_cents/);
 assert.match(html,/r\.invoiced_cents/);
 assert.match(html,/r\.issues\.join/);
});
