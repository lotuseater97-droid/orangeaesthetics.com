# Orange Aesthetics scheduling implementation
Status: deterministic capacity rules only. No live booking, calendar connection or patient records.

## Resource model
- Staff/provider resource, treatment room, service code, requested start/end, configurable buffer.
- Only confirmed or under-review appointments reserve capacity in the pure projection.
- Cancelled, declined and no-show bookings are ignored.
- Closures may block provider, room or all resources.
- Request window enforces notice and maximum scheduling horizon.

## Secure booking requirements
- The marketing appointment request form is **not** a confirmed appointment. The current assets-only Cloudflare Worker does not deploy the existing Pages Function handler.
- Implement a dedicated authenticated API and a server-side transaction with resource locks/unique exclusion constraints; a pure check alone is subject to concurrent double-booking.
- Validate timezone and daylight-saving conversion at the boundary; store UTC timestamps with an explicit location timezone.
- Restrict customer-facing descriptions to non-clinical service labels; avoid symptoms, diagnoses, infusion screening and PHI in calendars or notification payloads.
- Confirm provider credentials and service eligibility independently; scheduling availability is not clinical authorization.
- Use explicit staff confirmation, audited cancellation and no-show workflows.
- Only after real booking API is functional, connect Google Calendar with minimal event metadata, conflict handling and reconciliation.
