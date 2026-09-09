'use strict';
(() => {
  const A=window.Art;
  A.stageBackground=(c,camera,t,w,h,info)=>{
    const cave=info.biome==='cavern'||info.biome==='frost';
    (cave?A.cavernBackground:A.background)(c,camera,t,w,h);
    if(info.biome==='frost'){
      const light=c.createLinearGradient(0,0,0,610);light.addColorStop(0,'#c2edf055');light.addColorStop(1,'#659ca811');c.fillStyle=light;c.fillRect(0,0,w,h);
      c.strokeStyle='#c2edf0';c.lineWidth=2;
      for(let i=0;i<14;i++){const x=i*133-camera*.6,y=100+(i*73)%330;c.beginPath();c.moveTo(x-5,y);c.lineTo(x+5,y);c.moveTo(x,y-5);c.lineTo(x,y+5);c.stroke();}
    }
    if(info.biome==='twilight'){
      const dusk=c.createLinearGradient(0,0,0,610);dusk.addColorStop(0,'#483b65cc');dusk.addColorStop(1,'#483b6533');c.fillStyle=dusk;c.fillRect(0,0,w,h);
      c.fillStyle='#fff9e9';for(let i=0;i<22;i++)c.fillRect(i*137-camera*.15,35+(i*31)%160,2,2);
    }
  };
  A.stagePlatform=(c,p,info)=>{
    const cave=info.biome==='cavern'||info.biome==='frost';(cave?A.cavernPlatform:A.platform)(c,p);
    if(info.biome==='frost'){c.fillStyle='#c2edf0';c.fillRect(p.x,p.y-7,p.w,5);for(let x=p.x+10;x<p.x+p.w;x+=47){c.beginPath();c.moveTo(x,p.y-3);c.lineTo(x+4,p.y+12);c.lineTo(x+8,p.y-3);c.fill();}}
  };
  A.stageForeground=(c,camera,t,w,h,info)=>{(info.biome==='cavern'||info.biome==='frost'?A.cavernForeground:A.foreground)(c,camera,t,w,h);};
})();
