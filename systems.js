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
  G.equipmentStats=()=>Object.values(G.p.equipment).reduce((stats,id)=>{const item=G.items[id];if(item){stats.attack+=item.attack;stats.defense+=item.defense;}return stats;},G.p.run?.active?{attack:G.p.run.buffs?.attack||0,defense:G.p.run.buffs?.defense||0}:{attack:0,defense:0});
  G.canChangeJob=()=>!G.p.run?.active&&(!G.running||(G.p.zone==='forest'&&Math.abs(G.p.x-230)<110));
  G.setJob=id=>{if(!Object.hasOwn(G.jobs,id))return false;if(!G.canChangeJob()){G.notify('직업은 숲의 루미 옆에서 변경할 수 있어요.');return false;}const p=G.p;p.job=id;p.build=undefined;G.initializeGear();p.equipment.weapon=p.inventory.filter(key=>G.items[key].job===id&&G.items[key].slot==='weapon').sort((a,b)=>G.items[b].attack-G.items[a].attack)[0];p.attack=0;p.skill=0;G.projectiles=[];G.save();return true;};
  G.equip=id=>{const item=G.items[id],p=G.p;if(!item||!p.inventory.includes(id)||(item.job!=='all'&&item.job!==p.job))return false;p.equipment[item.slot]=id;G.save();return true;};
  G.sell=id=>{const item=G.items[id],p=G.p;if(!item||!p.inventory.includes(id)||Object.values(p.equipment).includes(id)||id.endsWith('-0'))return false;p.inventory=p.inventory.filter(key=>key!==id);p.gold+=item.sell;G.save();return true;};
  G.awardItem=id=>{const item=G.items[id],p=G.p;if(!item)return false;if(p.inventory.includes(id)){p.gold+=item.sell;G.notify(`${item.name} 중복 획득 · ${item.sell} 골드로 교환했어요.`);}else{p.inventory.push(id);G.notify(`${item.name} 획득! 가방에서 장착하세요.`);}G.emit(p.x,p.y-110,item.name,'#f7b749');};
  G.dropLoot=e=>{if(e.kind==='boss'){G.awardItem(`${G.p.job}-${e.zone==='cavern'?3:2}`);return;}G.p.lootKills++;if(G.p.lootKills%3===0){const armor=G.p.lootKills%6===0;G.awardItem(armor?`armor-${e.zone==='cavern'?2:1}`:`${G.p.job}-1`);}};
  G.save=()=>false;G.load=()=>false;
  G.compareItem=id=>{const item=G.items[id];if(!item)return null;const current=G.items[G.p.equipment[item.slot]];return {item,current,attack:item.attack-(current?.attack||0),defense:item.defense-(current?.defense||0),equipped:current?.id===id,canEquip:item.job==='all'||item.job===G.p.job,canSell:!Object.values(G.p.equipment).includes(id)&&!id.endsWith('-0'),materials:Math.max(1,Math.floor(item.sell/15))};};
  G.dismantle=id=>{const item=G.items[id],p=G.p;if(!item||!p.inventory.includes(id)||Object.values(p.equipment).includes(id)||id.endsWith('-0'))return false;p.inventory=p.inventory.filter(key=>key!==id);p.materials=(p.materials||0)+Math.max(1,Math.floor(item.sell/15));G.save();return true;};
  for(const item of Object.values(G.items)){item.tags=item.slot==='armor'?['defense']:['attack',item.job];item.description=item.slot==='armor'?`받는 피해 ${item.defense} 감소`:`공격력 +${item.attack} · 기술에 1.6배 적용`;}
  const traits={
   'warrior-1':{id:'longblade',text:'검격 범위 +30 · 출혈 적에게 접근하기 쉬움'},
   'warrior-2':{id:'parryblade',text:'기술 후 0.5초 방어 · 반격 빌드는 방어 0.5초 연장'},
   'warrior-3':{id:'lungeblade',text:'기술 사용 시 전방 70 이동과 0.2초 무적 · 마나 5 추가 소모'},
   'archer-1':{id:'snarearrow',text:'화살 명중 시 0.8초 둔화 · 냉기 효과와 중첩 연장'},
   'archer-2':{id:'drillarrow',text:'모든 화살의 관통 횟수 +1 · 관통 빌드와 합산'},
   'archer-3':{id:'spiritarrow',text:'화살 명중 시 마나 1 회복 · 기술 재사용 20% 증가'},
   'mage-1':{id:'manawand',text:'일반 마력탄 명중 시 마나 1 회복 · 비전 빌드와 합산'},
   'mage-2':{id:'icewand',text:'기술 명중 시 적 0.4초 빙결 · 겨울 빌드 빙결 연장'},
   'mage-3':{id:'emberwand',text:'기술이 3초 불길 생성 · 마나 5 추가 소모'},
   'armor-1':{id:'herbalcloak',text:'물약 회복량 +20 · 긴 원정의 물약 효율 증가'},
   'armor-2':{id:'froststep',text:'회피 시 주변 적 1.2초 둔화 · 냉기 효과와 중첩 연장'}
  };
  for(const [id,trait]of Object.entries(traits)){G.items[id].traits=[trait.id];G.items[id].tags.push(trait.id);G.items[id].description+=' · '+trait.text;}
  G.gearTraits=()=>new Set(Object.values(G.p.equipment).flatMap(id=>G.items[id]?.traits||[]));
  G.initializeGear();G.populate();
})();
