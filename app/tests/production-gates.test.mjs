import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const gatedFactories = [
 ['startCheckout','createCheckoutService'],
 ['checkout','createCheckoutHttpHandler'],
 ['ownerApproval','createOwnerCatalogHttpHandler'],
 ['memberHistory','createMemberOrderHistoryHandler'],
 ['memberBenefits','createMemberBenefitsHandler']
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

test('development runtime is pinned to its Neon development compute before connecting',async()=>{
 const source=await readFile(new URL('../server/index.mjs',import.meta.url),'utf8');
 assert.match(source,/developmentDatabaseHost="ep-young-rain-bfjamlfd\.c-5\.us-west-2\.aws\.neon\.tech"/);
 assert.match(source,/databaseAddress\.hostname!==developmentDatabaseHost/);
 assert.match(source,/databaseAddress\.pathname!=="\/neondb"/);
 assert.ok(source.indexOf('Development runtime requires the approved Neon development database')<source.indexOf('const pool=new Pool('));
});

test('development server port guard accepts numeric ports and rejects nonnumeric values',async()=>{
 const source=await readFile(new URL('../server/index.mjs',import.meta.url),'utf8');
 const guard=source.match(/if\(!\/(.*?)\/\.test\(String\(PORT\)\)\|\|Number\(PORT\)<1\|\|Number\(PORT\)>65535\)/);
 assert.ok(guard,'expected port guard');
 const digits=new RegExp(guard[1]);
 assert.equal(digits.test('8788'),true);
 assert.equal(digits.test('443'),true);
 assert.equal(digits.test('abc'),false);
 assert.equal(digits.test('8x'),false);
});

test('member order history is wired only to its private route',async()=>{
 const source=await readFile(new URL('../server/index.mjs',import.meta.url),'utf8');
 assert.match(source,/req\.url==="\/api\/member\/orders"\?memberHistory:null/);
 assert.match(source,/import \{createMemberOrderHistoryHandler\} from "\.\.\/lib\/member-order-history-handler\.mjs"/);
});

test('member benefits route remains private and disabled',async()=>{
 const source=await readFile(new URL('../server/index.mjs',import.meta.url),'utf8');
 assert.match(source,/req\.url==="\/api\/member\/benefits"\?memberBenefits:null/);
 assert.match(source,/import \{createMemberBenefitsHandler\} from "\.\.\/lib\/member-benefits-handler\.mjs"/);
});
