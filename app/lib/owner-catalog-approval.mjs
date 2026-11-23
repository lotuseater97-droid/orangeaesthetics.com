// Private server adapter. actorSubject must come from verified OIDC, never JSON.
export class OwnerApprovalDenied extends Error { constructor(){super("Owner authentication required");this.name="OwnerApprovalDenied"} }
export function createOwnerCatalogApproval({query,verifyOwner}={}){
 if(typeof query!=="function"||typeof verifyOwner!=="function")throw new TypeError("Trusted owner dependencies required");
 return async function approveCatalog({headers,itemId,approved,requiresClinicalReview,requestId}={}){
  const actor=await verifyOwner({headers});
  if(!actor||typeof actor.subject!=="string"||actor.subject.length<3||actor.role!=="owner")throw new OwnerApprovalDenied();
  if(typeof itemId!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(itemId))throw new Error("Invalid catalog item");
  if(typeof approved!=="boolean"||typeof requiresClinicalReview!=="boolean"||approved&&requiresClinicalReview)throw new Error("Invalid approval state");
  if(typeof requestId!=="string"||requestId.length<8||requestId.length>128)throw new Error("Invalid request ID");
  const result=await query("SELECT orange_app.set_catalog_checkout_approval($1,$2,$3,$4,$5) AS applied",[actor.subject,itemId,approved,requiresClinicalReview,requestId]);
  if(result?.rows?.[0]?.applied!==true)throw new Error("Catalog approval not confirmed");
  return {applied:true};
 };
}
