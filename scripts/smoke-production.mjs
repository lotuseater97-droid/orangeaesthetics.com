#!/usr/bin/env node
// Read-only production smoke test. Does not submit appointment data.
const base = process.env.SITE_URL || 'https://orangeaesthetics.com';
let target;
try { target = new URL(base); }
catch {
  console.error('SITE_URL must be a valid HTTPS origin');
  process.exit(2);
}
if (target.protocol !== 'https:' || target.username || target.password || target.search || target.hash || target.pathname !== '/') {
  console.error('SITE_URL must be an HTTPS origin with no path, query, credentials or fragment');
  process.exit(2);
}
const cases = [
  ['/', 200],
  ['/aesthetics.html', 200],
  ['/iv-therapy.html', 200],
  ['/memberships.html', 200],
  ['/appointment-request.html', 200],
  ['/about.html', 200],
  ['/aesthetic-pricing.html', 200],
  ['/botox.html', 200],
  ['/contact.html', 200],
  ['/fillers.html', 200],
  ['/iv-combinations.html', 200],
  ['/laser-hair-removal.html', 200],
  ['/microneedling.html', 200],
  ['/pricing.html', 200],
  ['/provider.html', 200],
  ['/prp.html', 200],
  ['/shop.html', 200],
  ['/skin-tightening.html', 200],
  ['/weight-loss.html', 200],
  ['/wellness.html', 200],
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
const pageMarkers = new Map([
  ['/', '<title>Medical Aesthetics & Wellness in Orange, CA'],
  ['/aesthetics.html', '<title>Medical Aesthetics in Orange CA'],
  ['/iv-therapy.html', '<title>IV Therapy & Hydration in Orange CA'],
  ['/memberships.html', '<title>IV Memberships'],
  ['/appointment-request.html', '<title>Request an Appointment'],
  ['/about.html', "<title>About | Orange Aesthetics & Wellness"],
  ['/aesthetic-pricing.html', "<title>Aesthetic Treatment Price List | Orange Aesthetics & Wellness"],
  ['/botox.html', "<title>Botox & Wrinkle Relaxers | Orange Aesthetics & Wellness"],
  ['/contact.html', "<title>Contact & Visit Us | Orange Aesthetics & Wellness"],
  ['/fillers.html', "<title>Dermal Fillers | Orange Aesthetics & Wellness"],
  ['/iv-combinations.html', "<title>IV Combination Review Chart | Orange Aesthetics"],
  ['/laser-hair-removal.html', "<title>Laser Hair Removal | Orange Aesthetics & Wellness"],
  ['/microneedling.html', "<title>Microneedling & RF Skin Rejuvenation | Orange Aesthetics & Wellness"],
  ['/pricing.html', "<title>IV Therapy Price List | Orange Aesthetics & Wellness"],
  ['/provider.html', "<title>Our Provider | Orange Aesthetics & Wellness"],
  ['/prp.html', "<title>PRP & Hair Restoration | Orange Aesthetics & Wellness"],
  ['/shop.html', "<title>Neocutis Skincare | Orange Aesthetics"],
  ['/skin-tightening.html', "<title>Skin Tightening | Orange Aesthetics & Wellness"],
  ['/weight-loss.html', "<title>Medical Weight Management | Orange Aesthetics"],
  ['/wellness.html', "<title>Wellness & IV Therapy | Orange Aesthetics & Wellness"],
]);
let failures = 0;
for (const [path, expected] of cases) {
  try {
    const response = await fetch(new URL(path, target), { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(10000) });
    const finalUrl = new URL(response.url);
    const allowedFinalPaths = path.endsWith('.html') ? [path, path.slice(0,-5)] : [path];
    const destinationOk = finalUrl.origin === target.origin && allowedFinalPaths.includes(finalUrl.pathname) && !finalUrl.search && !finalUrl.hash;
    const statusOk = response.status === expected;
    const nosniff = response.headers.get('x-content-type-options') === 'nosniff';
    const framing = response.headers.get('x-frame-options') === 'DENY';
    const referrer = response.headers.get('referrer-policy') === 'strict-origin-when-cross-origin';
    const methodAllowed = path === '/api/appointment-request' ? response.headers.get('allow') === 'POST' : true;
    // A generic fallback page may return 200 for a missing route. Check page identity too.
    const marker = pageMarkers.get(path);
    const pageContentOk = marker ? (response.headers.get('content-type') || '').toLowerCase().includes('text/html') && (await response.text()).includes(marker) : true;
    const ok = statusOk && destinationOk && nosniff && framing && referrer && methodAllowed && pageContentOk;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${path}: HTTP ${response.status} (expected ${expected}), destination-ok=${destinationOk}, nosniff=${nosniff}, frame-deny=${framing}, referrer-policy=${referrer}${path === '/api/appointment-request' ? `, allow-post=${methodAllowed}` : ''}${marker ? `, page-content=${pageContentOk}` : ''}`);
    if (!ok) failures++;
  } catch (error) {
    console.error(`FAIL ${path}: ${error.message}`);
    failures++;
  }
}
// HEAD should expose the same security protections without returning page content.
for (const path of ['/', '/appointment-request.html', '/app/schema.sql', '/api/appointment-request']) {
  try {
    const expected = path === '/app/schema.sql' ? 404 : path === '/api/appointment-request' ? 405 : 200;
    const response = await fetch(new URL(path, target), { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10000) });
    const finalUrl = new URL(response.url);
    const destinationOk = finalUrl.origin === target.origin &&
      [path, ...(path.endsWith('.html') ? [path.slice(0, -5)] : [])].includes(finalUrl.pathname) &&
      !finalUrl.search && !finalUrl.hash;
    const headersOk = response.headers.get('x-content-type-options') === 'nosniff' &&
      response.headers.get('x-frame-options') === 'DENY' &&
      response.headers.get('referrer-policy') === 'strict-origin-when-cross-origin';
    const allowOk = path !== '/api/appointment-request' || response.headers.get('allow') === 'POST';
    const ok = response.status === expected && destinationOk && headersOk && allowOk;
    console.log(`${ok ? 'PASS' : 'FAIL'} HEAD ${path}: HTTP ${response.status} (expected ${expected}), destination-ok=${destinationOk}, security-headers=${headersOk}, allow-post=${allowOk}`);
    if (!ok) failures++;
    // Consume/cancel the response so the request is fully closed.
    await response.body?.cancel();
  } catch (error) {
    console.error(`FAIL HEAD ${path}: ${error.message}`);
    failures++;
  }
}
process.exitCode = failures ? 1 : 0;
