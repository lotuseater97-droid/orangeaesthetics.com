// Deterministic non-clinical notification planning. No sending, persistence or PHI.
const templates=Object.freeze({
 appointment_request_received:{channels:["email"],audience:"customer",fields:["first_name"]},
 appointment_review_needed:{channels:["email"],audience:"staff",fields:["request_id"]},
 appointment_confirmed:{channels:["email"],audience:"customer",fields:["first_name","date_label","time_label"]},
 invoice_issued:{channels:["email"],audience:"customer",fields:["invoice_number"]},
 invoice_payment_received:{channels:["email"],audience:"customer",fields:["invoice_number"]},
 inventory_reorder_needed:{channels:["email"],audience:"staff",fields:["sku"]},
 task_assigned:{channels:["email"],audience:"staff",fields:["task_id"]}
});
const safeText=(v)=>typeof v==="string"&&v.length>0&&v.length<=120&&!/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(v);
export function notificationTypes(){return Object.keys(templates)}
export function prepareNotification({type,recipient,fields={},consent={},idempotency_key}){
 if(!Object.hasOwn(templates,type))throw new RangeError("Unknown notification type");
 const template=templates[type];
 if(!recipient||!safeText(recipient.id)||!safeText(recipient.email)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email))throw new TypeError("Invalid recipient");
 if(typeof idempotency_key!=="string"||!/^[-_a-zA-Z0-9]{12,128}$/.test(idempotency_key))throw new TypeError("Invalid idempotency key");
 if(!fields||typeof fields!=="object"||Array.isArray(fields)||Object.keys(fields).some(k=>!template.fields.includes(k)))throw new TypeError("Unexpected template fields");
 for(const key of template.fields)if(!safeText(fields[key]))throw new TypeError("Missing or invalid field: "+key);
 if(template.audience==="customer"&&consent.transactional_email!==true)throw new TypeError("Transactional email consent or lawful basis must be verified");
 const subject=({
 appointment_request_received:"Appointment request received",
 appointment_review_needed:"Appointment request needs review",
 appointment_confirmed:"Appointment confirmed",
 invoice_issued:"Invoice available",
 invoice_payment_received:"Payment receipt available",
 inventory_reorder_needed:"Inventory reorder review",
 task_assigned:"New task assigned"
 })[type];
 // Return only a transport-neutral command. Never place customer or financial details in URLs.
 return Object.freeze({type,recipient_id:recipient.id,channel:"email",to:recipient.email,subject,fields:Object.freeze({...fields}),idempotency_key,classification:"business_nonclinical"});
}
export function retryDecision({attempts,permanent_failure=false},maxAttempts=5){
 if(!Number.isSafeInteger(attempts)||attempts<0||!Number.isSafeInteger(maxAttempts)||maxAttempts<1)throw new RangeError("Invalid attempts");
 if(permanent_failure)return {action:"dead_letter",delay_seconds:null};
 if(attempts>=maxAttempts)return {action:"dead_letter",delay_seconds:null};
 return {action:"retry",delay_seconds:Math.min(3600,30*2**attempts)};
}
