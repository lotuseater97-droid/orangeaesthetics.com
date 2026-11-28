# System audit — 2026-11-27

Scope: source inspection, not penetration testing or production verification. Initial coverage: five files, 149 numbered lines including trailing blank lines. No real patient or employee data.

| File | Lines | Severity | Finding | Status |
|---|---|---|---|---|
| worker.mjs | 4, 24 | Medium | Extension-based asset guard permits extensionless paths; verify public manifest | Open |
| worker.mjs | 25 | Medium | Asset binding exceptions not explicitly handled | Open |
| worker.mjs | 26–30 | Medium | CSP not applied here; inspect asset headers before changing | Open |
| functions/api/appointment-request.js | 5–9, 32–33 | Medium | Origin and honeypot do not prevent direct automated abuse; verify edge rate limits | Open |
| functions/api/appointment-request.js | 40 | Medium | Contact fields can contain sensitive free text | Open |
| functions/api/appointment-request.js | 43 | Medium | Endpoint hostname not explicitly allowlisted; configuration trust boundary | Open |
| functions/api/appointment-request.js | 48–51 | High | No application-level duplicate submission protection; verify downstream idempotency | Open |
| functions/api/appointment-request.js | 49–53 | Medium | HTTP success is assumed to mean acceptance; monitoring not evident | Open |
| wrangler.toml | 7 | High | Repository root is asset directory; prefer dedicated public build directory | Open |
| .assetsignore | 1–34 | Medium | Exclusion list mitigates exposure but needs maintenance | Open |
| app/package.json | 6, 11–14 | Medium | Dependency reproducibility and runtime pinning require review | Open |

Existing safeguards: Worker-first routing, restricted directories and methods, streamed 4096-byte intake limit, strict UTF-8, allowed fields/services, HTTPS outbound endpoint, redirect rejection and timeout. These are source observations, not runtime test results.

Release gates: browser QA, persistent authenticated adapters, Neon integration test, Stripe sandbox reconciliation, California payroll rules review, clinical approval, deployment revision verification, appointment delivery verification, DNS/registrar/email migration. Do not cancel IONOS before independent hosting, DNS, email and registrar transfer are verified.

Last recorded CI: 670 passed, zero failed, one opt-in Neon test skipped (run 45935535061). No new test execution claimed.

Next: enumerate repository files; review each with exact line ranges; record fixes, regression tests and commit identifiers. Do not mark unreviewed files complete.
