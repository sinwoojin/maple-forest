'use strict';
(() => {
  const G = window.Game;
  G.makeRouteChoices = () => {
    const r = G.p.run,
      next = r.stage + 1;
    if (next % 10 === 0)
      return [
        {
          id: `${next}:boss`,
          title: '수호자의 문',
          description: '챕터 수호자와 대결',
          type: 'boss',
          risk: '높음',
          rewardHint: '챕터 보상'
        }
      ];
    const types = ['defeat', 'survival', 'escort', 'defense'],
      type = next % 4 === 0 ? 'elite' : types[(next + Math.floor(G.runRandom(7) * 4)) % 4],
      utility = ['event', 'shop', 'rest'][(next - 2) % 3];
    return [
      {
        id: `${next}:${type}`,
        title: {
          elite: '정예 치유단 토벌',
          defeat: '사냥꾼의 길',
          survival: '포위된 능선',
          escort: '반딧불 호송',
          defense: '수정 보물 수호'
        }[type],
        description: '위험한 전투 · 추가 골드',
        type,
        risk: '높음',
        rewardHint: type === 'elite' ? '완료 시 골드 +90 · 재료 +3' : '골드 +35'
      },
      {
        id: `${next}:${utility}`,
        title: { event: '숲의 만남', shop: '여행 상인', rest: '모닥불 쉼터' }[utility],
        description: '준비를 마친 뒤 다음 전투로 이동',
        type: utility,
        risk: '낮음',
        rewardHint: '보급과 선택'
      }
    ];
  };
  G.routeChoices = () => G.runCopy(G.p.run.routes);
  G.chooseRoute = id => {
    const r = G.p.run;
    if (!r.active || r.phase !== 'route') return false;
    const c = r.routes.find(v => v.id === id);
    if (!c) return false;
    r.routes = [];
    r.stage++;
    r.choices.push({ stage: r.stage, id, type: c.type });
    r.event = null;
    r.shop = [];
    r.restUsed = false;
    if (c.type === 'event') {
      G.prepareRunEvent();
      G.runTransition('event');
    } else if (c.type === 'shop') {
      r.shop = [
        {
          id: `${r.stage}:potion`,
          title: '물약 묶음',
          description: '물약 3개',
          cost: 45,
          kind: 'potions',
          value: 3
        },
        {
          id: `${r.stage}:forge`,
          title: '무기 정비',
          description: '이번 원정 공격력 +4',
          cost: 80,
          kind: 'attack',
          value: 4
        },
        {
          id: `${r.stage}:ward`,
          title: '여행의 부적',
          description: '이번 원정 방어력 +2',
          cost: 65,
          kind: 'defense',
          value: 2
        }
      ];
      G.runTransition('shop');
    } else if (c.type === 'rest') G.runTransition('rest');
    else {
      G.p.gold += 35;
      G.enterEncounter(c.type);
    }
    return true;
  };
  G.runShop = () => G.p.run.shop.map(c => ({ ...c, affordable: !c.bought && G.p.gold >= c.cost }));
  G.buyRunItem = id => {
    const r = G.p.run;
    if (!r.active || r.phase !== 'shop') return false;
    const c = r.shop.find(v => v.id === id);
    if (!c || c.bought || G.p.gold < c.cost) return false;
    c.bought = true;
    G.p.gold -= c.cost;
    if (c.kind === 'potions') G.p.potions += c.value;
    else r.buffs[c.kind] += c.value;
    G.save();
    G.openRunUI?.();
    return true;
  };
  G.restChoices = () => [
    {
      id: 'recover',
      title: '깊은 휴식',
      description: '체력 60%와 마나 전부 회복',
      enabled: !G.p.run.restUsed
    },
    {
      id: 'train',
      title: '달빛 수련',
      description: '회복 대신 이번 원정 공격력 +5',
      enabled: !G.p.run.restUsed
    },
    {
      id: 'prepare',
      title: '약초 조제',
      description: '회복 대신 물약 3개',
      enabled: !G.p.run.restUsed
    }
  ];
  G.chooseRest = id => {
    const p = G.p,
      r = p.run;
    if (!r.active || r.phase !== 'rest' || r.restUsed || !G.restChoices().some(c => c.id === id))
      return false;
    r.restUsed = true;
    if (id === 'recover') {
      p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.6);
      p.mp = p.maxMp;
    } else if (id === 'train') r.buffs.attack += 5;
    else p.potions += 3;
    G.save();
    G.openRunUI?.();
    return true;
  };
  G.continueRun = () => {
    const r = G.p.run;
    if (
      !r.active ||
      !['event', 'shop', 'rest'].includes(r.phase) ||
      (r.phase === 'event' && !r.event?.result) ||
      (r.phase === 'rest' && !r.restUsed)
    )
      return false;
    G.enterEncounter(['defeat', 'escort', 'defense', 'survival'][r.stage % 4]);
    return true;
  };
})();
('use strict');
(() => {
  const G = window.Game,
    make = G.makeRouteChoices;
  G.makeRouteChoices = () => {
    const choices = make(),
      r = G.p.run;
    if (
      r.stage % 10 !== 9 &&
      G.meta?.unlocks.includes('supply-route') &&
      !choices.some(c => c.type === 'rest')
    )
      choices.push({
        id: `${r.stage + 1}:rest`,
        title: '개척자의 보급로',
        description: '이전 원정에서 발견한 안전한 모닥불',
        type: 'rest',
        risk: '낮음',
        rewardHint: '회복 또는 수련'
      });
    return choices;
  };
  G.startingRelicChoices = () =>
    G.meta?.unlocks.includes('relic-choice')
      ? Object.entries(G.relicCatalog || {})
          .slice(0, 3)
          .map(([id, r]) => ({ id, title: r.name, description: r.description }))
      : [];
  const start = G.startRun;
  G.startRun = (options = {}) => {
    const valid = G.startingRelicChoices().some(r => r.id === options.relic);
    const result = start(options);
    if (result && valid && !options.daily) {
      G.grantRelic(options.relic);
      G.save();
    }
    return result;
  };
})();
