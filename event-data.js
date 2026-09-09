'use strict';
(() => {
 const G=window.Game;
 const option=(id,title,description,effect,cost={})=>({id,title,description,effect,cost});
 G.runEventCatalog=[
 {id:'spring',title:'빛나는 샘',description:'샘의 정령이 대가를 기다립니다.',choices:[option('drink','샘물을 마신다','40 골드: 체력과 마나 완전 회복',{heal:1,mana:1},{gold:40}),option('bottle','샘물을 담는다','물약 1개 획득',{potions:1})]},
 {id:'bridge',title:'끊어진 다리',description:'건너편에 잃어버린 보급품이 있습니다.',choices:[option('leap','뛰어넘는다','불확실: 60%로 90 골드, 실패 시 체력 20% 손실',{chance:.6,win:{gold:90},lose:{hurt:.2}}),option('repair','안전하게 수리한다','재료 2개를 쓰고 70 골드',{gold:70},{materials:2})]},
 {id:'smith',title:'떠돌이 대장장이',description:'그의 화로는 아직 뜨겁습니다.',choices:[option('temper','날을 벼린다','재료 3개: 이번 원정 공격력 +7',{attack:7},{materials:3}),option('salvage','풀무를 돕는다','재료 2개 획득',{materials:2})]},
 {id:'shrine',title:'잎새의 제단',description:'수호자는 희생에 응답합니다.',choices:[option('blood','생명력을 바친다','체력 25% 손실: 이번 원정 방어력 +3',{hurt:.25,defense:3}),option('gold','금을 바친다','50 골드: 무작위 미보유 유물',{relic:true},{gold:50})]},
 {id:'fox',title:'길 잃은 여우',description:'여우가 수풀 안으로 당신을 부릅니다.',choices:[option('feed','물약을 나눈다','물약 1개: 100 골드',{gold:100},{potions:1}),option('follow','여우를 따라간다','불확실: 50%로 유물, 실패 시 체력 15% 손실',{chance:.5,win:{relic:true},lose:{hurt:.15}})]},
 {id:'archive',title:'고대의 서고',description:'세 갈래 직업의 지식이 잠들어 있습니다.',choices:[option('study','전투 지식을 읽는다','마나 20: 이번 원정 공격력 +6',{attack:6},{mp:20}),option('copy','지도를 필사한다','35 골드 획득',{gold:35})]},
 {id:'garden',title:'달빛 약초밭',description:'약초와 가시가 함께 자랍니다.',choices:[option('harvest','가시 속을 수확한다','체력 15% 손실: 물약 4개',{hurt:.15,potions:4}),option('rest','향기를 즐긴다','체력 25% 회복',{heal:.25})]},
 {id:'gambler',title:'도토리 주사위',description:'상인이 확률을 공개하고 내기를 제안합니다.',choices:[option('bet','내기에 참가한다','40 골드: 50%로 120 골드, 실패 시 보상 없음',{chance:.5,win:{gold:120},lose:{}},{gold:40}),option('work','상인의 짐을 든다','20 골드 획득',{gold:20})]},
 {id:'ghost',title:'기억의 유령',description:'유령은 여행자의 힘을 시험합니다.',choices:[option('duel','검의 기억과 겨룬다','전사: 이번 원정 공격력 +8',{attack:8},{job:'warrior'}),option('listen','이야기를 들어준다','마나 전부 회복, 재료 1개',{mana:1,materials:1})]},
 {id:'nest',title:'바람새의 둥지',description:'높은 가지에 반짝이는 물건이 걸렸습니다.',choices:[option('shoot','줄을 쏘아 올린다','궁수: 미보유 유물 획득',{relic:true},{job:'archer'}),option('climb','나무를 오른다','체력 20% 손실: 75 골드',{hurt:.2,gold:75})]},
 {id:'crystal',title:'노래하는 수정',description:'수정의 소리는 마력에 반응합니다.',choices:[option('attune','수정과 공명한다','마법사: 이번 원정 공격력 +8, 마나 전부 회복',{attack:8,mana:1},{job:'mage'}),option('mine','수정 조각을 캔다','재료 4개 획득',{materials:4})]},
 {id:'caravan',title:'멈춰 선 대상단',description:'호위병이 물자를 교환해 줍니다.',choices:[option('escort','보호 부적을 받는다','물약 2개: 이번 원정 방어력 +4',{defense:4},{potions:2}),option('trade','여분의 광석을 판다','재료 2개: 90 골드',{gold:90},{materials:2}),option('meal','따뜻한 식사를 받는다','체력 20% 회복',{heal:.2})]}
 ];
})();
