// Membership operations projections. Authoritative records must come from a verified server.
// No billing side effects, subscription activation, or credit issuance here.
import {projectBenefits} from "./benefit-history.mjs";
const date=v=>{const t=Date.parse(v);if(!Number.isFinite(t))throw new TypeError("Invalid timestamp");return t};
const states=new Set(["trialing","active","past_due","paused","canceled","incomplete"]);
export function membershipOverview({member_id,subscriptions=[],grants=[],redemptions=[],adjustments=[],now,expirationApproved=false}){
 if(typeof member_id!=="string"||!member_id||!Array.isArray(subscriptions)||!Array.isArray(grants)||!Array.isArray(redemptions)||!Array.isArray(adjustments))throw new TypeError("Invalid membership inputs");
 const current=date(now),ids=new Set(),rows=[];
 for(const s of subscriptions){
  if(s.member_id!==member_id)continue;
  if(!s.id||ids.has(s.id)||!states.has(s.state))throw new TypeError("Invalid subscription");
  ids.add(s.id);
  const start=date(s.period_start),end=date(s.period_end);
  if(end<=start)throw new RangeError("Invalid billing period");
  const in_period=start<=current&&current<end;
  const payment_verified=s.payment_verified===true;
  const eligible=s.state==="active"&&payment_verified&&in_period;
  rows.push({id:s.id,state:s.state,period_start:s.period_start,period_end:s.period_end,payment_verified,eligible,renewal_review:s.state==="past_due"||s.state==="incomplete",ends_in_days:Math.ceil((end-current)/86400000)});
 }
 const scopedGrants=grants.filter(g=>ids.has(g.subscription_id));
 const scopedIds=new Set(scopedGrants.map(g=>g.id));
 const scopedRedemptions=redemptions.filter(r=>scopedIds.has(r.grant_id));
 const scopedAdjustments=adjustments.filter(a=>scopedIds.has(a.grant_id));
 const projection=projectBenefits({grants:scopedGrants,redemptions:scopedRedemptions,adjustments:scopedAdjustments,now,expirationApproved});
 const eligibleSubscriptions=new Set(rows.filter(r=>r.eligible).map(r=>r.id));
 const grantSubscription=new Map(scopedGrants.map(g=>[g.id,g.subscription_id]));
 const credits=projection.map(g=>({...g,available:eligibleSubscriptions.has(grantSubscription.get(g.id))?g.available:0}));
 return {member_id,subscriptions:rows,credits,available_credits:credits.reduce((n,g)=>n+g.available,0),requires_payment_review:rows.some(r=>r.renewal_review||r.state==="active"&&!r.payment_verified)};
}
export function renewalAlerts({subscriptions=[],now,within_days=7}){
 const current=date(now);if(!Number.isSafeInteger(within_days)||within_days<0||within_days>90)throw new RangeError("Invalid horizon");
 const alerts=[];
 for(const s of subscriptions){if(!s?.id||!states.has(s.state))throw new TypeError("Invalid subscription");const end=date(s.period_end);const days=Math.ceil((end-current)/86400000);if(s.state==="past_due"||s.state==="incomplete")alerts.push({subscription_id:s.id,kind:"payment_review"});else if(s.state==="active"&&days>=0&&days<=within_days)alerts.push({subscription_id:s.id,kind:"renewal_approaching",days_remaining:days});else if(s.state==="active"&&days<0)alerts.push({subscription_id:s.id,kind:"period_ended"});}
 return alerts
}
