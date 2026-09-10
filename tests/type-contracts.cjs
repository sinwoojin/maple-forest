'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..'),
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'maple-type-contract-'));
const source = path.join(dir, 'contract.ts'),
  config = path.join(dir, 'tsconfig.json');
const options = JSON.parse(
  fs.readFileSync(path.join(root, 'tsconfig.json'), 'utf8')
).compilerOptions;
const compiler = path.join(path.dirname(require.resolve('typescript/package.json')), 'bin', 'tsc');
try {
  fs.writeFileSync(
    config,
    JSON.stringify({
      compilerOptions: { ...options, noEmit: true, rootDir: dir },
      files: [path.join(root, 'types/events.d.ts'), source]
    })
  );
  const check = content => {
    fs.writeFileSync(source, content);
    return spawnSync(process.execPath, [compiler, '-p', config, '--pretty', 'false'], {
      encoding: 'utf8'
    });
  };
  // Given: the exact production contracts, with a valid control case.
  const valid = check(
    "const cost: MapleForest.EventCost={gold:20,job:'mage'}; const effect: MapleForest.Effect={chance:.5,win:{relic:true},lose:{hurt:.2}}; const phase: MapleForest.RunPhase='event';"
  );
  assert.equal(valid.status, 0, valid.stdout + valid.stderr);
  const cases = [
    ['unknown cost key', 'const cost: MapleForest.EventCost={golds:20};'],
    ['unknown job', "const job: MapleForest.JobId='cleric';"],
    ['unknown event', "const event: MapleForest.EventId='lost-event';"],
    ['unknown phase', "const phase: MapleForest.RunPhase='rewards';"],
    ['missing probability branch', 'const effect: MapleForest.Effect={chance:.5,win:{gold:10}};'],
    [
      'ambiguous chance and direct reward',
      'const effect: MapleForest.Effect={chance:.5,win:{},lose:{},gold:10};'
    ],
    [
      'unparsed external data',
      'declare const raw: unknown; const saved: MapleForest.EventSnapshot=raw;'
    ],
    [
      'unknown host capability',
      'declare const host: MapleForest.LegacyEventHost; host.getHealth();'
    ]
  ];
  for (const [name, content] of cases) {
    // When: malformed internal data or unparsed external input is type checked.
    const result = check(content);
    // Then: an error must be attributed to the test input, not a missing config/library.
    assert.equal(result.status, 1, name + ': ' + result.stdout + result.stderr);
    assert.match(result.stdout, /contract\.ts\(\d+,\d+\): error TS\d+:/, name);
    assert.equal(result.stderr, '');
    console.log('PASS rejects ' + name);
  }
  console.log('PASS valid control and 8 rejected type-contract cases');
} finally {
  for (const file of [source, config]) if (fs.existsSync(file)) fs.unlinkSync(file);
  fs.rmdirSync(dir);
}
