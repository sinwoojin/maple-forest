'use strict';
(() => {
  const forest=[{x:0,y:610,w:4400,h:110},{x:430,y:480,w:230,h:36},{x:810,y:380,w:230,h:36},{x:1150,y:475,w:260,h:36},{x:1550,y:365,w:230,h:36},{x:1860,y:475,w:270,h:36},{x:2270,y:405,w:270,h:36},{x:2700,y:495,w:250,h:36},{x:3040,y:385,w:220,h:36}];
  const cavern=[{x:0,y:610,w:3200,h:110},{x:390,y:470,w:230,h:36},{x:800,y:370,w:210,h:36},{x:1120,y:485,w:260,h:36},{x:1550,y:395,w:230,h:36},{x:1920,y:475,w:240,h:36}];
  const defaults=()=>({x:220,y:610,vx:0,vy:0,dir:1,grounded:true,level:1,xp:0,gold:0,hp:100,maxHp:100,mp:60,maxMp:60,potions:5,kills:0,quest:0,bossDead:false,won:false,attack:0,skill:0,cooldown:0,invuln:0,job:'warrior',inventory:[],equipment:{weapon:'',armor:''},zone:'forest',caveKills:0,caveBossDead:false,caveWon:false,lootKills:0});
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
  G.populate=()=>{G.configureMap();G.enemies=[];if(G.p.zone==='cavern'){[520,900,1280,1650,2040,2260].forEach(x=>spawn(x,'mushroom'));spawn(490,'mushroom',1);spawn(1210,'mushroom',3);if(!G.p.caveBossDead)spawn(2740,'boss');}else{[620,980,1370,1760,2120,2460,2860,3160].forEach((x,i)=>spawn(x,i%2?'mushroom':'slime'));spawn(520,'slime',1);spawn(1230,'mushroom',3);spawn(1930,'slime',5);if(!G.p.bossDead)spawn(3780,'boss');}};
  G.travel=zone=>{if(G.p.run?.active||!['forest','cavern'].includes(zone)||zone===G.p.zone)return false;if(zone==='cavern'&&!G.p.bossDead)return false;const p=G.p;p.zone=zone;p.x=zone==='cavern'?180:4200;p.y=610;p.vx=0;p.vy=0;p.grounded=true;p.attack=0;p.skill=0;p.invuln=2;G.projectiles=[];G.effects=[];G.keys.clear();G.camera=0;G.populate();G.save();G.notify(zone==='cavern'?'버섯 동굴에 도착했어요. 몬스터 6마리를 처치하세요.':'햇살이 머무는 숲으로 돌아왔어요.');return true;};
  G.reset=()=>{const job=G.p.job;G.p=G.defaults();G.p.job=job;G.initializeGear();G.effects=[];G.projectiles=[];G.time=0;G.camera=0;G.keys.clear();G.populate();G.save();};
  G.act=action=>{
    if(!G.running||G.paused)return;const p=G.p;
    if(p.run?.active&&action==='interact'){G.openRunUI?.();return;}
    if(p.run?.active&&p.run.phase!=='battle')return;
    if(action==='jump'&&p.grounded){p.vy=-660;p.grounded=false;G.beep(400);}
    if(action==='attack'||action==='skill')G.attackAction(action==='skill');
    if(action==='potion'){if(p.potions<=0){G.notify('물약이 없어요. 숲의 루미에게 구입하세요.');return;}if(p.hp>=p.maxHp){G.notify('체력이 이미 가득 차 있어요.');return;}const restored=Math.min(80,p.maxHp-p.hp);p.potions--;p.hp+=restored;G.emit(p.x,p.y-80,`+${restored} HP`,'#91bd61');G.beep(720);G.save();}
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
  G.hitEnemy=(e,amount)=>{if((G.p.run?.active&&G.p.run.phase!=='battle')||e.dead>0||e.hp<=0||(e.kind==='boss'&&!G.bossAwake(e)))return false;e.hp=Math.max(0,e.hp-amount);e.hurt=.22;G.emit(e.x,e.y-(e.kind==='boss'?110:55),String(amount),'#fff9e9');if(e.hp<=0)kill(e);else if(G.p.run?.active)G.save();return true;};
  function damage(amount,e){const p=G.p;if(p.invuln>0||(p.run?.active&&p.run.phase!=='battle'))return;const hit=Math.max(1,amount-G.equipmentStats().defense);p.hp=Math.max(0,p.hp-hit);p.invuln=1.2;p.vy=-230;p.x+=p.x<e.x?-24:24;G.emit(p.x,p.y-70,`-${hit}`,'#e986a5');G.beep(120,.15);if(p.run?.active){if(p.hp<=0)G.failRun();else G.save();return;}if(p.hp<=0){p.zone='forest';p.x=220;p.y=610;p.vx=0;p.vy=0;p.hp=p.maxHp;p.mp=p.maxMp;p.invuln=3;G.projectiles=[];G.populate();G.notify('루미가 구해줬어요. 마을에서 다시 출발합니다.');G.save();}}
  G.update=dt=>{
    if(!G.running||G.paused||(G.p.run?.active&&G.p.run.phase!=='battle'))return;G.time+=dt;const p=G.p;
    for(const key of ['attack','skill','cooldown','invuln'])p[key]=Math.max(0,p[key]-dt);
    p.mp=Math.min(p.maxMp,p.mp+dt*4);p.vx=((G.keys.has('right')?1:0)-(G.keys.has('left')?1:0))*255;if(p.vx)p.dir=Math.sign(p.vx);
    if(G.keys.has('attack'))G.act('attack');
    p.x=Math.max(26,Math.min(G.worldWidth-30,p.x+p.vx*dt));const oldY=p.y;p.vy+=1700*dt;p.y+=p.vy*dt;p.grounded=false;
    for(const platform of G.platforms){if(p.vy>=0&&oldY<=platform.y+1&&p.y>=platform.y&&p.x+15>platform.x&&p.x-15<platform.x+platform.w){p.y=platform.y;p.vy=0;p.grounded=true;break;}}
    if(p.y>800){p.y=610;p.x=220;p.vy=0;}
    for(const shot of G.projectiles){const oldX=shot.x;shot.x+=shot.vx*dt;shot.life-=dt;
      for(const e of G.enemies){if(shot.life<=0||shot.hit.has(e)||e.dead>0)continue;const radius=e.kind==='boss'?55:28;
        if(Math.max(oldX,shot.x)>=e.x-radius&&Math.min(oldX,shot.x)<=e.x+radius&&Math.abs(shot.y-(e.y-32))<(e.kind==='boss'?75:36)&&G.hitEnemy(e,shot.damage)){shot.hit.add(e);shot.pierce--;if(shot.pierce<=0)shot.life=0;}}
    }
    G.projectiles=G.projectiles.filter(s=>s.life>0&&s.x>-80&&s.x<G.worldWidth+80);
    for(const e of G.enemies){if(p.run?.active&&p.run.phase!=='battle')break;e.hurt=Math.max(0,e.hurt-dt);if(e.dead>0){if(p.run?.active)continue;e.dead-=dt;if(e.dead<=0){e.hp=e.maxHp;e.x=e.home;e.timer=0;}continue;}const boss=e.kind==='boss';if(boss&&!G.bossAwake(e))continue;
      e.timer+=dt;const speed=boss?75:e.zone==='cavern'?52:40,plat=G.platforms[e.platform];if(Math.abs(p.x-e.x)<(boss?420:230)&&Math.abs(p.y-e.y)<80)e.dir=Math.sign(p.x-e.x)||e.dir;
      e.x+=e.dir*speed*dt;if(e.x<Math.max(plat.x+25,e.home-150)){e.x=Math.max(plat.x+25,e.home-150);e.dir=1;}if(e.x>Math.min(plat.x+plat.w-25,e.home+150)){e.x=Math.min(plat.x+plat.w-25,e.home+150);e.dir=-1;}
      if(boss){e.phase=e.timer%3;if(e.phase>2.3&&e.phase<2.5&&Math.abs(p.x-e.x)<170&&p.grounded)damage(e.damage?e.damage+8:e.zone==='cavern'?36:25,e);}
      if(Math.abs(p.x-e.x)<(boss?66:34)&&Math.abs(p.y-e.y)<(boss?80:38))damage(e.damage|| (boss?(e.zone==='cavern'?28:20):(e.zone==='cavern'?14:9)),e);
      if(p.zone!==e.zone)break;
    }
    for(const effect of G.effects){effect.life-=dt;effect.y-=dt*42;}G.effects=G.effects.filter(e=>e.life>0);
  };
})();
