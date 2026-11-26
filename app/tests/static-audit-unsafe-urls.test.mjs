import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const script=fileURLToPath(new URL('../../scripts/audit-static-site.mjs',import.meta.url));
function runWithLink(link) {
  const dir=mkdtempSync(join(tmpdir(),'orange-audit-'));
  try {
    const head='<!doctype html><html lang="en"><head><title>Test page</title><meta name="viewport" content="width=device-width"><meta name="description" content="Test"></head><body>';
    writeFileSync(join(dir,'index.html'),head+link+'</body></html>');
    writeFileSync(join(dir,'appointment-request.html'),head+'</body></html>');
    return spawnSync(process.execPath,[script],{cwd:dir,encoding:'utf8',timeout:5000});
  } finally {rmSync(dir,{recursive:true,force:true});}
}
test('rejects javascript links',()=>{
  const result=runWithLink('<a href="javascript:alert(1)">Click</a>');
  assert.equal(result.status,1,result.stdout+result.stderr);
  assert.match(result.stderr,/unsafe URL/);
});
test('rejects data-backed script sources',()=>{
  const result=runWithLink('<script src="data:text/javascript,alert(1)"></script>');
  assert.equal(result.status,1,result.stdout+result.stderr);
  assert.match(result.stderr,/unsafe URL/);
});
test('permits data-backed image sources',()=>{
  const result=runWithLink('<img src="data:image/png;base64,iVBORw0KGgo=" alt="Example">');
  assert.equal(result.status,0,result.stdout+result.stderr);
});

test('ignores unpublished HTML inside private and internal directories',()=>{
  const dir=mkdtempSync(join(tmpdir(),'orange-audit-private-'));
  try {
    const head='<!doctype html><html lang="en"><head><title>Public</title><meta name="viewport" content="width=device-width"><meta name="description" content="Test"></head><body></body></html>';
    writeFileSync(join(dir,'index.html'),head);
    writeFileSync(join(dir,'appointment-request.html'),head);
    for (const folder of ['private','internal','src','tests']) {
      mkdirSync(join(dir,folder));
      writeFileSync(join(dir,folder,'draft.html'),'<a href="/missing-draft-only.png">Draft</a>');
    }
    const result=spawnSync(process.execPath,[script],{cwd:dir,encoding:'utf8',timeout:5000});
    assert.equal(result.status,0,result.stdout+result.stderr);
    assert.match(result.stdout,/Pages: 2\b/);
  } finally {rmSync(dir,{recursive:true,force:true});}
});

test('rejects SVG data images that could carry active content',()=>{
  const result=runWithLink('<img src="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" alt="Example">');
  assert.equal(result.status,1,result.stdout+result.stderr);
  assert.match(result.stderr,/unsafe URL/);
});
test('rejects non-base64 image data URLs',()=>{
  const result=runWithLink('<img src="data:image/png,not-base64" alt="Example">');
  assert.equal(result.status,1,result.stdout+result.stderr);
  assert.match(result.stderr,/unsafe URL/);
});

 test('rejects browser-normalized active URL schemes',()=>{
  for (const url of ['java\tscript:alert(1)', 'java\nscript:alert(1)', 'da\rta:text/html,unsafe']) {
    const result=runWithLink('<a href="'+url+'">Click</a>');
    assert.equal(result.status,1,result.stdout+result.stderr);
    assert.match(result.stderr,/unsafe URL/);
  }
});
