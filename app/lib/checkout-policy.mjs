// Fail-closed policy. This is not a checkout endpoint and does not create charges.
export function validateCheckoutRequest({sku, quantity, catalog, enabled = false}) {
  if (enabled !== true) throw new Error("Checkout disabled until merchant, compliance and operational approvals");
  if (typeof sku !== "string" || !/^[a-z0-9_]{3,80}$/.test(sku)) throw new Error("Invalid SKU");
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10) throw new Error("Invalid quantity");
  if (!catalog || catalog.status !== "approved" || !Array.isArray(catalog.items)) throw new Error("Catalog not approved");
  const item = catalog.items.find(x => x.code === sku && x.active === true);
  if (!item || item.payment_eligible !== true || item.requires_clinical_review === true) throw new Error("Item not eligible for online checkout");
  if (!Number.isSafeInteger(item.price_cents) || item.price_cents < 1) throw new Error("Missing approved price");
  if (item.currency !== "usd") throw new Error("Unsupported currency");
  if (!Number.isSafeInteger(item.price_cents * quantity) || item.price_cents * quantity > 99999999) throw new Error("Order total exceeds checkout limit");
  return Object.freeze({code:item.code,quantity,unitAmount:item.price_cents,currency:item.currency,totalAmount:item.price_cents*quantity});
}
