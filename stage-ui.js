'use strict';
(() => {
  const G=window.Game,U=G.UI,$=id=>document.getElementById(id);
  U.displayText=value=>String(value??'').replace(/\b(materials|gold|potions|attack|defense|warrior|archer|mage|counter|bleed|heavy|pierce|multishot|mark|frost|burn|mana|longblade|parryblade|lungeblade|snarearrow|drillarrow|spiritarrow|manawand|icewand|emberwand|herbalcloak|froststep)\b/g,key=>({materials:'재료',gold:'골드',potions:'물약',attack:'공격',defense:'방어',warrior:'전사',archer:'궁수',mage:'마법사',counter:'반격',bleed:'출혈',heavy:'강타',pierce:'관통',multishot:'다중 사격',mark:'표식',frost:'서리',burn:'화염',mana:'마나',longblade:'긴 칼날',parryblade:'반격 방어',lungeblade:'돌진',snarearrow:'둔화 화살',drillarrow:'추가 관통',spiritarrow:'마나 회수',manawand:'마력 회복',icewand:'빙결',emberwand:'잔류 불길',herbalcloak:'약초 회복',froststep:'서리 회피'}[key]));
  const phases={battle:'전투',route:'갈림길',event:'숲의 이야기',shop:'여행 상점',rest:'야영지',reward:'보상 선택',complete:'원정 완료',failed:'원정 종료'};
  U.paragraph=text=>{const p=document.createElement('p');p.textContent=String(text??'');$('modal-body').append(p);return p;};
  U.choices=(title,description,choices,choose,actions=[])=>{
    U.show(title,'<div class="decision-intro"></div><div class="reward-options"></div>',actions,true);
    $('modal-body').querySelector('.decision-intro').textContent=description;
    const list=$('modal-body').querySelector('.reward-options');
    for(const item of choices){const b=document.createElement('button');b.className='reward-card';b.dataset.choice=String(item.id);b.disabled=item.enabled===false||item.affordable===false;
      for(const [tag,text] of [['strong',item.title||item.name],['span',item.description],['small',[item.risk,item.rewardHint,item.synergy,item.cost!=null?`${item.cost} 골드`:null,b.disabled?item.reason:null].filter(Boolean).join(' · ')],['small',b.disabled?'조건 미충족':'선택 →']]){if(text){const el=document.createElement(tag);el.textContent=U.displayText(text);b.append(el);}}
      b.onclick=()=>choose(item.id);list.append(b);
    }
  };
  const afterChoice=()=>{U.close();if(G.p.run?.phase!=='battle')G.openRunUI();};
  const track=()=>'<ol class="stage-track" aria-label="40단계 원정 진행">'+Array.from({length:40},(_,i)=>`<li class="${(i+1)%10===0?'boss ':''}${i+1<(G.p.run?.stage||1)?'done':i+1===G.p.run?.stage?'current':''}">${i+1}</li>`).join('')+'</ol>';
  U.builds=(onSelect)=>U.choices('이번 원정의 전투 방식','직업마다 세 가지 성장 방향. 유물과 장비의 효과를 함께 살펴보세요.',G.buildOptions(G.p.job),onSelect);
  const begin=daily=>{
    const choose=()=>{if(G.p.run?.active)G.leaveRun();U.close();G.running=false;$('welcome').hidden=false;U.jobs(()=>U.builds(id=>{const launch=relic=>{U.close();G.startAdventure();if(daily)G.startDailyRun(G.p.job);else G.startRun({build:id,relic});G.selectBuild(id);if(relic&&!G.p.run.relics.includes(relic))G.grantRelic(relic);G.save();G.notify('40단계 원정 시작 · Shift로 회피 · E로 원정 메뉴');};const relics=G.startingRelicChoices?.()||[];if(relics.length&&!daily)U.choices('첫 길을 밝혀줄 유물','지난 원정으로 열린 새로운 시작. 하나를 선택하세요.',relics,launch);else launch();}));};
    if(G.hasRun())U.show('새로운 원정을 시작할까요?','<p>현재 원정의 진행과 임시 강화가 초기화됩니다. 모은 장비와 기록은 유지됩니다.</p>',[{text:'돌아가기',run:U.runDashboard},{text:'새 원정',primary:true,run:choose}]);else choose();
  };
  U.runDashboard=()=>{
    const r=G.p.run,actions=[];
    if(G.hasRun()&&r&&!['complete','failed'].includes(r.phase))actions.push({text:r.active?'원정 계속하기':'저장된 원정 재개',primary:true,run:()=>{U.close();G.running=true;$('welcome').hidden=true;if(!r.active)G.resumeRun();if(r.phase!=='battle')G.openRunUI();}});
    actions.push({text:'새 원정 시작',run:()=>begin(false)},{text:'오늘의 원정',run:()=>U.show('오늘의 원정 · UTC','<p>같은 UTC 날짜에는 같은 시드를 사용합니다. 기록은 이 기기에만 남는 비공인 개인 도전입니다.</p>',[{text:'돌아가기',run:U.runDashboard},{text:'오늘의 원정 시작',primary:true,run:()=>begin(true)}])},{text:'모험 기록 / 도감',run:()=>U.archive()});
    if(r?.active)actions.push({text:'저장하고 자유 탐험',run:()=>{G.leaveRun();U.close();G.running=true;$('welcome').hidden=true;}});
    U.show('갈림길의 원정',track()+'<div class="run-rules"><strong>40개의 여정 · 4명의 지배자</strong><p>전투, 갈림길, 사건과 야영지를 지나 자신만의 빌드를 만드세요. 10단계마다 보스가 기다립니다. 원정 레벨 1로 시작 · 장비 유지 · 획득 경험치는 귀환 시 반영됩니다. 메뉴를 닫아도 선택은 E로 다시 열 수 있습니다.</p></div>',actions,true);
    if(r)U.paragraph(`${r.stage} / 40 · ${phases[r.phase]||r.phase} · ${G.buildInfo?.().name||'전투 방식 미선택'}`);
  };
  U.runReward=()=>U.choices(`${G.p.run.stage}단계 보상`,'한 가지를 선택합니다. 유물은 현재 빌드와의 조합을 확인하세요.',G.runRewards().map(r=>({...r,synergy:r.synergy||G.relicCatalog?.[r.item]?.synergy})),id=>{if(G.chooseRunReward(id))afterChoice();},[{text:'나중에 선택',run:U.close}]);
  U.runRoute=()=>U.choices('숲길은 어디로 이어질까요?','위험과 보상을 비교하고 다음 길을 선택하세요.',G.routeChoices(),id=>{if(G.chooseRoute(id))afterChoice();});
  U.runEvent=()=>{const event=G.eventView();if(!event)return U.runDashboard();U.choices(event.title,event.description,event.result?[]:event.choices,id=>{if(G.chooseEventOption(id))G.openRunUI();},event.result?[{text:'이야기 계속',primary:true,run:()=>{G.continueRun();afterChoice();}}]:[]);if(event.result)U.paragraph(typeof event.result==='string'?event.result:event.result.text||event.result.description||JSON.stringify(event.result));};
  U.runShop=()=>U.choices('길 위의 작은 상점',`보유 ${G.p.gold} 골드 · 준비를 마치면 다음 길로 떠나세요.`,G.runShop(),id=>{if(G.buyRunItem(id))U.runShop();},[{text:'상점 떠나기',primary:true,run:()=>{G.continueRun();afterChoice();}}]);
  U.runRest=()=>U.choices('불빛 곁의 야영지',G.p.run.restUsed?'준비를 마쳤습니다. 다음 여정으로 떠나세요.':'휴식도 성장의 선택입니다.',G.restChoices(),id=>{if(G.chooseRest(id))afterChoice();},G.p.run.restUsed?[{text:'야영지 떠나기',primary:true,run:()=>{G.continueRun();afterChoice();}}]:[]);
  U.runEnd=()=>{const r=G.p.run;U.show(r.phase==='complete'?'네 지역을 정복했어요!':'이번 원정은 여기까지','', [{text:'모험 기록',run:()=>U.archive()},{text:'자유 탐험으로',primary:true,run:()=>{G.leaveRun();U.close();}},{text:'다시 도전',run:()=>begin(false)}],true);U.paragraph(`${r.stage} / 40 단계 · ${G.jobs[G.p.job].name} · ${Math.floor((r.elapsedSeconds||0)/60)}분`);U.paragraph(G.buildInfo?.().name||'');U.paragraph('원정에서 얻은 장비와 모험 기록은 남습니다. 다른 길과 전투 방식으로 다시 도전해 보세요.');};
  G.openRunUI=()=>({reward:U.runReward,route:U.runRoute,event:U.runEvent,shop:U.runShop,rest:U.runRest,complete:U.runEnd,failed:U.runEnd}[G.p.run?.phase]||U.runDashboard)();
  $('expedition').onclick=()=>G.p.run?.active&&G.p.run.phase!=='battle'?G.openRunUI():U.runDashboard();$('expedition-start').onclick=U.runDashboard;
  const start=G.startAdventure;G.startAdventure=()=>{start();if(G.p.run?.active&&G.p.run.phase!=='battle')G.openRunUI();};
  const refresh=G.refresh;G.refresh=()=>{refresh();const active=G.p.run?.active;$('stage-ribbon').hidden=!active;if(!active)return;const i=G.runInfo(),objective=i.objective?.label||`남은 적 ${i.remaining}마리`;
    $('stage-number').textContent=`STAGE ${String(i.stage).padStart(2,'0')} / 40`;$('stage-theme').textContent=i.name;$('stage-progress').value=i.stage;
    $('stage-counter').textContent=i.phase==='battle'?`${objective} · ${Math.ceil(i.objective?.remaining||0)} 남음 · ${Math.ceil(i.objective?.timeLeft||0)}초`:phases[i.phase];$('area').textContent=i.name;document.querySelector('.location .eyebrow').textContent=`CHAPTER ${i.chapter||Math.ceil(i.stage/10)} · EXPEDITION`;
    document.querySelector('.location-sub').textContent=G.buildInfo?.().name||'성장의 여정';$('quest-title').textContent=i.phase==='battle'?objective:phases[i.phase];$('quest-copy').textContent=i.phase==='battle'?'위험 표시를 확인하고 Shift / 회피로 피하세요.':'E 또는 도전 버튼으로 선택을 이어가세요.';$('quest-count').textContent=i.phase==='battle'?`${i.remaining}마리 남음`:'선택 대기';$('quest-reward').textContent=i.boss?'지역 보스':'갈림길과 성장';$('prompt').hidden=G.paused||!G.running||i.phase==='battle';$('prompt').textContent='E · 다음 선택 열기';
  };
})();
