import {summarizeLaborCosts} from "./staff-labor-cost.mjs";
const quote=v=>'"'+String(v).replace(/^[\s]*[=+@-]/,m=>"'"+m).replaceAll('"','""')+'"';
const money=v=>v===null?"":(v/100).toFixed(2);
export function laborExpenseCsv(rows,period=null){
 const totals=summarizeLaborCosts(rows);
 const data=[["record_type","employee","period_start","period_end","scheduled_base_usd","actual_base_usd","variance_usd","status"]];
 const dates=[period?.start??"",period?.end??""];
 for(const r of rows)data.push(["employee",r.staff_id,...dates,money(r.scheduled.cents),money(r.actual.cents),money(r.variance_cents),r.scheduled.cents===null||r.actual.cents===null?"INCOMPLETE":"BASE_ESTIMATE"]);
 data.push(["business_total","",...dates,money(totals.scheduled.total_cents),money(totals.actual.total_cents),money(totals.variance_cents),totals.variance_cents===null?"INCOMPLETE":"BASE_ESTIMATE"]);
 data.push(["known_subtotal","",...dates,money(totals.scheduled.known_cents),money(totals.actual.known_cents),"","PARTIAL_SUBTOTAL_NOT_PAYROLL"]);
 return data.map(r=>r.map(quote).join(",")).join("\r\n")+"\r\n";
}
