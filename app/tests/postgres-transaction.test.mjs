import test from "node:test";
import assert from "node:assert/strict";
import {postgresTransaction} from "../lib/postgres-transaction.mjs";
function fakePool(fail){const calls=[];let releases=0;const client={query:async(sql,params)=>{calls.push([sql,params]);if(fail&&sql===fail)throw new Error("failure");return {rows:[{ok:true}]}},release:()=>{releases++}};return {pool:{connect:async()=>client},calls,releases:()=>releases}}
test("transaction commits using the same bound client and releases it",async()=>{const db=fakePool();const result=await postgresTransaction(db.pool)(query=>query("SELECT $1",[7]));assert.deepEqual(result.rows,[{ok:true}]);assert.deepEqual(db.calls.map(c=>c[0]),["BEGIN","SELECT $1","COMMIT"]);assert.deepEqual(db.calls[1][1],[7]);assert.equal(db.releases(),1)});
test("failed operations roll back and release the client",async()=>{const db=fakePool("SELECT fail");await assert.rejects(postgresTransaction(db.pool)(query=>query("SELECT fail")),/failure/);assert.deepEqual(db.calls.map(c=>c[0]),["BEGIN","SELECT fail","ROLLBACK"]);assert.equal(db.releases(),1)});
test("failed commit attempts rollback and release",async()=>{const db=fakePool("COMMIT");await assert.rejects(postgresTransaction(db.pool)(async()=>42),/failure/);assert.deepEqual(db.calls.map(c=>c[0]),["BEGIN","COMMIT","ROLLBACK"]);assert.equal(db.releases(),1)});
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
 assert.deepEqual(events,["BEGIN","INSERT","ROLLBACK"]);
 assert.deepEqual(released,[true]);
});
