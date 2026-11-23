import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=new URL('../../',import.meta.url);
const wrangler=readFileSync(new URL('wrangler.toml',root),'utf8');
const worker=readFileSync(new URL('worker.mjs',root),'utf8');
const rules=readFileSync(new URL('.assetsignore',root),'utf8').split(/\r?\n/).map(s=>s.trim());
test('Wrangler uses the Worker entrypoint, not an assets-only deployment',()=>{
  assert.match(wrangler,/^main\s*=\s*["']worker\.mjs["']/m);
  assert.match(wrangler,/^\[assets\]$/m);
  assert.match(wrangler,/^binding\s*=\s*["']ASSETS["']/m);
  assert.match(wrangler,/^run_worker_first\s*=\s*true$/m);
});
test('Worker routes contact-only appointment POST before asset lookup',()=>{
  assert.match(worker,/import\s*\{\s*onRequestPost\s*\}\s*from\s*['"]\.\/functions\/api\/appointment-request\.js['"]/);
  const route=worker.indexOf("path === '/api/appointment-request'");
  const assets=worker.indexOf('env.ASSETS.fetch(request)');
  assert.ok(route>=0&&assets>route,'appointment requests must reach the API handler before assets');
});
test('Worker entrypoint and API handler are excluded from public assets',()=>{
  for(const rule of ['worker.mjs','functions/','scripts/','app/'])assert.ok(rules.includes(rule),rule);
});
