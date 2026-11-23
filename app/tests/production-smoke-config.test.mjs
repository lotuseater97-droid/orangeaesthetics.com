import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const script = fileURLToPath(new URL('../../scripts/smoke-production.mjs', import.meta.url));
for (const SITE_URL of [
  'http://orangeaesthetics.com',
  'https://user:secret@orangeaesthetics.com',
  'https://orangeaesthetics.com/other',
  'https://orangeaesthetics.com/?token=abc',
  'https://orangeaesthetics.com/#fragment'
]) {
  test(`smoke script rejects unsafe SITE_URL: ${SITE_URL.replace('secret','***')}`, () => {
    const result = spawnSync(process.execPath, [script], { env: {...process.env, SITE_URL}, encoding:'utf8', timeout:5000 });
    assert.equal(result.status,2,result.stderr);
    assert.match(result.stderr,/HTTPS origin/);
  });
}
