# Orange Aesthetics — private Stripe test webhook runtime

This is an **un-deployed development-only** Node.js HTTP server. It does not modify the public Cloudflare assets-only Worker. It accepts signed Stripe **test** events and calls the Neon development branch's `orange_app.confirm_paid_checkout` function.

## Local setup

Use Node 22+. From `app/server`, run `npm install`. Supply `DATABASE_URL` for a dedicated restricted Neon **development** role and `STRIPE_WEBHOOK_SECRET` from a Stripe test webhook endpoint through your secret manager or local environment. Never commit either value. Run `npm start`. Default binding is loopback `127.0.0.1:8788`, not a public listener.

Stripe CLI test forwarding can target `http://127.0.0.1:8788/api/stripe/webhook`; its signing secret must match the environment variable. A Stripe test Checkout Session must have been created and stored on an existing Neon order by a trusted server before this handler can reconcile it. No checkout-session creation endpoint exists yet.

## Before any deployment

Implement authenticated checkout creation and strict server-side order ownership, least-privilege database permissions, Stripe account identity verification, durable webhook retry monitoring, refunds/disputes, subscriptions, and operational alerts. Confirm that the database role cannot modify arbitrary orders or invoke unsafe functions. Do not place this server behind the public site until security/compliance review, BAAs where applicable, and test-mode end-to-end verification.

No PHI or real patient data may be sent to this development environment.
