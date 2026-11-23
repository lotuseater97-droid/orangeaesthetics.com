// Same-bag, same-line IV formulation gate. Pure function, safe to run server-side.
// NEVER treat this function alone as a medical authorization or substitute for pharmacy review.
const fail=(codes)=>({allowed:false,status:"blocked",codes:[...new Set(codes)]});
const positive=(v)=>typeof v==="number"&&Number.isFinite(v)&&v>0;
const id=v=>typeof v==="string"&&/^[a-z0-9_-]{2,80}$/.test(v);
const pair=(a,b)=>[a,b].sort().join("|");
const timestamp=value=>typeof value==="string"&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
const evidenceCurrent=(entry,now)=>timestamp(entry?.effectiveDate)&&timestamp(entry?.expiresAt)&&entry.effectiveDate<=now&&now<entry.expiresAt;
export function evaluateSameBag({formulation,policy,clinicalClearance=false,clinicalChecks={},now=new Date().toISOString()}) {
 const errors=[];
 if(!timestamp(now))return fail(["INVALID_EVALUATION_TIME"]);
 if(!policy||policy.status!=="approved"||policy.administration!=="same_bag_same_line"||!id(policy.formulationVersion))errors.push("POLICY_NOT_APPROVED");
 if(!formulation||!Array.isArray(formulation.ingredients)||!id(formulation.id)||!id(formulation.version))return fail([...errors,"FORMULATION_INCOMPLETE"]);
 if(formulation.version!==policy?.formulationVersion)errors.push("FORMULATION_VERSION_MISMATCH");
 if(!clinicalClearance||clinicalChecks.contraindicationsCleared!==true||clinicalChecks.medicationsReviewed!==true||clinicalChecks.labsReviewed!==true||clinicalChecks.clinicianOrderVerified!==true)errors.push("PATIENT_REVIEW_INCOMPLETE");
 if(!id(formulation.diluentId)||!positive(formulation.finalVolumeMl)||!positive(formulation.infusionMinutes)||!positive(formulation.holdMinutes))errors.push("PREPARATION_DETAILS_MISSING");
 if(!Array.isArray(policy?.rules))errors.push("RULES_UNAVAILABLE");
 const ingredients=formulation.ingredients;
 if(ingredients.length===0||ingredients.length>50)errors.push("INVALID_INGREDIENT_COUNT");
 const totals=new Map();
 for(const ing of ingredients){
  if(!id(ing?.ingredientId)||!positive(ing?.dose)||!id(ing?.unit)||!id(ing?.sourceSku)||!positive(ing?.concentration)||!id(ing?.concentrationUnit)) {errors.push("INGREDIENT_DETAILS_MISSING");continue;}
  const key=ing.ingredientId+"|"+ing.unit;
  totals.set(key,(totals.get(key)||0)+ing.dose);
 }
 if(totals.size!==ingredients.length)errors.push("DUPLICATE_INGREDIENT_REQUIRES_TOTAL_DOSE_REVIEW");
 const approved=Array.isArray(policy?.approvedIngredients)?policy.approvedIngredients:[];
 for(const ing of ingredients){
  const entry=approved.find(x=>x.ingredientId===ing.ingredientId&&x.sourceSku===ing.sourceSku&&x.unit===ing.unit&&x.concentrationUnit===ing.concentrationUnit);
  if(!entry||entry.status!=="approved"||!positive(entry.maxDose)||!positive(entry.minConcentration)||!positive(entry.maxConcentration)||!positive(entry.maxTotalDose)||!entry.sourceReference||!entry.reviewedBy||!evidenceCurrent(entry,now))errors.push("INGREDIENT_NOT_APPROVED:"+ing.ingredientId);
  else if(ing.dose>entry.maxDose||ing.concentration<entry.minConcentration||ing.concentration>entry.maxConcentration||(totals.get(ing.ingredientId+"|"+ing.unit)||0)>entry.maxTotalDose)errors.push("INGREDIENT_LIMIT_EXCEEDED:"+ing.ingredientId);
 }
 if(ingredients.length>1){
  for(let i=0;i<ingredients.length;i++)for(let j=i+1;j<ingredients.length;j++){
   const a=ingredients[i],b=ingredients[j];if(!id(a.ingredientId)||!id(b.ingredientId))continue;
   const rule=policy.rules?.find(r=>pair(r.a,r.b)===pair(a.ingredientId,b.ingredientId));
   if(!rule||rule.status!=="approved"||rule.administration!=="same_bag_same_line"||rule.formulationVersion!==formulation.version||rule.diluentId!==formulation.diluentId||!positive(rule.minVolumeMl)||!positive(rule.maxVolumeMl)||!positive(rule.maxInfusionMinutes)||!positive(rule.maxHoldMinutes)||!rule.sourceReference||!rule.reviewedBy||!evidenceCurrent(rule,now))errors.push("PAIR_NOT_VERIFIED:"+pair(a.ingredientId,b.ingredientId));
   else if(formulation.finalVolumeMl<rule.minVolumeMl||formulation.finalVolumeMl>rule.maxVolumeMl||formulation.infusionMinutes>rule.maxInfusionMinutes||formulation.holdMinutes>rule.maxHoldMinutes)errors.push("PAIR_PREPARATION_LIMIT:"+pair(a.ingredientId,b.ingredientId));
  }
 }
 if(!policy?.approvedDiluents?.includes(formulation.diluentId))errors.push("DILUENT_NOT_APPROVED");
 if(!positive(policy?.maxFinalVolumeMl)||formulation.finalVolumeMl>policy.maxFinalVolumeMl||!positive(policy?.maxInfusionMinutes)||formulation.infusionMinutes>policy.maxInfusionMinutes||!positive(policy?.maxHoldMinutes)||formulation.holdMinutes>policy.maxHoldMinutes)errors.push("GLOBAL_PREPARATION_LIMIT");
 if(errors.length)return fail(errors);
 return {allowed:true,status:"eligible_for_final_pharmacist_and_clinician_verification",codes:["POLICY_CHECKS_PASSED_NOT_ADMINISTRATION_AUTHORIZATION"]};
}
