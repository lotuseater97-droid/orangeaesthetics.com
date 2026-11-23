#!/usr/bin/env node
// Read-only production smoke test. Does not submit appointment data.
const base = process.env.SITE_URL || 'https://orangeaesthetics.com';
const cases = [
  ['/', 200],
  ['/app/schema.sql', 404],
  ['/functions/api/appointment-request.js', 404],
  ['/scripts/test-worker.mjs', 404],
  ['/.github/workflows/static-audit.yml', 404],
  ['/worker.mjs', 404],
  ['/wrangler.toml', 404],
  ['/api/unknown', 404],
  ['/api/appointment-request', 405],
];
let failures = 0;
for (const [path, expected] of cases) {
  try {
    const response = await fetch(new URL(path, base), { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(10000) });
    const ok = response.status === expected;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${path}: HTTP ${response.status} (expected ${expected})`);
    if (!ok) failures++;
  } catch (error) {
    console.error(`FAIL ${path}: ${error.message}`);
    failures++;
  }
}
process.exitCode = failures ? 1 : 0;
