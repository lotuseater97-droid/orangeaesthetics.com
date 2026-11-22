// Node server-only cryptographic primitives. Not wired to any public route.
import {randomBytes,createHash,timingSafeEqual} from "node:crypto";
const PREFIX="oa1_";
export function issueOpaqueToken(){return PREFIX+randomBytes(32).toString("base64url")}
export function isWellFormedToken(token){return typeof token==="string"&&/^oa1_[A-Za-z0-9_-]{43}$/.test(token)}
export function hashToken(token){if(!isWellFormedToken(token))throw new TypeError("Malformed QR token");return createHash("sha256").update(token,"utf8").digest("hex")}
export function matchToken(token,storedHash){if(!isWellFormedToken(token)||typeof storedHash!=="string"||!/^[a-f0-9]{64}$/.test(storedHash))return false;const actual=Buffer.from(hashToken(token),"hex"),expected=Buffer.from(storedHash,"hex");return timingSafeEqual(actual,expected)}
export function credentialValid({issuedAt,expiresAt,revokedAt,consumedAt,now}){const start=Date.parse(issuedAt),end=Date.parse(expiresAt),current=Date.parse(now);return [start,end,current].every(Number.isFinite)&&start<=current&&current<end&&end-start<=60000&&revokedAt==null&&consumedAt==null}
// Atomic consume, authorization, auditing and idempotency belong in the protected database transaction.
