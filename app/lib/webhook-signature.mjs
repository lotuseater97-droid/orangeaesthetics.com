import {createHmac,timingSafeEqual} from "node:crypto";
// Dependency-free Stripe signature verification for an unmodified raw UTF-8 payload.
// Production endpoint must also enforce body size, TLS, rate limits and durable event deduplication.
export function verifyStripeSignature(rawBody, header, secret, nowSeconds = Math.floor(Date.now()/1000), tolerance = 300) {
  if (typeof rawBody !== "string" || typeof header !== "string" || typeof secret !== "string" || secret.length < 8) return false;
  const segments = header.split(",").map(x => x.trim().split("="));
  const timestamp = segments.find(([key]) => key === "t")?.[1];
  const signatures = segments.filter(([key]) => key === "v1").map(([,v]) => v);
  if (!/^\d{10,}$/.test(timestamp || "") || signatures.length === 0 || !Number.isFinite(nowSeconds)) return false;
  const time = Number(timestamp);
  if (!Number.isSafeInteger(time) || Math.abs(nowSeconds-time) > tolerance) return false;
  const expected = createHmac("sha256", secret).update(timestamp+"."+rawBody).digest();
  return signatures.some(signature => { if (!/^[a-fA-F0-9]{64}$/.test(signature || "")) return false; const actual = Buffer.from(signature,"hex"); return actual.length === expected.length && timingSafeEqual(actual,expected); });
}
export function parseVerifiedStripeEvent(rawBody, header, secret, nowSeconds) {
  if (!verifyStripeSignature(rawBody,header,secret,nowSeconds)) throw new Error("Stripe signature verification failed");
  const event = JSON.parse(rawBody);
  if (!event || typeof event.id !== "string" || typeof event.type !== "string" || !event.data?.object) throw new Error("Malformed Stripe event");
  return event;
}
