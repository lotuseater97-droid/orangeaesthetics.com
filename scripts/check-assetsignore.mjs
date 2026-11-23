#!/usr/bin/env node
// Verify the static asset denylist retains critical protections.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const rules=new Set(readFileSync(resolve(root,'.assetsignore'),'utf8').split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&!s.startsWith('#')));
const required=['.git/','.github/','node_modules/','functions/','app/','scripts/','tests/','private/','internal/','src/','worker.mjs','*.mjs','*.sql','*.toml','*.env','*.env.*','.dev.vars*','*.md','*.json','*.jsonc','*.lock','*.map','*.yml','*.yaml','*.sh','*.py','*.zip','.gitignore','.assetsignore'];
const missing=required.filter(rule=>!rules.has(rule));
if(missing.length){console.error('Missing required static asset exclusions:',missing.join(', '));process.exitCode=1;}
else console.log('Static asset exclusions verified:',required.length);
