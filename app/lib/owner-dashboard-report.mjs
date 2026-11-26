import {summarizeOwnerPeriod} from "./owner-period-report.mjs";
import {summarizeExpenseCategories} from "./owner-expense-report.mjs";
import {evaluateInventory} from "./inventory-control.mjs";
// Pure view model. Caller must supply authorized tenant-scoped records.
// Inventory is a current snapshot, not a historical period balance.
export function buildOwnerDashboardReport({start,end,today,charges=[],refunds=[],fees=[],expenses=[],items=[],movements=[]}){
 const expenseReport=summarizeExpenseCategories({start,end,expenses});
 const financial=summarizeOwnerPeriod({start,end,charges,refunds,fees,expenses:expenses.filter(e=>e.status==="paid").map(e=>({business_date:e.paid_on,amount_cents:e.amount_cents}))});
 const inventory=evaluateInventory({items,movements,today});
 return {financial,expenseReport,inventory:{as_of:today,...inventory,low_stock_count:inventory.alerts.filter(a=>a.kind==="reorder").length}};
}
