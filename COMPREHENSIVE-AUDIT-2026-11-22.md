# Comprehensive Source and Live-Site Audit — 2026-11-22

## Scope and evidence
Inspected the GitHub default branch tree (67+ files), representative marketing and application files, Cloudflare Wrangler configuration, source navigation, booking form, sitemap, and the live homepage at https://orangeaesthetics.com/. This is **not** a full browser accessibility test, security penetration test, legal opinion, or clinical validation.

## Verified live
- The public homepage now renders the new **Where Beauty Meets Imagination** headline, two specialty pathways, and Home / Aesthetics dropdown / IV Therapy dropdown / Providers / Memberships / Request Appointment navigation.
- This establishes that at least the homepage's latest navigation and content have deployed. It does not establish a functioning appointment API or checkout.

## Fixes committed in this audit
- Updated about.html and skin-tightening.html to match the new six-action shared navigation and added canonical tags.
- Added aesthetics.html, iv-therapy.html, iv-combinations.html to sitemap.xml.

## P0 — before accepting real patient requests or payments
1. **Booking API mismatch:** form in appointment-request.html POSTs to /api/appointment-request, but backend is Cloudflare **Pages Function** at functions/api/appointment-request.js. Current wrangler.toml deploys an assets-only Worker with no script. Thus the function is not deployed by this configuration; requests will fail or be unhandled. Form currently displays a telephone fallback after failure. Either build and deploy a reviewed Worker API with approved notification secrets and anti-abuse controls, or remove/disable form submission and direct users to phone until ready. Do not collect PHI.
2. **Payment/portals:** Stripe event classifier, PostgreSQL schema and role/access utilities are scaffolds. No deployed identity provider, verified Stripe webhook, transactional ledger, or protected portal. Keep preview pages labeled as previews and never accept card or patient information in them.
3. **Clinical/legal:** IV formulas, NAD+, high-dose vitamin C, Plaquex and treatment claims need clinician, legal, and marketing review. Pricing and ingredient availability must be signed off before public advertising. No assumption that every listed treatment is currently offered.
4. **Memberships:** $99/$199/$399, 15%/20%/25% discounts and 90-day proposed rollover are public. Legal review and explicit terms are needed before paid enrollment; the current page correctly states online enrollment is not active.

## P1 — website quality
5. **SEO:** Sitemap had omitted two primary specialty landing pages; now corrected. Many secondary pages still lack canonical metadata; add systematic title, description, canonical, OG and structured data after content signoff. Exclude preview pages from sitemap and index.
6. **Navigation:** Main nav now uses native details/summary and CSS hover/focus. Test touch interaction, keyboard tab and Escape, pointer transition into submenu, mobile wrapping, and active state on real devices. Hover alone is not sufficient; click is supported through details.
7. **Cross-page content:** about.html and skin-tightening.html had legacy header; now corrected. Audit remaining footer versions, old secondary service links and naming differences. A separate skincare shop link exists in footer rather than top nav.
8. **Media:** Editorial Unsplash images are remote dependencies; verify license, availability, load performance, crop, alt text, and avoid suggesting stock photos depict real patients or providers.
9. **Accessibility/performance:** Browser tests needed for headings, contrast, form labels, keyboard behavior, CLS/LCP, responsive grids, and broken images. No Lighthouse or axe run was executed in this audit.
10. **Deployment security:** wrangler.toml uses assets.directory='.' and .assetsignore excludes app/, functions/, internal docs and configs. Cloudflare docs confirm .assetsignore support, but test public URLs to ensure internal source files are not served. A dedicated public/ build output would be stronger isolation.
11. **External links and DNS:** Test www redirect, canonical host, Pacific Urgent Care external link, TLS and mobile caching. Live homepage was reachable; no Cloudflare dashboard or deployment SHA was fetched in this audit.
12. **Operations:** Owner/staff/member preview pages and back-office documents are not proof of functioning software. Production requires auth, RBAC, audit logs, backups, retention, payment reconciliation, data agreements and independent security review.

## Release gates
- Confirm latest GitHub main SHA equals active Cloudflare deployment SHA.
- Validate the complete public URL map and both dropdowns in desktop and mobile browsers.
- Verify appointment API behavior with **synthetic non-patient data** only after approved server deployment.
- Obtain clinician/legal approvals for public treatments, pricing, memberships and claims.
- Keep member, staff and owner previews separate from authenticated production tools.

**Verdict:** New public homepage deployed and navigational improvements present. Website remains **not fully launch-ready** for transactional or patient-facing workflows.
