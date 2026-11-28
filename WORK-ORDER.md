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

### Independent inventory review — 2026-11-26
Improved existing low-stock and reorder engine: grouped movements for efficient review, reject duplicate movement IDs and invalid calendar dates, protect stock and reorder arithmetic from overflow (22fdf53). Four regression tests added (6a853e2). CI pending; no live inventory or clinical use activated. Next independent task: expense category reporting and dashboard integration with synthetic data.

### Owner expense reporting — 2026-11-26
Added paid expense category summaries by inclusive payment date, with category totals, counts, duplicate rejection and existing safe-cent calculations (593be59); five synthetic tests (e5014b5). Cash-basis reporting deliberately excludes approved but unpaid expenses; trusted adapter must map paid_on and status from authoritative records. CI pending; no live data or activation. Next independent task: integrate reporting modules into synthetic owner dashboard.

### Integrated owner reporting — 2026-11-26
Composed financial, paid expense category and current inventory reports in `app/lib/owner-dashboard-report.mjs` (9760513), with three integration tests (5c6bb20). Pure view model only; trusted adapter and UI integration remain pending. Previous Business foundation run 45899723738 passed at e5014b5; static audit and checkout integration failed at that revision and require diagnosis. New tests pending CI. Next independent work: diagnose failing workflows and build synthetic dashboard interface. No production activation.

### Interactive owner finance interface — 2026-11-26
Connected existing app/prototypes/owner-interactive.html finance view to shared reporting engine via ES module import, with date range controls, cash metrics, category breakdown and current inventory alert count (9c55149). Synthetic records only; serve over local HTTP for module imports. Browser QA pending. CI diagnosis: static audit asset/link and private exclusion steps passed, Worker security test failed; checkout integration failed at application library syntax check before full tests. Job logs not available in job metadata; exact causes remain unresolved. Next independent task: resolve syntax and Worker test failures, then browser QA and purchasing interface integration. No live activation.

### Staff reservation syntax repair — 2026-11-26
Corrected double-escaped regex literal in staff-reservation-http.mjs that prevented module parsing (86d1c10); added content-type regression coverage. CI verification pending. Staff endpoint remains disabled by default. Next: verify full checkout suite and diagnose remaining Worker security failures.

### CI regression repair — 2026-11-26
Checkout run 45900140490 confirmed all application and test modules parse after staff regex repair. Detailed job logs identified owner prototype test incorrectly parsing ES module as classic script. Updated test to use Node module-mode syntax check, preserving other assertions. New CI pending; next verify workflows then continue purchasing controls. No live activation.

### Purchasing controls — 2026-11-26
Verified previous repair at 86aceb3: business foundation run 45900244362, checkout run 45900244285 and static audit run 45900244323 all succeeded. Hardened purchase reconciliation with mandatory requester/approver identity, eligible purchase states, over-receipt detection and safe integer totals (63154b9); four regression tests (1376f1f). New CI pending. Next independent task: connect purchasing evaluation to synthetic owner interface. No payment or production activation.

### Interactive purchasing dashboard — 2026-11-26
Connected synthetic owner purchasing view to evaluatePurchase (718e81d), showing approval queue count, received/invoiced amounts, reconciliation issues and readiness. Added static wiring regression test. Existing demo actions simulate full receipt and matching invoice only; partial receipts, independent invoice entry and browser QA remain pending. No real payments, orders or inventory changes. Next independent task: partial receipt and invoice entry in demo.

### Partial purchasing records — 2026-11-26
Implemented independent multiple receipt and invoice amounts in synthetic owner workspace (6bf36d3), validated positive dollar inputs, and added static regression coverage. Uses browser prompts and in-memory arrays; no actual inventory quantity changes or payment execution. CI and browser verification pending. Next: inline entry forms and transaction history with correction controls.

### Verified handover — 2026-11-26
All completed code is committed. At 86ef5b1, business foundation run 45901018467, checkout integration run 45901018490 and static audit run 45901018541 succeeded; latest work-order static audit 45901028809 succeeded. No additional implementation occurred after partial purchasing. Next: replace browser prompts with inline validated receipt/invoice forms, transaction history and correction records; test and commit. Then continue vendor summaries, staff scheduling, appointment management, membership credits and QR check-in within approved scope. Browser QA and production integrations remain pending. Defer approval-dependent tasks; do not activate live payments, clinical workflows or PHI storage. Each continuation must fetch current repository files and latest commits, implement actual code, test, commit and update both plans. If blocked, attempt recovery and report actual failure rather than assume access is unavailable.

2026-11-26: Inline purchasing forms and receipt/invoice amount history committed (6038e38). Next: correction records, vendor summaries, browser QA and CI verification. Production gates unchanged.

### Purchasing corrections — 2026-11-26
Synthetic owner dashboard now records reasoned voids separately from original receipts/invoices, excludes voided entries from reconciliation, and rejects duplicate voids (b902419). Regression coverage committed (5fb1d6d); CI and browser QA pending. Next independent task: vendor-level purchasing summaries. No durable database audit or live payment activation.

### Vendor purchasing summaries — 2026-11-26
Implemented organization/vendor grouped commitments, pending approvals, received/invoiced totals, unreceived amounts and ready-for-review amounts (82026ed, 95d2adf), with regression tests. Synthetic dashboard only. Invoice totals are not unpaid balances; actual AP requires vendor payment records. CI/browser verification pending. Next: vendor payment record design and staff scheduling interface. No production activation.

### Accounts payable projection — 2026-11-26
Implemented read-only vendor invoice balances from scoped settled payment records (0b24fa3), five regression tests (2b65412), and synthetic purchasing dashboard balance view. Demo has no payment records yet; next add simulated settlement entry and staff scheduling. No live payment execution, database migration, or verified CI/browser run.

2026-11-26: Vendor settlement demo committed (e6456e0), with payment history and invoice void protection. Next staff scheduling workspace; CI/browser verification pending. No live activation.

2026-11-26: Staff schedule prototype committed (22c3580). Next business timezone, shift edits/cancellation and calendar filtering; CI/browser QA pending.

### Pacific staff scheduling — 2026-11-26
Added America/Los_Angeles wall-clock conversion, UTC storage and local display (8b60ac3, d741cc5). Ambiguous fall-back and nonexistent spring-forward inputs rejected rather than guessed. Regression tests committed; CI/browser QA pending. Next shift editing/cancellation and weekly calendar. Synthetic only.

2026-11-26: Shift editing/cancellation and change history committed (c8e6921). Next weekly calendar and availability. CI/browser QA pending.

### Weekly staff calendar — 2026-11-26
Added Monday–Sunday Pacific-date grouping, previous/next week and date navigation, overnight shift display and midnight-exclusive end handling (3f38808, 3a7554a). Four regression tests committed. Synthetic only; CI/browser verification pending. Next monthly calendar and employee availability. Weekly display does not change all-schedule hours totals.

### Monthly staff calendar — 2026-11-26
Monthly grouping, week/month toggle, adjacent-month shading and clamped navigation implemented (f86114b, 6a4233c). Added leap-year and rollover tests; execution and browser QA pending. Next employee availability and time-off requests. Synthetic records only.

### Staff availability — 2026-11-26
Recurring Pacific weekday windows, add/remove controls, existing conflict count and new/edit shift checks committed (ea1349f, eddcb95). Missing rules mean unrestricted; configured staff require full coverage. Four regression tests committed; execution/browser QA pending. Next time-off requests and approval. Synthetic only.

### Staff leave — 2026-11-26
Added sample full-day leave requests, approval/rejection, approval blocked by existing shifts, and new/edit shift leave checks (e07ef33, be57d9b). Four tests committed. Next calendar absence display and staff portal integration. Synthetic only; CI/browser QA pending.

### Calendar absence display — 2026-11-26
Approved leave projected onto weekly/monthly calendar dates with duplicate employee suppression and separate visual labels (e7387ac, a6b11be). Pending/rejected requests excluded. Regression assertion committed; CI/browser QA pending. Next staff self-service integration. Synthetic only.

### Employee self-service — 2026-11-26
Added sample identity switching, individual shift and leave views, and employee leave submission into shared owner approval queue (1f376a4). Same in-memory sandbox, explicitly not authentication or access control. Regression assertion committed; execution/browser QA pending. Next clock-in/out prototype and authenticated adapter integration.

### Staff time clock — 2026-11-26
Added sample append-only clock events, clock in/out, unpaid breaks, transition validation and worked-time history (f885625, 093cdde). Tests committed; execution/browser QA pending. Uses browser time and synthetic in-memory records, not payroll or production timekeeping. Next owner actual-hours review and timesheet submission.

### Owner timekeeping oversight — 2026-11-26
Added employee clock status, all-record scheduled/completed hours and variance, and completed session details (4949546, 8ba7ca6). Open sessions excluded from worked totals. Regression tests committed; execution/browser QA pending. Next pay-period filtering and timesheet submission. Synthetic only; not payroll or attendance determination.

### Staff reporting period — 2026-11-26
Added inclusive Pacific start-date filters and all-record reset for scheduled/completed hours and session detail (a261b61, 6a070df). Current status remains unfiltered. Overnight sessions assigned entirely to start date for operational reporting only, not payroll allocation. Regression test committed; CI/browser QA pending. Next timesheet submission and approval.

### Timesheet submission and review — 2026-11-26
Added employee completed-session snapshots, overlap prevention, owner approval/rejection with reason and final decision protection (e173ad8, 0909fc3). Rejected periods may be resubmitted. Tests committed; execution/browser QA pending. Next snapshot detail, correction workflow and reconciliation of late clock entries. Synthetic only; not payroll-ready.

### Timesheet reconciliation — 2026-11-26
Added expandable submitted session details, reconciliation against current completed clock records, added/missing session counts and variance, and stale approval guard in owner demo (4b3f78d, 9179922). Original snapshot preserved; stale pending records must be rejected and resubmitted. Regression test committed; CI/browser QA pending. Next correction request workflow. Synthetic only.

### Clock correction requests — 2026-11-26
Added employee issue/date/explanation submission, personal status, owner acceptance/rejection with note (7f69fe9, fc07295). Acceptance queues correction only; no hours changed. Tests committed; execution/browser QA pending. Next audited application of corrected events and timesheet reconciliation. Synthetic only.

### Missed punch application — 2026-11-26
Accepted missed-in/out requests can insert a linked corrected event using Pacific local time and mandatory audit note; original events retained, full staff chronology validated, duplicate application rejected (dc46dcf, 64cf246). Existing timesheet reconciliation detects changed completed sessions. Break/other corrections and approved-timesheet amendments remain pending. Tests committed; execution/browser QA pending. Synthetic only.

### Missing break correction — 2026-11-26
Added audited missing unpaid break insertion with two linked events, chronology validation, owner Pacific-time inputs and duplicate application protection (4679c03, 7b8cbdc). Existing break replacement/removal and approved-timesheet amendments remain pending. Tests committed; execution/browser QA pending. Synthetic only.

### Existing timestamp correction — 2026-11-26
Added audited replacement of an existing employee clock event with original and replacement snapshots, validated chronology and owner form for accepted other requests (162da6a, 32a236c). Tests committed; execution/browser QA pending. Next approved timesheet amendments and break removal. Synthetic only.

### Erroneous break removal — 2026-11-26
Added removal of completed break pairs from effective clock history with original pair retained in correction audit, required note, request date and chronology checks, and owner controls (363de27, dbaef8e). Tests committed; execution/browser QA pending. Next approved timesheet amendments. Synthetic only.

### Approved timesheet amendments — 2026-11-26
Added versioned amendment proposals for stale approved timesheets, mandatory reason, duplicate prevention, original snapshot preservation and effective approved version selection (7e60ced, 447083f). Pending amendments do not supersede approvals. Tests committed; execution/browser QA pending. Next approved-hours export with reconciliation safeguards. Synthetic only.

### Approved hours export — 2026-11-26
Added operational CSV download of effective approved timesheets with date validation, partial-period, pending-review and stale-snapshot guards (9fac318, 2de8dff). Does not establish completeness of all employee hours or calculate payroll. Tests committed; execution/browser QA pending. Next completeness checks and historical pay rates.

### Approved hours export completeness — 2026-11-26
Export now checks every employee represented in clock history for uncovered completed sessions, duplicate approved session coverage and open clocks (e391402). Open clocks block export conservatively even outside the selected period. Cannot detect unrecorded work. Regression tests committed; execution/browser QA pending. Next historical pay-rate configuration.

### Employee hourly rate history — 2026-11-26
Added sample effective-dated hourly compensation records in integer cents, mandatory reason, duplicate-date prevention and historical lookup, plus owner form (062b9eb, 487fe29). No real pay rates entered. Tests committed; execution/browser QA pending. Next base labor cost estimates, with overnight/rate-boundary and overtime limitations explicit.

### Base labor cost estimates — 2026-11-26
Added scheduled and completed actual base wage estimates, historical rate lookup, variance and unresolved rate guards, with owner reporting period integration (1b381e2, e2d2ad7). Excludes overtime, premiums, taxes and benefits; rate changes spanning a session require review. Tests committed; execution/browser QA pending. Next aggregate reporting and payroll rules validation.

### Business labor expense totals — 2026-11-26
Added business-level scheduled and actual base wage totals, variance, known subtotals and missing employee rate indicators; duplicate employee rows rejected (998f1bc, 8eb0887). Tests committed; execution/browser QA pending. Next labor expense CSV and period presets. Synthetic base wage estimates only.

### Labor expense CSV — 2026-11-26
Added employee and business base wage expense CSV, reporting period, incomplete indicators and known subtotals, plus owner download (a7ae3c7, 6e57450). Not payroll; missing costs remain blank. Tests committed; execution/browser QA pending. Next reporting presets and verification backlog.

### Financial reporting presets — 2026-11-26
Pacific week/month/quarter/year presets implemented (812c8f4), integrated with hours and labor cost reporting and existing labor CSV period (8047322). Calendar boundary regression tests committed. Execution/browser QA pending; prioritize verification backlog before further payroll features.

### CI coverage repair — 2026-11-26
Verified business foundation run 45935352742 passed 288/288, checkout 45935352847 and static audit 45935361608 passed. Logs revealed fixed test allowlist omitted recent modules. Changed workflow to app/tests/*.test.mjs and prototype path triggers (d91c8ea). Expanded run not yet verified. Next inspect failures and repair before payroll expansion.

### Expanded CI dependency repair — 2026-11-26
Run 45935444449: 670 tests, 660 passed, 9 failed, 1 skipped. Authentication module and seven startup rejection failures indicate missing dependencies. Added npm install --prefix app --ignore-scripts and package/server change triggers (4b3fe20). No lockfile currently present; reproducible lockfile and rerun verification pending. No security checks weakened.

### Expanded CI verified — 2026-11-26
GitHub Actions run 45935535061 at 4b3fe20: 671 tests, 670 passed, zero failures, one explicit opt-in Neon rollback test skipped. Dependency repair resolved all nine failures. Static audit 45935548137 passed. Browser interaction QA, dependency lockfile and live integration remain pending.

### Reproducible dependency installation — 2026-11-27
Scope: generate npm lockfile from existing app manifest, verify clean installation and update CI to use npm ci where applicable. No production activation. Status: started; next generate lockfile.
