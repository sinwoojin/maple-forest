'use strict';
(() => {
  const G = window.Game;
  G.bossPatterns = {
    forest: ['root', 'charge', 'summon'],
    cavern: ['crystal', 'ring', 'summon'],
    frost: ['ice', 'blizzard', 'leap'],
    twilight: ['rift', 'crossfire', 'eclipse']
  };
  G.updateBossAI = (e, dt) => {
    e.phase = e.hp / e.maxHp > 0.65 ? 1 : e.hp / e.maxHp > 0.3 ? 2 : 3;
    e.bossId ||= e.zone === 'cavern' ? 'cavern' : 'forest';
    e.aiCooldown = (e.aiCooldown ?? 1.5) - dt;
    e.dir = Math.sign(G.p.x - e.x) || 1;
    if (e.stun > 0) return;
    e.x += e.dir * (e.slow > 0 ? 18 : 36) * dt;
    if (e.aiCooldown > 0) return;
    e.moveIndex = (e.moveIndex || 0) + 1;
    const moves = G.bossPatterns[e.bossId] || G.bossPatterns.forest,
      move = moves[(e.moveIndex - 1) % moves.length],
      p = G.p;
    e.aiCooldown = 3.2 - e.phase * 0.35;
    const d = (e.damage || 22) + e.phase * 2;
    if (move === 'root')
      for (let i = 0; i < e.phase + 1; i++)
        G.warn(e, 'root', p.x + (i - e.phase / 2) * 120, 610, 48, d, 1.2);
    if (move === 'charge')
      G.warn(e, 'charge', e.x + e.dir * 120, 610, 155, d, 0.85, { onResolve: 'bossCharge' });
    if (move === 'summon' && G.enemies.filter(x => !x.dead).length < 14)
      for (let i = 0; i < e.phase; i++)
        G.warn(e, 'summon', e.x + i * 90 - 90, 610, 40, 0, 1.2, {
          onResolve: 'summon',
          summonRole: e.bossId === 'cavern' ? 'bomber' : 'charger'
        });
    if (move === 'crystal')
      for (let i = 0; i < e.phase + 2; i++)
        G.warn(e, 'crystal', p.x + (i - 1) * 90, 610, 35, d, 1.1 + i * 0.15);
    if (move === 'ring')
      for (const side of [-1, 1])
        G.warn(e, 'shockwave', e.x + side * 150, 610, 85, d, 1, { groundOnly: true });
    if (move === 'ice') G.warn(e, 'ice', p.x, 610, 110, d, 1.3, { slowPlayer: 2 });
    if (move === 'blizzard')
      for (let i = 0; i < 3 + e.phase; i++)
        G.warn(e, 'blizzard', e.x - 300 + i * 140, 610, 45, d, 1.5 + i * 0.1, { slowPlayer: 1 });
    if (move === 'leap') G.warn(e, 'leap', p.x, 610, 130, d, 1.1, { onResolve: 'leap' });
    if (move === 'rift')
      for (const offset of [-160, 160]) G.warn(e, 'rift', p.x + offset, 610, 85, d, 0.9);
    if (move === 'crossfire')
      for (const side of [-1, 1])
        G.warn(e, 'darkbolt', p.x + side * 350, p.y - 35, 18, d, 1, {
          onResolve: 'projectile',
          vx: -side * 360
        });
    if (move === 'eclipse') G.warn(e, 'eclipse', e.x, 610, 300, d + 8, 1.8, { groundOnly: true });
  };
})();
