// Pure owner reporting over authoritative, pre-scoped business records.
// Dates are business-local calendar dates supplied by the trusted data adapter.
import {summarizeMoney} from "./owner-metrics.mjs";
function date(value){
 if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new RangeError("Invalid business date");
 const parsed=new Date(value+"T00:00:00Z");
 if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==value)throw new RangeError("Invalid business date");
 return value;
}
export function summarizeOwnerPeriod({start,end,charges=[],refunds=[],fees=[],expenses=[]}){
 date(start);date(end);
 if(start>end)throw new RangeError("Reversed reporting period");
 const select=rows=>{
  if(!Array.isArray(rows))throw new TypeError("Expected business records");
  return rows.filter(row=>{const day=date(row?.business_date);return day>=start&&day<=end});
 };
 const selected={charges:select(charges),refunds:select(refunds),fees:select(fees),expenses:select(expenses)};
 return Object.freeze({start,end,...summarizeMoney(selected),counts:Object.freeze(Object.fromEntries(Object.entries(selected).map(([key,rows])=>[key,rows.length])))});
}
