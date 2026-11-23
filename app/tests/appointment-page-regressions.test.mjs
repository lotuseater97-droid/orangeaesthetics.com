import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const html=readFileSync(fileURLToPath(new URL('../../appointment-request.html',import.meta.url)),'utf8');
test('appointment page has accessible form feedback',()=>{
  assert.match(html,/id="appointment-message"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(html,/id="submit-request"[^>]*type="submit"/);
});
test('appointment form times out stalled requests and re-enables submit',()=>{
  assert.match(html,/AbortSignal\.timeout\(12000\)/);
  assert.match(html,/finally\{button\.disabled=false\}/);
});
test('failed requests preserve a click-to-call fallback',()=>{
  assert.match(html,/msg\.replaceChildren\(/);
  assert.match(html,/href:"tel:\+17149213870"/);
  assert.match(html,/if\(!response\.ok\)throw/);
});
test('appointment page avoids collecting clinical details',()=>{
  assert.doesNotMatch(html,/<textarea\b/i);
  assert.match(html,/Please do not include medical history/);
});
