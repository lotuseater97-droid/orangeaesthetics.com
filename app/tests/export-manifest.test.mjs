import test from "node:test";import assert from "node:assert/strict";
import {buildExportManifest,verifyExportManifest} from "../lib/export-manifest.mjs";
const data={"orders.csv":Buffer.from("id,total\\na,10\\n")};
const params={exportId:"test-1",generatedAt:"2026-11-22T00:00:00Z",periodStart:"2026-10-01T00:00:00Z",periodEnd:"2026-11-01T00:00:00Z",schemaVersion:"1",files:data,rowCounts:{"orders.csv":1}};
test("builds and validates export digest",()=>assert.equal(verifyExportManifest(buildExportManifest(params),data),true));
test("detects altered bytes",()=>assert.equal(verifyExportManifest(buildExportManifest(params),{"orders.csv":Buffer.from("altered")}),false));
test("rejects unexpected extra files",()=>assert.equal(verifyExportManifest(buildExportManifest(params),{...data,"extra.csv":Buffer.from("")}),false));
test("rejects path traversal file names",()=>assert.throws(()=>buildExportManifest({...params,files:{"../secret.csv":Buffer.from("x")},rowCounts:{"../secret.csv":1}})));
test("rejects negative row counts",()=>assert.throws(()=>buildExportManifest({...params,rowCounts:{"orders.csv":-1}})));
