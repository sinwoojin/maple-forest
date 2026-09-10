'use strict';
(() => {
 const G=window.Game,phases=['battle','route','event','shop','rest','reward','complete','failed'],types=['defeat','survival','escort','defense','boss','elite'];
 const number=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
 const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
 const array=(v,max)=>Array.isArray(v)&&v.length<=max;
 const safe=(v,depth=0)=>{if(depth>12)throw Error('Run nesting limit');if(v===null||typeof v==='boolean')return;if(typeof v==='number'){if(!number(v,-Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER))throw Error('Invalid run number');return;}if(typeof v==='string'){if(v.length>2000)throw Error('Invalid run text');return;}if(typeof v!=='object')throw Error('Invalid run value');if(Array.isArray(v)){if(v.length>1000)throw Error('Run array limit');v.forEach(x=>safe(x,depth+1));return;}for(const [k,x]of Object.entries(v)){if(['__proto__','prototype','constructor'].includes(k))throw Error('Unsafe run key');safe(x,depth+1);}};
 const requireValid=(test,message)=>{if(!test)throw Error(message);};
 G.parseRun=raw=>{
 if(raw===undefined||raw===null)return G.freshRun();safe(raw);requireValid(typeof raw==='object'&&!Array.isArray(raw),'Invalid expedition');
 if(raw.version!==4){requireValid(raw.version===undefined&&typeof raw.active==='boolean'&&typeof raw.started==='boolean'&&integer(raw.stage,1,20)&&integer(raw.best,0,20),'Invalid legacy run');return{...G.freshRun(),best:Math.min(40,raw.best*2),migrationNotice:'이전 원정은 새 경로의 시작점으로 옮겼습니다. 장비와 성장 기록은 유지됩니다.'};}
 const r=G.runCopy(raw);requireValid(typeof r.active==='boolean'&&typeof r.started==='boolean'&&integer(r.stage,1,40)&&integer(r.best,0,40),'Invalid run progress');
 if(!r.started){requireValid(!r.active,'Invalid inactive expedition');return{...G.freshRun(),best:r.best,migrationNotice:r.migrationNotice||''};}
 requireValid(integer(r.seed,1,4294967295)&&phases.includes(r.phase)&&Object.hasOwn(G.jobs,r.job)&&integer(r.entryLevel,1,10000)&&['forest','cavern'].includes(r.returnZone)&&number(r.returnX,0,4400),'Invalid run state');
 requireValid(number(r.elapsedSeconds,0,1e9)&&typeof r.daily==='boolean'&&typeof r.recorded==='boolean'&&types.includes(r.nodeType)&&integer(r.wave,1,1000)&&number(r.waveClock,0,1e9),'Invalid run clock');
 requireValid(r.buffs&&integer(r.buffs.attack,0,10000)&&integer(r.buffs.defense,0,10000),'Invalid run buffs');
 requireValid(typeof r.build==='string'&&(!r.build||G.buildOptions(r.job).some(b=>b.id===r.build))&&array(r.relics,100)&&r.relics.every(id=>Object.hasOwn(G.relicCatalog||{},id))&&new Set(r.relics).size===r.relics.length,'Invalid build');
 requireValid(array(r.enemies,1000)&&array(r.rewards,3)&&array(r.routes,3)&&array(r.choices,40)&&array(r.events,40)&&array(r.shop,3)&&array(r.gearGained,40)&&r.gearGained.every(id=>Object.hasOwn(G.items,id)),'Invalid collections');
 requireValid(r.player&&number(r.player.x,0,1600)&&number(r.player.y,-1000,800)&&number(r.player.hp,0,1e7)&&number(r.player.mp,0,1e7),'Invalid player snapshot');
 for(const e of r.enemies)requireValid(e&&['slime','mushroom','boss'].includes(e.kind)&&number(e.hp,0,1e7)&&number(e.maxHp,1,1e7)&&e.hp<=e.maxHp&&number(e.x,-500,2100)&&number(e.y,-1000,900)&&integer(e.platform,0,2)&&number(e.dead,0,1e6),'Invalid enemy snapshot');
 const o=r.objective;requireValid(o&&o.type===r.nodeType&&typeof o.label==='string'&&number(o.target,1,2000)&&number(o.current,0,3000)&&number(o.remaining,0,2000)&&number(o.x,0,1600)&&number(o.health,0,100)&&number(o.timeLeft,0,300),'Invalid objective');
 for(const c of r.routes)requireValid(c&&c.id===`${r.stage+1}:${c.type}`&&[...types,'event','shop','rest'].includes(c.type),'Invalid route offer');
 if(r.phase==='route')requireValid(r.stage<40&&r.routes.length>0,'Missing route');
 if(r.phase==='reward')requireValid(r.rewards.length===3,'Missing reward');else requireValid(r.rewards.length===0,'Unexpected reward');
 for(const c of r.rewards){requireValid(c&&c.id===`${r.stage}:${c.kind}`&&['gear','heal','relic','attack','materials'].includes(c.kind),'Invalid reward');if(c.kind==='gear')requireValid(Object.hasOwn(G.items,c.item),'Invalid gear reward');if(c.kind==='relic')requireValid(Object.hasOwn(G.relicCatalog||{},c.item),'Invalid relic reward');if(c.kind==='materials')requireValid(c.value===4,'Invalid material reward');if(c.kind==='attack')requireValid(c.value===3,'Invalid attack reward');}
 r.event=G.parseEventSnapshot(r.event);
 if(r.phase==='event')requireValid(r.event!==null,'Missing event');
 const shopRules={potions:{suffix:'potion',cost:45,value:3},attack:{suffix:'forge',cost:80,value:4},defense:{suffix:'ward',cost:65,value:2}};
 for(const c of r.shop){const rule=shopRules[c.kind];requireValid(rule&&c.id===`${r.stage}:${rule.suffix}`&&c.cost===rule.cost&&c.value===rule.value&&(c.bought===undefined||typeof c.bought==='boolean'),'Invalid shop');}
 requireValid(new Set(r.shop.map(c=>c.id)).size===r.shop.length,'Duplicate shop offers');
 requireValid(typeof r.restUsed==='boolean'&&(r.phase!=='complete'||r.stage===40),'Invalid terminal state');
 if(r.dailyReturn){requireValid(r.daily&&r.active&&typeof G.parseDailyReturn==='function','Invalid daily return');r.dailyReturn=G.parseDailyReturn(r.dailyReturn);}
  if(r.baseProgress!==undefined||r.expeditionProgress!==undefined){
  requireValid(!r.daily&&r.baseProgress&&r.expeditionProgress&&number(r.creditedXP,0,2e9),'Invalid expedition progression');
  for(const progress of [r.baseProgress,r.expeditionProgress])requireValid(integer(progress.level,1,10000)&&integer(progress.xp,0,50+(progress.level-1)*35-1)&&progress.maxHp===100+(progress.level-1)*20&&progress.maxMp===60+(progress.level-1)*8&&number(progress.hp,0,progress.maxHp)&&number(progress.mp,0,progress.maxMp),'Invalid resource progression');
 }
 if(r.combat!==null&&r.combat!==undefined){requireValid(typeof G.parseCombat==='function','Unknown combat snapshot');r.combat=G.parseCombat(r.combat,r.enemies.length);}return r;
 };
})();
