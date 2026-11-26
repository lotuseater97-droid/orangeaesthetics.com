# Orange Aesthetics — Execution Work Order

**Date:** 2026-11-22  
**Authority:** MASTER-PLAN.md; IV-MEMBERSHIP-APP-SPEC.md; OWNER-DASHBOARD-SPEC.md; LAUNCH-CHECKLIST.md; app/README.md.
**Method:** Read full master plan and relevant specification, inspect source, implement small independently reviewable commits, update status, and test before claiming functionality. This document is a resumable task queue, **not an unattended background job**.

## Ground rules
1. Preserve ivory/sea-glass branding, Orange address/phone and Pacific hours (Mon–Fri 8–5, Sat 8–2, Sun closed).
2. Three distinct experiences: **member**, **staff**, **owner**. Staff QR scanning does not grant financial or clinical privileges. Owner may view operational reports and manage roles but cannot bypass clinical authorization.
3. Separate QR for guest public catalog from private member QR. Member QR is short-lived, opaque, revocable, and contains no identity or medical information.
4. Stripe selected but not configured. No PHI in Stripe or analytics; no weight-loss pricing on public pages. Clinic medical screening is separate from payment.
5. Every work item records acceptance criteria, evidence, tests, blockers and rollback. No production launch until compliance, account connections and verification.

## Ordered queue

| ID | Priority | Work item | Acceptance evidence | State |
|---|---|---|---|---|
| W01 | P0 | Reconcile master plan and specs; create execution ledger | This work order and master-plan link | Complete |
| W02 | P0 | Design roles, permissions and separation of duties | Pure permission matrix + test source committed; server enforcement pending | Scaffold complete; untested |
| W03 | P0 | Define member QR lifecycle, check-in and redemption state machine | Draft schema, state guards and test source committed; transaction design pending | Scaffold complete; untested |
| W04 | P0 | Build auth and session architecture | API contract and pure access guards drafted; dedicated backend, sessions and MFA not deployed | Design complete; implementation blocked |
| W05 | P0 | Build protected membership/credits APIs | Added member-scoped paid subscription checks and approved reversal handling; production must require scope and server-derived inputs | Policy expanded; blocked: W04 |
| W06 | P0 | Implement QR issuance, scan, verify and atomic redemption | Added draft QR uniqueness, idempotency and redemption constraints; protected transaction/API still pending | SQL draft; blocked: W04/W05 |
| W07 | P0 | Connect Stripe sandbox and webhook reconciliation | Signed webhooks, duplicate event tests, refunds, portal and no PHI | Blocked: merchant onboarding/terms |
| W08 | P1 | Build authenticated member UI | Actual credits, appointments, QR and billing from protected APIs | Blocked: W04–W07 |
| W09 | P1 | Build authenticated staff UI | Check-in, benefits, visit queue, safe redemption/reversal | Blocked: W04–W07 |
| W10 | P1 | Build authenticated owner UI | Reports, audit, inventory, membership and role administration | Blocked: W04–W07 |
| W11 | P1 | Secure appointment notifications | HTTPS delivery, rate limits, test receipt, privacy review | Blocked: provider/secrets |
| W12 | P1 | Enforce IV ordering review server-side | Clinical evidence signoff; unverified combinations not auto-orderable | Blocked: clinical approval |
| W13 | P1 | Public website QA | Links, accessibility, mobile, copy, hours, photos, SEO | Open |
| W14 | P2 | NEOCUTIS retail fulfillment | Authorized resale, inventory, tax/shipping/returns | Blocked: retailer approval |
| W15 | P0 | Prelaunch security, compliance and disaster recovery | Independent test, BAAs, backups, monitoring, rollback | Blocked: live infrastructure |

## Execution protocol
- **Inspect:** master plan and specific existing source before edits; preserve decisions.
- **Implement:** commit smallest coherent changes to main only if non-destructive and clearly labeled draft; use staging/feature branches for risky migrations.
- **Verify:** run Node tests in a checked-out repository when available; for remote-only commits mark tests **not run**. Never infer deployed status from GitHub.
- **Document:** append concise progress to MASTER-PLAN.md; update this queue on meaningful milestones.
- **Resume:** choose first unblocked item, then work downward. Do not repeatedly re-research without checking existing source and evidence logs.

## Immediate deliverables
- Draft role permission model for member/staff/owner plus clinician and manager scopes.
- Draft QR token/check-in/visit schema extension (unapplied).
- Unit tests for permission and state transitions.
- Update master plan to reflect current QR demo and three distinct portal previews.

## Progress log — 2026-11-22
- Created pure role/permission model, check-in transition guards, QR credential/check-in schema draft and test source. These are **not** production authorization or an operational database.
- Next unblocked step: inspect checkout/member UI and add more testable static design; live authenticated functions remain gated by dedicated backend, contracts and secure deployment.

## Progress log — 2026-11-22 (continued)
- W04: Created `app/PORTAL-API-CONTRACT.md` detailing member, staff, clinician and owner endpoints; opaque QR lifecycle, MFA, audit and transactional redemption. **Contract only.**
- W04/W05: Added `app/lib/portal-access.mjs` with pure fail-closed action/self-access guards and `app/tests/portal-access.test.mjs` with isolation and MFA test cases. **Not deployed; tests not executed.**
- Remaining immediate work: run the full Node test suite in an actual checkout, design durable transaction migration, select/provision dedicated backend with compliance review, and wire authenticated portals only after gates.

## Progress log — QR credential security (2026-11-22)
- Added `app/lib/qr-token.mjs` using Node cryptographic random generation, SHA-256 hash storage helper, constant-time comparison and strict 60-second validity window. These are pure server-side helpers; **not connected to browser or database**.
- Added `app/tests/qr-token.test.mjs` for uniqueness, matching, malformed input, expiry, revocation and consumption. **Not executed**.
- Next: protected transaction to atomically consume token, verify role and create audited check-in; independent authorization and clinical gates required.

## Progress log — ledger integrity (2026-11-22)
- W05: Added `app/lib/grant-selection.mjs` and `app/tests/grant-selection.test.mjs` for deterministic earliest-expiring, paid, unspent credit selection. Pure helper only; database state is authoritative.
- W06: Added `app/redemption-integrity.draft.sql` with unique QR/check-in constraints, reversal record and idempotency record drafts. This is **unapplied**, requires review of schema evolution and transaction locking, and is not an API.
- No live credit deduction, authenticated login, Stripe integration or real patient QR operation. Tests committed but **not executed**.

## Progress log — member isolation and reversal policy (2026-11-22)
- Strengthened `app/lib/grant-selection.mjs` with optional authenticated-member scoping through server-verified active paid subscription records and separate approved reversal events. Legacy unscoped mode remains for existing tests; **must not be used in production APIs**.
- Added tests for cross-member isolation, unpaid/inactive subscriptions, unapproved reversal flags and missing subscription scope. **Not run**.
- Next: remove legacy unscoped entry point before any API integration, implement transaction-safe SQL and verify test suite in checkout.


## Membership rollover legal gate — 2026-11-22
- Owner preference: **90-day rollover** of unused monthly benefits. **Proposed only; not legally approved.** Do not implement automatic forfeiture, advertise enforceable expiry, or enable billing until California counsel classifies each paid service credit versus truly free promotional benefit.
- California Civil Code 1749.5 gift-certificate restrictions and exceptions require review; April 1, 2026 statutory change must be checked. Source: https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1749.5.&lawCode=CIV
- California Automatic Renewal Law BPC 17602: express consent, clear terms, retainable acknowledgment, consent record retention, annual reminders, online cancellation and fee-change notices. Source: https://oag.ca.gov/node/608083
- Medical Board corporate-practice and medical-spa ownership/clinical control: https://www.mbc.ca.gov/Licensing/Physicians-and-Surgeons/Practice-Information/default.aspx
- Counsel to review: medical-practice entity and NP/physician supervision/authorization, clinical eligibility and refund when unsuitable, HIPAA/payment separation and BAAs, package vs gift-card treatment, cash-out rights, cancellation and refund policy, advertising, sales tax and consumer privacy.
- **System rule pending legal signoff:** retain original grant issuance/payment/expiry records; support separate non-expiring prepaid-value ledger if legally required; never erase historical grants; provide member-visible terms and audit trail.

## Progress — Wellness discount scope (2026-11-22)
- Owner decided Wellness $99/month should provide 15% off eligible Orange Aesthetics services and retail, rather than IV-only. Updated public membership description, detailed membership specification and master plan.
- Proposed 90-day rollover is visible as pending legal approval; no automatic expiration or live discount processing. Higher-tier discount scope and exclusions remain to be confirmed.


## California membership legal architecture — 2026-11-22 (reviewed sources; COUNSEL APPROVAL REQUIRED)
**Owner decisions:** Orange Aesthetics is separate from Pacific Urgent Care. All tiers receive their respective discount on **eligible services and retail products actually sold by Orange Aesthetics only**: Wellness 15%, Performance 20%, Elite 25%. No discount on Pacific Urgent Care, insurance-billed care, or independent partner sales. Included IV entitlements should expire 90 days after issuance **only if enforceable after California healthcare counsel reviews the actual consideration, service delivery, and contract**. Do not present the plan as legally cleared or start automatic forfeiture before approval.

**Legal findings and design controls:**
1. Civil Code §§1749.45, 1749.5 as amended by SB22, operative April 1, 2026: covered purchased gift certificates cannot expire; cash redemption threshold is $15; truly free loyalty/promotional exception requires no money or value exchanged, so it is NOT presumed to apply to a paid membership IV. Source: https://legiscan.com/CA/text/SB22/2025 . Structure a time-limited, nontransferable membership service entitlement (no cash denomination, reload, gifting, standalone voucher or cash wallet), but labels alone do not defeat statutory treatment. Counsel must decide whether 90-day forfeiture is enforceable. Purchased packages, gift certificates, stored value and any legally protected paid balance are separate and must not expire under this rule.
2. BPC §§17600–17606 (particularly 17602): pre-purchase conspicuous renewal terms and separate express affirmative consent, retainable acknowledgment, accessible cancellation including online cancellation for online signup, annual reminders, required notices and consent record retention. Source: https://law.justia.com/codes/california/code-bpc/division-7/part-3/chapter-1/article-9/section-17602/ . Do not enable auto-billing before tested controls.
3. BPC §650: no referral inducements, prohibited percentage-based referrals or improper cross-entity rebates. Direct Orange Aesthetics discount only; no Pacific cross-subsidies. Source: https://law.justia.com/codes/california/code-bpc/division-2/chapter-1/article-6/section-650/ . Review professional advertising and undiscounted-price representation.
4. BPC §2400, §2775, §§2837.103–.104 and relevant professional corporation law: separate entity must be legally authorized to deliver medical services. NP-owned professional nursing corporation may be possible under applicable scope/authorization; ordinary LLC cannot simply practice medicine. 103/104 authorization and standardized procedures are materially different. Sources: https://www.rn.ca.gov/practice/ab890.shtml and https://www.mbc.ca.gov/Download/Documents/medical-spas-business.pdf . Verify actual entity and clinicians with counsel.
5. All treatments require independent clinical screening and informed consent. Medical ineligibility, provider unavailability, scheduling barriers, cancellations, refunds, chargebacks and service discontinuation require fair written policies; no forfeiture of protected funds. Clinical records remain separate from payment systems.

**Proposed contract model (NOT approved terms):** Membership grants an ongoing access/discount program and a specified number of monthly *service-use entitlements*, each issued on the paid billing date and usable until the exact timestamp 90 calendar days later; oldest eligible entitlement consumed first. Display issue date, expiration date and advance reminders; never promise a treatment without clinical approval. Do not use the word 'free' to imply the IV was exchanged for no consideration. Clarify whether entitlement survives cancellation, pauses, inability to schedule, and medical ineligibility. Never advertise 90-day expiration as legally enforceable until attorney signoff. A 3-credit maximum conflicts with Elite's two per month and must NOT be hard-coded; any cap must be plan-specific and reviewed.

**Implementation gates:** legal opinion on gift certificate classification; professional entity and scope verification; signed member agreement and checkout copy; refund/cancellation/no-show rules; consent records, accessible cancellation, reminders, separate non-expiring purchased-value ledger, test cases for rollover/refund/reversal, and manual override audit. No live billing, expiration job or patient data yet.


## Expired-benefit backup and legal recovery — 2026-11-22
Owner requested that proposed 90-day IV benefits disappear from *usable* member balances, be redeemed earliest-expiring first, and remain in a protected historical ledger after expiration for future legal remediation. Design recorded in [app/EXPIRED-BENEFIT-RECOVERY.md](app/EXPIRED-BENEFIT-RECOVERY.md). Expiration enforcement is **NOT enabled** pending California legal approval. Preserve immutable grant/payment/redemption/expiration events and use audited restoration/refund adjustments rather than deleting or rewriting records. Implementation and tests pending protected backend.


## Benefit recovery implementation progress — 2026-11-22
- Added `app/lib/benefit-history.mjs` pure projection for oldest-expiring-first selection, retained expired history, approved reversals/restorations, and retrospective impact counts.
- Added `app/tests/benefit-history.test.mjs` with seven test cases and `app/benefit-history.draft.sql` append-only audit event schema proposal. These are **not deployed** and tests have not been verified in repository runtime.
- **Important limitation:** projection is a prototype, not a production credit ledger. It does not enforce member scoping, verify payment, implement legal reinstatement of expired dates, or run atomic concurrent redemptions. Production implementation must address these before enabling anything.
- Expiration remains explicitly gated by legal approval; no live 90-day expiration or real backups are configured. Next: backend, event immutability/RLS, real backup/restore and integration tests.


## Consolidated membership compliance architecture — 2026-11-22
**Authoritative documents:** [LEGAL-COUNSEL-REVIEW.md](LEGAL-COUNSEL-REVIEW.md) (all open legal questions, L01–L10) and [MEMBERSHIP-TERMS-ATTORNEY-DRAFT.md](MEMBERSHIP-TERMS-ATTORNEY-DRAFT.md) (proposed customer terms). Do not treat legal review questions as resolved simply because implementation is designed around them.

**Owner-approved commercial design:** separate Orange Aesthetics entity; Wellness $99/one Mini PlenishIV/15%, Performance $199/one qualifying IV/20%, Elite $399/two qualifying IVs/25%; discounts only for eligible Orange Aesthetics services and retail, never Pacific Urgent Care or external partners. Proposed 90-day grant expiration, earliest-expiring-first redemption, owner-only retained expired history, audited legal recovery.

**Safe-by-default implementation:** issue only from verified payments; do not send PHI to Stripe; member/MA/owner access segregated; never delete credit history; keep gift cards and purchased stored value in a separate non-expiring-policy ledger; disable expiration server-side until attorney signoff; expose no production portal before authenticated HIPAA-ready backend, backups and tested restore. Clinical approval remains independent of payment. No live systems or tests are implied by this specification.

**Next work:** validate pure ledger against all boundary and remediation cases, implement server-side legal approval switch, append-only protected event store and real backup/restore, wire authenticated portals and signed payment webhooks only after infrastructure/legal gates. Remove contradictory historical 30-day wording wherever still present before launch.


## Business management and backup decision — 2026-11-22
Owner wants the authenticated Orange Aesthetics platform to operate the business end-to-end, with independently recoverable data and downloadable owner archives. See [BUSINESS-OPERATIONS-BACKUP-PLAN.md](BUSINESS-OPERATIONS-BACKUP-PLAN.md) for the implementation and security specification.
- Target: daily encrypted full database backups, weekly independent immutable offsite copies, monthly owner-downloadable audited business archives, quarterly actual restore drills, and failure alerts. Continuous PITR preferred if supported.
- Owner dashboard must include Backup Center, last verified successful job, backup history, downloadable monthly archive and restore-test evidence. Owner exports must exclude clinical charts and payment credentials; HIPAA-sensitive records require separate approved workflow.
- Retain expired IV credits, issuance, redemptions, refunds and legal restorations in immutable history. Backups are distinct from historical event logs. No automatic 90-day forfeiture without California counsel signoff.
- Added pure `app/lib/export-manifest.mjs` and five `app/tests/export-manifest.test.mjs` test cases for file hashes/manifest integrity. **No real archive, storage, scheduled job, owner download or restoration is implemented; tests have not been executed.**
- Next dependencies: protected backend, BAA/security decisions, authenticated owner endpoint, real backup provider, independent storage, tested restoration, approved retention policy.


## Cash-pay clinical record architecture — 2026-11-22
Owner confirms **100% cash-pay; no insurance claims** for Orange Aesthetics. Prefer existing Practice Fusion EHR for clinical charts and consents, but verify separate legal entity and account access with vendor and attorney before any cross-practice data access. Keep the Orange Aesthetics portal as the business/credit/payment/stock/owner system; no clinical chart duplication. Practice Fusion offers documented FHIR APIs and EHI export, but neither is confirmed configured or free; do not treat EHI export as a restorable EHR backup. Separate authorized clinical exports from ordinary daily/weekly business backups and monthly owner business ZIPs. Full vendor questions, public pricing and compliance gates: [PRACTICE-FUSION-CLINICAL-PLAN.md](PRACTICE-FUSION-CLINICAL-PLAN.md). Attorney issues L11-L15 in [LEGAL-COUNSEL-REVIEW.md](LEGAL-COUNSEL-REVIEW.md). **No actual EHR integration, records export, vendor account, BAA or clinical backup configured.**


## Brand alignment — original Orange Aesthetics website, 2026-11-22
Original website https://orangeaesthetics.com/ uses the tagline **Where Beauty Meets Imagination** and emphasizes personalized medical aesthetics, IV hydration, skincare, natural-looking enhancement and a luxurious clinical setting. Owner rejected **Feel beautiful. Live well.** because it resembles Flourish Longer branding. Homepage headline restored to **Where beauty meets imagination.** Supporting copy: **Refined aesthetics. Personalized care.** Do not reuse the rejected slogan; keep Orange Aesthetics brand distinct from Flourish Longer and Pacific Urgent Care. Avoid unsubstantiated treatment efficacy claims. Homepage change committed to GitHub; Cloudflare production deployment remains separately unverified and may be stalled.


## Homepage implementation — balanced aesthetics and IV wellness (2026-11-22)
Owner wants both specialties equally prominent. Actual index.html updated with equal primary CTAs and two equal editorial specialty panels; IV pricing FAQ corrected to reference Orange Aesthetics. Responsive styles.css updated and stylesheet cache-busted. Deployment not verified; no live functionality claimed.


## Unified public navigation implemented — 2026-11-22
Owner selected top-level **Home / Aesthetics / IV Therapy / Providers / Memberships**, with secondary **More** menu, external **Pacific Urgent Care** link clearly separate, and **Book Now** CTA. Actual HTML headers updated across 11 core pages; styles.css adds responsive dropdown treatment. Aesthetics currently links to existing aesthetic-pricing.html and IV Therapy to existing pricing.html, not newly built landing pages. Cloudflare publication and mobile/browser testing remain unverified. More menu houses injectables, skin, laser, shop, wellness and contact.


## Dedicated landing pages and internal consistency audit — 2026-11-22
Created aesthetics.html and iv-therapy.html, updated all 20 audited public page headers to consistent simplified navigation, fixed IV pricing business separation copy, and added responsive specialty CSS. See INTERNAL-CONSISTENCY-AUDIT-2026-11-22.md for findings, remaining clinical/legal checks, Cloudflare deployment and visual QA blockers. Changes are in GitHub, not verified live.


## Follow-up source audit — 2026-11-22
- Refined homepage to keep aesthetics and IV therapy equal; removed oversized standalone Flourish Longer homepage feature and independent partner tile. Partner remains available through secondary wellness content, subject to owner approval.
- Preserved four original specialty showcase cards, feature split, pricing highlight, two IV/membership cards, visit steps and FAQs; checked opening/closing section counts.
- Added two-column layout for remaining IV/membership cards and mobile single-column fallback.
- Added canonical URL metadata to aesthetics.html and iv-therapy.html.
- Confirmed source-level section structure and navigation; **still no live Cloudflare deployment, browser screenshot, or production form delivery verification**.


## Full-platform implementation pass — 2026-11-22
- Updated prominent appointment CTAs on homepage, both specialty landing pages, contact and memberships to link to appointment-request.html; label is **Request Appointment**, not guaranteed booking.
- Fixed CSS responsive nav wrapping and More dropdown clipping risk; still requires browser visual QA.
- Added PRODUCTION-DEPLOYMENT-CHECKLIST.md documenting Cloudflare Workers versus Pages incompatibility risk and acceptance checks. GitHub repository root has no package.json/wrangler config; actual Cloudflare project settings must be inspected before choosing a deployment mechanism.
- Appointment API is a Pages Function and uses server secrets for notification endpoint; cannot claim it runs on Workers or is operational. No PHI or payment tests.
- Stripe, auth, membership ledger, staff tools and owner dashboard remain prototypes/scaffolds, not deployed or secure.


## Silver Iris business architecture adaptation — 2026-11-22
- Reviewed **Silver Iris Farms Google Drive** business master plan and completion work order, plus private GitHub `naria-collab/SILVERIRISFARMS` README, implementation decisions, Business/Finances/dashboard code and role-aware application layout. **Silver Iris was read-only and unchanged.**
- Adapted ONLY useful business architecture: one protected owner/staff/member system, grouped workspaces, owner Business/Finances overview, inquiries, scheduling, invoices, cash/check deposit reconciliation, expenses, vendors, inventory, reports, tasks, staff permissions, audit events and backup center. Did NOT copy equestrian entities, voice workflows, styling, themes, assets, credentials or data.
- Created `app/BUSINESS-PLATFORM-STRUCTURE.md`, `app/lib/business-navigation.mjs`, `app/lib/business-operations.mjs`, `app/lib/workflow-rules.mjs`, synthetic tests, and a GitHub Actions test workflow.
- These are real committed business-domain foundations but **not yet a deployed, authenticated, database-backed owner dashboard**. Existing static Worker excludes `app/`; no real customer or financial data is collected. A dedicated secure backend, auth/RLS, payment integration, and regulatory review remain required.
- Public site remains Orange Aesthetics' existing visual identity and navigation.


### Public website QA — 2026-11-26
W13: Hardened static audit against browser-normalized active URL schemes (d631548); added regression cases (e45e971). Committed to main; CI execution and live deployment not verified. W13 remains open for mobile/browser QA. No production payment or clinical gates changed.


## Progress — 2026-11-26: staff appointment transport
- Added `app/lib/staff-reservation-http.mjs` and `app/tests/staff-reservation-http.test.mjs` in commits `7c959b0` and `f0755f3`. The private HTTP adapter composes existing reservation create/transition transactions with strict request/MFA/origin validation and sanitized responses. **Disabled by default, not routed or deployed.**
- Tests: GitHub Actions run 45898512010 was in progress at documentation time; local clone could not resolve github.com, so do not count as locally tested. Review CI result before declaring tested.
- W09: server-side appointment HTTP foundation added; authenticated staff UI remains blocked by approved identity, role mapping, RLS/migrations, and deployment security gates.
- Next smallest unblocked task: implement and test trusted server-side staff session identity adapter and tenant-scoped appointment read model; do not turn on live endpoints.

- **Verified CI update (2026-11-26):** GitHub Actions Business foundation tests run [45898512010](https://github.com/lotuseater97-droid/orangeaesthetics.com/actions/runs/45898512010) completed successfully for commit `f0755f33ad5bbd7f7fa79eeca071111d204a2065` (unit job success). This confirms automated repository tests at that commit, not live Postgres integration, production authorization or deployment.

## Independent development priority — 2026-11-26
Owner directs developers to defer all tasks requiring human authorization into a separate approval backlog, without blocking independent implementation. Preserve all activation gates; continue synthetic-data dashboard, reporting, inventory, scheduling, accessibility and automated tests. Implemented nested staff shift overlap detection in `app/lib/staff-operations.mjs` (6f1378c) and added regression coverage; CI not yet verified. Next independent task: improve owner reporting and staff scheduling review without live records or payroll activation.

### Independent owner reporting improvement — 2026-11-26
Owner financial and inventory summary arithmetic now rejects unsafe integer totals instead of silently losing precision (8cb604c). Five synthetic regression tests added (444e4a9). CI verification pending; no production or approval-dependent changes. Next independent work: owner reporting date-range summaries and inventory review.

### Owner reporting date ranges — 2026-11-26
Implemented pure inclusive business-local date range financial summaries in `app/lib/owner-period-report.mjs` (1baff1f), with counts and existing safe-cent arithmetic; five regression tests (513be8a). Trusted data adapter must supply pre-scoped business dates; no UI or production integration yet. CI pending. Next independent task: inventory review and low-stock reporting.
