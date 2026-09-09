'use strict';
(() => {
  const G=window.Game, key='maple-forest-v1', limit=1048576;
  const numbers=['level','xp','gold','hp','mp','potions','kills','quest','caveKills','lootKills','materials'];
  const flags=['bossDead','won','caveBossDead','caveWon'];
  const settingDefaults={sfx:false,bgm:false,intensity:'full',reducedMotion:false};
  const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  const fail=()=>{throw Error('저장 파일의 값 또는 형식이 올바르지 않습니다.');};
  function settings(raw){
    if(raw===undefined)return {...settingDefaults};
    if(!object(raw)||['sfx','bgm','reducedMotion'].some(k=>typeof raw[k]!=='boolean')||!['off','low','full'].includes(raw.intensity))fail();
    return Object.fromEntries(Object.keys(settingDefaults).map(k=>[k,raw[k]]));
  }
  function parse(text){
    if(typeof text!=='string'||text.length>limit)throw Error('저장 파일은 1MB 이하의 JSON이어야 합니다.');
    const d=JSON.parse(text);if(!object(d)||![1,2,3,4].includes(d.version))fail();
    const p=G.defaults();
    for(const k of numbers){const value=d[k]??((d.version<4&&k==='materials')?0:(d.version===1&&['caveKills','lootKills'].includes(k))?0:undefined);if(!( ['hp','mp'].includes(k)?Number.isFinite(value):Number.isSafeInteger(value))||value<0||value>1e9)fail();p[k]=value;}
    if(p.level<1||p.level>10000||p.quest>2||p.xp>=50+(p.level-1)*35)fail();
    p.maxHp=100+(p.level-1)*20;p.maxMp=60+(p.level-1)*8;p.hp=Math.min(p.hp,p.maxHp);p.mp=Math.min(p.mp,p.maxMp);
    for(const k of flags){if(d[k]!==undefined&&typeof d[k]!=='boolean')fail();p[k]=d[k]===true;}
    if(d.version>=2){
      if(!Object.hasOwn(G.jobs,d.job)||!['forest','cavern'].includes(d.zone)||!Array.isArray(d.inventory)||d.inventory.length>500||!object(d.equipment))fail();
      if(d.inventory.some(id=>typeof id!=='string'||!Object.hasOwn(G.items,id)))fail();
      p.job=d.job;p.zone=d.zone;p.inventory=[...new Set(d.inventory)];p.equipment={};
      for(const slot of ['weapon','armor']){const id=d.equipment[slot],item=G.items[id];if(!item||item.slot!==slot||!p.inventory.includes(id)||(item.job!=='all'&&item.job!==p.job))fail();p.equipment[slot]=id;}
    }else{p.lootKills=p.kills;p.inventory=['warrior-0','armor-0'];p.equipment={weapon:'warrior-0',armor:'armor-0'};}
    if(p.zone==='cavern'&&!p.bossDead)p.zone='forest';
    p.build=typeof d.build==='string'?d.build:'';
    if(p.build&&(!Object.hasOwn(G.buildCatalog||{},p.build)||G.buildCatalog[p.build].job!==p.job))fail();
    p.run=G.parseRun(d.version>=3?d.run:undefined);
    const meta=G.parseMeta(d.version===4?d.meta:undefined), preferences=settings(d.version===4?d.settings:undefined);
    p.x=p.zone==='cavern'?180:220;
    return {p,meta,settings:preferences,migrated:d.version<4};
  }
  function serialize(p=G.p,meta=G.meta,preferences=G.settings){
    const d={version:4};for(const k of [...numbers,...flags,'job','inventory','equipment','zone','run','build'])d[k]=p[k]??(numbers.includes(k)?0:undefined);
    d.meta=meta;d.settings=preferences||settingDefaults;return JSON.stringify(d);
  }
  function apply(candidate){
    G.p=candidate.p;G.meta=candidate.meta;G.settings=candidate.settings;G.sound=G.settings.sfx;
    G.projectiles=[];G.effects=[];G.hazards=[];G.keys.clear();G.camera=0;
    G.initializeGear();G.populate();G.saved=true;
    if(candidate.migrated)G.notify('이전 저장을 v4로 이전했어요. 장비와 성장 기록은 유지됩니다.');
  }
  G.parseDailyReturn=raw=>{if(!object(raw)||raw.run!==undefined)fail();const p=parse(JSON.stringify({...raw,version:4,meta:G.parseMeta(),settings:settingDefaults})).p;delete p.run;return p;};
  G.exportSave=()=>{G.snapshotRun?.();G.recordCodex?.();return serialize();};
  G.save=()=>{try{localStorage.setItem(key,G.exportSave());G.saved=true;return true;}catch{G.saved=false;return false;}};
  G.load=()=>{try{const raw=localStorage.getItem(key);if(!raw)return false;const candidate=parse(raw);apply(candidate);return true;}catch{return false;}};
  G.importSave=text=>{
    let candidate;try{candidate=parse(text);}catch(error){return {ok:false,error:error instanceof SyntaxError?'JSON 파일을 읽을 수 없습니다.':error.message};}
    const previous={p:G.p,meta:G.meta,settings:G.settings};let old;
    try{old=localStorage.getItem(key);localStorage.setItem(key,serialize(candidate.p,candidate.meta,candidate.settings));apply(candidate);return {ok:true};}
    catch{G.p=previous.p;G.meta=previous.meta;G.settings=previous.settings;try{if(old===null)localStorage.removeItem(key);else if(old!==undefined)localStorage.setItem(key,old);}catch{}return {ok:false,error:'저장 공간을 사용할 수 없어 가져오기를 취소했습니다.'};}
  };
  G.p.materials??=0;
})();
