#!/usr/bin/env node
// Dependency-free repository audit. Run: node scripts/audit-static-site.mjs
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, resolve, relative, isAbsolute } from 'node:path';
const root = process.cwd();
const excluded = new Set(['.git', 'node_modules', '.wrangler', '.github', 'app', 'functions', 'scripts']);
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
for (const page of pages) {
  const html = await readFile(page, 'utf8'), label = relative(root, page);
  if (!/<html\b[^>]*lang=/i.test(html)) warnings.push(label + ': missing language');
  if (!/<title>[^<]+<\/title>/i.test(html)) warnings.push(label + ': missing title');
  if (!/name=["']viewport["']/i.test(html)) warnings.push(label + ': missing viewport');
  if (!/name=["']description["']/i.test(html)) warnings.push(label + ': missing description');
  for (const match of html.matchAll(/<(a|link|script|img)\b[^>]*?\b(href|src)\s*=\s*["']([^"']+)["']/gi)) {
    const raw = match[3];
    if (/^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(raw)) continue;
    const path = raw.split(/[?#]/)[0];
    if (!path) continue;
    const target = path.startsWith('/') ? resolve(root, '.' + path) : resolve(dirname(page), path);
    if (relative(root, target).startsWith('..') || (isAbsolute(relative(root, target)))) {
      errors.push(label + ': unsafe local path ' + raw); continue;
    }
    try { await stat(target); } catch { errors.push(label + ': missing local file ' + raw); }
  }
  for (const match of html.matchAll(/<img\b([^>]*)>/gi)) {
    if (!/\balt\s*=/.test(match[1])) warnings.push(label + ': image missing alt');
  }
}
console.log('Pages:', pages.length, 'Warnings:', warnings.length, 'Broken paths:', errors.length);
warnings.forEach(x => console.log('WARN:', x));
errors.forEach(x => console.error('ERROR:', x));
if (errors.length) process.exitCode = 1;
