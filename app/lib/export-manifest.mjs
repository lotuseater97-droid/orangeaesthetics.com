import { createHash } from "node:crypto";
// Verify an already-generated export manifest against server-supplied file bytes.
// Do not use as a replacement for signed archives, authenticated downloads or encrypted storage.
const sha256 = data => createHash("sha256").update(data).digest("hex");
export function verifyExportManifest(manifest, files) {
 if (!manifest || !Array.isArray(manifest.files) || !files || typeof files!=="object" || !Number.isFinite(Date.parse(manifest.generated_at))) throw new TypeError("Invalid manifest");
 if (!manifest.export_id || !manifest.schema_version || !manifest.period_start || !manifest.period_end || !Number.isFinite(Date.parse(manifest.period_start)) || !Number.isFinite(Date.parse(manifest.period_end)) || Date.parse(manifest.period_end)<=Date.parse(manifest.period_start)) throw new TypeError("Invalid export metadata");
 const names=new Set();
 for(const entry of manifest.files) {
  if(!entry || typeof entry.name!=="string" || !/^[a-z][a-z0-9_-]*\.csv$/.test(entry.name) || names.has(entry.name) || !Number.isSafeInteger(entry.rows) || entry.rows<0 || !/^[a-f0-9]{64}$/.test(entry.sha256)) throw new TypeError("Invalid file entry");
  names.add(entry.name);
  const bytes=files[entry.name];
  if(!Buffer.isBuffer(bytes) && !(bytes instanceof Uint8Array)) return false;
  if(sha256(bytes)!==entry.sha256) return false;
 }
 return Object.keys(files).length===names.size;
}
export function buildExportManifest({exportId,generatedAt,periodStart,periodEnd,schemaVersion,files,rowCounts}) {
 if(!files || typeof files!=="object" || !rowCounts || typeof rowCounts!=="object") throw new TypeError("Invalid files");
 const manifest={export_id:exportId,generated_at:generatedAt,period_start:periodStart,period_end:periodEnd,schema_version:schemaVersion,files:Object.entries(files).sort(([a],[b])=>a.localeCompare(b)).map(([name,bytes])=>({name,rows:rowCounts[name],sha256:sha256(bytes)}))};
 if(!verifyExportManifest(manifest,files)) throw new TypeError("Invalid export");
 return manifest;
}
