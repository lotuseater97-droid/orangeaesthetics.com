import {summarizeOwnerPeriod} from "./owner-period-report.mjs";
// Only paid expenses, supplied by an authorized, tenant-scoped adapter.
// incurred_on is not used as a cash payment date.
export function summarizeExpenseCategories({start,end,expenses=[]}){
 if(!Array.isArray(expenses))throw new TypeError("Expected expenses");
 const ids=new Set(),groups=new Map();
 for(const row of expenses){
  if(!row||typeof row.id!=="string"||!row.id||ids.has(row.id))throw new TypeError("Invalid or duplicate expense");
  ids.add(row.id);
  if(!["draft","pending","approved","paid","rejected","void"].includes(row.status))throw new RangeError("Unknown expense status");
  if(row.status!=="paid")continue;
  const category=row.category;
  if(typeof category!=="string"||!category.trim()||category.length>100)throw new TypeError("Invalid category");
  const list=groups.get(category)||[];
  list.push({business_date:row.paid_on,amount_cents:row.amount_cents});
  groups.set(category,list);
 }
 const total=summarizeOwnerPeriod({start,end,expenses:[...groups.values()].flat()});
 const categories=[...groups].map(([category,rows])=>{
  const report=summarizeOwnerPeriod({start,end,expenses:rows});
  return {category,amount_cents:report.expenses_cents,count:report.counts.expenses};
 }).filter(row=>row.count>0).sort((a,b)=>b.amount_cents-a.amount_cents||a.category.localeCompare(b.category));
 return {start,end,total_cents:total.expenses_cents,count:total.counts.expenses,categories};
}
