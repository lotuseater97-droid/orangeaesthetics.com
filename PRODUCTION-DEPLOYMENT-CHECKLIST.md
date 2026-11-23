# Production deployment and acceptance checks — Orange Aesthetics

## Current release architecture (repository verified)
- Cloudflare Worker service: `orangeaesthetics-com`; production hostname intended: `orangeaesthetics.com`.
- `wrangler.toml` uses `main = "worker.mjs"`, `ASSETS` binding, `[assets] directory = "."`, and `run_worker_first = true`.
- `worker.mjs` handles `POST /api/appointment-request` and imports the contact-only handler from `functions/api/appointment-request.js`. The handler is not deployed automatically as a Pages Function.
- Repository commits do **not** prove Cloudflare deployment. Latest production SHA, connected branch, custom domain and secret configuration remain unverified.
- A **manual-only** GitHub Actions deployment workflow was added in commit `9381d1f` (`.github/workflows/deploy-cloudflare.yml`); its static audit passed. It has **not** been run and does not deploy on push. Verify any separately configured Cloudflare Git integration in the Cloudflare dashboard.
- The API returns HTTP 503 when `APPOINTMENT_NOTIFICATION_ENDPOINT` or `APPOINTMENT_NOTIFICATION_TOKEN` is missing; do not treat the contact form as operational until delivery is confirmed.

## Latest appointment readiness finding (2026-11-23)
- Live smoke run https://github.com/lotuseater97-droid/orangeaesthetics.com/actions/runs/45281401842 reported HTTP 503 for all three invalid POST probes. The handler at that time checked notification configuration before payload validation.
- GitHub commits `8d89ca7` and `362d439` moved payload validation ahead of notification configuration and added regression coverage. Static audit, business foundation and checkout integration tests passed for `362d439`.
- **The fix is not confirmed deployed.** Re-run production smoke only after verifying the updated Worker is deployed; expected invalid POST statuses are 400 (malformed JSON), 415 (unsupported content type) and 403 (wrong origin). If all remain 503, investigate deployed revision/configuration; do not weaken smoke expectations to make the run green.
- Even after these probes pass, a valid contact request must remain unavailable (503) unless the approved notification endpoint and token are configured. End-to-end delivery requires a separate synthetic submission with explicit destination approval.

## Manual deployment workflow setup (not yet executed)
1. In GitHub repository **Settings → Environments**, create `production` and enable required reviewers/branch restrictions as appropriate. The workflow references this environment, but merely naming it does not enforce approval.
2. Add repository or production-environment secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Use a scoped Cloudflare token authorized to deploy this Worker and its assets; do not commit credentials. Do not configure secrets in this chat.
3. Confirm Cloudflare Worker name `orangeaesthetics-com`, custom domain routing and whether Cloudflare's own Git integration also deploys automatically, to avoid competing deployment sources.
4. Open https://github.com/lotuseater97-droid/orangeaesthetics.com/actions/workflows/deploy-cloudflare.yml → **Run workflow**, select `main`, enter `DEPLOY`, and approve the protected environment if prompted. **Only do this after owner authorization and configuration review.**
5. Workflow runs static asset checks and Worker tests, deploys with Wrangler, and then runs the live production smoke test. Record deployed commit and deployment ID from Wrangler logs and verify Cloudflare dashboard revision. A passing smoke run does not prove notification delivery.
6. Configure approved notification destination secrets in Cloudflare separately and complete the controlled synthetic delivery test.

## Deployment verification (required before announcing launch)
1. In Cloudflare Workers & Pages, open `orangeaesthetics-com` and confirm the service is a Worker, the route/custom domain is `orangeaesthetics.com`, and deployment source points to the intended repository and branch.
2. Compare the **actual deployed commit SHA** with the intended GitHub commit. If they differ, inspect the build/deploy pipeline before changing DNS or service type.
3. Confirm deployment uses `worker.mjs`, the `ASSETS` binding and the asset exclusion rules; verify the deployment logs show success.
4. Configure `APPOINTMENT_NOTIFICATION_ENDPOINT` and `APPOINTMENT_NOTIFICATION_TOKEN` as Cloudflare Worker secrets only after approving the destination and privacy handling. Never put values in GitHub, HTML or logs.
5. Review Cloudflare rate-limiting/WAF rules for `POST /api/appointment-request`; input validation and the honeypot do not substitute for edge abuse controls.
6. Run GitHub Actions **Static audit** for the deployment commit. Then manually run **Production smoke test** (`.github/workflows/production-smoke.yml`); it performs read-only GET checks for page identity, security headers and private-file blocking.
7. With the notification provider configured, submit one clearly synthetic contact-only request from the public form. Verify delivery at the approved destination, the success message, and the failure/phone fallback. Do not use real patient data or clinical details.
8. Record tested deployment SHA, CI run URL, smoke run URL, date, and who approved the release. Do not claim launch readiness before these are documented.

## Verified automated checks (2026-11-23)
- Static audit passed for GitHub commit `20ad307`: https://github.com/lotuseater97-droid/orangeaesthetics.com/actions/runs/45280705190
- Live production smoke passed for GitHub commit `20ad307`: https://github.com/lotuseater97-droid/orangeaesthetics.com/actions/runs/45280705292
- The live test exercises 20 public page routes and 10 private/API/encoded-path routes; checks expected statuses, destination, security headers, and page-specific title markers.
- **Important distinction:** the workflow checks the current public hostname using the test script at `20ad307`; it does **not** identify the deployed Cloudflare Worker revision or test POST notification delivery.

## Public smoke-test matrix
- Homepage: hero slogan, equal aesthetics/IV links, six treatment cards, no standalone Flourish Longer promotion.
- Navigation on 375px, 768px, 1280px: Home, Aesthetics, IV Therapy, Providers, Memberships, More, Pacific external, Request Appointment; dropdown keyboard focus and click behavior; no clipped menu.
- Both specialty landing pages: no missing CSS, correct hero images, CTAs and price-menu links.
- Pricing: Botox $11/unit, hydration $50, Mini PlenishIV $99, Full $149, NAD+ 500 mg $500; confirm owner-approved values before public use.
- Memberships: $99/$199/$399 and 15%/20%/25%, enrollment request only; no real checkout or credits.
- Appointment request: if notification service is not configured, form must show unavailable + phone; if configured, test a non-patient synthetic submission and verify receipt and no PHI.
- Inspect browser console, 404s, images, mobile scrolling, HTTPS/canonical domain, SEO metadata, robots and sitemap.

## Release blockers
- Live production GET smoke passed on 2026-11-23 (30 routes checked; later page-title validation also passed). Cloudflare deployment commit SHA and visual/browser tests remain unverified.
- Notification endpoint, payment, member portal, staff and owner portals not production ready.
- Legal/clinical approval of membership rollover and infusion marketing pending.
- No real patient data in testing.

## Remaining work
- Static audit and live read-only production smoke passed for GitHub commit `20ad307` on 2026-11-23; these checks do not establish that Cloudflare serves that exact commit. Cloudflare deployed SHA, notification secrets, and end-to-end delivery remain unverified.
- Responsive/mobile and accessibility QA, pricing/legal/clinical approval, and member/payment portals remain separate launch decisions.
- No real patient data in tests. The public form is contact-only, not a clinical intake or confirmed booking system.
