'use strict';
const test = require('node:test'),
  assert = require('node:assert/strict'),
  vm = require('node:vm'),
  fs = require('node:fs'),
  path = require('node:path');
function game() {
  const memory = new Map(),
    context = vm.createContext({
      window: {},
      console,
      localStorage: {
        getItem: k => memory.get(k) ?? null,
        setItem: (k, v) => memory.set(k, v),
        removeItem: k => memory.delete(k)
      }
    });
  for (const name of [
    'engine',
    'systems',
    'builds',
    'relics',
    'enemy-ai',
    'boss-ai',
    'combat',
    'stages',
    'route-content',
    'event-data',
    'events',
    'encounters',
    'event-validation',
    'run-validation',
    'meta',
    'persistence'
  ])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', name + '.js'), 'utf8'), context);
  return context.window.Game;
}
test('event save parser rejects array relic IDs without replacing current progress', () => {
  const G = game();
  G.startRun({ seed: 99 });
  G.p.run.phase = 'event';
  G.prepareRunEvent();
  const saved = G.exportSave();
  assert.equal(G.importSave(saved).ok, true);
  const raw = JSON.parse(saved);
  raw.run.event.relic = [Object.keys(G.relicCatalog)[0]];
  const before = G.exportSave(),
    player = G.p;
  assert.equal(G.importSave(JSON.stringify(raw)).ok, false);
  assert.equal(G.p, player);
  assert.equal(G.exportSave(), before);
});
test('real active expedition save restores fractional resources and snapshot', () => {
  const G = game();
  G.startRun({ seed: 99 });
  G.p.hp = 89.25;
  G.p.mp = 58.7;
  const text = G.exportSave();
  assert.equal(G.importSave(text).ok, true);
  assert.equal(G.p.run.seed, 99);
  assert.equal(G.p.hp, 89.25);
  assert.equal(G.p.mp, 58.7);
});
test('daily normalized run survives repeated import then restores original character', () => {
  const G = game();
  G.p.level = 8;
  G.p.maxHp = 240;
  G.p.maxMp = 116;
  G.p.gold = 789;
  G.p.materials = 33;
  assert.equal(G.startDailyRun(), true);
  assert.equal(G.p.level, 1);
  assert.equal(G.p.gold, 0);
  for (let i = 0; i < 2; i++) {
    const result = G.importSave(G.exportSave());
    assert.equal(result.ok, true, result.error);
  }
  assert.equal(G.leaveRun(), true);
  assert.equal(G.p.level, 8);
  assert.equal(G.p.gold, 789);
  assert.equal(G.p.materials, 33);
  assert.equal(G.p.run.phase, 'failed');
  assert.equal(G.resumeRun(), false);
  assert.equal(G.importSave(G.exportSave()).ok, true);
});
test('tampered daily return cannot overwrite current game', () => {
  const G = game();
  G.startDailyRun();
  const raw = JSON.parse(G.exportSave());
  raw.run.dailyReturn.gold = -5;
  const p = G.p;
  assert.equal(G.importSave(JSON.stringify(raw)).ok, false);
  assert.equal(G.p, p);
});
test('veteran expedition starts bounded and credits earned XP once across save resume', () => {
  const G = game();
  Object.assign(G.p, { level: 30, xp: 17, maxHp: 680, hp: 680, maxMp: 292, mp: 292 });
  G.startRun({ seed: 456 });
  assert.equal(G.p.level, 1);
  assert.equal(G.p.maxHp, 100);
  assert.equal(G.p.maxMp, 60);
  G.gainXp(87);
  assert.equal(G.p.level, 2);
  const gained = G.p.xp;
  let result = G.importSave(G.exportSave());
  assert.equal(result.ok, true, result.error);
  assert.equal(G.p.level, 2);
  assert.equal(G.p.xp, gained);
  G.leaveRun();
  assert.equal(G.p.level, 30);
  assert.equal(G.p.xp, 104);
  assert.equal(G.p.maxHp, 680);
  result = G.importSave(G.exportSave());
  assert.equal(result.ok, true, result.error);
  G.resumeRun();
  assert.equal(G.p.level, 2);
  assert.equal(G.p.maxHp, 120);
  G.leaveRun();
  assert.equal(G.p.level, 30);
  assert.equal(G.p.xp, 104);
  assert.equal(G.importSave(G.exportSave()).ok, true);
});
