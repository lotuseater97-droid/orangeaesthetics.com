import {may,mayReadMember} from "./portal-permissions.mjs";
// Pure boundary guard. The calling API MUST authenticate the session and obtain actor.role/id from a trusted server-side identity store.
export function authorize({actor,action,memberId}){
 if(!actor||typeof actor.id!=="string"||!actor.id||!may(actor.role,action))return {allowed:false,reason:"forbidden"};
 if(action.endsWith("_self"))return {allowed:mayReadMember({role:actor.role,actorId:actor.id,memberId}),reason:actor.id===memberId?"ok":"forbidden"};
 return {allowed:true,reason:"ok"};
}
export function canIssueMemberCard({actor,memberId,accountActive,mfaSatisfied}){
 const decision=authorize({actor,action:"card.read_self",memberId});
 return decision.allowed&&accountActive===true&&mfaSatisfied===true;
}
export function canScanMemberCard({actor,mfaSatisfied}){
 return !!actor&&may(actor.role,"checkin.scan")&&mfaSatisfied===true;
}
