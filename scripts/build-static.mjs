import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
export async function buildStatic(out = path.join(root, 'dist')) {
 await mkdir(out, { recursive: true });
 for (const file of ['app.mjs', 'styles.css', 'schema.mjs', 'match.mjs', 'transport.mjs', 'favicon.svg']) {
  await copyFile(path.join(root, 'web', file), path.join(out, file));
 }
 let html = await readFile(path.join(root, 'web/index.html'), 'utf8');
 html = html.replace('<head>', '<head><meta name="sourcever-mode" content="static">').replaceAll('href="/', 'href="./').replaceAll('src="/', 'src="./');
 await writeFile(path.join(out, 'index.html'), html);
 const data = Object.fromEntries(await Promise.all(['cases', 'resources', 'sources', 'access'].map(async name => [name, JSON.parse(await readFile(path.join(root, 'data', name + '.json'), 'utf8'))])));
 await writeFile(path.join(out, 'demo-data.json'), JSON.stringify({ ...data, aiEnabled: false }));
 await writeFile(path.join(out, '.nojekyll'), '');
 return out;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log('Static demo built: ' + await buildStatic());
