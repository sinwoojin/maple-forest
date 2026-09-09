'use strict';
(() => {
  const G=window.Game,copy=v=>JSON.parse(JSON.stringify(v));
  G.runCopy=copy;
  G.freshRun=()=>({version:4,active:false,started:false,seed:0,stage:1,phase:'battle',best:0,buffs:{attack:0,defense:0},entryLevel:1,job:'warrior',returnZone:'forest',returnX:220,enemies:[],player:null,rewards:[],routes:[],choices:[],events:[],gearGained:[],elapsedSeconds:0,build:'',relics:[],daily:false,recorded:false,nodeType:'defeat',combat:null,objective:null,wave:0,waveClock:0,event:null,shop:[],restUsed:false});
  const defaults=G.defaults;G.defaults=()=>({...defaults(),run:G.freshRun()});G.p.run=G.freshRun();
  G.runRandom=(salt=0)=>{const r=G.p.run;let n=(r.seed^Math.imul(r.stage+salt,2654435761))>>>0;n^=n<<13;n^=n>>>17;n^=n<<5;return(n>>>0)/4294967296;};
  G.hasRun=()=>G.p.run.started;
  G.runInfo=()=>{const r=G.p.run,i=Math.floor((r.stage-1)/10);return{stage:r.stage,total:40,chapter:i+1,biome:['forest','cavern','frost','twilight'][i],name:['단풍숲 원정','빛나는 동굴','서리 수정굴','황혼의 숲'][i],boss:r.stage%10===0,remaining:(r.active?G.enemies:r.enemies).filter(e=>e.hp>0).length,phase:r.phase,nodeType:r.nodeType,objective:copy(r.objective),elapsedSeconds:r.elapsedSeconds};};
  G.runArena=()=>{const r=G.p.run,offset=(r.stage%3)*60;G.platforms=[{x:0,y:610,w:1600,h:110},{x:350+offset,y:455,w:230,h:36},{x:980-offset,y:410+(r.stage%2)*45,w:250,h:36}];G.worldWidth=1600;};
  G.clearRunMotion=()=>{Object.assign(G.p,{vx:0,vy:0,attack:0,skill:0,cooldown:0,grounded:true,invuln:1.5});G.keys.clear();G.projectiles=[];G.hazards=[];G.effects=[];G.camera=0;};
  G.snapshotRun=()=>{const p=G.p,r=p.run;if(!r?.active)return;r.enemies=copy(G.enemies);r.combat=G.snapshotCombat?.()||null;r.player={x:p.x,y:p.y,hp:p.hp,mp:p.mp};};
  G.runTransition=phase=>{G.p.run.phase=phase;G.projectiles=[];G.hazards=[];G.keys.clear();G.save();G.openRunUI?.();};
  const populate=G.populate;G.populate=()=>{if(!G.p.run?.active){populate();return;}G.runArena();G.p.zone=['cavern','frost'].includes(G.runInfo().biome)?'cavern':'forest';G.enemies=copy(G.p.run.enemies);if(G.p.run.player)Object.assign(G.p,G.p.run.player);G.restoreCombat?.(G.p.run.combat);};
  G.startRun=(options={})=>{const p=G.p,prior=p.run;let seed=options.seed;if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295)seed=Math.floor(Math.random()*4294967295)+1;p.run={...G.freshRun(),active:true,started:true,seed,best:prior.best,entryLevel:p.level,job:p.job,returnZone:prior.active?prior.returnZone:p.zone,returnX:prior.active?prior.returnX:p.x,daily:options.daily===true,startedAt:Date.now()};if(options.build&&G.buildOptions(p.job).some(b=>b.id===options.build))p.run.build=options.build;else if(p.build&&G.buildOptions(p.job).some(b=>b.id===p.build))p.run.build=p.build;p.hp=p.maxHp;p.mp=p.maxMp;G.enterEncounter('defeat');return true;};
  G.leaveRun=()=>{const p=G.p,r=p.run;if(!r.active)return false;G.snapshotRun();r.active=false;p.zone=r.returnZone;p.x=r.returnX;p.y=610;if(p.hp<=0){p.hp=p.maxHp;p.mp=p.maxMp;}G.clearRunMotion();G.populate();G.save();return true;};
  G.resumeRun=()=>{const r=G.p.run;if(!r.started||r.active||['complete','failed'].includes(r.phase))return false;r.returnZone=G.p.zone;r.returnX=G.p.x;G.p.job=r.job;G.p.build=r.build;G.initializeGear();if(G.items[G.p.equipment.weapon]?.job!==r.job)G.p.equipment.weapon=G.p.inventory.filter(id=>G.items[id].slot==='weapon'&&G.items[id].job===r.job).sort((a,b)=>G.items[b].attack-G.items[a].attack)[0];r.active=true;G.clearRunMotion();G.populate();G.save();if(r.phase!=='battle')G.openRunUI?.();return true;};
  G.finishRunRecord=cause=>{const r=G.p.run;if(r.recorded)return;r.recorded=true;G.recordRunResult?.({id:[r.seed,r.job,r.startedAt||0].join(':'),seed:r.seed,daily:r.daily,job:r.job,build:r.build,builds:[r.build].filter(Boolean),relics:copy(r.relics),elapsedSeconds:r.elapsedSeconds,stage:r.stage,choices:copy(r.choices),events:copy(r.events),gearGained:copy(r.gearGained),cause});};
  G.failRun=(cause='defeated')=>{const r=G.p.run;if(!r.active||r.phase!=='battle')return false;r.rewards=[];r.buffs={attack:0,defense:0};G.finishRunRecord(cause);G.runTransition('failed');return true;};
  G.runRewards=()=>copy(G.p.run.rewards);
  G.completeEncounter=()=>{const r=G.p.run;if(r.phase!=='battle')return;r.best=Math.max(r.best,r.stage);r.rewards=G.makeRunRewards();G.runTransition('reward');};
  G.chooseRunReward=id=>{const p=G.p,r=p.run;if(!r.active||r.phase!=='reward')return false;const c=r.rewards.find(v=>v.id===id);if(!c)return false;r.rewards=[];r.phase='route';if(c.kind==='gear'){G.awardItem(c.item);r.gearGained.push(c.item);}else if(c.kind==='heal'){p.hp=p.maxHp;p.mp=p.maxMp;}else if(c.kind==='relic')G.grantRelic?.(c.item);else if(c.kind==='materials')p.materials=(p.materials||0)+c.value;else r.buffs.attack+=c.value;if(r.stage===40){G.finishRunRecord('complete');G.runTransition('complete');}else{r.routes=G.makeRouteChoices();G.runTransition('route');}return true;};
})();



'use strict';
(() => {
 const G=window.Game;
 G.makeRunRewards=()=>{
  const r=G.p.run,tier=Math.min(3,1+Math.floor((r.stage-1)/14));
  const pool=Object.values(G.items).filter(item=>(item.job===r.job||item.job==='all')&&!G.p.inventory.includes(item.id)&&Number(item.id.split('-').at(-1))<=tier&&Number(item.id.split('-').at(-1))>0).sort((a,b)=>a.id.localeCompare(b.id));
  const item=pool[Math.floor(G.runRandom(13)*pool.length)];
  const gear=item?{id:`${r.stage}:gear`,title:item.name,description:'미보유 영구 장비 획득',kind:'gear',item:item.id}:{id:`${r.stage}:materials`,title:'제작 재료 4개',description:'이 등급의 장비를 모두 보유했습니다. 재료 4개를 받습니다.',kind:'materials',value:4};
  const relics=Object.keys(G.relicCatalog||{}).filter(id=>!r.relics.includes(id)),relic=relics[Math.floor(G.runRandom(11)*relics.length)];
  return[gear,{id:`${r.stage}:heal`,title:'생명의 샘',description:'체력과 마나 완전 회복',kind:'heal'},relic?{id:`${r.stage}:relic`,title:G.relicCatalog[relic].name,description:G.relicCatalog[relic].description,kind:'relic',item:relic}:{id:`${r.stage}:attack`,title:'단풍의 힘',description:'이번 원정 공격력 +3',kind:'attack',value:3}];
 };
})();

'use strict';
(() => {
 const G=window.Game;
 const snapshot=()=>{const p=G.p;return{level:p.level,xp:p.xp,hp:p.hp,mp:p.mp,maxHp:p.maxHp,maxMp:p.maxMp};};
 const totalXP=progress=>50*(progress.level-1)+35*(progress.level-1)*(progress.level-2)/2+progress.xp;
 const start=G.startRun;
 G.startRun=(options={})=>{if(G.p.run?.active)G.leaveRun();const base=snapshot();if(!options.daily)Object.assign(G.p,{level:1,xp:0,maxHp:100,maxMp:60,hp:100,mp:60});const result=start(options);if(result&&!options.daily){Object.assign(G.p.run,{baseProgress:base,expeditionProgress:snapshot(),creditedXP:0});G.save();}return result;};
 const leave=G.leaveRun;
 G.leaveRun=()=>{const r=G.p.run;if(!r?.active)return false;const progress=snapshot(),base=r.baseProgress;const result=leave();if(result&&base){r.expeditionProgress=progress;Object.assign(G.p,base);const earned=totalXP(progress),delta=Math.max(0,earned-(r.creditedXP||0));r.creditedXP=earned;if(delta)G.gainXp(delta);r.baseProgress=snapshot();G.save();}return result;};
 const resume=G.resumeRun;
 G.resumeRun=()=>{const r=G.p.run;if(!r?.started||r.active||['complete','failed'].includes(r.phase))return false;if(r.baseProgress&&r.expeditionProgress){r.baseProgress=snapshot();Object.assign(G.p,r.expeditionProgress);}return resume();};
 const snapshotRun=G.snapshotRun;
 G.snapshotRun=()=>{snapshotRun();if(G.p.run?.active&&G.p.run.baseProgress)G.p.run.expeditionProgress=snapshot();};
})();
