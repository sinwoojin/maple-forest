'use strict';
(() => {
  const G = window.Game,
    U = G.UI,
    $ = id => document.getElementById(id);
  let toastTimer;
  G.notify = text => {
    $('toast').textContent = text;
    $('toast').classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3800);
  };
  const hasSave = G.load();
  if (hasSave) {
    $('start').innerHTML = '이어서 모험하기 <span>→</span>';
    $('save-note').textContent = `저장된 모험 · ${G.jobs[G.p.job].name} Lv. ${G.p.level}`;
  }
  G.startAdventure = () => {
    G.running = true;
    G.paused = false;
    G.ready = true;
    $('welcome').hidden = true;
    $('game').focus();
    G.save();
    G.notify('루미 근처에서 직업 변경 · I로 장비 확인 · 오른쪽으로 모험 출발!');
  };
  $('start').onclick = () => {
    if (hasSave || G.ready) G.startAdventure();
    else U.jobs(G.startAdventure);
  };
  $('jobs').onclick = () => U.jobs();
  $('inventory').onclick = U.inventory;
  $('pause').onclick = U.pause;
  $('help').onclick = U.help;
  $('sound').onclick = () => {
    G.sound = !G.sound;
    $('sound').textContent = G.sound ? '소리 켜짐' : '소리 꺼짐';
    $('sound').setAttribute('aria-label', G.sound ? '효과음 끄기' : '효과음 켜기');
    $('sound').setAttribute('aria-pressed', String(G.sound));
    G.beep(600);
  };
  G.bindInputs();
  function quest(p) {
    if (p.zone === 'cavern')
      return p.caveBossDead
        ? ['동굴에 돌아온 빛', '오른쪽 출구에서 이야기를 마무리하세요.', '완료', '버섯 동굴 정복']
        : p.caveKills >= 6
          ? ['깨어난 버섯 군주', '동굴 오른쪽의 버섯 군주를 물리치세요.', 'BOSS', '희귀 장비 보장']
          : [
              '빛을 잃은 버섯 동굴',
              '동굴 몬스터 6마리를 처치하세요.',
              `${Math.min(6, p.caveKills)} / 6`,
              '군주의 봉인 해제'
            ];
    return p.bossDead
      ? ['숲 너머의 이야기', '오른쪽 포털로 버섯 동굴에 들어가세요.', 'OPEN', '새 지역 · CH.02']
      : p.quest === 0
        ? [
            '숲의 작은 소동',
            '숲의 몬스터를 8마리 처치하세요.',
            `${Math.min(8, p.kills)} / 8`,
            '120 EXP · 80 골드'
          ]
        : ['깨어난 숲의 수호자', '오른쪽 끝의 수호자를 물리치세요.', 'BOSS', '장비 + 동굴 개방'];
  }
  G.refresh = () => {
    const p = G.p,
      job = G.jobs[p.job];
    $('level').textContent = `Lv. ${p.level}`;
    $('gold').textContent = `${p.gold.toLocaleString()} 골드`;
    $('job-badge').textContent = job.name;
    $('job-badge').dataset.job = p.job;
    for (const stat of ['hp', 'mp']) {
      const max = stat === 'hp' ? p.maxHp : p.maxMp;
      $(stat).max = max;
      $(stat).value = p[stat];
      $(stat + '-text').textContent = `${Math.ceil(p[stat])} / ${max}`;
    }
    $('xp').max = G.needXp();
    $('xp').value = p.xp;
    $('xp-text').textContent = `${Math.floor((p.xp / G.needXp()) * 100)}%`;
    $('mobile-hp').textContent = `HP ${Math.ceil(p.hp)} / ${p.maxHp}`;
    $('mobile-mp').textContent = `MP ${Math.ceil(p.mp)} / ${p.maxMp}`;
    $('mobile-level').textContent = `${job.name} Lv.${p.level}`;
    $('potions').textContent = p.potions + '개';
    $('attack-name').textContent = job.attackName;
    $('skill-name').textContent = job.skillName;
    $('skill-cool').textContent =
      p.cooldown > 0 ? p.cooldown.toFixed(1) + '초' : `MP ${job.mpCost}`;
    $('map-dot').style.left = (p.x / G.worldWidth) * 96 + '%';
    $('area').textContent =
      p.zone === 'cavern'
        ? '빛나는 버섯 동굴'
        : p.x > 3350
          ? '오래된 수호자의 터'
          : '햇살이 머무는 숲';
    document.querySelector('.location .eyebrow').textContent =
      p.zone === 'cavern' ? 'LUMINOUS MUSHROOM CAVERN' : 'VICTORIA WOODLAND';
    document.querySelector('.location-sub').innerHTML =
      p.zone === 'cavern'
        ? '<i></i> 버섯 군주의 영역 · CH. 02'
        : '<i></i> 초보 모험가의 길 · CH. 01';
    document.querySelector('.quest .eyebrow').textContent =
      p.zone === 'cavern' ? 'STORY QUEST · 02' : 'STORY QUEST · 01';
    const q = quest(p);
    ['quest-title', 'quest-copy', 'quest-count', 'quest-reward'].forEach(
      (id, i) => ($(id).textContent = q[i])
    );
    const near =
      p.zone === 'cavern' ? p.x < 210 || p.x > 2990 : Math.abs(p.x - 230) < 110 || p.x > 4160;
    $('prompt').hidden = !near || !G.running || G.paused;
    $('prompt').textContent =
      p.zone === 'cavern'
        ? p.x < 210
          ? 'E · 단풍숲으로 돌아가기'
          : 'E · 동굴의 출구 이용'
        : p.x > 4160
          ? 'E · 버섯 동굴로 이동'
          : 'E · 루미와 대화 / 무료 회복';
  };
  setInterval(() => {
    if (G.running)
      $('save-status').textContent = G.save() ? '자동 저장됨' : '저장 불가 · 브라우저 설정 확인';
  }, 5000);
  window.addEventListener('pagehide', () => {
    if (G.running) G.save();
  });
})();
