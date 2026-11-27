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

test("purchase demo records independent partial amounts",()=>{
 assert.match(html,/received:\[\],invoiced:\[\]/);
 assert.match(html,/receipts:activeAmounts\(p,"received"\)\.map/);
 assert.match(html,/invoices:activeAmounts\(p,"invoiced"\)\.map/);
 assert.match(html,/p\[to\]\.push\(cents\)/);
 assert.doesNotMatch(html,/p\.received=true|p\.invoiced=true/);
});

test("purchasing uses inline forms and displays recorded amounts",()=>{
 assert.match(html,/form data-purchase=/);
 assert.match(html,/form\.elements\.amount\.value/);
 assert.match(html,/purchaseForm\(p\)/);
 assert.doesNotMatch(html,/window\.prompt/);
});

test("purchase corrections preserve originals and exclude voided amounts",()=>{
 const source=html.match(/const activeAmounts=(.*);/)[1];
 const activeAmounts=Function("return ("+source+")")();
 const p={received:[100,200,100],invoiced:[100],corrections:[{kind:"received",index:0,reason:"Duplicate"}]};
 assert.deepEqual(activeAmounts(p,"received"),[200,100]);
 assert.deepEqual(activeAmounts(p,"invoiced"),[100]);
 assert.deepEqual(p.received,[100,200,100]);
 assert.match(html,/p\.corrections\.push\(/);
 assert.match(html,/data-correction=/);
});

test("sample vendor settlements are bounded by invoice balance and block invoice void",()=>{
 assert.match(html,/data-settlement=/);
 assert.match(html,/cents>invoice\.balance_cents/);
 assert.match(html,/state\.vendorPayments\.push/);
 assert.match(html,/Cannot void an invoice with a recorded settlement/);
 assert.match(html,/Payment history/);
});

test("staff schedule uses shared overlap and break validation",()=>{
 assert.match(html,/data-view="staff"/);
 assert.match(html,/id="new-shift"/);
 assert.match(html,/reviewTimeEntries\(\[\.\.\.state\.shifts,entry\]\)/);
 assert.match(html,/result\.issues\.length/);
 assert.match(html,/Scheduled hours/);
});

test("shift changes preserve history and validate proposed schedule",()=>{
 assert.match(html,/data-edit-shift=/);
 assert.match(html,/data-cancel-shift=/);
 assert.match(html,/reviewTimeEntries\(proposed\)/);
 assert.match(html,/state\.shiftHistory\.push/);
 assert.match(html,/Shift change history/);
});
