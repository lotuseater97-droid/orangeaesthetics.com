// Deterministic, side-effect-free benefit projection. Never use browser-supplied records as authority.
// Legal gate: caller must explicitly enable expiration after signed-off policy review.
const timestamp = value => { const t = Date.parse(value); if (!Number.isFinite(t)) throw new TypeError("Invalid timestamp"); return t; };
const integer = value => Number.isSafeInteger(value) && value >= 0;
export function projectBenefits({grants,redemptions=[],adjustments=[],now,expirationApproved=false}) {
 if (!Array.isArray(grants)||!Array.isArray(redemptions)||!Array.isArray(adjustments)||typeof expirationApproved!=="boolean") throw new TypeError("Invalid ledger");
 const time=timestamp(now), seen=new Set(), output=[];
 for (const g of grants) {
  if (!g||typeof g.id!=="string"||!g.id||seen.has(g.id)||!integer(g.quantity)||g.quantity===0) throw new TypeError("Invalid grant");
  seen.add(g.id);
  const issued=timestamp(g.valid_from), expiry=timestamp(g.expires_at);
  if(expiry<=issued) throw new TypeError("Invalid grant window");
  const relevant=redemptions.filter(r=>r.grant_id===g.id&&r.status==="confirmed");
  const restored=adjustments.filter(a=>a.grant_id===g.id&&a.approved===true&&a.kind==="restore");
  const reversed=new Set(adjustments.filter(a=>a.grant_id===g.id&&a.approved===true&&a.kind==="reverse_redemption").map(a=>a.redemption_id));
  const redeemed=relevant.filter(r=>!reversed.has(r.id)).length;
  const extra=restored.reduce((sum,a)=>sum+(integer(a.quantity)?a.quantity:0),0);
  const remaining=Math.max(0,g.quantity+extra-redeemed);
  const expired=expirationApproved&&time>=expiry&&remaining>0;
  output.push({id:g.id,quantity:g.quantity,redeemed,restored:extra,remaining,expired,available:time>=issued&&!expired&&g.status==="paid"?remaining:0,expires_at:g.expires_at,valid_from:g.valid_from});
 }
 return output.sort((a,b)=>timestamp(a.expires_at)-timestamp(b.expires_at)||a.id.localeCompare(b.id));
}
export function chooseOldestAvailableGrant(projection) {
 if(!Array.isArray(projection))throw new TypeError("Invalid projection");
 return projection.find(g=>g.available>0)?.id??null;
}
export function expirationImpact({grants,redemptions=[],adjustments=[],now}) {
 const p=projectBenefits({grants,redemptions,adjustments,now,expirationApproved:true});
 return {affected:p.filter(g=>g.expired).map(g=>({grant_id:g.id,quantity:g.remaining,expires_at:g.expires_at})),total:p.filter(g=>g.expired).reduce((s,g)=>s+g.remaining,0)};
}
