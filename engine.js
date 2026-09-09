'use strict';
(() => {
  const forest=[{x:0,y:610,w:4400,h:110},{x:430,y:480,w:230,h:36},{x:810,y:380,w:230,h:36},{x:1150,y:475,w:260,h:36},{x:1550,y:365,w:230,h:36},{x:1860,y:475,w:270,h:36},{x:2270,y:405,w:270,h:36},{x:2700,y:495,w:250,h:36},{x:3040,y:385,w:220,h:36}];
  const cavern=[{x:0,y:610,w:3200,h:110},{x:390,y:470,w:230,h:36},{x:800,y:370,w:210,h:36},{x:1120,y:485,w:260,h:36},{x:1550,y:395,w:230,h:36},{x:1920,y:475,w:240,h:36}];
  const defaults=()=>({x:220,y:610,vx:0,vy:0,dir:1,grounded:true,level:1,xp:0,gold:0,hp:100,maxHp:100,mp:60,maxMp:60,potions:5,kills:0,quest:0,bossDead:false,won:false,attack:0,skill:0,cooldown:0,invuln:0,job:'warrior',inventory:[],equipment:{weapon:'',armor:''},zone:'forest',caveKills:0,caveBossDead:false,caveWon:false,lootKills:0,materials:0,build:'',dodgeCooldown:0,dodgeTime:0,guard:0});
  const G=window.Game={defaults,platforms:forest,worldWidth:4400,p:defaults(),enemies:[],projectiles:[],effects:[],keys:new Set(),time:0,camera:0,width:1280,height:720,running:false,paused:false,ready:false,sound:false,saved:false};
  G.notify=()=>{};
  G.emit=(x,y,text,color='#fff9e9')=>G.effects.push({x,y,text,color,life:1.1,max:1.1});
  G.needXp=()=>50+(G.p.level-1)*35;
  G.gainXp=amount=>{const p=G.p;p.xp+=amount;while(p.xp>=G.needXp()){p.xp-=G.needXp();p.level++;p.maxHp+=20;p.maxMp+=8;p.hp=p.maxHp;p.mp=p.maxMp;G.emit(p.x,p.y-90,'LEVEL UP!','#f7b749');G.notify(`레벨 ${p.level}! 체력과 마나가 회복되었습니다.`);G.beep(800,.25);}};
  let audio;
  G.beep=(frequency,duration=.1)=>{if(!G.sound)return;try{audio ||= new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),a=audio.createGain();o.type='triangle';o.frequency.setValueAtTime(frequency,audio.currentTime);o.frequency.exponentialRampToValueAtTime(frequency/2,audio.currentTime+duration);a.gain.setValueAtTime(.06,audio.currentTime);a.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(a);a.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{G.sound=false;}};
  G.bossAwake=e=>G.p.run?.active|| (e.zone==='cavern'?G.p.caveKills>=6:G.p.quest>=1);
  G.configureMap=()=>{const cave=G.p.zone==='cavern';G.platforms=cave?cavern:forest;G.worldWidth=cave?3200:4400;};
  function spawn(x,kind='slime',platform=0){const cave=G.p.zone==='cavern',hp=kind==='boss'?(cave?850:480):(cave?100:kind==='mushroom'?65:45);G.enemies.push({x,y:G.platforms[platform].y,vx:0,kind,zone:G.p.zone,hp,maxHp:hp,home:x,platform,dir:-1,timer:0,hurt:0,dead:0,phase:0});}
  G.populate=()=>{G.configureMap();G.enemies=[];G.hazards=[];if(G.p.zone==='cavern'){[520,900,1280,1650,2040,2260].forEach(x=>spawn(x,'mushroom'));spawn(490,'mushroom',1);spawn(1210,'mushroom',3);if(!G.p.caveBossDead)spawn(2740,'boss');}else{[620,980,1370,1760,2120,2460,2860,3160].forEach((x,i)=>spawn(x,i%2?'mushroom':'slime'));spawn(520,'slime',1);spawn(1230,'mushroom',3);spawn(1930,'slime',5);if(!G.p.bossDead)spawn(3780,'boss');}};
  G.travel=zone=>{if(G.p.run?.active||!['forest','cavern'].includes(zone)||zone===G.p.zone)return false;if(zone==='cavern'&&!G.p.bossDead)return false;const p=G.p;p.zone=zone;p.x=zone==='cavern'?180:4200;p.y=610;p.vx=0;p.vy=0;p.grounded=true;p.attack=0;p.skill=0;p.invuln=2;G.projectiles=[];G.effects=[];G.keys.clear();G.camera=0;G.populate();G.save();G.notify(zone==='cavern'?'버섯 동굴에 도착했어요. 몬스터 6마리를 처치하세요.':'햇살이 머무는 숲으로 돌아왔어요.');return true;};
  G.reset=()=>{const job=G.p.job;G.p=G.defaults();G.p.job=job;G.initializeGear();G.effects=[];G.projectiles=[];G.time=0;G.camera=0;G.keys.clear();G.populate();G.save();};
  G.act=action=>{
    if(!G.running||G.paused)return;const p=G.p;
    if(p.run?.active&&action==='interact'){G.openRunUI?.();return;}
    if(p.run?.active&&p.run.phase!=='battle')return;
    if(action==='dodge'){G.dodge?.();return;}
    if(action==='jump'&&p.grounded){p.vy=-660;p.grounded=false;G.beep(400);}
    if(action==='attack'||action==='skill')G.attackAction(action==='skill');
    if(action==='potion'){if(p.potions<=0){G.notify('물약이 없어요. 숲의 루미에게 구입하세요.');return;}if(p.hp>=p.maxHp){G.notify('체력이 이미 가득 차 있어요.');return;}const restored=Math.min(G.gearTraits?.().has('herbalcloak')?100:80,p.maxHp-p.hp);p.potions--;p.hp+=restored;G.emit(p.x,p.y-80,`+${restored} HP`,'#91bd61');G.beep(720);G.save();}
    if(action==='interact'){
      if(p.zone==='forest'){if(Math.abs(p.x-230)<110)G.shop();else if(p.x>4160){if(!p.bossDead)G.notify('숲의 수호자를 먼저 물리쳐야 해요.');else{p.won=true;G.travel('cavern');}}else G.notify('루미 또는 숲 끝의 포털 가까이에서 E를 눌러주세요.');}
      else if(p.x<210)G.travel('forest');else if(p.x>2990){if(p.caveBossDead){p.caveWon=true;G.save();G.victory();}else G.notify('버섯 군주를 먼저 물리쳐야 해요.');}else G.notify('동굴 양 끝의 포털에서 E를 눌러주세요.');
    }
  };
  function kill(e){if(G.p.run?.active){G.killRunEnemy(e);return;}const p=G.p,boss=e.kind==='boss',cave=e.zone==='cavern';e.dead=boss?Infinity:9;const gold=boss?(cave?350:200):(cave?20:12);p.gold+=gold;G.gainXp(boss?(cave?300:180):(cave?35:22));G.emit(e.x,e.y-28,`+${gold} GOLD`,'#f7b749');
    if(cave){if(boss){p.caveBossDead=true;G.notify('버섯 군주를 물리쳤어요! 오른쪽 수정 포털로 가세요.');}else{p.caveKills++;if(p.caveKills===6)G.notify('동굴 깊은 곳에서 버섯 군주가 깨어났어요!');}}
    else{p.kills++;if(boss){p.bossDead=true;p.quest=2;G.notify('숲의 수호자를 물리쳤어요! 오른쪽 포털이 열렸어요.');}else if(p.quest===0&&p.kills>=8){p.quest=1;p.gold+=80;p.potions+=3;G.gainXp(120);G.notify('퀘스트 완료! 물약 3개 획득. 오른쪽 끝의 수호자를 찾아가세요.');}}
    G.dropLoot(e);G.save();
  }
  G.hitEnemy=(e,amount,options={})=>{if((G.p.run?.active&&G.p.run.phase!=='battle')||e.dead>0||e.hp<=0||(e.kind==='boss'&&!G.bossAwake(e)))return false;if(e.blocking&&!options.ignoreShield&&((G.p.x<e.x)===(e.dir<0)))amount*=.3;if(G.hasRelic?.('hunter')&&e.kind==='boss')amount*=1.2;amount=Math.max(1,Math.round(amount));e.hp=Math.max(0,e.hp-amount);e.hurt=.22;G.emit(e.x,e.y-(e.kind==='boss'?110:55),String(amount),'#fff9e9');if(e.hp<=0){if(G.hasRelic?.('heart'))G.p.hp=Math.min(G.p.maxHp,G.p.hp+4);kill(e);}else if(G.p.run?.active)G.save();return true;};
  G.update=dt=>{
    if(!G.running||G.paused||(G.p.run?.active&&G.p.run.phase!=='battle'))return;G.time+=dt;const p=G.p;
    for(const key of ['attack','skill','cooldown','invuln','dodgeCooldown','dodgeTime','guard','leechCooldown','slow'])p[key]=Math.max(0,(p[key]||0)-dt);
    p.mp=Math.min(p.maxMp,p.mp+dt*(G.hasRelic?.('spring')?7:4));p.vx=((G.keys.has('right')?1:0)-(G.keys.has('left')?1:0))*255*(G.hasRelic?.('feather')?1.12:1)*(p.slow>0?.55:1);if(p.dodgeTime>0)p.vx=p.dir*650;if(p.vx)p.dir=Math.sign(p.vx);
    if(G.keys.has('attack'))G.act('attack');
    p.x=Math.max(26,Math.min(G.worldWidth-30,p.x+p.vx*dt));const oldY=p.y;p.vy+=1700*dt;p.y+=p.vy*dt;p.grounded=false;
    for(const platform of G.platforms){if(p.vy>=0&&oldY<=platform.y+1&&p.y>=platform.y&&p.x+15>platform.x&&p.x-15<platform.x+platform.w){p.y=platform.y;p.vy=0;p.grounded=true;break;}}
    if(p.y>800){p.y=610;p.x=220;p.vy=0;}
    G.updateCombat?.(dt);if(!p.run?.active||p.run.phase==='battle')G.updateEncounter?.(dt);
    for(const effect of G.effects){effect.life-=dt;effect.y-=dt*42;}G.effects=G.effects.filter(e=>e.life>0);
  };
})();
