// Server-only PostgreSQL transaction boundary for staff reservation workflows.
// Pass a trusted pg Pool or equivalent; never expose this module to the browser.
export function postgresTransaction(pool){
 if(!pool||typeof pool.connect!=="function")throw new TypeError("PostgreSQL connection pool required");
 return async work=>{
  if(typeof work!=="function")throw new TypeError("Transaction callback required");
  const client=await pool.connect();
  if(!client||typeof client.query!=="function"||typeof client.release!=="function"){
   if(typeof client?.release==="function")client.release(true);
   throw new TypeError("Invalid PostgreSQL client");
  }
  let begun=false,discard=false,committing=false,active=true;
  const scopedQuery=(sql,params)=>{if(!active)throw new Error("Transaction query handle has expired");return client.query(sql,params)};
  try{
   await client.query("BEGIN");begun=true;
   const result=await work(scopedQuery);
   active=false;
   committing=true;
   await client.query("COMMIT");
   committing=false;
   return result;
  }catch(error){
   active=false;
   if(committing||!begun){discard=true;}else if(begun){try{await client.query("ROLLBACK")}catch(rollbackError){discard=true;error.rollbackError=rollbackError}}
   throw error;
  }finally{active=false;client.release(discard)}
 };
}
