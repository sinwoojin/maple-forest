'use strict';
(() => {
  const G = window.Game;
  G.buildCatalog = {
    counter: {
      job: 'warrior',
      name: '반격 수호자',
      description: '기술 사용 후 1.4초 방어. 막은 공격은 주변 반격을 일으킵니다.',
      synergy: '방어 · 가시 유물',
      effects: ['guard', 'counter']
    },
    bleed: {
      job: 'warrior',
      name: '붉은 검객',
      description: '검격에 4초 출혈. 출혈은 중첩되어 지속 피해를 줍니다.',
      synergy: '빠른 공격 · 흡혈',
      effects: ['bleed']
    },
    heavy: {
      job: 'warrior',
      name: '대검 파괴자',
      description: '느린 강공격으로 피해 70% 증가, 기술은 적을 기절시킵니다.',
      synergy: '기절 · 공격력',
      effects: ['stun', 'heavy']
    },
    pierce: {
      job: 'archer',
      name: '관통 사수',
      description: '모든 화살이 세 적을 관통하며 기술은 방패를 무시합니다.',
      synergy: '일렬의 적 · 냉기',
      effects: ['pierce']
    },
    multishot: {
      job: 'archer',
      name: '폭풍 궁수',
      description: '한 번에 세 화살. 개별 피해는 55%, 여러 적과 큰 보스에 강합니다.',
      synergy: '명중 효과 · 연사',
      effects: ['multishot']
    },
    mark: {
      job: 'archer',
      name: '매의 추적자',
      description: '첫 명중이 표식. 표식이 있는 적에게 60% 추가 피해를 줍니다.',
      synergy: '단일 보스 · 집중',
      effects: ['mark']
    },
    frost: {
      job: 'mage',
      name: '겨울 마법사',
      description: '공격이 적을 3초 둔화. 기술은 1.5초 빙결시킵니다.',
      synergy: '안전 거리 · 재사용',
      effects: ['slow', 'freeze']
    },
    burn: {
      job: 'mage',
      name: '잿불 술사',
      description: '공격이 4초 화상. 기술은 폭발 후 불길을 남깁니다.',
      synergy: '지속 피해 · 범위',
      effects: ['burn']
    },
    mana: {
      job: 'mage',
      name: '비전 학자',
      description: '일반 공격 명중 시 마나 3 회복. 기술이 추가 마나 10으로 피해 70% 증가.',
      synergy: '마나 · 기술 반복',
      effects: ['mana']
    }
  };
  G.buildOptions = job =>
    Object.entries(G.buildCatalog)
      .filter(([, b]) => b.job === job)
      .map(([id, b]) => ({ id, ...b }));
  G.currentBuild = () => (G.p.run?.active ? G.p.run.build : G.p.build);
  G.selectBuild = id => {
    const b = G.buildCatalog[id],
      p = G.p;
    if (!b || b.job !== p.job) return false;
    if (p.run?.active && p.run.build && p.run.build !== id) return false;
    if (p.run?.active) p.run.build = id;
    else p.build = id;
    G.save();
    return true;
  };
  G.buildInfo = () =>
    G.buildCatalog[G.currentBuild()] || {
      name: '기본 전투',
      description: '세 전투 스타일 중 하나를 선택하세요.',
      effects: []
    };
  G.buildHit = (e, amount, skill = false) => {
    const id = G.currentBuild();
    if (id === 'mark' && e.mark > 0) amount *= 1.6;
    if (id === 'heavy') amount *= 1.7;
    const hit = G.hitEnemy(e, Math.round(amount), { ignoreShield: id === 'pierce' && skill });
    if (!hit) return false;
    if (id === 'bleed') {
      e.bleedStacks = Math.min(5, (e.bleed > 0 ? e.bleedStacks || 0 : 0) + 1);
      e.bleed = 4;
    }
    if (id === 'burn') e.burn = 4;
    if (id === 'mark') e.mark = 6;
    if (id === 'frost') {
      e.slow = 3;
      if (skill) e.stun = 1.5;
    }
    if (id === 'heavy' && skill) e.stun = 1.1;
    if (id === 'mana' && !skill) G.p.mp = Math.min(G.p.maxMp, G.p.mp + 3);
    const traits = G.gearTraits();
    if (traits.has('snarearrow')) e.slow = Math.min(4, (e.slow || 0) + 0.8);
    if (traits.has('icewand') && skill) e.stun = (e.stun || 0) + 0.4;
    if (traits.has('spiritarrow') || (traits.has('manawand') && !skill))
      G.p.mp = Math.min(G.p.maxMp, G.p.mp + 1);
    G.onRelicHit?.(e, skill);
    G.save();
    return true;
  };
})();
