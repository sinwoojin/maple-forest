'use strict';
(() => {
 const A=window.Art,G=window.Game,base=A.enemy;
 const names={charger:'돌격병',ranged:'궁수',shield:'방패병',leaper:'도약병',bomber:'폭탄병',summoner:'소환사',healer:'치유사',stealth:'그림자'};
 A.enemy=(c,e,t)=>{c.save();if(e.hidden)c.globalAlpha=.4;base(c,e,t);if(e.role&&e.kind!=='boss'){c.translate(e.x,e.y-36);c.strokeStyle='#543929';c.lineWidth=3;c.fillStyle='#f7b749';c.beginPath();
 if(e.role==='shield'){c.fillStyle='#4779aa';c.moveTo(12,-12);c.lineTo(32,-8);c.lineTo(29,12);c.lineTo(22,20);c.lineTo(13,10);c.closePath();c.fill();c.stroke();}
 if(e.role==='ranged'){c.arc(26,-4,18,-1.5,1.5);c.stroke();c.beginPath();c.moveTo(27,-22);c.lineTo(27,14);c.stroke();}
 if(e.role==='charger'){for(const x of [-18,10]){c.beginPath();c.moveTo(x,-10);c.lineTo(x+4,-29);c.lineTo(x+11,-10);c.fill();c.stroke();}}
 if(e.role==='leaper'){c.fillStyle='#8fc4d0';c.fillRect(-25,17,17,7);c.fillRect(9,17,17,7);}
 if(e.role==='bomber'){c.fillStyle='#352a24';c.arc(24,0,13,0,Math.PI*2);c.fill();c.strokeStyle='#f7b749';c.beginPath();c.moveTo(24,-12);c.lineTo(28,-22);c.stroke();}
 if(e.role==='summoner'){c.strokeStyle='#a7461c';c.beginPath();c.moveTo(28,20);c.lineTo(28,-34);c.stroke();c.fillStyle='#bc83a0';c.beginPath();c.arc(28,-34,8,0,Math.PI*2);c.fill();}
 if(e.role==='healer'){c.fillStyle='#fff9e9';c.fillRect(-13,-25,26,13);c.fillStyle='#76934b';c.fillRect(-3,-29,6,21);c.fillRect(-10,-22,20,6);}
 if(e.role==='stealth'){c.fillStyle='#483b65';c.fillRect(-22,-11,44,8);c.fillStyle='#fff9e9';c.fillRect(-11,-9,7,3);c.fillRect(6,-9,7,3);}
 c.font=`bold ${11*(G.textScale||1)}px "Malgun Gothic",sans-serif`;c.textAlign='center';c.lineWidth=3;c.strokeStyle='#352a24';c.strokeText(names[e.role],0,-42);c.fillStyle='#fff9e9';c.fillText(names[e.role],0,-42);}
 c.restore();if(e.elite){c.save();c.translate(e.x,e.y-98);c.fillStyle='#f7b749';c.strokeStyle='#543929';c.lineWidth=2;c.beginPath();c.moveTo(-18,0);c.lineTo(-23,-19);c.lineTo(-9,-11);c.lineTo(0,-25);c.lineTo(9,-11);c.lineTo(23,-19);c.lineTo(18,0);c.closePath();c.fill();c.stroke();c.font=`bold ${11*(G.textScale||1)}px sans-serif`;c.textAlign='center';c.strokeText('정예 · 우선 처치',0,-34);c.fillStyle='#fff9e9';c.fillText('정예 · 우선 처치',0,-34);c.restore();}};
 A.combatLabel=text=>({root:'뿌리 솟구침',charge:'돌진',summon:'소환',crystal:'수정 낙하',shockwave:'충격파 · 점프',ice:'빙결',blizzard:'눈보라',leap:'도약 강타',rift:'균열',darkbolt:'암흑 탄환',eclipse:'월식 · 점프',arrow:'화살',bash:'방패 강타',bomb:'폭발',pulse:'파동',ambush:'기습'})[text]||text;
 A.danger=(c,h)=>{
  if(!Number.isFinite(h.x)||!Number.isFinite(h.y))return;
  c.save();const warning=h.warning||h.life>0&&h.label;
  c.strokeStyle=warning?'#f7b749':'#cf504b';c.fillStyle=warning?'#f7b74933':'#cf504b66';c.lineWidth=3;c.setLineDash(warning?[8,5]:[]);c.beginPath();
  if(h.width)c.rect(h.x-h.width/2,h.y-(h.height||12)/2,h.width,h.height||12);else c.arc(h.x,h.y,h.radius||12,0,Math.PI*2);
  c.fill();c.stroke();c.setLineDash([]);
  c.restore();
 };
 A.dangerLabel=(c,h)=>{
  c.save();const extent=h.width?h.width/2:h.radius||12;
  if(h.label&&h.x+extent>=G.camera&&h.x-extent<=G.camera+G.width){
   const text=A.combatLabel(h.label),scale=G.textScale||1,margin=6*scale;
   c.font=`bold ${12*scale}px "Malgun Gothic",sans-serif`;c.textAlign='center';
   const half=Math.min(c.measureText(text).width/2,(G.width-2*margin)/2);
   const x=Math.max(G.camera+half+margin,Math.min(G.camera+G.width-half-margin,h.x));
   const y=Math.max((G.cameraY||0)+18*scale,h.y-Math.max(h.radius||h.height||20,96)-12);
   c.strokeStyle='#352a24';c.lineWidth=4;c.strokeText(text,x,y,G.width-2*margin);c.fillStyle='#fff9e9';c.fillText(text,x,y,G.width-2*margin);
  }
  c.restore();
 };
})();
