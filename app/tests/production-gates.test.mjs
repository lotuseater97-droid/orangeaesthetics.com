import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("development runtime keeps checkout, checkout HTTP and owner approval disabled",async()=>{
 const source=await readFile(new URL("../server/index.mjs",import.meta.url),"utf8");
 assert.match(source,/createCheckoutService\(\{[^;]*enabled:false\}\)/);
 assert.match(source,/createCheckoutHttpHandler\(\{[\s\S]*?enabled:false[\s\S]*?\}\)/);
 assert.match(source,/createOwnerCatalogHttpHandler\(\{[^;]*enabled:false\}\)/);
});
