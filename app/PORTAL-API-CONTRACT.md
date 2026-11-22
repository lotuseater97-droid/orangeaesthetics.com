# Portal API contract — proposed, not deployed

## Authentication and isolation
- Dedicated identity provider for Orange Aesthetics. Server verifies session signature, expiry, CSRF protection, account status and MFA for staff/owner; derive role and subject from protected identity records, never browser JSON.
- All responses `Cache-Control: no-store`; restrict CORS to first-party origin; prohibit personal data in URLs, analytics and logs. Rate limit per account/device/IP. Apply least privilege and audit mutations.
- Separate member and employee login experiences. Employee roles: MA, clinician, manager, owner. Owner financial privileges do **not** grant clinical clearance.

## Proposed endpoints (all return 401 unauthenticated, 403 unauthorized)
| Method | Route | Role | Behavior |
|---|---|---|---|
| GET | /api/member/me | member | Return minimal own account and plan status |
| GET | /api/member/benefits | member | Return own verified ledger balances |
| POST | /api/member/card | member | Issue 60-second opaque random QR token after authenticated step-up |
| POST | /api/staff/checkins/scan | MA/clinician/manager/owner | Consume one-time QR token; return minimal identity-verification prompt, not clinical data |
| POST | /api/staff/checkins/:id/identity | authorized staff | Verify two identifiers in protected workflow, not in QR |
| POST | /api/staff/checkins/:id/eligibility | authorized staff | Confirm paid membership and unused eligible credit |
| POST | /api/clinical/checkins/:id/clearance | clinician only | Record reference to EHR clearance, never substitute for chart |
| POST | /api/staff/checkins/:id/performed | authorized staff | Record verified service completion after clinical clearance |
| POST | /api/staff/checkins/:id/redeem | authorized staff | Atomic ledger redemption; idempotency key mandatory |
| POST | /api/manager/redemptions/:id/reverse | manager/owner | Approved reversal, reason and immutable audit |
| GET | /api/owner/overview | owner | Aggregate financial reporting without clinical data |
| GET | /api/owner/audit | owner | Paginated protected audit records |

## QR security
- QR contains only a cryptographically random opaque bearer token, no member ID/name/email/DOB/medical info. Generate server-side, hash at rest, short TTL, single-use, revocable. Never store token in localStorage or analytics.
- Scan endpoint atomically consumes valid token after authenticating staff; reject expired/replayed/revoked tokens. Return only enough data to support a protected identity check.
- No QR can independently authorize care or redeem a credit. Eligibility and clinician clearance are separate server states.

## Redemption transaction
1. Verify authenticated staff permission and unique idempotency key.
2. Lock check-in, paid subscription, benefit grant and relevant ledger rows in one ACID transaction.
3. Require identity verified, payment settled, unexpired credit, clinician clearance and service performed.
4. Enforce unique redemption per visit/credit, write immutable ledger and audit event, commit atomically.
5. On retry return previous result; never double-decrement. Reverse with compensating event rather than deleting history.

## Implementation gates
No real endpoints, accounts, QR credentials, billing or PHI are active. Confirm vendor BAA/HIPAA scope, architecture, backups, retention, staging/production isolation, test harness and independent security review before connecting patient information.

## Current QR helper source
`app/lib/qr-token.mjs` provides Node-only cryptographic primitives; `app/tests/qr-token.test.mjs` provides unit-test source. No API routes, DB writes, credential issuance or redemption are live. A QR credential is not authorization for medical care.
