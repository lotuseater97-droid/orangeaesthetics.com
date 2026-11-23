import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tests = readdirSync(join(root, 'app/tests')).filter(name => name.endsWith('.test.mjs')).sort().map(name => join(root, 'app/tests', name));
const result = spawnSync(process.execPath, ['--test', ...tests], { stdio: 'inherit', cwd: root });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
