'use strict';
(() => {
  const G = window.Game;
  G.settings = {
    sfx: false,
    bgm: false,
    intensity: 'full',
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches
  };
  let context,
    step = 0;
  const notes = [
    261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23, 261.63, 392, 523.25, 392, 246.94,
    293.66, 392, 293.66
  ];
  function tone(frequency, duration, volume) {
    try {
      context ||= new (window.AudioContext || window.webkitAudioContext)();
      context.resume();
      const o = context.createOscillator(),
        a = context.createGain();
      o.type = 'triangle';
      o.frequency.value = frequency;
      a.gain.setValueAtTime(volume, context.currentTime);
      a.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
      o.connect(a);
      a.connect(context.destination);
      o.start();
      o.stop(context.currentTime + duration);
    } catch {
      G.settings.sfx = false;
      G.settings.bgm = false;
    }
  }
  G.beep = (frequency, duration = 0.1) => {
    if (G.settings.sfx) tone(frequency, duration, 0.045);
  };
  G.applySettings = () => {
    G.sound = G.settings.sfx;
    document.documentElement.dataset.motion = G.settings.reducedMotion ? 'reduced' : 'full';
  };
  setInterval(() => {
    if (G.settings.bgm && G.running && !G.paused && !document.hidden)
      tone(notes[step++ % notes.length], 0.65, 0.025);
  }, 420);
})();
