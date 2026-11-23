# Neon development checkout verification

This project deliberately keeps checkout and owner-approval endpoints disabled in `app/server/index.mjs`. Do not enable them as part of test setup.

## 1. Ordinary CI
Open [Checkout integration tests](https://github.com/lotuseater97-droid/orangeaesthetics.com/actions/workflows/checkout-integration-tests.yml), select **Run workflow**, and leave **Run rollback-only signed webhook test against Neon development** unchecked. Confirm the `checkout` job succeeds, including syntax verification, dependency installation and the TAP report. A green workflow with a skipped Neon job does **not** establish database integration success.

## 2. Optional real Neon integration
In GitHub repository settings, create an Actions environment named `neon-development` with appropriate reviewer protection. In that environment add the secret `NEON_DEV_DATABASE_URL` using a connection URL for the **development branch only** (`br-nameless-wave-bfsa2x6n`). Do not paste the URL into an issue, commit, workflow input or chat. Use a direct connection, not a pooler. The test pins the known development endpoint `ep-young-rain-bfjamlfd.c-5.us-west-2.aws.neon.tech` and database `neondb`; if Neon rotates the endpoint, verify the new hostname against the Neon API before updating the test.

Manually run the workflow and check the Neon integration option. This launches `neon-development-integration` with `ALLOW_ROLLBACK_DB_TEST=true`. It fails if the secret is missing, the branch marker is incorrect, or the URL does not match the approved development endpoint. It creates only synthetic records inside a transaction, sends HMAC-signed Stripe **test-mode** events through the application handler, checks duplicate-event and cross-order replay protection, and rolls back. No live Stripe API calls are made.

**Evidence required before claiming success:** both GitHub jobs must report success on the same manual workflow run; the Neon integration job must actually execute (not skip); inspect its logs for the Node test result; confirm no test data persisted. Record the workflow run URL and commit SHA.

## 3. Production remains blocked
Do not activate live checkout until a dedicated least-privilege database role, real authenticated member and owner sessions, deployment and secrets review, Stripe test-mode reconciliation, refunds/disputes policy, and security review are complete. The public Cloudflare assets-only site is not a secure payment backend.
