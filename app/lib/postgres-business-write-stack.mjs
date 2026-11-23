// Server-only integration of transactional business service with pinned PostgreSQL connections.
// Creation is intentionally disabled until schema-aligned create adapters are implemented.
import {createPostgresBusinessCreateAdapter} from "./postgres-business-creates.mjs";
import {createTransactionalBusinessService} from "./transactional-business-service.mjs";
import {createPostgresTransactionRunner} from "./postgres-transaction-runner.mjs";
import {createPostgresTransitionAdapter} from "./postgres-business-transitions.mjs";
import {createPostgresIdempotencyAdapter} from "./postgres-idempotency.mjs";
import {createStaffMembershipSqlLookup} from "./staff-membership-sql.mjs";
export function createPostgresBusinessWriteStack({pool,verifySession,queryMembership}){
 if(typeof verifySession!=="function"||typeof queryMembership!=="function")throw new TypeError("Trusted session and membership adapters required");
 const run=createPostgresTransactionRunner({pool});
 const lookupStaff=createStaffMembershipSqlLookup({query:queryMembership});
 const service=createTransactionalBusinessService({
  verifySession,
  lookupStaff,
  withTransaction:callback=>run(async ({query})=>{
   const transitions=createPostgresTransitionAdapter({query});
   const idempotency=createPostgresIdempotencyAdapter({query});
   const creates=createPostgresBusinessCreateAdapter({query});
   return callback(Object.freeze({
    ...transitions,
    ...idempotency,
    ...creates
   }));
  })
 });
 return Object.freeze({
  async createExpense({token,payload,idempotency_key}){
   return service.write({token,kind:"expense",operation:"create",payload,idempotency_key});
  },
  async transition({token,kind,id,to,idempotency_key}){
   return service.write({token,kind,operation:"transition",id,to,idempotency_key});
  }
 });
}
