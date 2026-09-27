import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildStatic } from '../scripts/build-static.mjs';
import { findCase } from '../web/match.mjs';
test('static build works in repository subpaths and contains only public artifacts', async () => {
 const out = await mkdtemp(path.join(os.tmpdir(), 'sourcever-static-'));
 try {
  await buildStatic(out);
  const files = await readdir(out);
  assert.deepEqual(files.sort(), ['.nojekyll', 'app.mjs', 'demo-data.json', 'favicon.svg', 'index.html', 'match.mjs', 'schema.mjs', 'styles.css', 'transport.mjs'].sort());
  const html = await readFile(path.join(out, 'index.html'), 'utf8');
  assert.match(html, /sourcever-mode" content="static/);
  assert.doesNotMatch(html, /(?:src|href)="\//);
  const data = JSON.parse(await readFile(path.join(out, 'demo-data.json'), 'utf8'));
  assert.equal(data.aiEnabled, false);
  assert.equal(data.cases.length, 7);
  assert.equal(findCase(data.cases, '我想搭建网站').id, 'website');
  assert.equal(findCase(data.cases, '我想养番茄'), null);
 } finally { await rm(out, { recursive: true, force: true }); }
});
