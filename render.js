'use strict';
(() => {
  const G=window.Game,canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
  const reducedPreference=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function resize(){const box=canvas.getBoundingClientRect();G.width=Math.round(720*box.width/box.height);G.height=720;G.textScale=Math.max(1,720/box.height);canvas.width=G.width;canvas.height=720;ctx.imageSmoothingEnabled=false;}
  new ResizeObserver(resize).observe(canvas);resize();
  function label(x,y,text,color='#fff9e9',size=14){ctx.font=`bold ${size*(G.textScale||1)}px "Malgun Gothic",sans-serif`;ctx.textAlign='center';ctx.lineWidth=3*(G.textScale||1);ctx.strokeStyle='#352a24';ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);}
  function drawEnemy(e,t){
    if(e.dead>0||e.x<G.camera-120||e.x>G.camera+G.width+120)return;
    Art.enemy(ctx,e,t);const boss=e.kind==='boss';
    if(boss){const name=G.p.run?.active?G.runInfo().name+' 수호자':e.zone==='cavern'?'버섯 군주':'숲의 수호자';label(e.x,e.y-126,G.bossAwake(e)?name:'잠든 '+name,'#f7b749',16);
      if(!G.p.run?.active&&e.phase>1.6&&e.phase<2.5&&G.bossAwake(e)){ctx.fillStyle='#cf504b66';ctx.fillRect(e.x-170,e.y-8,340,8);label(e.x,e.y-152,'충격파! 점프로 피하세요','#fff9e9',14);}
    }
    if(e.hp<e.maxHp){const w=boss?120:44;ctx.fillStyle='#543929';ctx.fillRect(e.x-w/2,e.y-(boss?115:56),w,6);ctx.fillStyle='#cf504b';ctx.fillRect(e.x-w/2+1,e.y-(boss?114:55),(w-2)*Math.max(0,e.hp/e.maxHp),4);}
  }
  function draw(){
    const reduced=reducedPreference||G.settings?.reducedMotion;const p=G.p,cave=p.zone==='cavern',t=G.time,run=p.run?.active,info=run?G.runInfo():null;G.camera=Math.max(0,Math.min(G.worldWidth-G.width,p.x-G.width*.35));
    if(run)Art.stageBackground(ctx,G.camera,t,G.width,G.height,info);else (cave?Art.cavernBackground:Art.background)(ctx,G.camera,t,G.width,G.height);ctx.save();ctx.translate(-Math.round(G.camera),0);
    for(const platform of G.platforms){if(run)Art.stagePlatform(ctx,platform,info);else (cave?Art.cavernPlatform:Art.platform)(ctx,platform); }
    if(run){if(info.phase!=='battle'){Art.portal(ctx,G.worldWidth-100,610,t,true);label(G.worldWidth-100,490,'다음 원정으로','#fff9e9');}}else if(cave){Art.portal(ctx,100,610,t,true);label(100,490,'단풍숲으로','#8fc4d0');Art.portal(ctx,3070,610,t,p.caveBossDead);label(3070,490,'수정의 출구','#8fc4d0');}
    else{Art.npc(ctx,230,610,t);label(230,518,'숲지기 루미','#fff9e9',12);Art.portal(ctx,4260,610,t,p.bossDead);label(4260,490,p.bossDead?'버섯 동굴로':'봉인된 동굴','#fff9e9');}
    if(run&&['escort','defense'].includes(info.objective?.type)){const o=info.objective;ctx.save();ctx.strokeStyle='#8fc4d0';ctx.lineWidth=3;ctx.setLineDash([8,8]);ctx.beginPath();ctx.ellipse(o.x,610,o.type==='defense'?210:180,30,0,0,Math.PI*2);ctx.stroke();ctx.restore();if(o.type==='escort')Art.npc(ctx,o.x,o.y,t);else{ctx.fillStyle='#8fc4d0';ctx.beginPath();ctx.moveTo(o.x,530);ctx.lineTo(o.x+24,570);ctx.lineTo(o.x,610);ctx.lineTo(o.x-24,570);ctx.fill();}label(o.x,510,(o.type==='escort'?'반딧불 호송':'수정 방어')+' · '+Math.ceil(o.health)+' HP','#8fc4d0',16);}for(const h of G.hazards||[])Art.danger(ctx,h);for(const e of G.enemies)drawEnemy(e,t);
    if(p.invuln<=0||Math.floor(G.time*12)%2||reduced)Art.player(ctx,p,t);
    Art.attack(ctx,p);for(const shot of G.projectiles)Art.projectile(ctx,shot);
    label(p.x,p.y+20,G.jobs[p.job].name+' · 단풍 여행자','#fff9e9',12);
    if(G.settings?.intensity!=='off'&&!reduced){if(run)Art.stageForeground(ctx,G.camera,t,G.width,G.height,info);else (cave?Art.cavernForeground:Art.foreground)(ctx,G.camera,t,G.width,G.height);}
    for(const e of (G.settings?.intensity==='off'?[]:G.effects)){ctx.globalAlpha=Math.min(G.settings?.intensity==='low'?.5:1,e.life*3);label(e.x,e.y,e.text,e.color,e.text.includes('LEVEL')?32:24);}ctx.globalAlpha=1;ctx.restore();
  }
  let last=performance.now(),acc=0;
  function frame(now){acc+=Math.min((now-last)/1000,.08);last=now;while(acc>=1/60){G.update(1/60);acc-=1/60;}draw();if(G.refresh)G.refresh();requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
})();
