'use strict';
(() => {
  const G = window.Game,
    roles = ['charger', 'ranged', 'shield', 'leaper', 'bomber', 'summoner', 'healer', 'stealth'];
  G.spawnEncounterWave = () => {
    const r = G.p.run,
      boss = r.nodeType === 'boss',
      elite = r.nodeType === 'elite';
    r.wave++;
    const count = boss || elite ? 3 : 2 + ((r.stage + r.wave) % 3);
    for (let i = 0; i < count; i++) {
      const isBoss = boss && r.wave === 1 && i === count - 1,
        chapter = Math.floor((r.stage - 1) / 10),
        x = 450 + ((i * 330 + r.wave * 127) % 1000);
      G.enemies.push(
        G.spawnEnemy({
          x,
          y: 610,
          kind: isBoss ? 'boss' : i % 2 ? 'mushroom' : 'slime',
          role: elite
            ? ['ranged', 'shield', 'healer'][i]
            : roles[(r.stage + r.wave + i) % roles.length],
          elite: elite && i === 2,
          bossId: isBoss ? ['forest', 'cavern', 'frost', 'twilight'][chapter] : undefined,
          zone: G.p.zone,
          level: r.entryLevel + chapter * 2,
          platform: 0,
          hp: isBoss ? 420 + chapter * 120 : 55 + chapter * 18,
          damage: 7 + chapter * 3 + (elite ? 4 : 0)
        })
      );
    }
    G.snapshotRun();
  };
  G.enterEncounter = type => {
    const r = G.p.run;
    r.phase = 'battle';
    r.nodeType = r.stage % 10 === 0 ? 'boss' : type;
    r.wave = 0;
    r.waveClock = 0;
    r.rewards = [];
    G.runArena();
    G.p.zone = ['cavern', 'frost'].includes(G.runInfo().biome) ? 'cavern' : 'forest';
    G.p.x = 180;
    G.p.y = 610;
    G.clearRunMotion();
    G.enemies = [];
    const kind = r.nodeType;
    const target =
      kind === 'survival'
        ? 55 + (r.stage % 3) * 10
        : kind === 'escort'
          ? 1100
          : kind === 'defense'
            ? 50
            : ['boss', 'elite'].includes(kind)
              ? 2
              : 3;
    r.objective = {
      type: kind,
      label: {
        elite: '정예 치유사 우선 처치 · 아군 회복 오라 차단',
        boss: '수호자와 호위대를 처치하세요',
        defeat: '세 차례 습격을 격퇴하세요',
        survival: '끝까지 살아남으세요',
        escort: '반딧불 곁에서 호송하세요',
        defense: '수정 근처를 지켜 충전하세요'
      }[kind],
      target,
      current: 0,
      remaining: target,
      x: 240,
      y: 610,
      health: 100,
      timeLeft: kind === 'defense' ? 100 : 300
    };
    G.spawnEncounterWave();
    G.save();
  };
  G.killRunEnemy = e => {
    const r = G.p.run;
    if (!r.active || r.phase !== 'battle' || e.dead > 0) return;
    e.hp = 0;
    e.dead = 1;
    const gold = e.kind === 'boss' ? 120 : 14;
    G.p.gold += gold;
    G.gainXp(e.kind === 'boss' ? 100 : 12);
    G.emit(e.x, e.y - 40, `+${gold} GOLD`, '#f7b749');
    G.save();
  };
  G.onEnemyDefeated = G.killRunEnemy;
  G.updateEncounter = dt => {
    const r = G.p.run;
    if (
      !r?.active ||
      r.phase !== 'battle' ||
      G.paused ||
      !G.running ||
      !Number.isFinite(dt) ||
      dt <= 0
    )
      return;
    dt = Math.min(dt, 0.25);
    r.elapsedSeconds += dt;
    r.waveClock += dt;
    const o = r.objective,
      alive = G.enemies.filter(e => e.hp > 0),
      near = alive.filter(e => Math.abs(e.x - o.x) < 130 && Math.abs(e.y - 610) < 70);
    o.timeLeft = Math.max(0, o.timeLeft - dt);
    if (o.type === 'survival') o.current += dt;
    if (o.type === 'escort') {
      if (Math.abs(G.p.x - o.x) < 180 && Math.abs(G.p.y - 610) < 120 && !near.length) {
        o.x += dt * 42;
        o.current = o.x - 240;
      }
      o.health = Math.max(0, o.health - near.length * dt * 3);
    }
    if (o.type === 'defense') {
      o.x = 800;
      if (Math.abs(G.p.x - o.x) < 210 && Math.abs(G.p.y - 610) < 160 && !near.length)
        o.current += dt;
      o.health = Math.max(0, o.health - near.length * dt * 2);
    }
    if (o.type === 'elite' && alive.some(e => e.elite))
      for (const e of alive) if (!e.elite) e.hp = Math.min(e.maxHp, e.hp + dt * 3);
    if (['boss', 'defeat', 'elite'].includes(o.type)) {
      o.current = r.wave - (alive.length ? 1 : 0);
      if (!alive.length && r.wave < o.target && r.waveClock > 2) {
        r.waveClock = 0;
        G.spawnEncounterWave();
      }
    } else if (r.waveClock >= 14 && alive.length < 7 && o.current < o.target) {
      r.waveClock = 0;
      G.spawnEncounterWave();
    }
    o.remaining = Math.max(0, o.target - o.current);
    if (o.health <= 0 || (['escort', 'defense'].includes(o.type) && o.timeLeft === 0)) {
      G.failRun('objective');
      return;
    }
    if (o.current >= o.target) {
      if (o.type === 'elite') {
        G.p.gold += 90;
        G.p.materials = (G.p.materials || 0) + 3;
        G.emit(G.p.x, G.p.y - 100, '+90 GOLD +3 재료', '#f7b749');
      }
      G.completeEncounter();
      return;
    }
    if (
      Math.floor(r.elapsedSeconds) !== Math.floor(r.elapsedSeconds - dt) &&
      Math.floor(r.elapsedSeconds) % 5 === 0
    )
      G.save();
  };
})();
