# Production deployment and acceptance checks — Orange Aesthetics

## Current status
GitHub repository has real static HTML/CSS and a Cloudflare Pages-style `functions/api/appointment-request.js` handler. No `package.json`, `wrangler.toml`, or `wrangler.jsonc` was found at repository root on 2026-11-22. The Cloudflare dashboard screenshot previously showed a **Workers service**, `orangeaesthetics-com`, with a successful deployment older than recent GitHub edits. **Do not assume Pages Functions deploy under Workers** or that every GitHub commit triggers a new build.

## First: confirm Cloudflare project type
1. Open Cloudflare dashboard → Workers & Pages → `orangeaesthetics-com`.
2. Record whether the project is **Workers** or **Pages**, the connected GitHub repo, production branch, build command, deploy command, root directory, and most recent deployment SHA.
3. Compare deployed SHA to GitHub main HEAD. A green older deployment is not proof recent commits shipped.
4. If a Worker: confirm static assets configuration and deploy command. The `functions/` Pages route will not automatically become a Worker endpoint. Do not switch project type blindly; preserve existing DNS/domain binding.
5. If Pages: for a no-build static site, output directory should match repository root, and `functions/` routes need Pages Functions enabled. Validate the appointment route only after its approved notification endpoint secrets are configured.
6. Trigger a deployment from the current main commit and read full logs. Do not publish a new Worker config without confirming the project's existing settings.

## Public smoke-test matrix
- Homepage: hero slogan, equal aesthetics/IV links, six treatment cards, no standalone Flourish Longer promotion.
- Navigation on 375px, 768px, 1280px: Home, Aesthetics, IV Therapy, Providers, Memberships, More, Pacific external, Request Appointment; dropdown keyboard focus and click behavior; no clipped menu.
- Both specialty landing pages: no missing CSS, correct hero images, CTAs and price-menu links.
- Pricing: Botox $11/unit, hydration $50, Mini PlenishIV $99, Full $149, NAD+ 500 mg $500; confirm owner-approved values before public use.
- Memberships: $99/$199/$399 and 15%/20%/25%, enrollment request only; no real checkout or credits.
- Appointment request: if notification service is not configured, form must show unavailable + phone; if configured, test a non-patient synthetic submission and verify receipt and no PHI.
- Inspect browser console, 404s, images, mobile scrolling, HTTPS/canonical domain, SEO metadata, robots and sitemap.

## Release blockers
- Live Cloudflare deployment and visual/browser tests unverified.
- Notification endpoint, payment, member portal, staff and owner portals not production ready.
- Legal/clinical approval of membership rollover and infusion marketing pending.
- No real patient data in testing.
