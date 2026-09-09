'use strict';
(() => {
 const G=window.Game;
 G.enemyRoles=['charger','ranged','shield','leaper','bomber','summoner','healer','stealth'];
 G.spawnEnemy=spec=>{const kind=spec.kind||'slime',boss=kind==='boss',hp=spec.hp||spec.maxHp||(boss?420:65)+(spec.level||1)*(boss?35:6);return {x:600,y:610,vx:0,kind,zone:G.p.zone,hp,maxHp:hp,home:spec.x||600,platform:0,dir:-1,timer:0,hurt:0,dead:0,phase:1,role:spec.role||'charger',damage:boss?20:9,aiCooldown:.8, ...spec};};
 G.warn=(e,type,x,y,radius,damage,delay=.8,extra={})=>{const h={x,y,radius,width:radius*2,height:extra.groundOnly?50:180,shape:'rect',life:delay,max:delay,type,label:type,damage,warning:true,owner:e,...extra};G.hazards.push(h);e.telegraph={...h,owner:undefined};return h;};
 G.updateEnemyAI=(e,dt)=>{
  e.role||=e.kind==='mushroom'?'leaper':'charger';e.damage??=e.kind==='mushroom'?14:9;const p=G.p,dx=p.x-e.x;e.dir=Math.sign(dx)||e.dir;e.aiCooldown=(e.aiCooldown??1)-dt;if(e.stun>0)return;
  const speed=(e.slow>0?.5:1),near=Math.abs(dx)<850; if(!near)return;
  if(e.role==='stealth'){e.hidden=e.aiCooldown>1.1;if(e.hidden)e.x+=e.dir*100*speed*dt;}
  if(e.role==='charger'){e.x+=e.dir*(e.charging>0?350:46)*speed*dt;e.charging=Math.max(0,(e.charging||0)-dt);}
  if(e.role==='shield'){e.blocking=e.aiCooldown>1;e.x+=e.dir*35*speed*dt;}
  if(e.role==='ranged'&&Math.abs(dx)<190)e.x-=e.dir*60*speed*dt;
  if(e.role==='leaper'&&e.leap>0){e.leap-=dt;e.x+=e.dir*210*speed*dt;e.y=610-Math.sin(Math.max(0,e.leap)*Math.PI)*110;}
  if(e.role==='bomber'&&Math.abs(dx)>130)e.x+=e.dir*50*speed*dt;
  if(e.aiCooldown>0)return;e.aiCooldown=2.7;
  switch(e.role){
   case 'charger':G.warn(e,'charge',e.x+e.dir*90,e.y,115,e.damage,.65,{onResolve:'charge'});break;
   case 'ranged':G.warn(e,'arrow',e.x,e.y-35,15,e.damage,.8,{onResolve:'projectile',vx:e.dir*310});break;
   case 'shield':G.warn(e,'bash',e.x+e.dir*55,e.y,75,e.damage+4,.8);break;
   case 'leaper':G.warn(e,'leap',p.x,610,85,e.damage+5,1,{onResolve:'leap'});break;
   case 'bomber':G.warn(e,'bomb',p.x,610,120,e.damage+10,1.5);e.aiCooldown=3.5;break;
   case 'summoner':if(G.enemies.filter(x=>!x.dead).length<16)G.warn(e,'summon',e.x+e.dir*80,610,45,0,1.2,{onResolve:'summon'});e.aiCooldown=6;break;
   case 'healer':{const ally=G.enemies.filter(x=>!x.dead&&x!==e&&Math.abs(x.x-e.x)<400).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];if(ally){ally.hp=Math.min(ally.maxHp,ally.hp+18);G.emit(ally.x,ally.y-65,'+18','#91bd61');}G.warn(e,'pulse',e.x,e.y,100,e.damage,1);break;}
   case 'stealth':e.hidden=false;G.warn(e,'ambush',p.x,p.y,65,e.damage+8,.6);e.aiCooldown=3.6;break;
  }
 };
})();
