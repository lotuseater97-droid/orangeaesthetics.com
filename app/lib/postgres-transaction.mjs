// Server-only PostgreSQL transaction boundary for staff reservation workflows.
// Pass a trusted pg Pool or equivalent; never expose this module to the browser.
export function postgresTransaction(pool,{statementTimeoutMs=15000}={}){
 if(!Number.isInteger(statementTimeoutMs)||statementTimeoutMs<1000||statementTimeoutMs>120000)throw new RangeError("Invalid statement timeout");
 if(!pool||typeof pool.connect!=="function")throw new TypeError("PostgreSQL connection pool required");
 return async work=>{
  if(typeof work!=="function")throw new TypeError("Transaction callback required");
  const client=await pool.connect();
  if(!client||typeof client.query!=="function"||typeof client.release!=="function"){
   if(typeof client?.release==="function")client.release(true);
   throw new TypeError("Invalid PostgreSQL client");
  }
  const pending=new Set();let failed=false,firstFailure;
  let begun=false,discard=false,committing=false,active=true;
  const scopedQuery=(sql,params)=>{if(!active)throw new Error("Transaction query handle has expired");const p=Promise.resolve().then(()=>client.query(sql,params));pending.add(p);p.then(()=>pending.delete(p),error=>{pending.delete(p);if(!failed){failed=true;firstFailure=error}});return p};
  try{
   await client.query("BEGIN");begun=true;
   await client.query("SELECT set_config('statement_timeout', $1, true)",[String(statementTimeoutMs)]);
   const result=await work(scopedQuery);
   active=false;
   await Promise.allSettled([...pending]);
   if(failed)throw firstFailure;
   committing=true;
   await client.query("COMMIT");
   committing=false;
   return result;
  }catch(error){
   active=false;
   await Promise.allSettled([...pending]);
   if(committing||!begun){discard=true;}else if(begun){try{await client.query("ROLLBACK")}catch(rollbackError){discard=true;error.rollbackError=rollbackError}}
   throw error;
  }finally{active=false;client.release(discard)}
 };
}
