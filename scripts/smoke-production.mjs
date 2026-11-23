#!/usr/bin/env node
// Read-only production smoke test. Does not submit appointment data.
const base = process.env.SITE_URL || 'https://orangeaesthetics.com';
const target = new URL(base);
if (target.protocol !== 'https:' || target.username || target.password || target.search || target.hash || target.pathname !== '/') {
  console.error('SITE_URL must be an HTTPS origin with no path, query, credentials or fragment');
  process.exit(2);
}
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
  ['/%2561pp/schema.sql', 404],
  ['/app%252Fschema.sql', 404],
];
let failures = 0;
for (const [path, expected] of cases) {
  try {
    const response = await fetch(new URL(path, target), { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(10000) });
    const statusOk = response.status === expected;
    const nosniff = response.headers.get('x-content-type-options') === 'nosniff';
    const framing = response.headers.get('x-frame-options') === 'DENY';
    const referrer = response.headers.get('referrer-policy') === 'strict-origin-when-cross-origin';
    const methodAllowed = path === '/api/appointment-request' ? response.headers.get('allow') === 'POST' : true;
    const ok = statusOk && nosniff && (expected === 200 ? framing && referrer : true) && methodAllowed;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${path}: HTTP ${response.status} (expected ${expected}), nosniff=${nosniff}${expected === 200 ? `, frame-deny=${framing}, referrer-policy=${referrer}` : ''}${path === '/api/appointment-request' ? `, allow-post=${methodAllowed}` : ''}`);
    if (!ok) failures++;
  } catch (error) {
    console.error(`FAIL ${path}: ${error.message}`);
    failures++;
  }
}
process.exitCode = failures ? 1 : 0;
