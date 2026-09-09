'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx={window:{},console,Math,Set,Uint32Array,Date};vm.createContext(ctx);
for(const file of ['engine.js','systems.js','builds.js','relics.js','enemy-ai.js','boss-ai.js','combat.js','stages.js','route-content.js','event-data.js','events.js','encounters.js','run-validation.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const G=ctx.window.Game;G.save=()=>{G.snapshotRun();return true;};G.running=true;G.startRun({seed:123,build:'bleed'});assert.equal(G.p.run.build,'bleed');
let checks=0;const check=()=>{G.snapshotRun();assert.equal(G.parseRun(JSON.parse(JSON.stringify(G.p.run))).stage,G.p.run.stage);checks++;};
check();let elapsed=G.p.run.elapsedSeconds;G.paused=true;G.updateEncounter(.1);assert.equal(G.p.run.elapsedSeconds,elapsed);G.paused=false;
const clear=()=>{for(const e of G.enemies)if(e.hp>0)G.killRunEnemy(e);};
for(let stage=1;stage<=40;stage++){
 for(let t=0;G.p.run.phase==='battle'&&t<1600;t++){clear();G.p.x=G.p.run.objective.type==='defense'?800:G.p.run.objective.x;G.p.y=610;G.updateEncounter(.25);}
 assert.equal(G.p.run.phase,'reward',`stage ${stage}`);check();const id=G.runRewards()[1].id;assert.equal(G.chooseRunReward(id),true);assert.equal(G.chooseRunReward(id),false);
 if(stage<40){check();const route=G.routeChoices()[0];assert.equal(G.chooseRoute(route.id),true);assert.equal(G.chooseRoute(route.id),false);assert.equal(G.p.run.stage,stage+1);check();}
}
assert.equal(G.p.run.phase,'complete');assert.equal(G.p.run.stage,40);check();assert.equal(G.failRun(),false);
for(const event of G.runEventCatalog){G.startRun({seed:123});G.p.run.phase='event';G.p.run.event={id:event.id,roll:.2,relic:null,result:null,choice:null};G.p.gold=1000;G.p.materials=100;G.p.potions=100;const options=G.eventView().choices.filter(c=>c.enabled&&c.id!=='leave');assert.ok(options.length);assert.equal(G.chooseEventOption(options[0].id),true);const gold=G.p.gold;assert.equal(G.chooseEventOption(options[0].id),false);assert.equal(G.p.gold,gold);check();assert.equal(G.continueRun(),true);}
for(const type of ['defeat','survival','escort','defense']){G.startRun({seed:1});G.enterEncounter(type);check();}
G.p.run.objective.health=0;G.updateEncounter(.1);assert.equal(G.p.run.phase,'failed');check();
const invalid=JSON.parse(JSON.stringify(G.p.run));invalid.elapsedSeconds=-1;assert.throws(()=>G.parseRun(invalid));assert.throws(()=>G.parseRun({...invalid,version:99}));
const migrated=G.parseRun({active:true,started:true,stage:10,best:9});assert.equal(migrated.version,4);assert.equal(migrated.active,false);assert.ok(migrated.migrationNotice);
console.log(`PASS: 40 encounters, 12 event claims, 4 objectives, pause, migration, invalid snapshot and ${checks} round trips`);
// Utility nodes must retain their claims across reloads.
G.startRun({seed:321});G.p.run.stage=1;G.p.run.phase='route';G.p.run.routes=[{id:'2:shop',type:'shop'}];G.chooseRoute('2:shop');G.p.gold=500;check();const offer=G.runShop()[0];assert.equal(G.buyRunItem(offer.id),true);const potions=G.p.potions;assert.equal(G.buyRunItem(offer.id),false);assert.equal(G.p.potions,potions);check();assert.equal(G.continueRun(),true);
G.p.run.phase='route';G.p.run.routes=[{id:'3:rest',type:'rest'}];G.chooseRoute('3:rest');assert.equal(G.continueRun(),false);assert.equal(G.chooseRest('train'),true);assert.equal(G.chooseRest('recover'),false);check();assert.equal(G.continueRun(),true);
G.p.run.phase='event';G.p.run.event={id:'shrine',roll:.4,relic:null,result:null,choice:null};G.p.gold=0;assert.equal(G.chooseEventOption('gold'),false);assert.equal(G.p.run.event.result,null);assert.equal(G.chooseEventOption('leave'),true);check();
G.meta={unlocks:['supply-route','relic-choice']};G.p.run.stage=1;assert.equal(G.makeRouteChoices().length,3);assert.equal(G.startingRelicChoices().length,3);const firstRelic=G.startingRelicChoices()[0].id;G.startRun({seed:4,relic:firstRelic});assert.ok(G.p.run.relics.includes(firstRelic));check();
console.log('PASS: shop/rest/event affordability and double claims, unlock route and starting relic');
// Suspended runs restore coherent job, weapon and build after free-world changes.
G.meta={unlocks:[]};G.p.job='warrior';G.p.build='counter';G.initializeGear();G.startRun({seed:55,build:'counter'});G.leaveRun();G.setJob('mage');G.selectBuild('burn');assert.equal(G.p.equipment.weapon,'mage-0');assert.equal(G.resumeRun(),true);assert.equal(G.p.job,'warrior');assert.equal(G.p.build,'counter');assert.equal(G.items[G.p.equipment.weapon].job,'warrior');check();
// Elite target has a real healing aura, and the encounter pays a distinct completion bonus.
G.enterEncounter('elite');assert.equal(G.p.run.objective.target,2);const elite=G.enemies.find(e=>e.elite),ally=G.enemies.find(e=>!e.elite);assert.ok(elite);ally.hp-=10;let health=ally.hp;G.updateEncounter(.25);assert.ok(ally.hp>health);G.killRunEnemy(elite);health=ally.hp;G.updateEncounter(.25);assert.equal(ally.hp,health);let beforeMaterials=G.p.materials||0;for(let t=0;G.p.run.phase==='battle'&&t<100;t++){clear();G.updateEncounter(.25);}assert.equal(G.p.run.phase,'reward');assert.equal(G.p.materials,beforeMaterials+3);check();
// Rewards prefer eligible unowned armor/weapons and fall back transparently to materials.
G.startRun({seed:66});G.p.inventory=['warrior-0','armor-0'];let rewards=G.makeRunRewards();assert.equal(rewards[0].kind,'gear');assert.ok(!G.p.inventory.includes(rewards[0].item));assert.equal(JSON.stringify(rewards),JSON.stringify(G.makeRunRewards()));G.p.inventory.push('warrior-1','armor-1');rewards=G.makeRunRewards();assert.equal(rewards[0].kind,'materials');G.p.run.rewards=rewards;G.p.run.phase='reward';check();beforeMaterials=G.p.materials||0;assert.equal(G.chooseRunReward(rewards[0].id),true);assert.equal(G.p.materials,beforeMaterials+4);assert.equal(G.chooseRunReward(rewards[0].id),false);
console.log('PASS: suspended cross-job resume, elite healing/bonus, deterministic unowned gear and materials fallback');

// Veteran entry is bounded; expedition growth survives resume and is credited once to freeplay.
G.leaveRun();Object.assign(G.p,{level:30,xp:0,maxHp:680,hp:680,maxMp:292,mp:292});G.startRun({seed:90});assert.equal(G.p.level,1);assert.equal(G.p.maxHp,100);assert.equal(G.p.maxMp,60);assert.equal(G.p.run.entryLevel,1);check();G.gainXp(120);const runLevel=G.p.level,runXP=G.p.xp;G.leaveRun();assert.equal(G.p.level,30);assert.equal(G.p.xp,120);const baseHP=G.p.maxHp;assert.equal(baseHP,680);assert.equal(G.resumeRun(),true);assert.equal(G.p.level,runLevel);assert.equal(G.p.xp,runXP);check();G.leaveRun();assert.equal(G.p.level,30);assert.equal(G.p.xp,120);G.resumeRun();G.gainXp(50);G.leaveRun();assert.equal(G.p.xp,170);G.resumeRun();G.snapshotRun();const parsed=G.parseRun(JSON.parse(JSON.stringify(G.p.run)));assert.equal(parsed.baseProgress.level,30);assert.equal(parsed.creditedXP,170);
console.log('PASS: level30 bounded entry, own expedition growth, repeated return XP deduplication, progression snapshots');
