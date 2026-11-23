// Orange Aesthetics private app IA adapted from Silver Iris business workspaces.
// Pure configuration; authorization must be enforced server-side, never from navigation.
export const workspaces=Object.freeze([
 {id:"today",label:"Today",roles:["owner","manager","clinician","ma"],children:["schedule","requests","tasks","alerts"]},
 {id:"business",label:"Business",roles:["owner","manager"],children:["overview","finances","services","vendors","inventory"]},
 {id:"operations",label:"Operations",roles:["owner","manager","clinician","ma"],children:["appointments","clients","membership-benefits","tasks"]},
 {id:"communication",label:"Communication",roles:["owner","manager","clinician","ma"],children:["inquiries","messages","announcements","documents"]},
 {id:"administration",label:"Administration",roles:["owner","manager"],children:["team","permissions","audit","settings","backup-center"]}
]);
export const capabilities=Object.freeze({owner:["*"],manager:["dashboard.read","appointments.manage","leads.manage","business.read","invoices.manage","payments.record","expenses.manage","inventory.manage","inventory.read","appointments.read","tasks.read","reports.read","staff.read"],clinician:["dashboard.read","appointments.read","tasks.read","appointments.update-assigned","benefits.verify","inventory.read"],ma:["dashboard.read","appointments.read","appointments.update-assigned","inventory.read"],member:["account.read-own","appointments.request-own","benefits.read-own"]});
export function allowed(role,capability,overrides=[]){if(!Object.hasOwn(capabilities,role))return false;if(typeof capability!=="string"||!capability)return false;return capabilities[role].includes("*")||capabilities[role].includes(capability)||overrides.includes(capability)}
export function visibleWorkspaces(role){return workspaces.filter(w=>w.roles.includes(role)).map(w=>({...w,children:[...w.children]}))}
