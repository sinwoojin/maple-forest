'use strict';
(() => {
  const G=window.Game;
  G.jobs={
    warrior:{name:'전사',attackName:'검격',skillName:'바람 베기',description:'검을 휘둘러 가까운 적들을 함께 공격합니다.',range:'근거리 · 범위',color:'#bd6137',mpCost:15},
    archer:{name:'궁수',attackName:'화살',skillName:'관통 화살',description:'멀리서 화살을 쏘고 강한 화살로 적 셋을 관통합니다.',range:'원거리 · 관통',color:'#91bd61',mpCost:18},
    mage:{name:'마법사',attackName:'마력탄',skillName:'별빛 폭발',description:'마력탄을 쏘고 주위의 적에게 별빛을 터뜨립니다.',range:'원거리 · 주변 폭발',color:'#8fc4d0',mpCost:22}
  };
  G.items={};
  const weaponNames={warrior:['여행자의 검','단풍 장검','수호자의 칼날','수정 군주의 검'],archer:['여행자의 활','단풍 장궁','수호자의 활','수정 군주의 활'],mage:['여행자의 지팡이','단풍 지팡이','수호자의 홀','수정 군주의 홀']};
  for(const job of Object.keys(G.jobs))weaponNames[job].forEach((name,tier)=>{const id=`${job}-${tier}`;G.items[id]={id,name,slot:'weapon',job,attack:[0,9,18,30][tier],defense:0,rarity:['일반','고급','희귀','영웅'][tier],sell:[5,30,70,120][tier]};});
  ['여행자의 망토','단풍 가죽옷','동굴 수정 갑옷'].forEach((name,tier)=>{const id=`armor-${tier}`;G.items[id]={id,name,slot:'armor',job:'all',attack:0,defense:[0,3,7][tier],rarity:['일반','고급','희귀'][tier],sell:[5,25,60][tier]};});
  G.initializeGear=()=>{const p=G.p;for(const id of [`${p.job}-0`,'armor-0'])if(!p.inventory.includes(id))p.inventory.push(id);if(!p.equipment.weapon)p.equipment.weapon=`${p.job}-0`;if(!p.equipment.armor)p.equipment.armor='armor-0';};
  G.equipmentStats=()=>Object.values(G.p.equipment).reduce((stats,id)=>{const item=G.items[id];if(item){stats.attack+=item.attack;stats.defense+=item.defense;}return stats;},G.p.run?.active?{...G.p.run.buffs}:{attack:0,defense:0});
  G.canChangeJob=()=>!G.p.run?.active&&(!G.running||(G.p.zone==='forest'&&Math.abs(G.p.x-230)<110));
  G.setJob=id=>{if(!Object.hasOwn(G.jobs,id))return false;if(!G.canChangeJob()){G.notify('직업은 숲의 루미 옆에서 변경할 수 있어요.');return false;}const p=G.p;p.job=id;G.initializeGear();p.equipment.weapon=p.inventory.filter(key=>G.items[key].job===id&&G.items[key].slot==='weapon').sort((a,b)=>G.items[b].attack-G.items[a].attack)[0];p.attack=0;p.skill=0;G.projectiles=[];G.save();return true;};
  G.equip=id=>{const item=G.items[id],p=G.p;if(!item||!p.inventory.includes(id)||(item.job!=='all'&&item.job!==p.job))return false;p.equipment[item.slot]=id;G.save();return true;};
  G.sell=id=>{const item=G.items[id],p=G.p;if(!item||!p.inventory.includes(id)||Object.values(p.equipment).includes(id)||id.endsWith('-0'))return false;p.inventory=p.inventory.filter(key=>key!==id);p.gold+=item.sell;G.save();return true;};
  G.awardItem=id=>{const item=G.items[id],p=G.p;if(p.inventory.includes(id)){p.gold+=item.sell;G.notify(`${item.name} 중복 획득 · ${item.sell} 골드로 교환했어요.`);}else{p.inventory.push(id);G.notify(`${item.name} 획득! 가방에서 장착하세요.`);}G.emit(p.x,p.y-110,item.name,'#f7b749');};
  G.dropLoot=e=>{if(e.kind==='boss'){G.awardItem(`${G.p.job}-${e.zone==='cavern'?3:2}`);return;}G.p.lootKills++;if(G.p.lootKills%3===0){const armor=G.p.lootKills%6===0;G.awardItem(armor?`armor-${e.zone==='cavern'?2:1}`:`${G.p.job}-1`);}};
  G.attackAction=skill=>{const p=G.p,job=G.jobs[p.job];if(p.run?.active&&p.run.phase!=='battle')return;if(p.attack>0)return;if(skill&&(p.mp<job.mpCost||p.cooldown>0)){G.notify(p.mp<job.mpCost?'마나가 부족해요. 잠시 쉬면 회복됩니다.':`${job.skillName} 준비 중이에요.`);return;}
    if(skill){p.mp-=job.mpCost;p.cooldown=p.job==='mage'?2.4:p.job==='archer'?2:1.6;p.skill=.4;}p.attack=skill?.4:.28;G.beep(skill?650:260);
    const damage=Math.round((skill?42:18)+p.level*5+G.equipmentStats().attack*(skill?1.6:1));
    if(p.job==='warrior'||(p.job==='mage'&&skill)){const reach=p.job==='mage'?235:skill?245:105;for(const e of G.enemies){const dx=e.x-p.x,dy=e.y-p.y;const inRange=p.job==='mage'?Math.hypot(dx,dy)<reach:Math.abs(dx)<reach&&dx*p.dir>-28&&Math.abs(dy)<85;if(inRange&&G.hitEnemy(e,damage)){e.x+=p.dir*(e.kind==='boss'?5:18);G.beep(500,.07);}}}
    else G.projectiles.push({x:p.x+p.dir*24,y:p.y-33,vx:p.dir*(p.job==='archer'?800:590),kind:p.job==='archer'?'arrow':'orb',life:skill?1.4:1.1,damage,pierce:skill?3:1,charged:skill,hit:new Set()});
  };
  const numeric=['level','xp','gold','hp','mp','potions','kills','quest'];
  G.save=()=>{try{const p=G.p,data={version:3};G.snapshotRun?.();if(p.run)data.run=p.run;for(const key of [...numeric,'bossDead','won','job','inventory','equipment','zone','caveKills','caveBossDead','caveWon','lootKills'])data[key]=p[key];localStorage.setItem('maple-forest-v1',JSON.stringify(data));G.saved=true;return true;}catch{G.saved=false;return false;}};
  G.load=()=>{try{const raw=localStorage.getItem('maple-forest-v1');if(!raw)return false;const d=JSON.parse(raw);if(!d||![1,2,3].includes(d.version))return false;const p=G.defaults();
    for(const key of numeric){if(!Number.isFinite(d[key])||d[key]<0)return false;p[key]=Math.floor(d[key]);}
    if(p.level<1||p.level>10000||p.quest>2||p.xp>=50+(p.level-1)*35)return false;
    p.maxHp=100+(p.level-1)*20;p.maxMp=60+(p.level-1)*8;p.hp=Math.min(p.maxHp,Math.max(1,p.hp));p.mp=Math.min(p.maxMp,p.mp);p.bossDead=d.bossDead===true;p.won=d.won===true;
    if(d.version>=2){if(!Object.hasOwn(G.jobs,d.job)||!['forest','cavern'].includes(d.zone)||!Array.isArray(d.inventory)||d.inventory.some(id=>typeof id!=='string'||!Object.hasOwn(G.items,id))||!d.equipment)return false;
      p.job=d.job;p.zone=d.zone;p.inventory=[...new Set(d.inventory)];
      for(const slot of ['weapon','armor']){const id=d.equipment[slot],item=G.items[id];if(!item||item.slot!==slot||!p.inventory.includes(id)||(item.job!=='all'&&item.job!==p.job))return false;p.equipment[slot]=id;}
      for(const key of ['caveKills','lootKills']){if(!Number.isSafeInteger(d[key])||d[key]<0)return false;p[key]=d[key];}
      p.caveBossDead=d.caveBossDead===true;p.caveWon=d.caveWon===true;if(p.zone==='cavern'&&!p.bossDead)p.zone='forest';
    }else p.lootKills=p.kills;
    if(G.parseRun)p.run=G.parseRun(d.version===3?d.run:undefined);
    G.p=p;G.initializeGear();p.x=p.zone==='cavern'?180:220;G.projectiles=[];G.effects=[];G.populate();G.saved=true;return true;
  }catch{return false;}};
  G.initializeGear();G.populate();
})();
