# Owner dashboard read HTTP contract (not deployed)

The `owner-read-http.mjs` module adds a framework-neutral GET-only boundary for `/api/owner/records?collection=appointments&limit=50`. It uses the previously integrated backend, validates collection and limit, rejects extraneous parameters, sends `Cache-Control: no-store`, and returns sanitized errors without database details. No write methods are accepted.

The caller must implement `extractVerifiedToken(request)` securely (for example, validating an HttpOnly session cookie or an authorization token through a trusted provider). Merely parsing a cookie or trusting a header is **not** verification. The server must protect against cross-site request risks, enforce rate limits and response size/time limits, configure trusted origins, and supply real `verifySession`, `lookupMembership`, and `query` implementations. Never expose service-role database credentials or PHI to the browser.

This module is not a Cloudflare Worker route and does not change the public site's deployment. It is a reviewable transport contract for integration once the Orange-only backend exists.

## Same-origin request boundary
The handler now requires an explicit HTTPS `allowedOrigin` at construction. It rejects requests addressed to another origin, mismatched `Origin` headers and `Sec-Fetch-Site` values other than `same-origin` or `none`. The full stack forwards this configuration. These are defense-in-depth checks, not authentication and not a substitute for CSRF controls on future mutation routes. Deploy behind a trusted proxy with host-header validation; never derive the allowlisted origin from an untrusted request header.
