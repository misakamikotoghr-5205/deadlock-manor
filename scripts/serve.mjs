import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const allowed = new Set(['index.html', 'styles.css', 'app.js', 'simulation.js', 'scenarios.js', 'replay.js']);
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${host}:${port}`);
    const file = decodeURIComponent(url.pathname) === '/' ? 'index.html' : decodeURIComponent(url.pathname).slice(1);
    if (!allowed.has(file)) { res.writeHead(404); res.end('Not found'); return; }
    const target = path.join(root, file);
    const info = await stat(target);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    if (req.method === 'HEAD') { res.end(); return; }
    res.end(await readFile(target));
  } catch {
    res.writeHead(404); res.end('Not found');
  }
});
server.listen(port, host, () => console.log(`Deadlock Manor: http://${host}:${port}`));
