// Fail-closed, server-reusable IV combination authorization.
// A rule is valid ONLY when published through an approved policy version.
const key=(a,b)=>[a,b].sort().join("|");
export function evaluateIvSelection({selected,policy,clinicalClearance=false,formulationVersion=null}) {
 if(!Array.isArray(selected)||selected.length===0||selected.some(x=>typeof x!=="string"))return {allowed:false,status:"blocked",reasons:["Select a valid treatment."]};
 if(!policy||policy.status!=="approved"||!Array.isArray(policy.items)||!Array.isArray(policy.rules))return {allowed:false,status:"blocked",reasons:["No approved IV combination policy is active."]};
 const known=new Map(policy.items.map(x=>[x.id,x]));
 if(new Set(selected).size!==selected.length)return {allowed:false,status:"blocked",reasons:["Duplicate selection."]};
 if(selected.some(id=>!known.has(id)))return {allowed:false,status:"blocked",reasons:["Unknown treatment or add-on."]};
 if(!clinicalClearance)return {allowed:false,status:"blocked",reasons:["Patient-specific clinical clearance is required."]};
 if(!formulationVersion||formulationVersion!==policy.formulationVersion)return {allowed:false,status:"blocked",reasons:["Approved formulation version is required."]};
 const bases=selected.filter(id=>known.get(id).type==="base");
 if(bases.length!==1)return {allowed:false,status:"blocked",reasons:["Exactly one base treatment is required."]};
 const reasons=[];
 for(let i=0;i<selected.length;i++)for(let j=i+1;j<selected.length;j++){
  const pair=key(selected[i],selected[j]);
  const rule=policy.rules.find(r=>key(r.a,r.b)===pair);
  if(!rule||rule.status!=="approved"||rule.formulationVersion!==formulationVersion||!rule.reviewedBy||!rule.sourceReference||!rule.effectiveDate||!["same_bag","y_site","sequential_only"].includes(rule.administration))reasons.push("Combination "+pair+" is not verified for the requested administration.");
  else if(rule.administration==="sequential_only")reasons.push("Combination "+pair+" requires separate sequential administration and cannot be automatically combined.");
 }
 return {allowed:reasons.length===0,status:reasons.length?"blocked":"eligible_for_clinician_order",reasons:reasons.length?reasons:["Combination policy checks passed; clinician order and final administration checks remain required."]};
}
