// Pure financial summaries for a future authenticated owner dashboard.
// Values must come from reconciled authoritative records, never fabricated sample data.
const valid = value => { if (!Number.isSafeInteger(value) || value < 0) throw new RangeError("Invalid cents"); return value; };
export function summarizeMoney({charges=[],refunds=[],fees=[],expenses=[]}) {
  const sum = rows => rows.reduce((acc,x) => acc + valid(x.amount_cents),0);
  const gross = sum(charges), refunded = sum(refunds), processingFees = sum(fees), operatingExpenses = sum(expenses);
  return Object.freeze({gross_cents:gross,refund_cents:refunded,fees_cents:processingFees,expenses_cents:operatingExpenses,net_cash_before_other_costs_cents:gross-refunded-processingFees-operatingExpenses});
}
export function inventoryOnHand(movements) { return movements.reduce((total,m) => {if (!Number.isSafeInteger(m.quantity_delta)) throw new RangeError("Invalid inventory movement"); return total+m.quantity_delta;},0); }
