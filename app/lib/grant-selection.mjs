// Pure grant selection logic for tests; NOT a replacement for DB locks or authoritative payment checks.
export function chooseEligibleGrant({grants,redemptions,now}){
 const time=Date.parse(now);
 if(!Number.isFinite(time)||!Array.isArray(grants)||!Array.isArray(redemptions))throw new TypeError("Invalid input");
 const eligible=grants.filter(g=>{
  if(g?.status!=="paid"||!Number.isSafeInteger(g.quantity)||g.quantity<=0)return false;
  const from=Date.parse(g.valid_from),until=Date.parse(g.expires_at);
  if(!Number.isFinite(from)||!Number.isFinite(until)||!(from<=time&&time<until))return false;
  const used=redemptions.filter(r=>r.grant_id===g.id&&r.status==="confirmed"&&!r.reversed).length;
  return used<g.quantity;
 });
 eligible.sort((a,b)=>Date.parse(a.expires_at)-Date.parse(b.expires_at)||String(a.id).localeCompare(String(b.id)));
 return eligible[0]?.id??null;
}
