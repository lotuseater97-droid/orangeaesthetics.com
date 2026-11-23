// Business inventory controls. Does not authorize clinical use or track PHI.
const integer=n=>Number.isSafeInteger(n)&&n>=0;
export function evaluateInventory({items=[],movements=[],today}){
 const now=Date.parse(today);if(!Number.isFinite(now))throw new TypeError("Invalid date");
 const seen=new Set(),stock=[],alerts=[];
 for(const item of items){
  if(!item||typeof item.id!=="string"||!item.id||seen.has(item.id)||!integer(item.reorder_threshold))throw new TypeError("Invalid inventory item");
  seen.add(item.id);
  let on_hand=0;
  for(const m of movements.filter(m=>m.item_id===item.id)){
   if(!Number.isSafeInteger(m.quantity_delta)||!m.id)throw new TypeError("Invalid inventory movement");
   on_hand+=m.quantity_delta;
  }
  const record={id:item.id,sku:item.sku,on_hand,reorder_threshold:item.reorder_threshold};
  stock.push(record);
  if(on_hand<0)alerts.push({kind:"negative_stock",item_id:item.id});
  if(on_hand<=item.reorder_threshold)alerts.push({kind:"reorder",item_id:item.id});
  if(item.lots)for(const lot of item.lots){
   if(!integer(lot.quantity)||typeof lot.lot_code!=="string"||!lot.lot_code)throw new TypeError("Invalid lot");
   const expiry=Date.parse(lot.expires_on+"T00:00:00Z");if(!Number.isFinite(expiry))throw new TypeError("Invalid expiry");
   if(lot.quantity>0&&expiry<=now)alerts.push({kind:"expired_lot",item_id:item.id,lot_code:lot.lot_code});
   else if(lot.quantity>0&&expiry-now<=30*86400000)alerts.push({kind:"expiring_lot",item_id:item.id,lot_code:lot.lot_code});
  }
 }
 for(const m of movements)if(!seen.has(m.item_id))alerts.push({kind:"orphan_movement",movement_id:m.id});
 return {stock,alerts}
}
export function proposeReorder({on_hand,reorder_threshold,target_stock,pack_size=1}){
 if(![on_hand,reorder_threshold,target_stock,pack_size].every(Number.isSafeInteger)||reorder_threshold<0||target_stock<reorder_threshold||pack_size<1)throw new RangeError("Invalid stock policy");
 if(on_hand>reorder_threshold)return 0;
 return Math.ceil(Math.max(0,target_stock-on_hand)/pack_size)*pack_size
}
