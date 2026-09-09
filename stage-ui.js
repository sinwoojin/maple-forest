'use strict';
(() => {
  const G=window.Game,U=G.UI,$=id=>document.getElementById(id);
  const track=()=>{const r=G.p.run;return '<ol class="stage-track" aria-label="20스테이지 진행">'+Array.from({length:20},(_,i)=>{const n=i+1;return `<li class="${n%5===0?'boss ':''}${n<(r?.stage||1)?'done':n===r?.stage?'current':''}" aria-label="${n}스테이지${n%5===0?' 보스':''}">${n}</li>`;}).join('')+'</ol>';};
  const start=()=>{U.close();G.startAdventure();G.startRun();G.notify('20스테이지 도전 시작! 적을 모두 처치하고 보상을 선택하세요.');};
  U.runDashboard=()=>{
    const r=G.p.run,existing=G.hasRun(),info=G.runInfo();
    const intro=existing?`${r.stage} / 20 · ${info.name} · 최고 ${r.best||0}스테이지`:'4개의 지역, 20번의 전투. 5스테이지마다 보스가 기다립니다.';
    const actions=[];
    if(existing&&!['complete','failed'].includes(r.phase))actions.push({text:r.active?'도전 계속하기':'저장된 도전 재개',primary:true,run:()=>{U.close();G.running=true;$('welcome').hidden=true;if(!r.active)G.resumeRun();if(G.p.run.phase==='reward')U.runReward();}});
    actions.push({text:'새 도전 시작',primary:actions.length===0,run:()=>{
      const choose=()=>{if(G.p.run?.active)G.leaveRun();U.close();const was=G.running;G.running=false;document.getElementById("welcome").hidden=false;U.jobs(()=>{G.running=was;start();});};
      if(existing)U.show('이번 도전을 새로 시작할까요?','<p>스테이지와 도전 중 임시 강화가 초기화됩니다.<br>모아 둔 장비, 레벨과 자유 탐험 기록은 유지됩니다.</p>',[{text:'취소',run:U.runDashboard},{text:'새 도전',primary:true,run:choose}]);else choose();
    }});
    if(r?.active)actions.push({text:'저장하고 자유 탐험',run:()=>{G.leaveRun();U.close();G.running=true;$('welcome').hidden=true;G.notify('도전을 저장했습니다. 위쪽 도전 메뉴에서 재개할 수 있어요.');}});
    U.show('스테이지 원정',`<p>${intro}</p>${track()}<div class="run-rules"><strong>전투 → 보상 선택 → 다음 스테이지</strong><p>매 전투 뒤 무작위 보상 3개 중 하나를 고릅니다. 장비는 계속 보유하고, 도전 강화는 이번 원정에만 적용됩니다. 쓰러지면 도전은 종료되지만 획득한 장비는 남습니다.</p></div>`,actions,true);
  };
  U.runReward=()=>{
    const info=G.runInfo();
    U.show(`${info.stage}스테이지 클리어!`,`<span class="reward-kicker">CHOOSE YOUR REWARD</span><p>세 가지 보상 중 하나를 선택하세요. 선택한 보상은 즉시 적용됩니다.</p><div class="reward-options"></div>`,[{text:'나중에 선택',run:U.close}],true);
    const list=$('modal-body').querySelector('.reward-options');
    for(const reward of G.runRewards()){
      const b=document.createElement('button');b.className='reward-card '+reward.kind;
      const symbol=document.createElement('span');symbol.className='reward-symbol';symbol.setAttribute('aria-hidden','true');symbol.innerHTML='<svg viewBox="0 0 32 32"><path d="M16 3 27 10v12L16 29 5 22V10Z M5 10l11 7 11-7M16 17v12" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
      const title=document.createElement('strong');title.textContent=reward.title;const desc=document.createElement('span');desc.textContent=reward.description;const pick=document.createElement('small');pick.textContent='이 보상 선택 →';b.append(symbol,title,desc,pick);
      b.onclick=()=>{if(G.chooseRunReward(reward.id)){U.close();if(G.p.run.phase==='complete')U.runEnd();}};list.append(b);
    }
  };
  U.runEnd=()=>{
    const r=G.p.run,won=r.phase==='complete';
    U.show(won?'20스테이지 정복!':'이번 원정은 여기까지',`<span class="reward-kicker">${won?'EXPEDITION COMPLETE':'EXPEDITION RECORD'}</span><p>${won?'네 지역의 보스를 모두 물리쳤습니다.':'쓰러졌지만, 이번에 모은 장비는 사라지지 않습니다.'}</p><div class="equipped-summary"><strong>${r.stage} / 20 스테이지</strong><span>${G.jobs[G.p.job].name} · Lv.${G.p.level} · 장비 ${G.p.inventory.length}개 보유</span></div>`,[{text:'자유 탐험으로',primary:true,run:()=>{G.leaveRun();U.close();}},{text:'도전 기록 보기',run:U.runDashboard}],true);
  };
  G.openRunUI=()=>{if(G.p.run?.phase==='reward')U.runReward();else if(['complete','failed'].includes(G.p.run?.phase))U.runEnd();else U.runDashboard();};
  $('expedition').onclick=()=>G.p.run?.active&&G.p.run.phase==='reward'?U.runReward():U.runDashboard();
  $('expedition-start').onclick=U.runDashboard;
  const startAdventure=G.startAdventure;
  G.startAdventure=()=>{startAdventure();if(G.p.run?.active){G.notify(`스테이지 ${G.p.run.stage} 도전을 이어갑니다.`);if(G.p.run.phase!=='battle')G.openRunUI();}};
  const refresh=G.refresh;let lastStageRefresh=0;
  G.refresh=()=>{
    refresh();if(performance.now()-lastStageRefresh<80)return;lastStageRefresh=performance.now();const active=G.p.run?.active;$('stage-ribbon').hidden=!active;
    if(!active)return;const info=G.runInfo();
    $('stage-number').textContent=`STAGE ${String(info.stage).padStart(2,'0')} / 20`;$('stage-theme').textContent=info.name;
    $('stage-progress').value=info.stage;$('stage-counter').textContent=info.phase==='battle'?`남은 적 ${info.remaining}마리`:info.phase==='reward'?'보상 선택 대기':info.phase==='complete'?'원정 정복':'도전 종료';
    document.querySelector('.location .eyebrow').textContent='STAGE EXPEDITION';$('area').textContent=info.name;document.querySelector('.location-sub').textContent=info.boss?'보스 스테이지 · 충격파 주의':'적을 모두 처치하고 다음 지역으로';
    document.querySelector('.quest .eyebrow').textContent=`STAGE ${info.stage} · ${info.boss?'BOSS':'BATTLE'}`;$('quest-title').textContent=info.phase==='reward'?'다음 모험을 위한 선택':info.boss?'지역의 지배자':'원정의 발걸음';$('quest-copy').textContent=info.phase==='reward'?'E 또는 도전 버튼으로 보상을 고르세요.':'스테이지 안의 적을 모두 처치하세요.';$('quest-count').textContent=info.phase==='battle'?`${info.remaining}마리 남음`:'완료';$('quest-reward').textContent='무작위 보상 3개 중 선택';
    if(info.phase==='failed'){$('quest-title').textContent='원정 종료';$('quest-copy').textContent='E 또는 도전 버튼에서 기록을 확인하세요.';$('quest-count').textContent='종료';} $('prompt').hidden=G.paused||!G.running||info.phase==='battle';$('prompt').textContent='E · 보상 / 원정 기록 열기';
  };
})();
