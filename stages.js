'use strict';
(() => {
  const G=window.Game,copy=value=>JSON.parse(JSON.stringify(value));
  const fresh=()=>({active:false,started:false,seed:0,stage:1,phase:'battle',best:0,buffs:{attack:0,defense:0},entryLevel:1,job:'warrior',returnZone:'forest',returnX:220,enemies:[],player:null,rewards:[]});
  const newSeed=()=>{if(window.crypto?.getRandomValues){const a=new Uint32Array(1);window.crypto.getRandomValues(a);return a[0]||1;}return Math.floor(Math.random()*4294967295)+1;};
  const oldDefaults=G.defaults;
  G.defaults=()=>({...oldDefaults(),run:fresh()});G.p.run=fresh();
  const biomes=['forest','cavern','frost','twilight'],names=['단풍숲 원정','빛나는 동굴','서리 수정굴','황혼의 숲'];
  G.hasRun=()=>G.p.run.started;
  G.runInfo=()=>{const r=G.p.run,index=Math.floor((r.stage-1)/5);return {stage:r.stage,total:20,biome:biomes[index],name:names[index],boss:r.stage%5===0,remaining:(r.active?G.enemies:r.enemies).filter(e=>e.hp>0).length,phase:r.phase};};
  const arena=()=>{G.platforms=[{x:0,y:610,w:1600,h:110},{x:420,y:455,w:230,h:36},{x:1030,y:455,w:230,h:36}];G.worldWidth=1600;};
  const playerSnapshot=()=>{const p=G.p;return {x:p.x,y:p.y,hp:p.hp,mp:p.mp};};
  G.snapshotRun=()=>{const r=G.p.run;if(!r?.active)return;r.enemies=G.enemies.map(e=>({...e,dead:e.hp<=0?1:0}));r.player=playerSnapshot();};
  const oldPopulate=G.populate;
  G.populate=()=>{if(!G.p.run?.active){oldPopulate();return;}const r=G.p.run;arena();G.p.zone=['cavern','frost'].includes(G.runInfo().biome)?'cavern':'forest';G.enemies=copy(r.enemies);if(r.player)Object.assign(G.p,r.player);};
  const clearMotion=()=>{Object.assign(G.p,{vx:0,vy:0,attack:0,skill:0,cooldown:0,grounded:true,invuln:1.5});G.keys.clear();G.projectiles=[];G.effects=[];G.camera=0;};
  function enterStage(){
    const p=G.p,r=p.run,boss=r.stage%5===0;r.phase='battle';r.rewards=[];arena();p.zone=['cavern','frost'].includes(G.runInfo().biome)?'cavern':'forest';
    p.x=180;p.y=610;clearMotion();
    G.enemies=[540,850,1180].map((x,i)=>{const kind=boss&&i===2?'boss':i%2?'mushroom':'slime';const hp=Math.round((kind==='boss'?190:45)+r.entryLevel*12+r.stage*(kind==='boss'?24:7));return {x,y:610,vx:0,kind,zone:p.zone,hp,maxHp:hp,home:x,platform:0,dir:-1,timer:0,hurt:0,dead:0,phase:0,damage:Math.round((kind==='boss'?12:5)+r.entryLevel*.7+r.stage*.65)};});
    G.snapshotRun();G.save();
  }
  G.startRun=()=>{const p=G.p,prior=p.run;const returnZone=prior.active?prior.returnZone:p.zone,returnX=prior.active?prior.returnX:p.x;p.run={...fresh(),active:true,started:true,seed:newSeed(),best:prior.best,entryLevel:p.level,job:p.job,returnZone,returnX};p.hp=p.maxHp;p.mp=p.maxMp;enterStage();return true;};
  G.leaveRun=()=>{const p=G.p,r=p.run;if(!r.active)return false;G.snapshotRun();r.active=false;p.zone=r.returnZone;p.x=r.returnX;p.y=610;if(p.hp<=0){p.hp=p.maxHp;p.mp=p.maxMp;}clearMotion();G.populate();G.save();return true;};
  G.resumeRun=()=>{const r=G.p.run;if(!r.started||r.active||!['battle','reward'].includes(r.phase))return false;r.returnZone=G.p.zone;r.returnX=G.p.x;G.p.job=r.job;G.initializeGear();G.p.equipment.weapon=G.p.inventory.filter(id=>G.items[id].job===r.job&&G.items[id].slot==='weapon').sort((a,b)=>G.items[b].attack-G.items[a].attack)[0];r.active=true;clearMotion();G.populate();G.save();if(r.phase==='reward')G.openRunUI?.();return true;};
  function choices(r){
    let state=(r.seed^Math.imul(r.stage,2654435761))>>>0;const draw=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};
    const tier=Math.min(3,1+Math.floor((r.stage-1)/7)),item=draw()<.5?`armor-${Math.min(2,tier)}`:`${r.job}-${tier}`;
    const gear={id:`${r.stage}:gear`,title:G.items[item].name,description:`영구 장비 획득 · 중복은 ${G.items[item].sell} 골드`,kind:'gear',item};
    const supply=draw()<.5?{id:`${r.stage}:heal`,title:'샘물의 축복',description:'체력과 마나를 모두 회복합니다.',kind:'heal'}:{id:`${r.stage}:potions`,title:'여행자의 물약',description:'체력 물약 3개를 영구 획득합니다.',kind:'potions'};
    const kind=draw()<.5?'attack':'defense',value=kind==='attack'?6:2;
    return [gear,supply,{id:`${r.stage}:${kind}`,title:kind==='attack'?'단풍의 힘':'수정의 가호',description:`이번 원정 동안 ${kind==='attack'?'공격력':'방어력'} +${value}`,kind,value}];
  }
  G.runRewards=()=>copy(G.p.run.rewards);
  G.killRunEnemy=e=>{const p=G.p,r=p.run;if(!r.active||r.phase!=='battle'||e.dead>0)return;e.hp=0;e.dead=1;const boss=e.kind==='boss',gold=boss?90+r.stage*8:12+r.stage*2;p.gold+=gold;G.gainXp(boss?90+r.stage*5:18+r.stage*2);G.emit(e.x,e.y-40,`+${gold} GOLD`,'#f7b749');
    if(G.enemies.every(enemy=>enemy.hp<=0)){r.phase='reward';r.best=Math.max(r.best,r.stage);r.rewards=choices(r);G.projectiles=[];G.keys.clear();G.save();G.openRunUI?.();}else G.save();
  };
  G.chooseRunReward=id=>{const p=G.p,r=p.run;if(!r.active||r.phase!=='reward')return false;const choice=r.rewards.find(c=>c.id===id);if(!choice)return false;
    r.rewards=[];r.phase=r.stage===20?'complete':'battle';
    if(choice.kind==='gear')G.awardItem(choice.item);else if(choice.kind==='heal'){p.hp=p.maxHp;p.mp=p.maxMp;}else if(choice.kind==='potions')p.potions+=3;else r.buffs[choice.kind]+=choice.value;
    if(r.stage===20){r.buffs={attack:0,defense:0};G.save();G.openRunUI?.();}else{r.stage++;enterStage();}return true;
  };
  G.failRun=()=>{const r=G.p.run;if(!r.active||r.phase!=='battle')return false;r.phase='failed';r.rewards=[];r.buffs={attack:0,defense:0};G.projectiles=[];G.keys.clear();G.save();G.openRunUI?.();return true;};
  G.parseRun=data=>{
    if(data===undefined||data===null)return fresh();
    const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max,finite=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
    if(typeof data!=='object'||typeof data.active!=='boolean'||typeof data.started!=='boolean'||!integer(data.stage,1,20)||!integer(data.best,0,20))throw Error('Invalid expedition');
    if(!data.started){if(data.active)throw Error('Invalid active run');return {...fresh(),best:data.best};}
    if(!integer(data.seed,1,4294967295)||!['battle','reward','complete','failed'].includes(data.phase)||!Object.hasOwn(G.jobs,data.job)||!integer(data.entryLevel,1,10000)||!['forest','cavern'].includes(data.returnZone)||!finite(data.returnX,0,4400))throw Error('Invalid run state');
    if(!data.buffs||!integer(data.buffs.attack,0,120)||!integer(data.buffs.defense,0,40)||!Array.isArray(data.enemies)||data.enemies.length!==3||!Array.isArray(data.rewards))throw Error('Invalid run snapshot');
    const player=data.player;if(!player||!finite(player.x,0,1600)||!finite(player.y,-1000,800)||!finite(player.hp,0,200100)||!finite(player.mp,0,80060))throw Error('Invalid run player');
    for(const e of data.enemies){if(!e||!['slime','mushroom','boss'].includes(e.kind)||!['forest','cavern'].includes(e.zone)||!integer(e.platform,0,2)||!finite(e.hp,0,1000000)||!finite(e.maxHp,1,1000000)||e.hp>e.maxHp||!finite(e.x,0,1600)||!finite(e.y,0,610)||!finite(e.home,0,1600)||!finite(e.timer,0,1e12)||!finite(e.hurt,0,1)||!finite(e.phase,0,3)||!integer(e.dir,-1,1)||!finite(e.damage,1,10000)||e.dead!==(e.hp===0?1:0))throw Error('Invalid enemy');}
    if(data.enemies.filter(e=>e.kind==='boss').length!==(data.stage%5===0?1:0))throw Error('Invalid boss');
    const allDead=data.enemies.every(e=>e.hp===0);
    if((data.phase==='battle'&&allDead)||(['reward','complete'].includes(data.phase)&&!allDead)||(data.phase==='complete'&&data.stage!==20)||(data.phase==='failed'&&player.hp!==0))throw Error('Invalid phase');
    const expected=data.phase==='reward'?choices(data):[];
    if(JSON.stringify(data.rewards)!==JSON.stringify(expected))throw Error('Invalid reward choices');
    return copy(data);
  };
})();
