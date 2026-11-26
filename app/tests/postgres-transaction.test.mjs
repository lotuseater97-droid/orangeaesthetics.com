import test from "node:test";
import assert from "node:assert/strict";
import {postgresTransaction} from "../lib/postgres-transaction.mjs";
function fakePool(fail){const calls=[];let releases=0;const client={query:async(sql,params)=>{calls.push([sql,params]);if(fail&&sql===fail)throw new Error("failure");return {rows:[{ok:true}]}},release:()=>{releases++}};return {pool:{connect:async()=>client},calls,releases:()=>releases}}
test("transaction commits using the same bound client and releases it",async()=>{const db=fakePool();const result=await postgresTransaction(db.pool)(query=>query("SELECT $1",[7]));assert.deepEqual(result.rows,[{ok:true}]);assert.deepEqual(db.calls.map(c=>c[0]),["BEGIN","SELECT set_config('statement_timeout', $1, true)","SELECT $1","COMMIT"]);assert.deepEqual(db.calls[2][1],[7]);assert.equal(db.releases(),1)});
test("failed operations roll back and release the client",async()=>{const db=fakePool("SELECT fail");await assert.rejects(postgresTransaction(db.pool)(query=>query("SELECT fail")),/failure/);assert.deepEqual(db.calls.map(c=>c[0]),["BEGIN","SELECT set_config('statement_timeout', $1, true)","SELECT fail","ROLLBACK"]);assert.equal(db.releases(),1)});
test("failed commit discards connection without attempting an unsafe rollback",async()=>{const calls=[],released=[];const client={query:async sql=>{calls.push(sql);if(sql==="COMMIT")throw new Error("uncertain commit")},release:discard=>released.push(discard)};await assert.rejects(postgresTransaction({connect:async()=>client})(async()=>42),/uncertain commit/);assert.deepEqual(calls,["BEGIN","SELECT set_config('statement_timeout', $1, true)","COMMIT"]);assert.deepEqual(released,[true])});
test("rejects missing trusted database pool and callback",async()=>{assert.throws(()=>postgresTransaction(null),TypeError);const db=fakePool();await assert.rejects(postgresTransaction(db.pool)(null),TypeError);assert.equal(db.calls.length,0)});

test("invalid client with release is discarded",async()=>{
 const released=[];
 await assert.rejects(postgresTransaction({connect:async()=>({release:discard=>released.push(discard)})})(async()=>{}),TypeError);
 assert.deepEqual(released,[true]);
});
test("rollback failure discards connection and preserves original error",async()=>{
 const released=[],events=[];
 const original=new Error("insert failed");
 const client={query:async sql=>{events.push(sql);if(sql==="INSERT")throw original;if(sql==="ROLLBACK")throw new Error("rollback failed")},release:discard=>released.push(discard)};
 await assert.rejects(postgresTransaction({connect:async()=>client})(query=>query("INSERT")),error=>error===original&&error.rollbackError.message==="rollback failed");
 assert.deepEqual(events,["BEGIN","SELECT set_config('statement_timeout', $1, true)","INSERT","ROLLBACK"]);
 assert.deepEqual(released,[true]);
});

test("transaction query handles expire before commit and after rollback",async()=>{
 const db=fakePool();let retained;
 await postgresTransaction(db.pool)(async query=>{retained=query;await query("SELECT 1")});
 assert.throws(()=>retained("SELECT forbidden"),/expired/);
 assert.deepEqual(db.calls.map(x=>x[0]),["BEGIN","SELECT set_config('statement_timeout', $1, true)","SELECT 1","COMMIT"]);
 const failed=fakePool();let expired;
 await assert.rejects(postgresTransaction(failed.pool)(query=>{expired=query;throw new Error("stop")}),/stop/);
 assert.throws(()=>expired("SELECT forbidden"),/expired/);
 assert.deepEqual(failed.calls.map(x=>x[0]),["BEGIN","SELECT set_config('statement_timeout', $1, true)","ROLLBACK"]);
});

test("failed BEGIN discards connection without running work or rollback",async()=>{
 const statements=[],releases=[];
 const client={query:async sql=>{statements.push(sql);throw new Error("begin failed")},release:discard=>releases.push(discard)};
 let executed=false;
 await assert.rejects(postgresTransaction({connect:async()=>client})(async()=>{executed=true}),/begin failed/);
 assert.equal(executed,false);
 assert.deepEqual(statements,["BEGIN"]);
 assert.deepEqual(releases,[true]);
});

test("unawaited failed query prevents commit even after settlement",async()=>{
 const db=fakePool("SELECT fail");
 await assert.rejects(postgresTransaction(db.pool)(async query=>{query("SELECT fail");await new Promise(resolve=>setImmediate(resolve))}),/failure/);
 assert.deepEqual(db.calls.map(c=>c[0]),["BEGIN","SELECT set_config('statement_timeout', $1, true)","SELECT fail","ROLLBACK"]);
});
test("pending successful query finishes before commit",async()=>{
 const events=[];let finish;
 const client={query:async sql=>{events.push(sql);if(sql==="SELECT slow"){await new Promise(resolve=>{finish=resolve});events.push("finished")}},release:()=>events.push("release")};
 const result=postgresTransaction({connect:async()=>client})(async query=>{query("SELECT slow");return 42});
 await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(events,["BEGIN","SELECT set_config('statement_timeout', $1, true)","SELECT slow"]);finish();assert.equal(await result,42);assert.deepEqual(events,["BEGIN","SELECT set_config('statement_timeout', $1, true)","SELECT slow","finished","COMMIT","release"]);
});

test("timeout is parameterized and local",async()=>{const db=fakePool();await postgresTransaction(db.pool,{statementTimeoutMs:3000})(async()=>42);assert.deepEqual(db.calls[1],["SELECT set_config('statement_timeout', $1, true)",["3000"]]);assert.throws(()=>postgresTransaction(db.pool,{statementTimeoutMs:0}),RangeError)});
