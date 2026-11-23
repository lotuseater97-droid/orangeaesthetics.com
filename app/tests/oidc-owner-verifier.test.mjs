import test from "node:test";
import assert from "node:assert/strict";
import {createOidcOwnerVerifier} from "../lib/oidc-owner-verifier.mjs";
const config={issuer:"https://auth.example.test",audience:"orange-private-api",jwksUrl:"https://auth.example.test/.well-known/jwks.json"};
test("missing bearer token never queries owner roles",async()=>{
 const verify=createOidcOwnerVerifier({...config,query:async()=>{throw Error("DB access not expected")}});
 assert.equal(await verify({headers:{}}),null);
 assert.equal(await verify({headers:{authorization:"Bearer invalid token"}}),null);
});
test("rejects insecure or cross-origin JWKS",()=>{
 assert.throws(()=>createOidcOwnerVerifier({...config,jwksUrl:"https://attacker.example.test/keys",query:async()=>{}}),/Invalid OIDC/);
 assert.throws(()=>createOidcOwnerVerifier({...config,issuer:"http://auth.example.test",query:async()=>{}}),/Invalid OIDC/);
});
