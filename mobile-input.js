'use strict';
(() => {
  const G=window.Game, pointers=new Map(), keyboard=new Map();
  const modal=()=>document.getElementById('modal');
  const allowed=()=>G.running&&!G.paused&&!modal().open&&(!G.p.run?.active||G.p.run.phase==='battle');
  const sync=()=>{
    for(const action of ['left','right','attack']) {
      const held=[...pointers.values()].some(v=>v.action===action)||[...keyboard.values()].includes(action);
      if(held&&allowed())G.keys.add(action);else G.keys.delete(action);
    }
  };
  G.clearInput=()=>{pointers.clear();keyboard.clear();G.keys.clear();document.querySelectorAll('[data-pressed]').forEach(b=>b.removeAttribute('data-pressed'));};
  G.bindInputs=()=>{
    const holds={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',KeyZ:'attack'};
    const actions={ShiftLeft:'dodge',ShiftRight:'dodge',Space:'jump',ArrowUp:'jump',KeyW:'jump',KeyX:'skill',KeyC:'potion',KeyE:'interact'};
    window.addEventListener('keydown',e=>{
      if(e.code==='Escape'){e.preventDefault();if(modal().open)G.UI.close();else G.UI.pause();return;}
      if(e.target.matches('input,select,textarea,[contenteditable=true]'))return;
      if(e.code==='Slash'&&e.shiftKey){e.preventDefault();G.UI.help();return;}
      if(e.code==='KeyI'&&!e.repeat&&!modal().open){e.preventDefault();G.UI.inventory();return;}
      if(!G.running||G.paused)return;
      if(holds[e.code]||actions[e.code])e.preventDefault();
      if(holds[e.code]&&allowed()){keyboard.set(e.code,holds[e.code]);sync();}
      if(!e.repeat&&actions[e.code])G.act(actions[e.code]);
    });
    window.addEventListener('keyup',e=>{keyboard.delete(e.code);sync();});
    for(const b of document.querySelectorAll('[data-action],[data-hold]')) {
      const action=b.dataset.hold||b.dataset.action,hold=!!b.dataset.hold||action==='attack';
      b.addEventListener('pointerdown',e=>{
        if(e.button!==0||b.disabled||!G.running||G.paused)return;
        e.preventDefault();b.setPointerCapture(e.pointerId);b.dataset.pressed='true';
        pointers.set(e.pointerId,{action:hold?action:null,button:b});
        if(hold)sync();if(!b.dataset.hold)G.act(action);
      });
      const release=e=>{pointers.delete(e.pointerId);if(![...pointers.values()].some(v=>v.button===b))b.removeAttribute('data-pressed');sync();};
      for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,release);
      b.addEventListener('click',e=>{if(e.detail===0&&!b.disabled)G.act(action);});
      b.addEventListener('contextmenu',e=>e.preventDefault());
    }
    const suspend=()=>{G.clearInput();if(G.running){G.save();if(!G.paused)G.UI.pause();}};
    window.addEventListener('blur',suspend);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});
    window.addEventListener('pagehide',suspend);
    screen.orientation?.addEventListener('change',suspend);
    window.addEventListener('orientationchange',suspend);
    let portrait=innerHeight>=innerWidth;
    window.addEventListener('resize',()=>{const next=innerHeight>=innerWidth;if(next!==portrait){portrait=next;suspend();}});
    let gesture;
    modal().addEventListener('pointerdown',e=>{if(e.pointerType==='touch')gesture={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};},true);
    modal().addEventListener('pointermove',e=>{if(gesture?.id===e.pointerId&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>10)gesture.moved=true;},true);
    modal().addEventListener('pointercancel',()=>{if(gesture)gesture.moved=true;},true);
    modal().addEventListener('click',e=>{if(gesture?.moved&&e.detail!==0){e.preventDefault();e.stopImmediatePropagation();}gesture=null;},true);
  };
})();
