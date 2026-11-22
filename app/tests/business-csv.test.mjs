import test from "node:test";import assert from "node:assert/strict";import {businessCsv,exportKinds} from "../lib/business-csv.mjs";
test("only allowlisted columns export",()=>{const s=businessCsv("expenses",[{id:"x",vendor_id:"v",category:"supplies",amount_cents:500,incurred_on:"2026-11-22",status:"paid",diagnosis:"secret"}]);assert.equal(s.includes("diagnosis"),false);assert.equal(s.includes("secret"),false);assert.ok(s.includes("500"))});
test("spreadsheet formula injection escaped",()=>{const s=businessCsv("tasks",[{id:"x",title:"=HYPERLINK(1)",status:"open"}]);assert.ok(s.includes("'=HYPERLINK(1)"))});
test("unsupported dataset rejected",()=>assert.throws(()=>businessCsv("patients",[]),RangeError));
test("multiline data rejected",()=>assert.throws(()=>businessCsv("tasks",[{title:"hello\nworld"}]),TypeError));
test("export menu includes finance and inventory",()=>assert.deepEqual(exportKinds(),["invoices","payments","expenses","inventory","tasks"]));
