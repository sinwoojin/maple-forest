'use strict';
(() => {
  const G = window.Game;
  const titles = {
    survival: '생존',
    escort: '반딧불 호송',
    defense: '수정 방어',
    defeat: '습격 격퇴',
    elite: '정예전',
    boss: '수호자 전투',
    event: '숲의 만남',
    shop: '상점',
    rest: '휴식'
  };
  const instructions = {
    survival: '남은 시간 동안 살아남으세요. 적을 모두 처치할 필요는 없어요.',
    escort: '반딧불과 같은 지면 가까이에서 주변 적을 처치하면 이동합니다.',
    defense: '수정과 같은 지면 가까이에서 주변 적을 처치하면 충전됩니다.',
    defeat: '모든 습격을 격퇴하세요. 다음 습격은 잠시 뒤 도착합니다.',
    elite: '정예를 먼저 처치해 다른 적의 회복을 막으세요.',
    boss: '수호자와 호위대를 모두 처치하세요. 바닥 경고를 피해 이동하세요.'
  };
  const percent = o => Math.floor(Math.min(1, Math.max(0, o.current / o.target)) * 100);
  const progress = o =>
    o.type === 'survival'
      ? `생존 ${Math.floor(o.current)} / ${Math.ceil(o.target)}초 · ${Math.ceil(Math.max(0, o.target - o.current))}초 남음`
      : ['escort', 'defense'].includes(o.type)
        ? `${o.type === 'escort' ? '호송' : '충전'} ${percent(o)}% · 대상 HP ${Math.ceil(o.health)} / 100${o.health <= 30 ? ' 위험' : ''} · ${Math.ceil(o.timeLeft)}초`
        : `습격 ${Math.floor(o.current)} / ${o.target}`;
  G.objectiveView = () => {
    const r = G.p.run,
      o = r?.objective;
    if (!o) return { title: '원정 목표', progress: '목표 정보 없음', status: '', instruction: '' };
    let status = '';
    if (r.phase === 'battle') {
      if (['escort', 'defense'].includes(o.type)) {
        const reason = G.objectiveBlockReason();
        status =
          {
            enemies: '멈춤 · 대상 주변 적을 처치하세요',
            distance: '멈춤 · 대상 가까이 이동하세요',
            height: '멈춤 · 대상과 같은 지면으로 이동하세요'
          }[reason] || (o.type === 'escort' ? '호송 중' : '충전 중');
      } else {
        const alive = G.enemies.filter(e => e.hp > 0).length;
        status = o.type === 'survival' ? '시간이 지나면 목표가 진행됩니다' : `남은 적 ${alive}마리`;
      }
      if (G.paused || !G.running)
        status = status.startsWith('멈춤')
          ? '일시정지 · ' + status
          : '일시정지 · 목표 진행도 멈췄습니다';
    }
    return {
      title: titles[o.type] || '원정 목표',
      progress: progress(o),
      status,
      instruction: instructions[o.type] || o.label || ''
    };
  };
  G.objectiveTitle = type => titles[type] || type;
  G.outcomeView = outcome => {
    if (!outcome)
      return { cause: '종료 원인 상세 기록 없음', snapshot: '종료 시점 수치 기록 없음' };
    const cause =
      {
        enemy: '적의 공격으로 체력 소진',
        objective: '목표 실패 · 상세 미기록',
        'target-destroyed': '보호 대상 체력 소진',
        'objective-timeout': '목표 제한 시간 초과',
        complete: '40단계 원정 완료',
        abandoned: '원정 중단'
      }[outcome.cause] ||
      (typeof outcome.cause === 'string' && outcome.cause
        ? outcome.cause
        : '종료 원인 상세 기록 없음');
    const valid = ['current', 'target', 'health', 'timeLeft', 'hp', 'maxHp', 'stage'].every(key =>
      Number.isFinite(outcome[key])
    );
    return {
      cause,
      snapshot: valid
        ? `${outcome.stage}단계 · ${titles[outcome.objectiveType] || '목표'} · ${progress({ ...outcome, type: outcome.objectiveType })} · 내 HP ${Math.ceil(outcome.hp)} / ${outcome.maxHp}`
        : '종료 시점 수치 기록 없음'
    };
  };
})();
