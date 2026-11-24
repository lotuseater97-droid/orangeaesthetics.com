// Server-side PostgreSQL transaction boundary. No pool is created or exposed here.
// Pass a dedicated Orange-only pg-compatible pool with connect() and client.query().
export function createPostgresTransactionRunner({pool,statementTimeoutMs=15000}){
 if(!Number.isSafeInteger(statementTimeoutMs)||statementTimeoutMs<1000||statementTimeoutMs>120000)throw new RangeError("Invalid transaction statement timeout");
 if(!pool||typeof pool.connect!=="function")throw new TypeError("PostgreSQL connection pool required");
 return async callback=>{
  if(typeof callback!=="function")throw new TypeError("Transaction callback required");
  const client=await pool.connect();
  if(!client||typeof client.release!=="function")throw new TypeError("Invalid PostgreSQL client");
  if(typeof client.query!=="function"){client.release();throw new TypeError("Invalid PostgreSQL client");}
  let begun=false;
  let discardClient=false;
  let active=true;
  const pending=new Set();
  try{
   try{await client.query("BEGIN")}catch(error){discardClient=true;throw error;}
   begun=true;
   // Bound transaction-local timeout prevents stalled booking writes from holding locks indefinitely.
   await client.query("SELECT set_config($1,$2,true)",["statement_timeout",String(statementTimeoutMs)]);
   // The callback must only use this transaction-scoped client. Never use pool.query.
   const result=await callback(Object.freeze({query:(text,values=[])=>{if(!active)throw new Error("Transaction query used after completion");const operation=Promise.resolve().then(()=>client.query(text,values));pending.add(operation);operation.finally(()=>pending.delete(operation)).catch(()=>{});return operation;}}));
   active=false;
   // Never commit while an unawaited statement may still be executing.
   const outstanding=await Promise.allSettled([...pending]);
   const failed=outstanding.find(item=>item.status==="rejected");
   if(failed)throw failed.reason;
   try{await client.query("COMMIT")}catch(error){
    // Commit may have succeeded remotely even if acknowledgement was lost.
    // Never return a connection with an uncertain transaction state to the pool.
    discardClient=true;
    begun=false;
    throw error;
   }
   begun=false;
   return result;
  }catch(error){
   if(begun){
    try{await client.query("ROLLBACK")}catch(rollbackError){
     discardClient=true;
     throw new AggregateError([error,rollbackError],"Transaction failed and rollback could not be confirmed");
    }
   }
   throw error;
  }finally{active=false;client.release(discardClient?new Error("Transaction state uncertain; discard connection"):undefined)}
 };
}
