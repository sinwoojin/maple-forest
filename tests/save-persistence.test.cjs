'use strict';
const test = require('node:test'),
  assert = require('node:assert/strict'),
  vm = require('node:vm'),
  fs = require('node:fs'),
  path = require('node:path');
function fixture() {
  const memory = new Map(),
    G = {
      jobs: { warrior: {}, archer: {}, mage: {} },
      items: {
        'warrior-0': { id: 'warrior-0', name: 'Sword', slot: 'weapon', job: 'warrior' },
        'armor-0': { id: 'armor-0', name: 'Armor', slot: 'armor', job: 'all' }
      },
      keys: new Set(),
      relicCatalog: {},
      defaults: () => ({
        level: 1,
        xp: 0,
        gold: 0,
        hp: 100,
        mp: 60,
        potions: 5,
        kills: 0,
        quest: 0,
        caveKills: 0,
        lootKills: 0,
        materials: 0,
        job: 'warrior',
        zone: 'forest',
        inventory: ['warrior-0', 'armor-0'],
        equipment: { weapon: 'warrior-0', armor: 'armor-0' },
        bossDead: false,
        won: false,
        caveBossDead: false,
        caveWon: false
      }),
      parseRun: r => {
        if (r && r.invalid) throw Error('Invalid run');
        return r || { active: false };
      },
      initializeGear() {},
      populate() {},
      notify() {},
      leaveRun() {
        return true;
      }
    };
  G.p = G.defaults();
  const context = vm.createContext({
    window: { Game: G },
    localStorage: {
      getItem: k => memory.get(k) ?? null,
      setItem: (k, v) => memory.set(k, v),
      removeItem: k => memory.delete(k)
    },
    console
  });
  for (const name of ['meta.js', 'persistence.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', name), 'utf8'), context);
  return { G, memory };
}
test('version 4 save round trip preserves resources and settings', () => {
  const { G } = fixture();
  G.p.gold = 123;
  G.settings = { sfx: true, bgm: false, intensity: 'low', reducedMotion: true };
  const text = G.exportSave();
  G.p.gold = 0;
  assert.equal(G.importSave(text).ok, true);
  assert.equal(G.p.gold, 123);
  assert.equal(G.settings.intensity, 'low');
});
for (const version of [1, 2, 3])
  test(`legacy v${version} migrates without losing progression`, () => {
    const { G } = fixture(),
      d = { ...G.p, version, gold: 321 };
    delete d.materials;
    if (version === 1) {
      delete d.inventory;
      delete d.equipment;
      delete d.caveKills;
      delete d.lootKills;
    }
    assert.equal(G.importSave(JSON.stringify(d)).ok, true);
    assert.equal(G.p.gold, 321);
    assert.equal(G.p.materials, 0);
    assert.equal(JSON.parse(G.exportSave()).version, 4);
  });
test('invalid JSON, fields, run, settings, metadata and oversize never overwrite', () => {
  const { G, memory } = fixture();
  G.save();
  const before = memory.get('maple-forest-v1'),
    player = G.p,
    base = JSON.parse(before);
  for (const text of [
    '{',
    JSON.stringify({ ...base, gold: -1 }),
    JSON.stringify({ ...base, run: { invalid: true } }),
    JSON.stringify({ ...base, settings: { sfx: 'yes' } }),
    JSON.stringify({ ...base, meta: {} }),
    ' '.repeat(1048577)
  ]) {
    assert.equal(G.importSave(text).ok, false);
    assert.equal(memory.get('maple-forest-v1'), before);
    assert.equal(G.p, player);
  }
});
test('history deduplicates and unlocks strategic options', () => {
  const { G } = fixture(),
    r = { id: 'one', seed: 123, job: 'warrior', stage: 20, elapsedSeconds: 42, cause: 'failed' };
  assert.equal(G.recordRunResult(r), true);
  assert.equal(G.recordRunResult(r), false);
  assert.equal(G.history().length, 1);
  assert.deepEqual(Array.from(G.codex().unlocks), ['supply-route', 'relic-choice']);
  assert.equal(G.importSave(G.exportSave()).ok, true);
});
test('UTC daily seed is stable and validates calendar days', () => {
  const { G } = fixture();
  assert.equal(G.dailySeed('2026-09-09'), G.dailySeed('2026-09-09'));
  assert.notEqual(G.dailySeed('2026-09-09'), G.dailySeed('2026-09-10'));
  assert.throws(() => G.dailySeed('2026-02-30'));
});
test('history retains route event and equipment recap across export and rejects bad recap', () => {
  const { G } = fixture();
  G.recordRunResult({
    id: 'details',
    seed: 12,
    job: 'warrior',
    stage: 5,
    elapsedSeconds: 3,
    cause: 'failed',
    choices: [{ stage: 2, id: '2:event', type: 'event' }],
    events: [{ stage: 2, eventId: 'camp', choice: 'rest', result: 'Recovered' }],
    gearGained: ['armor-0']
  });
  const text = G.exportSave();
  assert.equal(G.importSave(text).ok, true);
  assert.equal(G.history()[0].choices[0].type, 'event');
  assert.equal(G.history()[0].events[0].result, 'Recovered');
  assert.equal(G.history()[0].gearGained[0], 'armor-0');
  const bad = JSON.parse(text);
  bad.meta.records[0].gearGained = ['unknown'];
  assert.equal(G.importSave(JSON.stringify(bad)).ok, false);
});
