const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const makeGame = type => {
  const G = {
    p: {
      x: 240,
      y: 610,
      run: {
        active: true,
        phase: 'battle',
        objective: {
          type,
          target: type === 'survival' ? 65 : 100,
          current: 25,
          health: 73,
          timeLeft: 48,
          x: 240,
          y: 610
        }
      }
    },
    enemies: [],
    paused: false,
    running: true,
    objectiveBlockReason: () => null
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../objective-ui.js'), 'utf8'), {
    window: { Game: G }
  });
  return G;
};
test('objective HUD uses seconds for survival and percentage plus target HP for escort and defense', () => {
  const survival = makeGame('survival').objectiveView();
  assert.match(survival.progress, /25 \/ 65초/);
  assert.match(survival.progress, /40초 남음/);
  for (const type of ['escort', 'defense']) {
    const G = makeGame(type);
    assert.match(G.objectiveView().progress, /25% · 대상 HP 73 \/ 100 · 48초/);
    for (const [reason, word] of [
      ['distance', '가까이'],
      ['height', '지면'],
      ['enemies', '적을 처치']
    ]) {
      G.objectiveBlockReason = () => reason;
      const before = JSON.stringify(G.p);
      assert.match(G.objectiveView().status, new RegExp(word));
      assert.equal(JSON.stringify(G.p), before);
    }
  }
});
test('outcome view reads captured values and never invents legacy failure details', () => {
  const G = makeGame('escort');
  assert.match(G.outcomeView().cause, /기록 없음/);
  const outcome = {
    cause: 'objective-timeout',
    objectiveType: 'escort',
    current: 42,
    target: 100,
    health: 73,
    timeLeft: 0,
    hp: 61,
    maxHp: 120,
    stage: 8
  };
  const view = G.outcomeView(outcome);
  assert.match(view.cause, /제한 시간 초과/);
  assert.match(view.snapshot, /42%/);
  assert.match(view.snapshot, /내 HP 61 \/ 120/);
  assert.equal(G.outcomeView({ ...outcome, cause: '돌진 경고' }).cause, '돌진 경고');
  assert.match(G.outcomeView({ cause: 'enemy' }).snapshot, /기록 없음/);
});
