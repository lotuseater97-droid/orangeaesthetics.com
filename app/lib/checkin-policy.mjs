// Domain state checks only; database transactions, authentication and actual clinical verification are NOT implemented.
export const checkinStates=Object.freeze(["scanned","identity_verified","eligibility_verified","awaiting_clinical_clearance","cleared","service_performed","redeemed","cancelled"]);
const allowed={scanned:["identity_verified","cancelled"],identity_verified:["eligibility_verified","cancelled"],eligibility_verified:["awaiting_clinical_clearance","cancelled"],awaiting_clinical_clearance:["cleared","cancelled"],cleared:["service_performed","cancelled"],service_performed:["redeemed"],redeemed:[],cancelled:[]};
export function canAdvance(from,to){return Object.hasOwn(allowed,from)&&allowed[from].includes(to)}
export function evaluateRedemption({identityVerified,paymentVerified,creditAvailable,clinicianCleared,servicePerformed,alreadyRedeemed}){return [identityVerified,paymentVerified,creditAvailable,clinicianCleared,servicePerformed].every(v=>v===true)&&alreadyRedeemed===false}
export function canResolveQr({expired,revoked,used,authenticatedStaff}){return expired===false&&revoked===false&&used===false&&authenticatedStaff===true}
