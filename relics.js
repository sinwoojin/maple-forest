'use strict';
(() => {
 const G=window.Game;
 G.relicCatalog={
  ember:{id:'ember',name:'잿불 씨앗',description:'명중 시 적에게 4초 화상.',tags:['burn'],synergy:'잿불 술사 · 폭풍 궁수'},
  frost:{id:'frost',name:'겨울 이슬',description:'명중 시 2초 동안 적 이동속도 절반.',tags:['slow'],synergy:'겨울 마법사 · 궁수'},
  thorn:{id:'thorn',name:'가시 왕관',description:'피격 시 주변 적에게 24 반격 피해.',tags:['counter'],synergy:'반격 수호자'},
  vampire:{id:'vampire',name:'붉은 잎',description:'명중 시 체력 1 회복 (0.3초 간격).',tags:['heal'],synergy:'붉은 검객 · 폭풍 궁수'},
  echo:{id:'echo',name:'메아리 수정',description:'기술 명중 시 14 추가 피해.',tags:['skill'],synergy:'비전 학자'},
  feather:{id:'feather',name:'바람 깃털',description:'회피 재사용 35% 감소, 이동속도 12% 증가.',tags:['dodge'],synergy:'궁수 · 근접 진입'},
  shell:{id:'shell',name:'수호 껍질',description:'받는 피해 20% 감소.',tags:['guard'],synergy:'반격 수호자'},
  spring:{id:'spring',name:'마나 샘',description:'마나 초당 추가 3 회복.',tags:['mana'],synergy:'비전 학자'},
  storm:{id:'storm',name:'폭풍 조각',description:'매 네 번째 명중은 주변 적에게 번개 20 피해.',tags:['chain'],synergy:'폭풍 궁수'},
  hunter:{id:'hunter',name:'사냥꾼 문장',description:'보스에게 주는 피해 20% 증가.',tags:['boss'],synergy:'매의 추적자'},
  hourglass:{id:'hourglass',name:'모래 시계',description:'기술 재사용 시간 25% 감소.',tags:['skill'],synergy:'대검 파괴자'},
  heart:{id:'heart',name:'숲의 심장',description:'적 처치 시 체력 4 회복.',tags:['heal'],synergy:'긴 탐험'}
 };
 G.hasRelic=id=>!!G.p.run?.active&&(G.p.run.relics||[]).includes(id);
 G.grantRelic=id=>{const r=G.p.run;if(!r?.active||!G.relicCatalog[id]||r.relics.includes(id))return false;r.relics.push(id);G.save();return true;};
 G.onRelicHit=(e,skill)=>{if(G.hasRelic('ember'))e.burn=4;if(G.hasRelic('frost'))e.slow=2;if(G.hasRelic('vampire')&&!(G.p.leechCooldown>0)){G.p.hp=Math.min(G.p.maxHp,G.p.hp+1);G.p.leechCooldown=.3;}if(skill&&G.hasRelic('echo'))G.hitEnemy(e,14);if(G.hasRelic('storm')){G.p.combo=(G.p.combo||0)+1;if(G.p.combo%4===0)for(const other of G.enemies)if(other!==e&&Math.abs(other.x-e.x)<190)G.hitEnemy(other,20);}};
})();
