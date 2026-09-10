'use strict';
(() => {
  const G = window.Game,
    $ = id => document.getElementById(id),
    modal = $('modal');
  const U = (G.UI = {});
  U.close = () => {
    modal.close();
    G.paused = false;
    G.clearInput();
    $('game').focus();
  };
  U.show = (title, body, actions = [], wide = false) => {
    G.paused = true;
    G.clearInput();
    modal.classList.toggle('wide', wide);
    modal.dataset.view = title;
    document.getElementById('modal-body').scrollTop = 0;
    $('modal-title').textContent = title;
    $('modal-body').innerHTML = body;
    $('modal-actions').replaceChildren();
    for (const a of actions) {
      const b = document.createElement('button');
      b.textContent = a.text;
      b.className = a.primary ? 'primary' : '';
      b.onclick = a.run;
      $('modal-actions').append(b);
    }
    if (!modal.open) modal.showModal();
  };
  const icons = {
    warrior: 'M8 24 24 8l2-6-6 2L4 20m1-7 14 14M3 29l7-7',
    archer: 'M9 3q23 13 0 26L16 16 9 3M3 16h26m-5-5 5 5-5 5',
    mage: 'M6 29 22 8m-3-5 7 1 3 7-7 4-6-5Z'
  };
  const icon = job =>
    `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="${icons[job] || icons.warrior}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  U.jobs = onSelect => {
    const canSwitch = G.canChangeJob();
    U.show(
      '나만의 전투 스타일',
      `<p>${canSwitch ? '세 가지 길, 서로 다른 모험. 레벨과 장비 수집 기록은 유지됩니다.' : '직업 변경은 시작 지점의 루미 근처에서 할 수 있어요.'}</p><div class="job-options"></div>`,
      [],
      true
    );
    const box = modal.querySelector('.job-options');
    for (const [id, job] of Object.entries(G.jobs)) {
      const b = document.createElement('button');
      b.className = 'job-card ' + id;
      b.setAttribute('aria-pressed', String(G.p.job === id));
      b.disabled = !canSwitch;
      b.innerHTML = `<span class="job-art">${icon(id)}</span><span class="job-details"><strong>${job.name}</strong><span>${job.description}</span><small>${job.attackName} · ${job.skillName}</small></span><span class="job-pick">${G.p.job === id ? '선택됨' : '선택 →'}</span>`;
      b.onclick = () => {
        if (G.setJob(id)) {
          G.save();
          U.close();
          if (onSelect) onSelect();
          else G.notify(`${job.name}로 전직했어요. 장비와 스킬을 확인해 보세요.`);
        }
      };
      box.append(b);
    }
  };
  U.inventory = () => {
    const p = G.p,
      stats = G.equipmentStats();
    const weapon = G.items[p.equipment.weapon],
      armor = G.items[p.equipment.armor];
    U.show(
      '모험가의 가방',
      `<div class="equipment-showcase"><canvas id="gear-preview" width="160" height="200" aria-label="현재 장비 외형 미리보기"></canvas><div class="equipped-summary"><span class="eyebrow">${G.jobs[p.job].name} · EQUIPMENT</span><strong>${weapon?.name || '무기 없음'}</strong><span>${armor?.name || '방어구 없음'}</span><small>추가 공격력 +${stats.attack} · 피해 감소 ${stats.defense}</small><small>${Art.gearLook(p).name} 무기</small><small>${Art.gearLook(p).armorName}</small></div></div><p class="inventory-hint">자유 탐험은 사냥 3마리마다, 원정은 스테이지 보상으로 장비 획득. 중복은 골드로 전환됩니다.</p><div class="inventory-list"></div>`,
      [{ text: '닫기', primary: true, run: U.close }],
      true
    );
    Art.equipmentPreview(document.getElementById('gear-preview'), p);
    const list = modal.querySelector('.inventory-list');
    for (const id of p.inventory) {
      const item = G.items[id];
      if (!item) continue;
      const equipped = p.equipment[item.slot] === id,
        compatible = item.job === 'all' || item.job === p.job;
      const row = document.createElement('div');
      row.className = 'item-row';
      const desc = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = item.name;
      const detail = document.createElement('small');
      detail.textContent = `${item.rarity} · ${item.slot === 'weapon' ? '공격력 +' + item.attack : '피해 감소 ' + item.defense} · ${item.job === 'all' ? '공용' : G.jobs[item.job].name}`;
      desc.append(name, detail);
      const b = document.createElement('button');
      b.textContent = equipped ? '장착 중' : compatible ? '장착' : '다른 직업';
      b.disabled = equipped || !compatible;
      b.setAttribute('aria-label', `${item.name} ${b.textContent}`);
      b.onclick = () => {
        if (G.equip(id)) {
          G.save();
          U.inventory();
        }
      };
      row.append(desc, b);
      list.append(row);
    }
  };
  U.confirmReset = () =>
    U.show(
      '새로운 모험을 시작할까요?',
      '<p>현재 레벨, 장비, 골드와 두 지역의 진행이 초기화됩니다.</p>',
      [
        { text: '취소', run: U.close },
        {
          text: '초기화하고 시작',
          run: () => {
            G.reset();
            U.close();
            G.running = false;
            $('welcome').hidden = false;
            U.jobs(G.startAdventure);
          }
        }
      ]
    );
  U.pause = () => {
    if (!G.running) return;
    if (modal.open) {
      U.close();
      return;
    }
    U.show(
      '잠시 쉬어가기',
      '<p>숲과 동굴의 시간이 잠시 멈췄어요.<br>준비되면 다시 모험을 이어가세요.</p>',
      [
        { text: '계속 모험하기', primary: true, run: U.close },
        { text: '처음부터 시작', run: U.confirmReset }
      ]
    );
  };
  U.help = () =>
    U.show(
      '모험가의 작은 안내서',
      '<div class="help-grid"><span><kbd>←</kbd> <kbd>→</kbd></span><span>이동 · A / D도 가능</span><span><kbd>SPACE</kbd></span><span>점프 · 충격파 피하기</span><span><kbd>Z</kbd></span><span>직업별 기본 공격 · 길게 누르기</span><span><kbd>X</kbd></span><span>직업별 스킬 · 마나 소비</span><span><kbd>SHIFT</kbd></span><span>회피 · 짧은 무적과 재사용 대기시간</span><span><kbd>C</kbd></span><span>물약 · 체력 80 회복</span><span><kbd>E</kbd></span><span>루미와 대화 / 포털 이동</span><span><kbd>I</kbd></span><span>가방 · 장비 장착</span><span><kbd>ESC</kbd></span><span>일시정지 / 메뉴 닫기</span></div><p><strong>스테이지 원정:</strong> 도전 메뉴에서 시작하세요. 40단계, 10단계마다 보스가 등장하며, 클리어 후 보상 3개 중 하나를 선택합니다. E로 보상 창을 다시 열 수 있습니다. 저장하고 자유 탐험으로 나갔다가 재개할 수 있어요.</p><p>숲에서 8마리를 처치하고 수호자를 물리치세요. 오른쪽 포털로 버섯 동굴에 들어가 6마리를 처치한 뒤 버섯 군주에게 도전하세요.</p><p>직업은 마을에서 바꿀 수 있어요. 장비는 자동으로 가방에 들어가며, 가방에서 장착해야 효과가 적용됩니다.</p>',
      [{ text: '알겠어요', primary: true, run: U.close }]
    );
  G.shop = () =>
    U.show(
      '숲지기 루미',
      '<p>“이 숲 너머에 빛나는 버섯 동굴이 있대.<br>준비를 단단히 하고 떠나렴.”</p><p id="shop-status">물약 1개: 20 골드 · 보유 ' +
        G.p.gold +
        ' 골드</p>',
      [
        {
          text: '물약 구입 · 20 골드',
          primary: true,
          run: () => {
            if (G.p.gold < 20) {
              $('shop-status').textContent = '골드가 부족해요. 사냥으로 모아보세요.';
              return;
            }
            G.p.gold -= 20;
            G.p.potions++;
            G.save();
            $('shop-status').textContent = `보유 ${G.p.gold} 골드 · 물약 ${G.p.potions}개`;
          }
        },
        {
          text: '무료 회복',
          run: () => {
            G.p.hp = G.p.maxHp;
            G.p.mp = G.p.maxMp;
            G.save();
            U.close();
            G.notify('체력과 마나를 모두 회복했어요.');
          }
        },
        { text: '직업 변경', run: () => U.jobs() },
        { text: '돌아가기', run: U.close }
      ]
    );
  G.victory = () =>
    U.show(
      '동굴에도 빛이 돌아왔어요',
      `<p>단풍숲의 수호자와 버섯 군주를 물리쳤습니다.<br>두 지역을 지켜낸 모험가의 이야기는 계속됩니다.</p><div class="equipped-summary"><span class="eyebrow">CHAPTER 02 · COMPLETE</span><strong>${G.jobs[G.p.job].name} · Lv. ${G.p.level}</strong><span>누적 ${G.p.kills + G.p.caveKills + (G.p.caveBossDead ? 1 : 0)}마리 처치 · 장비 ${G.p.inventory.length}개 수집</span></div>`,
      [
        { text: '계속 탐험하기', primary: true, run: U.close },
        { text: '새 모험 시작', run: U.confirmReset }
      ]
    );
  $('close-modal').onclick = U.close;
  modal.addEventListener('cancel', e => {
    e.preventDefault();
    U.close();
  });
})();
