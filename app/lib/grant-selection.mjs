// Pure grant selection policy; callers MUST supply only grants verified for the authenticated member
// and paid subscriptions. No browser-provided grants, reversals or membership status are trusted.
export function chooseEligibleGrant({grants,redemptions,now,memberId,subscriptions,reversals=[]}){
 const time=Date.parse(now);
 if(!Number.isFinite(time)||!Array.isArray(grants)||!Array.isArray(redemptions)||!Array.isArray(reversals))throw new TypeError("Invalid input");
 const scoped=memberId!==undefined;
 if(scoped&&(typeof memberId!=="string"||!memberId||!Array.isArray(subscriptions)))throw new TypeError("Invalid member scope");
 const paidSubscriptions=scoped?new Set(subscriptions.filter(s=>s.member_id===memberId&&s.state==="active"&&s.payment_verified===true&&Number.isFinite(Date.parse(s.period_start))&&Number.isFinite(Date.parse(s.period_end))&&Date.parse(s.period_start)<=time&&time<Date.parse(s.period_end)).map(s=>s.id)):null;
 const reversedIds=new Set(reversals.filter(r=>r?.approved===true).map(r=>r.redemption_id));
 const eligible=grants.filter(g=>{
  if(g?.status!=="paid"||!Number.isSafeInteger(g.quantity)||g.quantity<=0||!g.id)return false;
  if(scoped&&!paidSubscriptions.has(g.subscription_id))return false;
  const from=Date.parse(g.valid_from),until=Date.parse(g.expires_at);
  if(!Number.isFinite(from)||!Number.isFinite(until)||!(from<=time&&time<until))return false;
  const used=redemptions.filter(r=>r.grant_id===g.id&&r.status==="confirmed"&&!reversedIds.has(r.id)).length;
  return used<g.quantity;
 });
 eligible.sort((a,b)=>Date.parse(a.expires_at)-Date.parse(b.expires_at)||String(a.id).localeCompare(String(b.id)));
 return eligible[0]?.id??null;
}
