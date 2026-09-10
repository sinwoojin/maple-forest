'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
function fixture(job='warrior'){
 let saves=0;const grants=[],calls=[];
 const G={p:{job,gold:500,potions:5,materials:8,mp:40,maxMp:60,hp:80,maxHp:100,run:{active:true,phase:'event',stage:2,relics:[],events:[],buffs:{attack:0,defense:0}}},relicCatalog:{alpha:{},beta:{}},save(){saves++;return true;},grantRelic(id){grants.push(id);G.p.run.relics.push(id);},openRunUI(){},runRandom(seed){calls.push(seed);return {99:.2,101:.4,103:.8}[seed];}};
 const ctx=vm.createContext({window:{Game:G}});
 for(const file of ['event-data.js','events.js','event-validation.js']){const p=path.join(root,file);vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:file});}
 return {G,calls,state:()=>JSON.parse(JSON.stringify({gold:G.p.gold,potions:G.p.potions,materials:G.p.materials,mp:G.p.mp,hp:G.p.hp,buffs:G.p.run.buffs,relics:G.p.run.relics,claims:G.p.run.events.length,saves,grants}))};
}
test('all pre-migration event choices retain resources effects and single-claim behavior',()=>{
 // Given: outcomes captured from c8f458e before the port, covering all choices, jobs, both roll outcomes.
 const rows=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/event-baseline.json'),'utf8'));
 for(const row of rows){const f=fixture(row.job);f.G.p.run.event={id:row.event,roll:row.roll,relic:'alpha',result:null,choice:null};
  // When: the choice is submitted twice.
  const first=f.G.chooseEventOption(row.choice),second=f.G.chooseEventOption(row.choice);
  // Then: costs, rewards and one-time claim match the original implementation.
  assert.deepEqual({first,second,after:f.state()},{first:row.first,second:row.second,after:row.after},JSON.stringify({event:row.event,choice:row.choice,job:row.job,roll:row.roll}));
 }
});
test('event preparation retains seeded sampling order and selected reward',()=>{
 const {G,calls}=fixture(); // Given: fixed random samples and two unowned relics.
 G.prepareRunEvent(); // When: preparing an event.
 assert.deepEqual(calls,[99,101,103]); // Then: RNG contract and selected event remain stable.
 assert.deepEqual(JSON.parse(JSON.stringify(G.p.run.event)),{id:'smith',roll:.4,relic:'beta',result:null,choice:null});
});
test('insufficient event resources leave state unchanged',()=>{
 for(const [event,choice,resource]of [['spring','drink','gold'],['archive','study','mp'],['smith','temper','materials'],['fox','feed','potions']]){
  const f=fixture();f.G.p[resource]=0;f.G.p.run.event={id:event,roll:0,relic:null,result:null,choice:null};const before=f.state();
  const claimed=f.G.chooseEventOption(choice);
  assert.equal(claimed,false);assert.deepEqual(f.state(),before);
 }
});
test('persisted event parser retains accepted legacy falsy relic values and extra fields',()=>{
 const {G}=fixture();
 for(const relic of [null,undefined,'',0,false,'alpha']){const raw={id:'spring',roll:.5,relic,result:null,choice:null,extra:'preserved'};
  const parsed=G.parseEventSnapshot(raw);
  assert.equal(parsed,raw);
 }
 assert.equal(G.parseEventSnapshot(null),null);
});
test('persisted event parser rejects invalid fields and incoherent outcomes',()=>{
 const {G}=fixture(),base={id:'spring',roll:.5,relic:null,result:null,choice:null};
 const invalid=[undefined,[],{}, {...base,id:'absent'}, {...base,roll:'0.5'}, {...base,roll:NaN},{...base,roll:Infinity},{...base,roll:-.1},{...base,roll:1.1},{...base,relic:['alpha']},{...base,relic:{}},{...base,relic:1},{...base,relic:true},{...base,relic:'missing'},{...base,result:false},{...base,choice:'missing'},{...base,choice:'drink'},{...base,result:'done'}];
 for(const raw of invalid)assert.throws(()=>G.parseEventSnapshot(raw),{name:'EventSnapshotError'});
});
