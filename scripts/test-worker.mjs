import { spawnSync } from 'node:child_process';
const result = spawnSync(process.execPath, ['--test', 'app/tests/appointment-request.test.mjs', 'app/tests/worker-routing.test.mjs'], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
