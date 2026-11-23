import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestPost} from '../../functions/api/appointment-request.js';
const env={APPOINTMENT_NOTIFICATION_ENDPOINT:'https://notify.example.test/send',APPOINTMENT_NOTIFICATION_TOKEN:'test'};
const base={name:'Jane Example',email:'jane@example.com',phone:'7145550101',service:'IV wellness'};
async function submit(phone){
  const request=new Request('https://orangeaesthetics.com/api/appointment-request',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...base,phone})});
  return onRequestPost({request,env});
}
test('rejects nonnumeric appointment phone entries',async()=>{
  for(const phone of ['abcdefghi','714-CALL-NOW','123456','1234567890123456','7145550101<script>']){
    assert.equal((await submit(phone)).status,400,phone);
  }
});
test('accepts formatted domestic and international phone numbers',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>new Response(null,{status:200});
  try{
    for(const phone of ['(714) 555-0101','+1 714 555 0101','+44 20 7946 0958']){
      assert.equal((await submit(phone)).status,200,phone);
    }
  }finally{globalThis.fetch=original;}
});
