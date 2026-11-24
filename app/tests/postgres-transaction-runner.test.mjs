import test from "node:test";import assert from "node:assert/strict";import {createPostgresTransactionRunner} from "../lib/postgres-transaction-runner.mjs";
const fixture=(failSql)=>{const calls=[];let releases=0;const client={query:async(text,values)=>{calls.push({text,values});if(text===failSql)throw Error("query failure");return {rows:[{id:"record1"}]}},release:()=>{releases++}};const pool={connect:async()=>client};return {run:createPostgresTransactionRunner({pool}),calls,get releases(){return releases}}};
test("commits successful operations on the same client",async()=>{const f=fixture();const result=await f.run(async tx=>(await tx.query("SELECT $1 AS id",["record1"])).rows[0]);assert.equal(result.id,"record1");assert.deepEqual(f.calls.map(x=>x.text),["BEGIN","SELECT set_config($1,$2,true)","SELECT $1 AS id","COMMIT"]);assert.deepEqual(f.calls[2].values,["record1"]);assert.equal(f.releases,1)});
test("rolls back when the operation fails",async()=>{const f=fixture("INSERT INTO audit");await assert.rejects(()=>f.run(async tx=>tx.query("INSERT INTO audit")),/query failure/);assert.deepEqual(f.calls.map(x=>x.text),["BEGIN","SELECT set_config($1,$2,true)","INSERT INTO audit","ROLLBACK"]);assert.equal(f.releases,1)});
test("discards client after ambiguous commit failure without assuming rollback",async()=>{const calls=[];let released;const run=createPostgresTransactionRunner({pool:{connect:async()=>({query:async sql=>{calls.push(sql);if(sql==="COMMIT")throw Error("commit acknowledgement lost");return {rows:[]}},release:reason=>{released=reason}})}});await assert.rejects(()=>run(async()=>true),/commit acknowledgement lost/);assert.deepEqual(calls,["BEGIN","SELECT set_config($1,$2,true)","COMMIT"]);assert.ok(released instanceof Error)});
test("callback errors trigger rollback and release",async()=>{const f=fixture();await assert.rejects(()=>f.run(async()=>{throw Error("audit failed")}),/audit failed/);assert.deepEqual(f.calls.map(x=>x.text),["BEGIN","SELECT set_config($1,$2,true)","ROLLBACK"]);assert.equal(f.releases,1)});
test("failed BEGIN does not attempt rollback",async()=>{const f=fixture("BEGIN");await assert.rejects(()=>f.run(async()=>true),/query failure/);assert.deepEqual(f.calls.map(x=>x.text),["BEGIN"]);assert.equal(f.releases,1)});
test("rollback failure reports both errors",async()=>{const calls=[];let released=false;const run=createPostgresTransactionRunner({pool:{connect:async()=>({query:async sql=>{calls.push(sql);if(sql==="ROLLBACK")throw Error("rollback failed")},release:()=>{released=true}})}});await assert.rejects(()=>run(async()=>{throw Error("write failed")}),AggregateError);assert.deepEqual(calls,["BEGIN","SELECT set_config($1,$2,true)","ROLLBACK"]);assert.equal(released,true)});
test("invalid pool fails before starting",()=>assert.throws(()=>createPostgresTransactionRunner({pool:{}}),TypeError));

test("transaction runner releases clients with no query method",async()=>{
 let releases=0;
 const runner=createPostgresTransactionRunner({pool:{connect:async()=>({release(){releases++}})}});
 await assert.rejects(runner(async()=>{}),TypeError);
 assert.equal(releases,1);
});

test("rollback failure discards potentially aborted PostgreSQL connection",async()=>{
 let releaseError,queries=[];
 const pool={connect:async()=>({query:async sql=>{queries.push(sql);if(sql==="ROLLBACK")throw Error("rollback failed");},release:error=>{releaseError=error;}})};
 const run=createPostgresTransactionRunner({pool});
 await assert.rejects(()=>run(async()=>{throw Error("write failed")}),AggregateError);
 assert.deepEqual(queries,["BEGIN","SELECT set_config($1,$2,true)","ROLLBACK"]);
 assert.ok(releaseError instanceof Error);
 assert.match(releaseError.message,/discard connection/);
});

test("transaction statement timeout is bounded and transaction-local",async()=>{
 const f=fixture();
 await f.run(async()=>true);
 assert.deepEqual(f.calls[1],{text:"SELECT set_config($1,$2,true)",values:["statement_timeout","15000"]});
 for(const statementTimeoutMs of [0,999,120001,NaN,"5000"]){
  assert.throws(()=>createPostgresTransactionRunner({pool:{connect:async()=>{}},statementTimeoutMs}),RangeError);
 }
});

test("failed BEGIN discards connection because transaction state is uncertain",async()=>{
 let releaseReason;
 const run=createPostgresTransactionRunner({pool:{connect:async()=>({query:async sql=>{if(sql==="BEGIN")throw Error("connection lost during BEGIN")},release:reason=>{releaseReason=reason}})}});
 await assert.rejects(()=>run(async()=>true),/connection lost during BEGIN/);
 assert.ok(releaseReason instanceof Error);
 assert.match(releaseReason.message,/discard connection/);
});

test("transaction query handle cannot be reused after commit",async()=>{
 const f=fixture();let escaped;
 await f.run(async tx=>{escaped=tx.query;await tx.query("SELECT 1")});
 assert.throws(()=>escaped("SELECT 2"),/Transaction query used after completion/);
 assert.deepEqual(f.calls.map(x=>x.text),["BEGIN","SELECT set_config($1,$2,true)","SELECT 1","COMMIT"]);
});
test("transaction query handle cannot be reused after rollback",async()=>{
 const f=fixture();let escaped;
 await assert.rejects(()=>f.run(async tx=>{escaped=tx.query;throw Error("cancel")}),/cancel/);
 assert.throws(()=>escaped("SELECT 2"),/Transaction query used after completion/);
 assert.deepEqual(f.calls.map(x=>x.text),["BEGIN","SELECT set_config($1,$2,true)","ROLLBACK"]);
});

test("unawaited transaction statements finish before commit",async()=>{
 const calls=[];let complete;
 const gate=new Promise(resolve=>{complete=resolve});
 const run=createPostgresTransactionRunner({pool:{connect:async()=>({query:async sql=>{calls.push(sql);if(sql==="UPDATE pending")await gate;return {rows:[]}},release:()=>{}})}});
 const running=run(async tx=>{tx.query("UPDATE pending");return true});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls.includes("COMMIT"),false);
 complete();await running;
 assert.deepEqual(calls.slice(-2),["UPDATE pending","COMMIT"]);
});
test("rejected unawaited statements prevent commit and cause rollback",async()=>{
 const calls=[];
 const run=createPostgresTransactionRunner({pool:{connect:async()=>({query:async sql=>{calls.push(sql);if(sql==="UPDATE pending")throw Error("statement failed");return {rows:[]}},release:()=>{}})}});
 await assert.rejects(()=>run(async tx=>{tx.query("UPDATE pending");return true}),/statement failed/);
 assert.equal(calls.includes("COMMIT"),false);
 assert.equal(calls.at(-1),"ROLLBACK");
});
