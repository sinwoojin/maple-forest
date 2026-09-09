'use strict';
(() => {
  const A=window.Art;
  const ellipse=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
  const poly=(c,points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
  function mushroom(c,x,y,s,color){
    c.save();c.translate(x,y);c.scale(s,s);
    const glow=c.createRadialGradient(0,-65,3,0,-65,100);glow.addColorStop(0,color+'55');glow.addColorStop(1,color+'00');c.fillStyle=glow;c.fillRect(-110,-170,220,190);
    poly(c,[[-10,0],[-8,-61],[7,-62],[12,0]],'#8fc4d0');poly(c,[[0,0],[2,-60],[7,-62],[12,0]],'#3f7470');
    c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.moveTo(-28,-56);c.quadraticCurveTo(0,-25,28,-56);c.stroke();
    poly(c,[[-44,-55],[-37,-77],[-21,-95],[0,-106],[24,-93],[39,-75],[46,-56],[27,-50],[-29,-50]],color);
    poly(c,[[-37,-73],[-19,-94],[0,-102],[24,-89],[8,-91],[-12,-86]],'#fff9e966');
    ellipse(c,-20,-73,7,4,'#fff9e9');ellipse(c,6,-89,8,5,'#fff9e9');ellipse(c,28,-66,5,3,'#fff9e9');c.restore();
  }
  let cavern;
  function cachedCave(){if(cavern)return cavern;cavern=document.createElement('canvas');cavern.width=3900;cavern.height=720;const c=cavern.getContext('2d');
    for(let i=0;i<23;i++){const x=i*183;poly(c,[[x-60,0],[x+100,0],[x+70,140+i%3*33],[x+44,184],[x+15,65]],'#284e50');poly(c,[[x+15,0],[x+38,0],[x+44,152]],'#3f7470');}
    for(let i=0;i<17;i++){const x=i*245;poly(c,[[x,610],[x+24,390-i%4*30],[x+58,349],[x+89,490],[x+122,610]],'#284e50');mushroom(c,x+115,608,.8+(i%3)*.5,i%2?'#8fc4d0':'#e986a5');}
    for(let i=0;i<80;i++){c.fillStyle=i%3?'#3f7470':'#8fc4d0';c.fillRect(i*49,280+(i*67)%320,3,4);}return cavern;}
  A.cavernBackground=(c,camera,t,w,h)=>{
    const bg=c.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#102527');bg.addColorStop(.6,'#173536');bg.addColorStop(1,'#284e50');c.fillStyle=bg;c.fillRect(0,0,w,h);
    for(let i=0;i<8;i++){const x=i*475-camera*.22;const glow=c.createRadialGradient(x,360,5,x,360,250);glow.addColorStop(0,'#3f747055');glow.addColorStop(1,'#17353600');c.fillStyle=glow;c.fillRect(x-250,100,500,500);}
    c.drawImage(cachedCave(),-camera*.75,0);
    const mist=c.createLinearGradient(0,460,0,610);mist.addColorStop(0,'#8fc4d000');mist.addColorStop(1,'#8fc4d022');c.fillStyle=mist;c.fillRect(0,460,w,150);
  };
  A.cavernPlatform=(c,p)=>{
    c.fillStyle='#173536';c.fillRect(p.x,p.y,p.w,p.h);c.fillStyle='#284e50';c.fillRect(p.x+3,p.y+8,p.w-6,p.h-8);
    c.fillStyle='#3f7470';c.fillRect(p.x,p.y-5,p.w,10);c.fillStyle='#8fc4d0';c.fillRect(p.x,p.y-6,p.w,2);
    for(let x=p.x+12;x<p.x+p.w;x+=37){c.fillStyle='#3f7470';c.fillRect(x,p.y+18,16,5);c.fillStyle='#173536';c.fillRect(x+8,p.y+29,20,4);}
  };
  A.cavernForeground=(c,camera,t,w)=>{
    for(let i=Math.floor(camera/150);i<(camera+w)/150+1;i++){const x=i*150+30;poly(c,[[x,607],[x+7,576],[x+16,591],[x+23,581],[x+29,607]],i%2?'#3f7470':'#8fc4d0');}
  };
  A.projectile=(c,p)=>{
    c.save();c.translate(p.x,p.y);c.scale(Math.sign(p.vx)||1,1);
    if(p.kind==='arrow'){c.strokeStyle=p.charged?'#f7b749':'#fff9e9';c.lineWidth=p.charged?4:2;c.beginPath();c.moveTo(-27,0);c.lineTo(15,0);c.stroke();poly(c,[[15,-5],[25,0],[15,5]],'#8fc4d0');poly(c,[[-18,0],[-25,-6],[-32,-6],[-26,0],[-32,6],[-25,6]],'#91bd61');}
    else{const g=c.createRadialGradient(0,0,2,0,0,23);g.addColorStop(0,'#fff9e9');g.addColorStop(.35,'#8fc4d0');g.addColorStop(1,'#8fc4d000');c.fillStyle=g;c.fillRect(-24,-24,48,48);ellipse(c,-19,0,17,4,'#8fc4d077');}
    c.restore();
  };
  A.attack=(c,p)=>{
    if(p.attack<=0)return;
    if(p.job==='warrior'){c.save();c.translate(p.x+p.dir*18,p.y-32);c.scale(p.dir,1);c.strokeStyle=p.skill>0?'#f7b749':'#fff9e9';c.lineWidth=p.skill>0?9:5;c.beginPath();c.arc(0,0,p.skill>0?245:68,-1.15,1.15);c.stroke();c.restore();}
    if(p.job==='mage'&&p.skill>0){const x=p.x;c.strokeStyle='#8fc4d0';c.lineWidth=4;c.beginPath();c.ellipse(x,p.y-30,235,85,0,0,Math.PI*2);c.stroke();c.fillStyle='#8fc4d033';c.fill();for(let i=0;i<7;i++){const dx=(i-3)*65;poly(c,[[x+dx-7,p.y-10],[x+dx,p.y-105-Math.abs(i-3)*5],[x+dx+7,p.y-10]],'#8fc4d0aa');}}
  };
})();
