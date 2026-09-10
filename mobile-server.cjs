'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const root = process.argv[2] || __dirname;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const allowed = new Set([
  'index.html',
  ...Array.from(html.matchAll(/(?:src|href)="([^"#]+[.](?:js|css))"/g), match => match[1]).filter(
    name => /^[a-zA-Z0-9-]+[.](js|css)$/.test(name)
  )
]);
const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    res.end();
    return;
  }
  const url = new URL(req.url, 'http://localhost');
  const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  if (!allowed.has(name)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  fs.readFile(path.join(root, name), (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': types[path.extname(name)],
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
});
server.on('error', e => {
  console.error(e.message);
  process.exitCode = 1;
});
server.listen(8765, '0.0.0.0', () => {
  console.log('Maple Forest mobile server is running. Close this window to stop.');
  for (const items of Object.values(os.networkInterfaces()))
    for (const i of items)
      if (i.family === 'IPv4' && !i.internal)
        console.log('Open on your phone: http://' + i.address + ':8765');
});
