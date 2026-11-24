import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../worker.mjs';
const env={ASSETS:{fetch:async()=>new Response('asset',{status:200})}};
const call=(path,method='GET')=>worker.fetch(new Request('https://orangeaesthetics.com'+path,{method}),env);
test('public HTML and CSS served',async()=>{assert.equal((await call('/index.html')).status,200);assert.equal((await call('/styles.css')).status,200)});
test('internal source and config blocked',async()=>{for(const path of ['/app/schema.sql','/app/package.json','/app/server/package.json','/app/tests/appointment-request.test.mjs','/.env','/.git/config','/PRODUCTION-DEPLOYMENT-CHECKLIST.md','/functions/api/appointment-request.js','/scripts/audit-static-site.mjs','/.github/workflows/static-audit.yml','/wrangler.toml','/MASTER-PLAN.md','/worker.mjs','/app%2fschema.sql'])assert.equal((await call(path)).status,404,path)});
test('unknown API and wrong method rejected',async()=>{assert.equal((await call('/api/unknown')).status,404);assert.equal((await call('/index.html','POST')).status,405);assert.equal((await call('/api/appointment-request','GET')).status,405)});
