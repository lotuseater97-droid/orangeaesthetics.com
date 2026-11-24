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
  let begun=false,discard=false;
  try{
   await client.query("BEGIN");begun=true;
   const result=await work((sql,params)=>client.query(sql,params));
   await client.query("COMMIT");
   return result;
  }catch(error){
   if(begun){try{await client.query("ROLLBACK")}catch(rollbackError){discard=true;error.rollbackError=rollbackError}}
   throw error;
  }finally{client.release(discard)}
 };
}
