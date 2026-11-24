import test from "node:test";import assert from "node:assert/strict";import {createPostgresTransactionRunner} from "../lib/postgres-transaction-runner.mjs";
const fixture=(failSql)=>{const calls=[];let releases=0;const client={query:async(text,values)=>{calls.push({text,values});if(text===failSql)throw Error("query failure");return {rows:[{id:"record1"}]}},release:()=>{releases++}};const pool={connect:async()=>client};return {run:createPostgresTransactionRunner({pool}),calls,get releases(){return releases}}};
test("commits successful operations on the same client",async()=>{const f=fixture();const result=await f.run(async tx=>(await tx.query("SELECT $1 AS id",["record1"])).rows[0]);assert.equal(result.id,"record1");assert.deepEqual(f.calls.map(x=>x.text),["BEGIN","SELECT $1 AS id","COMMIT"]);assert.deepEqual(f.calls[1].values,["record1"]);assert.equal(f.releases,1)});
test("rolls back when the operation fails",async()=>{const f=fixture("INSERT INTO audit");await assert.rejects(()=>f.run(async tx=>tx.query("INSERT INTO audit")),/query failure/);assert.deepEqual(f.calls.map(x=>x.text),["BEGIN","INSERT INTO audit","ROLLBACK"]);assert.equal(f.releases,1)});
test("rolls back if commit fails",async()=>{const f=fixture("COMMIT");await assert.rejects(()=>f.run(async()=>true),/query failure/);assert.deepEqual(f.calls.map(x=>x.text),["BEGIN","COMMIT","ROLLBACK"]);assert.equal(f.releases,1)});
test("callback errors trigger rollback and release",async()=>{const f=fixture();await assert.rejects(()=>f.run(async()=>{throw Error("audit failed")}),/audit failed/);assert.deepEqual(f.calls.map(x=>x.text),["BEGIN","ROLLBACK"]);assert.equal(f.releases,1)});
test("failed BEGIN does not attempt rollback",async()=>{const f=fixture("BEGIN");await assert.rejects(()=>f.run(async()=>true),/query failure/);assert.deepEqual(f.calls.map(x=>x.text),["BEGIN"]);assert.equal(f.releases,1)});
test("rollback failure reports both errors",async()=>{const calls=[];let released=false;const run=createPostgresTransactionRunner({pool:{connect:async()=>({query:async sql=>{calls.push(sql);if(sql==="ROLLBACK")throw Error("rollback failed")},release:()=>{released=true}})}});await assert.rejects(()=>run(async()=>{throw Error("write failed")}),AggregateError);assert.deepEqual(calls,["BEGIN","ROLLBACK"]);assert.equal(released,true)});
test("invalid pool fails before starting",()=>assert.throws(()=>createPostgresTransactionRunner({pool:{}}),TypeError));

test("transaction runner releases clients with no query method",async()=>{
 let releases=0;
 const runner=createPostgresTransactionRunner({pool:{connect:async()=>({release(){releases++}})}});
 await assert.rejects(runner(async()=>{}),TypeError);
 assert.equal(releases,1);
});
