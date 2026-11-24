// Trusted server-only membership lookup. Must use privileged, audited DB connection.
import {BusinessError} from "./business-api.mjs";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function createStaffMembershipSqlLookup({query,lockMembership=false}){
 if(typeof lockMembership!=="boolean")throw new TypeError("Invalid membership lock option");
 if(typeof query!=="function")throw new TypeError("Trusted SQL executor required");
 return async ({user_id,organization_id})=>{
  if(!uuid.test(user_id||"")||!uuid.test(organization_id||""))throw new BusinessError("FORBIDDEN","Invalid membership scope");
  const result=await query("SELECT organization_id, role, active FROM public.oa_team_members WHERE user_id = $1 AND organization_id = $2 AND active = TRUE LIMIT 1"+(lockMembership?" FOR SHARE":""),[user_id,organization_id]);
  if(!result||!Array.isArray(result.rows)||result.rows.length>1)throw new BusinessError("INTERNAL","Invalid membership response");
  const member=result.rows[0]??null;
  if(member!==null&&(typeof member!=="object"||Array.isArray(member)||member.organization_id!==organization_id||typeof member.role!=="string"||typeof member.active!=="boolean"))throw new BusinessError("INTERNAL","Invalid membership row");
  return member;
 };
}
