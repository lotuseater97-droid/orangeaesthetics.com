import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../../appointment-request.html',import.meta.url),'utf8');
const handler=readFileSync(new URL('../../functions/api/appointment-request.js',import.meta.url),'utf8');
test('appointment form service choices exactly match API allowlist',()=>{
  const select=page.match(/<select\b[^>]*id="service"[^>]*>([\s\S]*?)<\/select>/i);
  assert.ok(select,'service select must exist');
  const options=[...select[1].matchAll(/<option\b[^>]*value="([^"]*)"/g)].map(match=>match[1]).filter(Boolean);
  const allowed=handler.match(/const allowed\s*=\s*new Set\(\[([^\]]+)\]\)/);
  assert.ok(allowed,'API service allowlist must exist');
  const api=[...allowed[1].matchAll(/"([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual([...new Set(options)].sort(),[...new Set(api)].sort());
  assert.equal(options.length,new Set(options).size,'no duplicate service options');
});
test('appointment form submits only contact fields',()=>{
  const form=page.match(/<form\b[^>]*id="appointment-form"[^>]*>([\s\S]*?)<\/form>/i);
  assert.ok(form);
  const names=[...form[1].matchAll(/<(?:input|select|textarea)\b[^>]*name="([^"]+)"/gi)].map(match=>match[1]);
  assert.deepEqual(names.sort(),['name','email','phone','service','website'].sort());
});
