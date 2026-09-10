'use strict';
(() => {
  const G = window.Game;
  const titles = {
    defeat: '습격 격퇴',
    survival: '생존',
    escort: '반딧불 호송',
    defense: '수정 방어',
    elite: '정예 치유단',
    boss: '챕터 수호자'
  };
  G.makeModernRoutes = () => {
    const r = G.p.run,
      next = r.stage + 1;
    if (next % 10 === 0)
      return [
        {
          id: `${next}:boss`,
          title: '수호자의 문',
          description: '수호자와 호위대의 두 차례 습격을 격퇴합니다.',
          type: 'boss',
          encounter: 'boss',
          risk: '보스 패턴',
          rewardHint: '전투 보상 1개 선택'
        }
      ];
    const types = ['defeat', 'survival', 'escort', 'defense'];
    const encounter = types[Math.floor(G.runRandom(7) * types.length)];
    const direct = next % 4 === 0 ? 'elite' : encounter;
    const ordinal = next - Math.floor(next / 10) - 1;
    const utility =
      ordinal % 3 === 0 ? 'rest' : ['event', 'shop', 'rest'][Math.floor(G.runRandom(29) * 3)];
    const supply = { event: '숲의 만남', shop: '여행 상인', rest: '모닥불 쉼터' };
    const benefit = {
      event: '비용 없는 선택도 있는 사건',
      shop: '구입은 선택 사항 · 물약 45 / 공격 80 / 방어 65골드',
      rest: '무료 회복 또는 수련·물약 조제'
    };
    return [
      {
        id: `${next}:${direct}`,
        title: `바로 도전 · ${titles[direct]}`,
        description:
          direct === 'elite'
            ? '치유사가 살아 있으면 동료가 회복합니다. 우선 처치하세요.'
            : '사전 보급을 건너뛰고 전투를 시작합니다.',
        type: direct,
        encounter: direct,
        risk: direct === 'elite' ? '적 회복 오라' : '사전 보급 없음',
        rewardHint:
          direct === 'elite' ? '진입 +60골드 · 완료 +90골드·재료3' : '진입 +60골드 · 전투 보상 1개'
      },
      {
        id: `${next}:${utility}`,
        title: supply[utility],
        description: `${benefit[utility]}. 준비 뒤 ${titles[encounter]} 전투를 치릅니다.`,
        type: utility,
        encounter,
        risk: '보급 뒤 전투',
        rewardHint: '준비 기회 · 전투 보상 1개'
      }
    ];
  };
})();
