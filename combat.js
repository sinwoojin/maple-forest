'use strict';
(() => {
 const G=window.Game;G.hazards=[];
 G.dodge=()=>{const p=G.p;if(p.dodgeCooldown>0)return false;p.dodgeCooldown=G.hasRelic('feather')?1.3:2;p.dodgeTime=.22;p.invuln=Math.max(p.invuln,.35);if(G.gearTraits().has('froststep'))for(const e of G.enemies)if(Math.abs(e.x-p.x)<170)e.slow=(e.slow||0)+1.2;G.emit(p.x,p.y-70,'회피','#8fc4d0');return true;};
 G.damagePlayer=(amount,source={x:G.p.x,cause:'enemy'})=>{
  const p=G.p;if(!G.running||G.paused||p.invuln>0||(p.run?.active&&p.run.phase!=='battle'))return false;
  if(p.guard>0){p.invuln=.3;G.emit(p.x,p.y-65,'방어 · 반격','#91bd61');for(const e of G.enemies)if(Math.abs(e.x-p.x)<200)G.hitEnemy(e,32);return false;}
  const hit=Math.max(1,Math.round((amount-G.equipmentStats().defense)*(G.hasRelic('shell')?.8:1)));p.hp=Math.max(0,p.hp-hit);p.invuln=.8;p.vy=-180;G.emit(p.x,p.y-70,`-${hit}`,'#e986a5');G.onRunDamage?.(hit,source);
  if(G.hasRelic('thorn'))for(const e of G.enemies)if(Math.abs(e.x-p.x)<180)G.hitEnemy(e,24);
  if(p.run?.active){if(p.hp<=0)G.failRun(source.label||source.cause||'enemy');else G.save();return true;}
  if(p.hp<=0){p.zone='forest';p.x=220;p.y=610;p.vx=0;p.vy=0;p.hp=p.maxHp;p.mp=p.maxMp;p.invuln=3;G.projectiles=[];G.hazards=[];G.populate();G.notify('루미가 구해줬어요. 마을에서 다시 출발합니다.');G.save();}return true;
 };
 G.attackAction=skill=>{
  const p=G.p,job=G.jobs[p.job],build=G.currentBuild(),traits=G.gearTraits(),cost=job.mpCost+(traits.has('lungeblade')||traits.has('emberwand')?5:0);if(!G.running||G.paused||(p.run?.active&&p.run.phase!=='battle')||(p.attack>0&&(!skill||p.skill>0)))return;
  if(skill&&(p.mp<cost||p.cooldown>0))return;
  if(skill){p.mp-=cost;p.cooldown=(p.job==='mage'?2.4:p.job==='archer'?2:1.6)*(G.hasRelic('hourglass')?.75:1);p.skill=.4;if(build==='counter')p.guard=1.4;if(traits.has('parryblade'))p.guard=(p.guard||0)+.5;if(traits.has('spiritarrow'))p.cooldown*=1.2;if(traits.has('lungeblade')){p.x=Math.max(30,Math.min(G.worldWidth-30,p.x+p.dir*70));p.invuln=Math.max(p.invuln,.2);}}
  p.attack=(skill?.4:.28)*(build==='heavy'?1.6:1);G.beep(skill?650:260);
  let damage=Math.round((skill?42:18)+p.level*5+G.equipmentStats().attack*(skill?1.6:1));
  if(build==='mana'&&skill&&p.mp>=10){p.mp-=10;damage=Math.round(damage*1.7);}
  if(p.job==='warrior'||(p.job==='mage'&&skill)){
   const reach=(p.job==='mage'?235:skill?245:105)+(traits.has('longblade')?30:0);
   for(const e of G.enemies){const dx=e.x-p.x,dy=e.y-p.y;const inRange=p.job==='mage'?Math.hypot(dx,dy)<reach:Math.abs(dx)<reach&&dx*p.dir>-28&&Math.abs(dy)<85;if(inRange&&G.buildHit(e,damage,skill))e.x+=p.dir*(e.kind==='boss'?5:18);}
   if((build==='burn'||traits.has('emberwand'))&&skill)G.hazards.push({x:p.x,y:p.y,radius:230,life:3,type:'friendlyFire',damage:8,tick:0,warning:false});
  }else{const offsets=build==='multishot'?[-20,0,20]:[0];for(const offset of offsets)G.projectiles.push({x:p.x+p.dir*24,y:p.y-33+offset,vx:p.dir*(p.job==='archer'?800:590),kind:p.job==='archer'?'arrow':'orb',life:skill?1.4:1.1,damage:damage*(build==='multishot'?.55:1),pierce:(build==='pierce'?skill?6:3:skill?3:1)+(traits.has('drillarrow')?1:0),charged:skill,hit:new Set()});}
 };
 function resolve(h){
  const e=h.owner;if(e?.dead>0)return;
  if(h.onResolve==='projectile'){G.hazards.push({x:h.x,y:h.y,vx:h.vx,radius:14,damage:h.damage,life:3,type:'enemyProjectile',warning:false});return;}
  if(h.onResolve==='summon'){G.enemies.push(G.spawnEnemy({x:h.x,y:610,kind:'slime',role:h.summonRole||'charger',zone:e.zone,hp:Math.round(e.maxHp*.12),damage:8,summoned:true,stage:e.stage}));return;}
  if(h.onResolve==='charge')e.charging=.55;
  if(h.onResolve==='bossCharge')e.x=Math.max(40,Math.min(G.worldWidth-40,h.x));
  if(h.onResolve==='leap'){e.x=h.x;e.leap=1;}
  const p=G.p;if(Math.abs(p.x-h.x)<h.radius&&Math.abs(p.y-h.y)<(h.groundOnly?25:90)){if(G.damagePlayer(h.damage,h)&&h.slowPlayer)p.slow=h.slowPlayer;}
  G.emit(h.x,h.y-40,h.label,'#e986a5');
 }
 G.updateCombat=dt=>{
  if(!G.running||G.paused||(G.p.run?.active&&G.p.run.phase!=='battle'))return;
  for(const shot of G.projectiles){const oldX=shot.x;shot.x+=shot.vx*dt;shot.life-=dt;shot.hit||=new Set();for(const e of G.enemies){if(shot.life<=0||shot.hit.has(e)||e.dead>0)continue;const radius=e.kind==='boss'?55:28;if(Math.max(oldX,shot.x)>=e.x-radius&&Math.min(oldX,shot.x)<=e.x+radius&&Math.abs(shot.y-(e.y-32))<(e.kind==='boss'?75:36)){const life=shot.life;shot.hit.add(e);if(--shot.pierce<=0)shot.life=0;if(!G.buildHit(e,shot.damage,shot.charged)){shot.hit.delete(e);shot.pierce++;shot.life=life;}}}}
  G.projectiles=G.projectiles.filter(s=>s.life>0&&s.x>-80&&s.x<G.worldWidth+80);
  for(const e of [...G.enemies]){
   if(G.p.run?.active&&G.p.run.phase!=='battle')break;e.hurt=Math.max(0,(e.hurt||0)-dt);
   if(e.dead>0){if(!G.p.run?.active){e.dead-=dt;if(e.dead<=0){e.hp=e.maxHp;e.x=e.home;e.timer=0;}}continue;}
   if(e.kind==='boss'&&!G.bossAwake(e))continue;
   for(const key of ['stun','slow','mark','burn','bleed'])e[key]=Math.max(0,(e[key]||0)-dt);
   e.dotTick=(e.dotTick||0)+dt;if(e.dotTick>=.5){e.dotTick=0;if(e.burn>0)G.hitEnemy(e,5);if(e.bleed>0)G.hitEnemy(e,3*(e.bleedStacks||1));}
   if(e.hp<=0)continue;e.timer=(e.timer||0)+dt;e.telegraph=null;
   if(e.kind==='boss')G.updateBossAI(e,dt);else G.updateEnemyAI(e,dt);
   const plat=G.platforms[e.platform||0]||G.platforms[0];e.x=Math.max(plat.x+25,Math.min(plat.x+plat.w-25,e.x));if(!(e.leap>0))e.y=plat.y;
   if(e.stun<=0&&Math.abs(G.p.x-e.x)<(e.kind==='boss'?62:30)&&Math.abs(G.p.y-e.y)<(e.kind==='boss'?80:38))G.damagePlayer(e.damage||9,e);
  }
  for(const h of [...G.hazards]){
   if(G.p.run?.active&&G.p.run.phase!=='battle')break;h.life-=dt;
   if(h.warning){if(h.owner)h.owner.telegraph={x:h.x,y:h.y,radius:h.radius,life:h.life,type:h.type,label:h.label};if(h.life<=0)resolve(h);}
   else if(h.type==='enemyProjectile'){const oldX=h.x;h.x+=h.vx*dt;if(Math.min(oldX,h.x)-18<G.p.x&&Math.max(oldX,h.x)+18>G.p.x&&Math.abs(h.y-(G.p.y-30))<38){h.life=0;G.damagePlayer(h.damage,h);}}
   else if(h.type==='friendlyFire'){h.tick-=dt;if(h.tick<=0){h.tick=.5;for(const e of G.enemies)if(Math.abs(e.x-h.x)<h.radius)G.hitEnemy(e,h.damage);}}
  }
  G.hazards=G.hazards.filter(h=>h.life>0&&!(h.owner?.dead>0));
 };
})();


(() => {
 const G=window.Game;
 const timers=['attack','skill','cooldown','invuln','dodgeCooldown','dodgeTime','guard','leechCooldown','slow','combo'];
 const hazardTypes=['charge','arrow','bash','leap','bomb','summon','pulse','ambush','root','crystal','shockwave','ice','blizzard','rift','darkbolt','eclipse','enemyProjectile','friendlyFire'];
 const resolutions=['projectile','summon','charge','bossCharge','leap'];
 const numeric={x:[-1e5,1e5],y:[-1e4,1e4],radius:[0,2000],width:[0,4000],height:[0,4000],life:[0,60],max:[0,60],damage:[0,1e7],vx:[-5000,5000],tick:[-1,60],slowPlayer:[0,60]};
 const valid=(ok)=>{if(!ok)throw Error('Invalid combat snapshot');};
 const number=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
 const index=(v,count)=>Number.isInteger(v)&&v>=0&&v<count;
 G.parseCombat=(raw,enemyCount)=>{
  if(raw===undefined||raw===null)return null;
  valid(raw&&typeof raw==='object'&&!Array.isArray(raw)&&raw.version===1);
  valid(Array.isArray(raw.hazards)&&raw.hazards.length<=500&&Array.isArray(raw.projectiles)&&raw.projectiles.length<=500);
  valid(raw.player&&typeof raw.player==='object');const player={};
  for(const key of timers){valid(number(raw.player[key],0,key==='combo'?1e9:60));player[key]=raw.player[key];}
  for(const key of ['vx','vy']){valid(number(raw.player[key],-5000,5000));player[key]=raw.player[key];}
  valid([-1,1].includes(raw.player.dir)&&typeof raw.player.grounded==='boolean');player.dir=raw.player.dir;player.grounded=raw.player.grounded;
  const hazards=raw.hazards.map(h=>{
   valid(h&&typeof h==='object'&&hazardTypes.includes(h.type)&&typeof h.warning==='boolean');const out={type:h.type,warning:h.warning};
   for(const [key,[min,max]]of Object.entries(numeric))if(h[key]!==undefined){valid(number(h[key],min,max));out[key]=h[key];}
   for(const key of ['x','y','radius','life','damage'])valid(out[key]!==undefined);
   if(h.ownerIndex!==undefined){valid(index(h.ownerIndex,enemyCount));out.ownerIndex=h.ownerIndex;}
   if(h.onResolve!==undefined){valid(resolutions.includes(h.onResolve)&&out.ownerIndex!==undefined);out.onResolve=h.onResolve;}
   if(h.summonRole!==undefined){valid(G.enemyRoles.includes(h.summonRole));out.summonRole=h.summonRole;}
   if(h.groundOnly!==undefined){valid(typeof h.groundOnly==='boolean');out.groundOnly=h.groundOnly;}
   if(h.shape!==undefined){valid(['rect','circle'].includes(h.shape));out.shape=h.shape;}
   if(h.label!==undefined){valid(typeof h.label==='string'&&h.label.length<=80);out.label=h.label;}
   if(h.type==='enemyProjectile')valid(out.vx!==undefined);
   if(h.type==='friendlyFire')valid(out.tick!==undefined);
   return out;
  });
  const projectiles=raw.projectiles.map(s=>{
   valid(s&&['arrow','orb'].includes(s.kind)&&typeof s.charged==='boolean'&&Number.isInteger(s.pierce)&&s.pierce>=0&&s.pierce<=20);
   const out={kind:s.kind,charged:s.charged,pierce:s.pierce};
   for(const key of ['x','y','vx','life','damage']){const [min,max]=numeric[key];valid(number(s[key],min,max));out[key]=s[key];}
   valid(Array.isArray(s.hitIndices)&&s.hitIndices.length<=enemyCount&&s.hitIndices.every(i=>index(i,enemyCount)));out.hitIndices=[...new Set(s.hitIndices)];return out;
  });
  return {version:1,player,hazards,projectiles};
 };
 G.snapshotCombat=()=>{
  const player={};for(const key of timers)player[key]=G.p[key]||0;for(const key of ['vx','vy','dir','grounded'])player[key]=G.p[key];
  const hazards=G.hazards.filter(h=>h.life>0&&!(h.owner?.dead>0)).map(h=>{const {owner,...data}=h;if(owner)data.ownerIndex=G.enemies.indexOf(owner);return data;});
  const projectiles=G.projectiles.filter(s=>s.life>0).map(s=>{const {hit,...data}=s;data.hitIndices=[...(hit||[])].map(e=>G.enemies.indexOf(e)).filter(i=>i>=0);return data;});
  return {version:1,player,hazards,projectiles};
 };
 G.restoreCombat=raw=>{
  const state=G.parseCombat(raw,G.enemies.length);G.hazards=[];G.projectiles=[];if(!state)return;
  Object.assign(G.p,state.player);
  G.hazards=state.hazards.map(h=>{const {ownerIndex,...data}=h;if(ownerIndex!==undefined)data.owner=G.enemies[ownerIndex];return data;});
  G.projectiles=state.projectiles.map(s=>{const {hitIndices,...data}=s;data.hit=new Set(hitIndices.map(i=>G.enemies[i]));return data;});
 };
})();
