// Pure authorization policy. Server must derive role from authenticated session/database, NEVER from a browser request.
const permissions=Object.freeze({
 member:["account.read_self","benefits.read_self","card.read_self","billing.portal_self","appointments.request_self"],
 ma:["checkin.scan","checkin.verify_identity","benefits.read_limited","checkin.create","redemption.request"],
 clinician:["checkin.scan","checkin.verify_identity","benefits.read_limited","checkin.create","redemption.request","clinical.clearance_record"],
 manager:["checkin.scan","checkin.verify_identity","benefits.read_limited","checkin.create","redemption.request","redemption.reverse_approve","refund.review","inventory.manage"],
 owner:["checkin.scan","checkin.verify_identity","benefits.read_limited","checkin.create","redemption.request","redemption.reverse_approve","refund.review","inventory.manage","financial.read","financial.export","roles.manage","audit.read","catalog.manage"]
});
export function may(role,permission){return typeof role==="string"&&typeof permission==="string"&&Object.hasOwn(permissions,role)&&permissions[role].includes(permission)}
export function mayReadMember({role,actorId,memberId}){return role==="member"&&typeof actorId==="string"&&actorId.length>0&&actorId===memberId}
export function requirePermission(role,permission){if(!may(role,permission))throw new Error("Forbidden");return true}
export const roleNames=Object.freeze(Object.keys(permissions));
// Financial and clinical approval are intentionally separate. Owner role cannot approve clinical clearance.
