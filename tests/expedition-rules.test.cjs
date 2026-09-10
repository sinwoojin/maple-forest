'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function game() {
  const memory = new Map();
  const c = vm.createContext({
    window: {},
    console,
    localStorage: { getItem: k => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v) }
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
    'route-options',
    'route-content',
    'event-data',
    'events',
    'encounters',
    'event-validation',
    'run-details',
    'run-validation',
    'meta',
    'persistence'
  ]) {
    const file = path.join(__dirname, '..', name + '.js');
    vm.runInContext(fs.readFileSync(file, 'utf8'), c);
  }
  const G = c.window.Game;
  G.running = true;
  G.startRun({ seed: 20260910, build: 'bleed' });
  return G;
}
test('new expedition level growth preserves missing resources instead of a free full heal', () => {
  const G = game();
  G.p.hp = 30;
  G.p.mp = 10;
  G.p.xp = 45;
  G.gainXp(10);
  assert.deepEqual([G.p.hp, G.p.mp, G.p.maxHp, G.p.maxMp], [50, 18, 120, 68]);
});
test('legacy active run keeps its full level-up and reward recovery', () => {
  const G = game();
  delete G.p.run.rulesVersion;
  G.p.hp = 30;
  G.p.mp = 10;
  G.p.xp = 45;
  G.gainXp(10);
  assert.equal(G.p.hp, 120);
  G.p.hp = 30;
  G.completeEncounter();
  G.chooseRunReward('1:heal');
  assert.equal(G.p.hp, 120);
});
test('new reward is partial while potion and rest remain useful', () => {
  const G = game();
  G.p.hp = 30;
  G.p.mp = 10;
  G.completeEncounter();
  G.chooseRunReward('1:heal');
  assert.deepEqual([G.p.hp, G.p.mp], [70, 40]);
  G.p.run.phase = 'battle';
  G.act('potion');
  assert.equal(G.p.hp, 100);
  assert.equal(G.p.potions, 4);
  G.p.run.phase = 'rest';
  G.p.hp = 20;
  G.p.mp = 1;
  G.chooseRest('recover');
  assert.deepEqual([G.p.hp, G.p.mp], [80, 60]);
});
test('armor investment cannot erase new-run attacks; active guard and dodge still prevent them', () => {
  const G = game();
  G.p.run.buffs.defense = 31;
  G.p.invuln = 0;
  G.damagePlayer(16);
  assert.equal(G.p.hp, 94);
  G.p.invuln = 0;
  G.p.guard = 1;
  assert.equal(G.damagePlayer(16), false);
  assert.equal(G.p.hp, 94);
  G.p.guard = 0;
  G.p.invuln = 0;
  G.dodge();
  assert.equal(G.damagePlayer(16), false);
  delete G.p.run.rulesVersion;
  G.p.invuln = 0;
  G.damagePlayer(16);
  assert.equal(G.p.hp, 93);
});
test('seeded route descriptions execute their exact advertised next objective and payout', () => {
  for (const seed of [1, 2, 20260910, 4294967295])
    for (let stage = 1; stage < 40; stage++) {
      const G = game();
      G.p.run.seed = seed;
      G.p.run.stage = stage;
      G.completeEncounter();
      G.chooseRunReward(`${stage}:heal`);
      const offers = G.routeChoices();
      assert(offers.length > 0);
      for (const offer of offers) {
        assert(offer.encounter);
        assert(!['높음', '낮음'].includes(offer.risk));
      }
      const before = G.p.gold,
        chosen = offers[0];
      assert(G.chooseRoute(chosen.id));
      assert.equal(G.p.run.nodeType, chosen.encounter);
      assert.equal(G.p.gold - before, chosen.type === 'boss' ? 0 : 60);
    }
});
test('supplies vary by seed and recovery opportunities remain available', () => {
  const sequences = [];
  for (const seed of [1, 9, 20260910]) {
    const G = game();
    G.p.run.seed = seed;
    const sequence = [];
    for (let stage = 1; stage < 39; stage++) {
      G.p.run.stage = stage;
      const offers = G.makeRouteChoices();
      if ((stage + 1) % 10 !== 0) {
        const supply = offers.find(c => ['rest', 'shop', 'event'].includes(c.type));
        assert(supply);
        sequence.push(supply.type);
        const ordinal = stage + 1 - Math.floor((stage + 1) / 10) - 1;
        if (ordinal % 3 === 0) assert.equal(supply.type, 'rest');
      }
    }
    sequences.push(sequence.join(','));
  }
  assert(new Set(sequences).size > 1);
});
test('pending supply choice and generated offers survive export/import without re-rolling', () => {
  const G = game();
  G.completeEncounter();
  G.chooseRunReward('1:heal');
  const offers = JSON.stringify(G.routeChoices());
  assert(G.importSave(G.exportSave()).ok);
  assert.equal(JSON.stringify(G.routeChoices()), offers);
  const chosen = G.routeChoices().find(c => ['event', 'shop', 'rest'].includes(c.type));
  G.chooseRoute(chosen.id);
  const pending = G.exportSave();
  assert(G.importSave(pending).ok);
  assert.equal(G.p.run.nextEncounter, chosen.encounter);
  if (G.p.run.phase === 'event') G.chooseEventOption('leave');
  if (G.p.run.phase === 'rest') G.chooseRest('train');
  assert(G.continueRun());
  assert.equal(G.p.run.nodeType, chosen.encounter);
  assert.equal(G.continueRun(), false);
});
test('legacy missing rule fields restore as legacy; malformed future fields cannot replace progress', () => {
  const G = game();
  const raw = JSON.parse(G.exportSave());
  delete raw.run.rulesVersion;
  delete raw.run.nextEncounter;
  delete raw.run.seenObjectives;
  delete raw.run.outcome;
  assert(G.importSave(JSON.stringify(raw)).ok);
  assert.equal(G.p.run.rulesVersion, 1);
  for (const patch of [
    { rulesVersion: 3 },
    { rulesVersion: null },
    { seenObjectives: null },
    { seenObjectives: ['fake'] },
    { nextEncounter: 'boss' },
    { outcome: { cause: 'fake' } }
  ]) {
    const before = G.exportSave(),
      bad = JSON.parse(before);
    Object.assign(bad.run, patch);
    assert.equal(G.importSave(JSON.stringify(bad)).ok, false);
    assert.equal(G.exportSave(), before);
  }
});
test('objective progress and reason agree for distance, height and nearby enemies', () => {
  const G = game();
  G.enterEncounter('escort');
  G.enemies = [];
  const o = G.p.run.objective;
  G.p.x = o.x + 180;
  G.p.y = 610;
  assert.equal(G.objectiveBlockReason(), 'distance');
  const previous = o.current;
  G.updateEncounter(0.1);
  assert.equal(o.current, previous);
  G.p.x = o.x;
  G.p.y = 400;
  assert.equal(G.objectiveBlockReason(), 'height');
  G.p.y = 610;
  assert.equal(G.objectiveBlockReason(), null);
  G.enemies = [G.spawnEnemy({ x: o.x, y: 610, hp: 50 })];
  assert.equal(G.objectiveBlockReason(), 'enemies');
});
test('objective defeat records an actual immutable failure snapshot and restores it', () => {
  const G = game();
  G.enterEncounter('defense');
  G.p.run.objective.health = 0;
  G.updateEncounter(0.1);
  assert.equal(G.p.run.phase, 'failed');
  assert.equal(G.p.run.outcome.cause, 'target-destroyed');
  assert.equal(G.p.run.outcome.health, 0);
  const outcome = JSON.stringify(G.p.run.outcome);
  G.p.hp = 99;
  assert.equal(JSON.stringify(G.p.run.outcome), outcome);
  assert(G.importSave(G.exportSave()).ok);
  assert.deepEqual(JSON.parse(JSON.stringify(G.p.run.outcome)), JSON.parse(outcome));
  assert.equal(G.history()[0].outcome.cause, 'target-destroyed');
});
test('first objective guidance persists across resume and timeout reports actual clock', () => {
  const G = game(),
    messages = [];
  G.notify = text => messages.push(text);
  G.enterEncounter('escort');
  assert.equal(messages.length, 1);
  assert(G.importSave(G.exportSave()).ok);
  G.enterEncounter('escort');
  assert.equal(messages.length, 1);
  G.p.run.objective.timeLeft = 0;
  G.updateEncounter(0.1);
  assert.equal(G.p.run.outcome.cause, 'objective-timeout');
  assert(G.p.run.outcome.health > 0);
  assert.equal(G.p.run.outcome.timeLeft, 0);
});
test('legacy route presentation explains actual objective without rewriting stored offers', () => {
  const G = game();
  G.p.run.rulesVersion = 1;
  G.p.run.stage = 2;
  G.p.run.routes = G.makeRouteChoices();
  const raw = JSON.stringify(G.p.run.routes);
  const shown = G.routeChoices();
  assert.equal(JSON.stringify(G.p.run.routes), raw);
  assert(shown.every(c => !['높음', '낮음'].includes(c.risk)));
  const supply = shown.find(c => c.type === 'shop');
  assert.equal(supply.encounter, 'survival');
  G.p.run.phase = 'route';
  G.chooseRoute(supply.id);
  G.continueRun();
  assert.equal(G.p.run.nodeType, supply.encounter);
});
