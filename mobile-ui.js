'use strict';
(() => {
  const G = window.Game,
    U = G.UI,
    $ = id => document.getElementById(id);
  const mobile = matchMedia('(max-width: 1000px)');
  const notify = G.notify;
  G.notify = message =>
    notify(
      mobile.matches
        ? String(message)
            .replace(
              '40단계 원정 시작 · Shift로 회피 · E로 원정 메뉴',
              '왼손 이동 · 오른손 전투 · 메뉴에서 조작 안내'
            )
            .replace(
              '루미 근처에서 직업 변경 · I로 장비 확인 · 오른쪽으로 모험 출발!',
              '왼손 이동 · 오른손 전투 · 메뉴에서 조작 안내'
            )
            .replace('E로 원정 메뉴', '원정 버튼으로 메뉴')
        : message
    );

  const text = (el, value) => {
    value = String(value);
    if (el.textContent !== value) el.textContent = value;
  };
  const svg = path =>
    `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const paths = {
    left: 'm15 5-7 7 7 7',
    right: 'm9 5 7 7-7 7',
    attack: 'm5 19 14-14 1-3-3 1L3 17m0-5 9 9',
    skill: 'm13 2-8 12h6l-1 8 9-13h-7Z',
    jump: 'M12 20V4m-6 6 6-6 6 6M4 20h16',
    dodge: 'M3 12h12m-5-5 5 5-5 5m8-14 3 3-3 3',
    potion: 'M9 3h6m-5 0v6l-5 9q-1 3 3 3h8q4 0 3-3l-5-9V3M7 15h10',
    interact: 'M4 4h16v12H9l-5 4Zm4 5h8m-8 3h5'
  };
  const dock = document.querySelector('.touch-controls'),
    stats = dock.querySelector('.mobile-stats');
  const status = document.createElement('section');
  status.className = 'mobile-status';
  status.setAttribute('aria-label', '전투 상태');
  status.innerHTML =
    '<div class="status-top"><strong id="mobile-region">단풍숲</strong><span id="mobile-stage">자유 탐험</span></div><div class="mobile-vitals"></div><div class="mobile-gauges"><progress id="mobile-health" aria-label="체력" max="100" value="100"></progress><progress id="mobile-mana" aria-label="마나" max="60" value="60"></progress></div><p id="mobile-objective"></p><div id="mobile-boss" hidden><span></span><progress aria-label="보스 체력" max="100" value="100"></progress></div>';
  status.querySelector('.mobile-vitals').append(stats);
  document.querySelector('.stage').before(status);
  const groups = {
    move: document.createElement('div'),
    action: document.createElement('div'),
    utility: document.createElement('div')
  };
  for (const [key, node] of Object.entries(groups)) {
    node.className = key + '-pad';
    dock.append(node);
  }
  const labels = {
    left: '왼쪽',
    right: '오른쪽',
    attack: '공격',
    skill: '스킬',
    jump: '점프',
    dodge: '회피',
    potion: '물약',
    interact: '대화'
  };
  for (const b of [...dock.querySelectorAll('button')]) {
    const action = b.dataset.action || b.dataset.hold;
    b.innerHTML = svg(paths[action]) + `<strong>${labels[action]}</strong><small></small>`;
    b.removeAttribute('aria-label');
    groups[
      b.dataset.hold ? 'move' : ['potion', 'interact'].includes(action) ? 'utility' : 'action'
    ].append(b);
  }
  const hint = document.createElement('p');
  hint.className = 'touch-hint';
  hint.textContent = '왼손으로 이동 · 오른손으로 전투';
  dock.append(hint);
  const menu = document.createElement('button');
  menu.id = 'mobile-menu';
  menu.textContent = '메뉴';
  menu.setAttribute('aria-label', '메뉴와 일시정지');
  document.querySelector('.header-actions').append(menu);
  const showMenu = () =>
    U.show(
      '잠시 쉬어가기',
      '<p>전투가 멈췄습니다. 준비되면 이어가세요.</p><div class="mobile-menu-grid"></div>',
      [{ text: '게임으로 돌아가기', primary: true, run: U.close }],
      true
    );
  U.mobileMenu = () => {
    showMenu();
    const grid = document.querySelector('.mobile-menu-grid');
    for (const [label, fn] of [
      ['원정 · 진행 중 선택', () => (G.p.run?.active ? G.openRunUI() : U.runDashboard())],
      ['장비 가방', () => U.inventory()],
      ['직업', () => U.jobs()],
      ['기록 · 도감', () => U.archive()],
      ['설정 · 저장 파일', () => U.settings()],
      ['조작 안내', () => U.help()]
    ]) {
      const b = document.createElement('button');
      b.textContent = label;
      b.onclick = fn;
      grid.append(b);
    }
  };
  menu.onclick = U.mobileMenu;
  const help = U.help;
  U.help = () => {
    if (!mobile.matches) return help();
    U.show(
      '두 손으로 떠나는 모험',
      '<div class="touch-guide"><p><strong>왼손: 좌우 이동</strong><br>이동을 누른 채 오른손으로 점프나 공격을 함께 사용할 수 있어요.</p><p><strong>오른손: 공격 · 스킬 · 점프 · 회피</strong><br>공격은 누르는 동안 반복됩니다. 스킬과 회피 버튼의 남은 시간을 확인하세요.</p><p><strong>위험 예고를 보고 회피</strong><br>발밑의 경고를 벗어나거나 점프로 피하세요. 물약과 대화는 아래 작은 버튼에 있어요.</p><p>메뉴를 열거나 화면을 돌리면 잠시 멈춥니다. 보상 선택을 닫아도 상단 도전에서 이어갈 수 있어요.</p><p>넓게 보려면 가로 화면을 사용하세요. 설정 · 저장 파일에서 기기 간 기록을 옮길 수 있어요.</p></div>',
      [{ text: '모험으로 돌아가기', primary: true, run: U.close }],
      true
    );
  };
  const updateButton = (action, detail, unavailable) => {
    for (const b of document.querySelectorAll(`.touch-controls [data-action="${action}"]`)) {
      text(b.querySelector('small'), detail);
      b.dataset.unavailable = String(unavailable);
    }
  };
  const resetMobileScroll = () => {
    if (mobile.matches) window.scrollTo(0, 0);
  };
  mobile.addEventListener('change', resetMobileScroll);
  resetMobileScroll();
  const refresh = G.refresh;
  let last = 0;
  G.refresh = () => {
    const now = performance.now();
    if (now - last < 100) return;
    last = now;
    refresh();
    document.body.classList.toggle('is-playing', G.running);
    if (!mobile.matches) return;
    const p = G.p,
      r = p.run,
      active = r?.active,
      info = active ? G.runInfo() : null;
    text($('mobile-region'), active ? info.name : p.zone === 'cavern' ? '빛나는 동굴' : '단풍숲');
    text($('mobile-stage'), active ? `${r.stage} / 40` : `${G.jobs[p.job].name} Lv.${p.level}`);
    const objective = active
      ? r.phase === 'battle'
        ? [G.objectiveView().progress, G.objectiveView().status].filter(Boolean).join(' · ')
        : '상단 도전에서 선택을 이어가세요'
      : document.getElementById('quest-copy').textContent;
    text($('mobile-objective'), objective);
    for (const [id, value, max] of [
      ['mobile-health', p.hp, p.maxHp],
      ['mobile-mana', p.mp, p.maxMp]
    ]) {
      const el = $(id);
      if (el.max !== max) el.max = max;
      if (el.value !== value) el.value = value;
    }
    const cost =
      G.jobs[p.job].mpCost +
      (G.gearTraits().has('lungeblade') || G.gearTraits().has('emberwand') ? 5 : 0);
    updateButton(
      'skill',
      p.cooldown > 0 ? `${p.cooldown.toFixed(1)}초` : p.mp < cost ? '마나 부족' : `MP ${cost}`,
      p.cooldown > 0 || p.mp < cost
    );
    updateButton(
      'dodge',
      p.dodgeCooldown > 0 ? `${p.dodgeCooldown.toFixed(1)}초` : '준비',
      p.dodgeCooldown > 0
    );
    updateButton(
      'potion',
      `${p.potions}개${p.hp >= p.maxHp ? ' · 가득' : ''}`,
      p.potions < 1 || p.hp >= p.maxHp
    );
    const canTalk = active || !$('prompt').hidden;
    labels.interact = active ? '원정' : '대화';
    text(dock.querySelector('[data-action=interact] strong'), labels.interact);
    updateButton(
      'interact',
      active
        ? r.phase === 'battle'
          ? '메뉴 열기'
          : '선택 계속'
        : canTalk
          ? '가까이 있어요'
          : '가까이 이동',
      !canTalk
    );
    const boss = G.enemies.find(
      e => e.kind === 'boss' && e.hp > 0 && e.dead <= 0 && G.bossAwake(e)
    );
    const box = $('mobile-boss');
    box.hidden = !boss;
    if (boss) {
      text(
        box.querySelector('span'),
        `보스 · ${Math.ceil(boss.hp)} / ${boss.maxHp} · ${boss.phase || 1}단계`
      );
      box.querySelector('progress').max = boss.maxHp;
      box.querySelector('progress').value = boss.hp;
    }
  };
})();
