import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const gatedFactories = [
 ['startCheckout','createCheckoutService'],
 ['checkout','createCheckoutHttpHandler'],
 ['ownerApproval','createOwnerCatalogHttpHandler']
];
function assertGatesDisabled(source) {
 for (const [variable,factory] of gatedFactories) {
  const pattern = new RegExp('const\\s+'+variable+'\\s*=\\s*'+factory+'\\s*\\(\\s*\\{([\\s\\S]*?)\\}\\s*\\)\\s*;');
  const match = source.match(pattern);
  assert.ok(match,`${factory} must be assigned to ${variable}`);
  assert.match(match[1],/(?:^|,)\s*enabled\s*:\s*false\s*(?:,|$)/,`${factory} must explicitly disable the endpoint`);
 }
}
test('development runtime explicitly disables all payment and owner endpoints',async()=>{
 const source=await readFile(new URL('../server/index.mjs',import.meta.url),'utf8');
 assertGatesDisabled(source);
});
test('deployment guard detects a changed checkout flag',async()=>{
 const source=await readFile(new URL('../server/index.mjs',import.meta.url),'utf8');
 for (const [variable,factory] of gatedFactories) {
  const pattern=new RegExp('(const\\s+'+variable+'\\s*=\\s*'+factory+'\\s*\\(\\s*\\{[\\s\\S]*?enabled\\s*:\\s*)false');
  assert.match(source,pattern);
  const mutated=source.replace(pattern,'$1true');
  assert.throws(()=>assertGatesDisabled(mutated),/must explicitly disable/);
 }
});

test('development runtime refuses non-loopback network binding',async()=>{
 const source=await readFile(new URL('../server/index.mjs',import.meta.url),'utf8');
 assert.match(source,/\["127\.0\.0\.1","::1","localhost"\]\.includes\(HOST\)/);
 assert.match(source,/throw new Error\("Development runtime must bind to loopback only"\)/);
 assert.ok(source.indexOf('Development runtime must bind to loopback only')<source.indexOf('const pool=new Pool('),'network guard must run before database pool initialization');
});
