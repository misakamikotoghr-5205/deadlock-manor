import { mkdir, copyFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const publicFiles = ['index.html', 'styles.css', 'app.js', 'simulation.js', 'scenarios.js'];
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all(publicFiles.map(file => copyFile(path.join(root, file), path.join(output, file))));
console.log(`Built ${publicFiles.length} static files in dist/`);
