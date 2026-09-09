(() => {
  'use strict';
  const ink='#543929';
  function shape(c,pts,fill,stroke=ink,width=2){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  function oval(c,x,y,rx,ry,fill,stroke){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  function box(c,x,y,w,h,fill){c.fillStyle=fill;c.fillRect(x,y,w,h);}
  function shadow(c,w){oval(c,0,-1,w,4,'#352a2433');}
  function eyes(c,y,gap=8){box(c,-gap-2,y,4,7,ink);box(c,gap-2,y,4,7,ink);box(c,-gap-1,y,2,2,'#fff9e9');box(c,gap-1,y,2,2,'#fff9e9');}
  window.Art={
    player(c,p,t){
      const cape=p.job==='archer'?'#76934b':p.job==='mage'?'#4779aa':'#bd6137';
      c.save();c.translate(Math.round(p.x),Math.round(p.y));shadow(c,21);
      if(p.invuln>0&&Math.floor(t*18)%2)c.globalAlpha=.45;
      c.scale(p.dir||1,1);const run=p.grounded&&Math.abs(p.vx)>15;const step=run?Math.sin(t*15)*5:0;const bob=run?Math.abs(Math.sin(t*15))*2:Math.sin(t*3)*.7;c.translate(0,-bob);
      shape(c,[[-12,-41],[-23,-20],[-28,-7],[-12,-10],[3,-18],[7,-39]],cape);
      shape(c,[[-16,-35],[-21,-15],[-13,-18],[-7,-38]],'#8fc4d0',null);
      box(c,-11,-16,9,11+step,ink);box(c,3,-16,9,11-step,ink);
      shape(c,[[-12,-7+step],[-3,-7+step],[0,-1],[-14,-1]],'#785344');
      shape(c,[[3,-7-step],[12,-7-step],[16,-1],[3,-1]],'#785344');
      shape(c,[[-12,-39],[10,-39],[14,-18],[8,-13],[-13,-17]],'#fff9e9');
      box(c,-11,-23,24,5,'#a77750');box(c,-1,-23,5,5,'#f7b749');
      shape(c,[[-14,-36],[-18,-24],[-11,-20],[-6,-31]],cape);oval(c,-13,-22,5,5,'#ffd8ad',ink);
      oval(c,0,-48,18,17,'#ffd8ad',ink);oval(c,15,-46,4,5,'#ffd8ad',ink);
      shape(c,[[-18,-48],[-20,-59],[-14,-64],[-7,-63],[-2,-68],[8,-64],[15,-61],[19,-52],[12,-55],[6,-50],[0,-55],[-7,-49],[-11,-55],[-14,-44]],ink);
      shape(c,[[-15,-59],[-6,-62],[3,-63],[10,-59],[0,-58],[-5,-54]],'#a77750',null);
      box(c,1,-49,4,7,ink);box(c,11,-49,3,6,ink);box(c,2,-49,2,2,'#fff9e9');box(c,3,-39,5,2,'#bd6137');oval(c,-5,-42,4,2,'#e986a5');
      shape(c,[[-13,-37],[4,-34],[14,-38],[8,-30],[-7,-31]],'#8fc4d0');
      c.save();c.translate(11,-27);
      if(p.job==='archer'){
        c.strokeStyle='#a77750';c.lineWidth=4;c.beginPath();c.arc(4,-9,25,-1.2,1.2);c.stroke();
        c.strokeStyle='#fff9e9';c.lineWidth=1;c.beginPath();c.moveTo(13,-32);c.lineTo(p.attack>0?-3:13,-9);c.lineTo(13,14);c.stroke();
        box(c,0,-10,35,2,'#785344');shape(c,[[35,-13],[43,-9],[35,-5]],'#8fc4d0');
      }else if(p.job==='mage'){
        c.rotate(.15);box(c,6,-35,5,54,'#a77750');oval(c,8,-38,10,10,'#8fc4d0',ink);oval(c,5,-41,4,4,'#fff9e9');
        shape(c,[[0,-34],[-4,-43],[1,-50],[3,-41],[14,-41],[16,-49],[21,-42],[17,-33]],'#f7b749');
      }else{
        c.rotate(p.attack>0?-1.05:-.23);shape(c,[[4,2],[8,-30],[12,-39],[16,-29],[12,4]],'#8fc4d0');shape(c,[[8,-30],[12,-39],[12,3],[9,3]],'#ffffff',null);
        box(c,0,0,17,4,'#f7b749');box(c,7,4,5,10,ink);
      }
      oval(c,5,6,5,5,'#ffd8ad',ink);c.restore();c.restore();
    },
    enemy(c,e,t){
      c.save();c.translate(Math.round(e.x),Math.round(e.y));const boss=e.kind==='boss';shadow(c,boss?45:22);
      if(e.hurt>0)c.globalAlpha=.65;
      const bob=Math.sin(t*4+e.x)*2;
      if(e.kind==='slime'){
        c.translate(0,bob);shape(c,[[-23,-8],[-21,-20],[-14,-31],[-3,-38],[2,-45],[7,-34],[16,-29],[22,-19],[24,-7],[17,-3],[-16,-3]],e.zone==='cavern'?'#8fc4d0':'#91bd61');
        shape(c,[[-17,-15],[-16,-24],[-6,-33],[2,-34],[13,-28],[5,-27],[-4,-23],[-8,-14]],'#bad0ac',null);oval(c,-8,-27,5,3,'#fff9e9');eyes(c,-19,7);oval(c,-14,-10,4,2,'#df8b42');oval(c,14,-10,4,2,'#df8b42');shape(c,[[-3,-8],[0,-6],[3,-8]],'#4779aa',null);
      }else{
        if(boss)c.scale(2.1,2.1);c.translate(0,bob);
        oval(c,-11,-4,7,4,'#a77750',ink);oval(c,11,-4,7,4,'#a77750',ink);
        shape(c,[[-13,-28],[13,-28],[17,-9],[11,-4],[-11,-4],[-17,-9]],'#ffd8ad');
        shape(c,[[-26,-25],[-23,-36],[-15,-44],[-3,-47],[10,-45],[21,-37],[27,-25],[20,-20],[-19,-20]],e.zone==='cavern'?(boss?'#4779aa':'#e986a5'):(boss?'#bd6137':'#df8b42'));
        shape(c,[[-23,-30],[-17,-39],[-6,-44],[6,-42],[17,-36],[1,-39],[-11,-36]],'#f7b749',null);
        oval(c,-15,-32,5,4,'#fff9e9');oval(c,5,-39,6,4,'#fff9e9');oval(c,17,-28,4,3,'#fff9e9');eyes(c,-17,6);oval(c,-12,-10,3,2,'#e986a5');oval(c,12,-10,3,2,'#e986a5');box(c,-2,-8,4,2,ink);
        if(boss){shape(c,[[-12,-46],[-15,-56],[-6,-51],[0,-60],[6,-51],[15,-56],[12,-46]],'#f7b749');box(c,-2,-53,4,4,'#cf504b');}
      }c.restore();
    },
    npc(c,x,y,t){
      c.save();c.translate(x,y);shadow(c,24);box(c,-13,-8,11,8,ink);box(c,3,-8,11,8,ink);
      shape(c,[[-17,-39],[14,-39],[20,-9],[-19,-9]],'#76934b');shape(c,[[-5,-36],[5,-36],[8,-10],[-8,-10]],'#f8d685');
      oval(c,0,-48,19,17,'#ffd8ad',ink);oval(c,-18,-45,5,5,'#fff9e9');oval(c,18,-45,5,5,'#fff9e9');
      shape(c,[[-15,-43],[-12,-30],[0,-24],[12,-30],[15,-43],[5,-38],[0,-40],[-5,-38]],'#fff9e9');eyes(c,-50,7);
      shape(c,[[-25,-59],[-13,-67],[-8,-83],[10,-80],[17,-62],[25,-59],[20,-54],[-22,-54]],'#a77750');
      shape(c,[[-11,-64],[-7,-78],[8,-76],[13,-64]],'#ca9968',null);box(c,-16,-63,34,4,'#f7b749');
      box(c,24,-49,4,50,ink);oval(c,26,-51,7,7,'#f7b749',ink);oval(c,17,-26,5,5,'#ffd8ad',ink);c.restore();
    },
    portal(c,x,y,t,open){
      c.save();c.translate(x,y);shadow(c,46);
      const g=c.createRadialGradient(0,-45,3,0,-45,58);g.addColorStop(0,open?'#8fc4d099':'#f7b74922');g.addColorStop(1,'#8fc4d000');c.fillStyle=g;c.fillRect(-64,-115,128,120);
      c.strokeStyle='#a77750';c.lineWidth=12;c.beginPath();c.ellipse(0,-46,33,48,0,Math.PI,Math.PI*2);c.lineTo(33,-3);c.stroke();box(c,-39,-46,12,44,'#a77750');
      c.strokeStyle=open?'#8fc4d0':'#d9bf8b';c.lineWidth=4;c.beginPath();c.ellipse(0,-45,28,43,0,0,Math.PI*2);c.stroke();
      if(open){c.strokeStyle='#fff9e9';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.ellipse(0,-45,12+Math.sin(t*2+i)*8,34,Math.sin(t+i)*.3,0,Math.PI*2);c.stroke();}}
      for(let i=0;i<5;i++){const a=Math.PI+i*Math.PI/4;oval(c,Math.cos(a)*34,-46+Math.sin(a)*48,5,5,'#f7b749',ink);}box(c,-44,-5,88,7,'#785344');c.restore();
    },
    platform(c,p){
      const deep=p.h||28;box(c,p.x,p.y,p.w,deep,'#785344');box(c,p.x+3,p.y+7,p.w-6,deep-10,'#a77750');
      for(let x=p.x+8;x<p.x+p.w-4;x+=24){box(c,x,p.y+16,10,5,'#ca9968');box(c,x+7,p.y+22,4,4,'#785344');}
      box(c,p.x-3,p.y-5,p.w+6,9,'#76934b');box(c,p.x,p.y-7,p.w,4,'#bad0ac');
      for(let x=p.x;x<p.x+p.w;x+=13){box(c,x,p.y+2,7,5+(x%3),'#76934b');box(c,x+4,p.y-9,3,4,'#bad0ac');}
      for(let x=p.x+15;x<p.x+p.w;x+=79){shape(c,[[x,p.y+deep-2],[x+4,p.y+deep+9],[x+8,p.y+deep-2]],'#76934b',null);}
    }
  };
})();
