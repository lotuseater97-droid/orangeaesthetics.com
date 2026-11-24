// Server-side PostgreSQL transaction boundary. No pool is created or exposed here.
// Pass a dedicated Orange-only pg-compatible pool with connect() and client.query().
export function createPostgresTransactionRunner({pool}){
 if(!pool||typeof pool.connect!=="function")throw new TypeError("PostgreSQL connection pool required");
 return async callback=>{
  if(typeof callback!=="function")throw new TypeError("Transaction callback required");
  const client=await pool.connect();
  if(!client||typeof client.release!=="function")throw new TypeError("Invalid PostgreSQL client");
  if(typeof client.query!=="function"){client.release();throw new TypeError("Invalid PostgreSQL client");}
  let begun=false;
  let discardClient=false;
  try{
   await client.query("BEGIN");
   begun=true;
   // The callback must only use this transaction-scoped client. Never use pool.query.
   const result=await callback(Object.freeze({query:(text,values=[])=>client.query(text,values)}));
   await client.query("COMMIT");
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
  }finally{client.release(discardClient?new Error("Transaction rollback failed; discard connection"):undefined)}
 };
}
