# Production deployment and acceptance checks — Orange Aesthetics

## Current release architecture (repository verified)
- Cloudflare Worker service: `orangeaesthetics-com`; production hostname intended: `orangeaesthetics.com`.
- `wrangler.toml` uses `main = "worker.mjs"`, `ASSETS` binding, `[assets] directory = "."`, and `run_worker_first = true`.
- `worker.mjs` handles `POST /api/appointment-request` and imports the contact-only handler from `functions/api/appointment-request.js`. The handler is not deployed automatically as a Pages Function.
- Repository commits do **not** prove Cloudflare deployment. Latest production SHA, connected branch, custom domain and secret configuration remain unverified.
- The API returns HTTP 503 when `APPOINTMENT_NOTIFICATION_ENDPOINT` or `APPOINTMENT_NOTIFICATION_TOKEN` is missing; do not treat the contact form as operational until delivery is confirmed.

## Deployment verification (required before announcing launch)
1. In Cloudflare Workers & Pages, open `orangeaesthetics-com` and confirm the service is a Worker, the route/custom domain is `orangeaesthetics.com`, and deployment source points to the intended repository and branch.
2. Compare the **actual deployed commit SHA** with the intended GitHub commit. If they differ, inspect the build/deploy pipeline before changing DNS or service type.
3. Confirm deployment uses `worker.mjs`, the `ASSETS` binding and the asset exclusion rules; verify the deployment logs show success.
4. Configure `APPOINTMENT_NOTIFICATION_ENDPOINT` and `APPOINTMENT_NOTIFICATION_TOKEN` as Cloudflare Worker secrets only after approving the destination and privacy handling. Never put values in GitHub, HTML or logs.
5. Review Cloudflare rate-limiting/WAF rules for `POST /api/appointment-request`; input validation and the honeypot do not substitute for edge abuse controls.
6. Run GitHub Actions **Static audit** for the deployment commit. Then manually run **Production smoke test** (`.github/workflows/production-smoke.yml`); it performs read-only GET checks for page identity, security headers and private-file blocking.
7. With the notification provider configured, submit one clearly synthetic contact-only request from the public form. Verify delivery at the approved destination, the success message, and the failure/phone fallback. Do not use real patient data or clinical details.
8. Record tested deployment SHA, CI run URL, smoke run URL, date, and who approved the release. Do not claim launch readiness before these are documented.

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

## Remaining work
- Cloudflare deployment SHA, live CI/smoke outcomes, notification secrets, and end-to-end delivery remain unverified.
- Responsive/mobile and accessibility QA, pricing/legal/clinical approval, and member/payment portals remain separate launch decisions.
- No real patient data in tests. The public form is contact-only, not a clinical intake or confirmed booking system.
