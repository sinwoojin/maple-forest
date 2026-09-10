'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const compiler = path.join(path.dirname(require.resolve('typescript/package.json')), 'bin', 'tsc');
execFileSync(process.execPath, [compiler, '-p', path.join(root, 'tsconfig.json')], {
  cwd: root,
  stdio: 'inherit'
});
const check = process.argv.includes('--check'),
  files = ['event-data', 'events', 'event-validation'];
let drift = false;
for (const name of files) {
  const content =
    `// Generated from src/events/${name}.ts. Edit the TypeScript source and run npm run build:typed.\n` +
    fs.readFileSync(path.join(root, '.generated', name + '.js'), 'utf8');
  const target = path.join(root, name + '.js');
  if (check) {
    if (
      !fs.existsSync(target) ||
      fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== content
    ) {
      console.error('Generated JavaScript differs: ' + name + '.js');
      drift = true;
    }
  } else fs.writeFileSync(target, content);
}
if (drift) process.exitCode = 1;
else
  console.log(
    check
      ? 'Generated event scripts match TypeScript sources.'
      : 'Compiled 3 strict TypeScript event scripts.'
  );
