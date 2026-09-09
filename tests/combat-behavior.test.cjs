const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function game(){const ctx=vm.createContext({window:{},console,Set,Math});for(const file of ['engine','systems','builds','relics','enemy-ai','boss-ai','combat'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file+'.js'),'utf8'),ctx);const G=ctx.window.Game;G.running=true;G.p.run={active:true,phase:'battle',build:'',relics:[],buffs:{attack:0,defense:0}};G.killRunEnemy=e=>{e.dead=Infinity;};G.failRun=()=>{G.p.run.phase='failed';};G.enemies=[];return G;}
function enemy(G,extra={}){const e=G.spawnEnemy({x:G.p.x+55,hp:1000,...extra});G.enemies.push(e);return e;}
test('nine job builds apply actual distinct behavior',()=>{
 for(const [id,b] of Object.entries(game().buildCatalog)){
  const G=game();G.p.job=b.job;assert.equal(G.selectBuild(id),true);const e=enemy(G);G.attackAction(false);if(G.projectiles.length)G.updateCombat(.1);
  assert.ok(e.hp<1000,id+' damages');
  if(id==='bleed')assert.equal(e.bleedStacks,1);if(id==='mark')assert.ok(e.mark>0);if(id==='burn')assert.ok(e.burn>0);if(id==='frost')assert.ok(e.slow>0);
  if(id==='pierce')assert.ok(G.projectiles[0].pierce>=2);if(id==='multishot')assert.equal(G.projectiles.length,0); // Three projectiles each land on this close target.
  G.p.attack=0;G.attackAction(true);if(id==='counter')assert.ok(G.p.guard>0);if(id==='heavy')assert.ok(e.stun>0);if(id==='mana')assert.ok(G.p.mp<38);
 }
});
test('dodge, guard and pause protect player; statuses tick',()=>{const G=game(),e=enemy(G);assert.equal(G.dodge(),true);assert.equal(G.dodge(),false);G.damagePlayer(20,e);assert.equal(G.p.hp,100);G.p.invuln=0;G.p.guard=1;G.damagePlayer(20,e);assert.equal(G.p.hp,100);assert.equal(e.hp,968);G.p.guard=0;G.p.invuln=0;G.paused=true;G.damagePlayer(20,e);assert.equal(G.p.hp,100);G.paused=false;e.burn=3;G.updateCombat(.5);assert.equal(e.hp,963);});
test('all eight enemy roles produce their documented action',()=>{for(const role of game().enemyRoles){const G=game(),e=enemy(G,{role,aiCooldown:0});const ally=enemy(G,{x:e.x+30,hp:30,maxHp:100});G.updateEnemyAI(e,.01);if(role==='healer')assert.equal(ally.hp,48);else assert.ok(G.hazards.length,role);}});
test('four bosses rotate distinct moves and change phase',()=>{const sets=[];for(const bossId of ['forest','cavern','frost','twilight']){const G=game(),e=enemy(G,{kind:'boss',bossId,aiCooldown:0});for(let i=0;i<3;i++){e.aiCooldown=0;G.updateBossAI(e,.01);}sets.push([...new Set(G.hazards.map(h=>h.type))].join(','));e.hp=200;e.aiCooldown=0;G.updateBossAI(e,.01);assert.equal(e.phase,3);}assert.equal(new Set(sets).size,4);});
test('relic effects and protected gear dismantle persist state',()=>{const G=game(),e=enemy(G);for(const id of ['ember','frost','vampire','echo','storm'])assert.equal(G.grantRelic(id),true);G.p.hp=80;G.onRelicHit(e,true);assert.equal(G.p.hp,81);assert.ok(e.burn>0&&e.slow>0);assert.equal(e.hp,986);assert.equal(G.grantRelic('ember'),false);G.p.inventory.push('warrior-1');assert.equal(G.compareItem('warrior-1').attack,9);assert.equal(G.dismantle('warrior-1'),true);assert.equal(G.p.materials,2);assert.equal(G.dismantle('warrior-0'),false);});
test('enemy hazards wait for telegraph and stop during pause/decision',()=>{const G=game(),e=enemy(G);G.warn(e,'bomb',G.p.x,610,100,20,.5);G.updateCombat(.25);assert.equal(G.p.hp,100);G.paused=true;G.updateCombat(1);assert.equal(G.hazards[0].life,.25);G.paused=false;G.updateCombat(.25);assert.equal(G.p.hp,80);G.p.run.phase='route';G.p.invuln=0;G.damagePlayer(40,e);assert.equal(G.p.hp,80);});
test('suspended run relics never affect free exploration',()=>{const G=game();G.p.run.relics=['shell','spring'];G.p.run.active=false;assert.equal(G.hasRelic('shell'),false);});
test('mana surcharge paid once per cast across multiple targets',()=>{const G=game();G.p.job='mage';G.selectBuild('mana');const a=enemy(G),b=enemy(G,{x:G.p.x+100});G.attackAction(true);assert.equal(G.p.mp,28);assert.equal(a.hp,b.hp);assert.equal(a.hp,920);});
test('legacy free exploration enemies deal finite damage',()=>{const G=game();G.p.run.active=false;const e={x:G.p.x+100,y:610,kind:'slime',zone:'forest',hp:45,maxHp:45,dir:-1,dead:0,timer:0,aiCooldown:0};G.enemies=[e];G.updateEnemyAI(e,.01);G.p.x=G.hazards[0].x;G.updateCombat(.7);assert.ok(Number.isFinite(G.p.hp));assert.ok(G.p.hp<100);});
test('shield faces player and piercing skill bypasses guard',()=>{const G=game(),e=enemy(G,{role:'shield',blocking:true,dir:-1});G.hitEnemy(e,100);assert.equal(e.hp,970);G.hitEnemy(e,100,{ignoreShield:true});assert.equal(e.hp,870);});
test('defense, mana, mobility, cooldown, boss and kill relics are active',()=>{const G=game(),e=enemy(G,{kind:'boss'});for(const id of ['shell','spring','feather','hourglass','hunter','heart'])G.grantRelic(id);G.damagePlayer(20,e);assert.equal(G.p.hp,84);G.p.mp=0;G.update(.1);assert.ok(Math.abs(G.p.mp-.7)<.00001);G.dodge();assert.equal(G.p.dodgeCooldown,1.3);G.p.mp=60;G.p.attack=0;G.attackAction(true);assert.ok(G.p.cooldown<1.6);const before=e.hp;G.hitEnemy(e,100);assert.equal(before-e.hp,120);G.p.hp=50;G.hitEnemy(e,9999);assert.equal(G.p.hp,54);});

test('combat snapshot restores pending warnings, cooldowns and projectile hit identities',()=>{const G=game(),e=enemy(G,{x:1000});G.warn(e,'bomb',G.p.x,610,100,20,.5);G.p.cooldown=1.75;G.p.dodgeCooldown=1.2;G.projectiles=[{x:100,y:577,vx:800,kind:'arrow',life:1,damage:20,pierce:2,charged:false,hit:new Set([e])}];const raw=JSON.parse(JSON.stringify(G.snapshotCombat()));G.hazards=[];G.projectiles=[];G.p.cooldown=0;G.restoreCombat(raw);assert.equal(G.hazards.length,1);assert.equal(G.hazards[0].owner,e);assert.equal(G.projectiles[0].hit.has(e),true);assert.equal(G.p.cooldown,1.75);assert.equal(G.p.dodgeCooldown,1.2);G.updateCombat(.51);assert.equal(G.p.hp,80);});
test('combat parser rejects invalid owner, damage and cooldown without partial restore',()=>{const G=game(),e=enemy(G);G.warn(e,'bomb',300,610,100,20,.5);const raw=G.snapshotCombat();raw.hazards[0].ownerIndex=999;assert.throws(()=>G.restoreCombat(raw));assert.equal(G.hazards.length,1);raw.hazards[0].ownerIndex=0;raw.hazards[0].damage=-1;assert.throws(()=>G.parseCombat(raw,1));raw.hazards[0].damage=20;raw.player.cooldown=-1;assert.throws(()=>G.parseCombat(raw,1));});
test('skill has priority during a held basic attack without bypassing skill cooldown',()=>{const G=game();G.attackAction(false);assert.ok(G.p.attack>0);G.attackAction(true);assert.equal(G.p.mp,45);assert.ok(G.p.cooldown>0);G.attackAction(true);assert.equal(G.p.mp,45);});
test('weapon traits change reach, guard, lunge, snare, pierce and mana economy',()=>{
 const a=game();a.p.equipment.weapon='warrior-1';const far=enemy(a,{x:a.p.x+125});a.attackAction(false);assert.ok(far.hp<1000);
 const b=game();b.p.equipment.weapon='warrior-2';b.selectBuild('counter');b.attackAction(true);assert.equal(b.p.guard,1.9);
 const c=game();c.p.equipment.weapon='warrior-3';const x=c.p.x;c.attackAction(true);assert.equal(c.p.x,x+70);assert.equal(c.p.mp,40);assert.equal(c.p.invuln,.2);
 const d=game();d.p.job='archer';d.p.equipment.weapon='archer-1';const snared=enemy(d);d.buildHit(snared,1,false);assert.equal(snared.slow,.8);
 const e=game();e.p.job='archer';e.p.equipment.weapon='archer-2';e.selectBuild('pierce');e.attackAction(false);assert.equal(e.projectiles[0].pierce,4);
 const f=game();f.p.job='archer';f.p.equipment.weapon='archer-3';f.p.mp=30;f.buildHit(enemy(f),1,false);assert.equal(f.p.mp,31);f.attackAction(true);assert.equal(f.p.cooldown,2.4);
});
test('mage and armor traits combine with builds and consume additional skill mana',()=>{
 const a=game();a.p.job='mage';a.p.equipment.weapon='mage-1';a.selectBuild('mana');a.p.mp=20;a.buildHit(enemy(a),1,false);assert.equal(a.p.mp,24);
 const b=game();b.p.job='mage';b.p.equipment.weapon='mage-2';b.selectBuild('frost');const frozen=enemy(b);b.buildHit(frozen,1,true);assert.equal(frozen.stun,1.9);
 const c=game();c.p.job='mage';c.p.equipment.weapon='mage-3';c.attackAction(true);assert.equal(c.p.mp,33);assert.ok(c.hazards.some(h=>h.type==='friendlyFire'));
 const d=game();d.p.equipment.armor='armor-1';d.p.maxHp=200;d.p.hp=50;d.act('potion');assert.equal(d.p.hp,150);
 const e=game();e.p.equipment.armor='armor-2';const slowed=enemy(e);e.dodge();assert.equal(slowed.slow,1.2);
});
test('save during projectile impact cannot restore already consumed shot',()=>{const G=game();G.p.job='archer';enemy(G);G.attackAction(false);let saved;G.save=()=>{saved=JSON.parse(JSON.stringify(G.snapshotCombat()));};G.updateCombat(.1);assert.equal(saved.projectiles.length,0);});
