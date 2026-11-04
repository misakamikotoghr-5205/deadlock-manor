import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

for (const name of ['app.js', 'simulation.js', 'scenarios.js', 'scripts/build.mjs', 'scripts/serve.mjs']) {
  const result = spawnSync(process.execPath, ['--check', name], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
const html = await readFile('index.html', 'utf8');
for (const required of ['lang="en"', 'name="viewport"', 'type="module"', 'styles.css']) {
  if (!html.includes(required)) throw new Error(`Missing document requirement: ${required}`);
}
console.log('JavaScript syntax and document checks passed.');
