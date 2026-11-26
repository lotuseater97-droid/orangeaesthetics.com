#!/usr/bin/env node
// Dependency-free repository audit. Run: node scripts/audit-static-site.mjs
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, resolve, relative, isAbsolute } from 'node:path';
const root = process.cwd();
const excluded = new Set(['.git', 'node_modules', '.wrangler', '.github', 'app', 'functions', 'scripts', 'tests', 'private', 'internal', 'src']);
async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory() && !excluded.has(entry.name)) out.push(...await walk(path));
    else if (entry.isFile() && extname(entry.name) === '.html') out.push(path);
  }
  return out;
}
const pages = await walk(root), errors = [], warnings = [];
if (pages.length === 0) errors.push('No public HTML pages found; refusing to pass an empty site audit');
for (const required of ['index.html', 'appointment-request.html']) {
  if (!pages.some(page => relative(root, page) === required)) errors.push('Missing required public page: ' + required);
}
for (const page of pages) {
  const html = await readFile(page, 'utf8'), label = relative(root, page);
  if (!/<html\b[^>]*lang=/i.test(html)) warnings.push(label + ': missing language');
  if (!/<title>[^<]+<\/title>/i.test(html)) warnings.push(label + ': missing title');
  if (!/name=["']viewport["']/i.test(html)) warnings.push(label + ': missing viewport');
  if (!/name=["']description["']/i.test(html)) warnings.push(label + ': missing description');
  for (const match of html.matchAll(/<(a|link|script|img)\b[^>]*?\b(href|src)\s*=\s*["']([^"']+)["']/gi)) {
    const raw = match[3].trim();
    // Browsers remove ASCII tabs and newlines from URL schemes.
    const normalized = raw.replace(/[\t\n\r]/g, '');
    const tag = match[1].toLowerCase();
    const safeEmbeddedImage = tag === 'img' && /^data:image\/(?:png|jpeg|gif|webp|avif);base64,[a-z0-9+/=]+$/i.test(raw);
    if (/^javascript\s*:/i.test(normalized) || (/^data\s*:/i.test(normalized) && !safeEmbeddedImage)) {
      errors.push(label + ': unsafe URL in ' + tag + ' ' + match[2] + ': ' + raw.slice(0, 80));
      continue;
    }
    if (/^(https?:|mailto:|tel:|data:|#|\/\/)/i.test(raw)) continue;
    const path = raw.split(/[?#]/)[0];
    if (!path) continue;
    const target = path.startsWith('/') ? resolve(root, '.' + path) : resolve(dirname(page), path);
    if (relative(root, target).startsWith('..') || (isAbsolute(relative(root, target)))) {
      errors.push(label + ': unsafe local path ' + raw); continue;
    }
    try { const info = await stat(target); if (!info.isFile()) errors.push(label + ': local asset is not a file ' + raw); } catch { errors.push(label + ': missing local file ' + raw); }
  }
  for (const match of html.matchAll(/<img\b([^>]*)>/gi)) {
    if (!/\balt\s*=/.test(match[1])) warnings.push(label + ': image missing alt');
  }
}
console.log('Pages:', pages.length, 'Warnings:', warnings.length, 'Broken paths:', errors.length);
warnings.forEach(x => console.log('WARN:', x));
errors.forEach(x => console.error('ERROR:', x));
if (errors.length) process.exitCode = 1;
