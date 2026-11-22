// Expand supplier products to constituent ingredients before compatibility screening.
// Do not equate supplier-listed ingredients with pharmacy-validated preparation data.
export function expandProducts({products,catalog}) {
 if(!Array.isArray(products)||!catalog||!Array.isArray(catalog.products))return {ok:false,errors:["INVALID_INPUT"]};
 const lookup=new Map(catalog.products.map(p=>[p.id,p]));const errors=[],ingredients=[],counts=new Map();
 for(const entry of products){const item=lookup.get(entry?.productId);if(!item){errors.push("UNKNOWN_PRODUCT:"+String(entry?.productId));continue}
  if(item.route_not_established_for_iv)errors.push("IV_ROUTE_NOT_ESTABLISHED:"+item.id);
  if(!Array.isArray(item.ingredients)||!item.ingredients.length){errors.push("MISSING_INGREDIENTS:"+item.id);continue}
  for(const ingredientId of item.ingredients){ingredients.push({ingredientId,productId:item.id});counts.set(ingredientId,(counts.get(ingredientId)||0)+1)}
 }
 for(const [ingredientId,count] of counts)if(count>1)errors.push("OVERLAPPING_INGREDIENT_REQUIRES_CUMULATIVE_DOSE_REVIEW:"+ingredientId);
 // Full concentrations and manufacturer excipients are not present; never auto-authorize.
 errors.push("EXACT_FORMULATION_AND_SAME_BAG_COMPATIBILITY_NOT_VERIFIED");
 return {ok:false,errors:[...new Set(errors)],ingredients};
}
