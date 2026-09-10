'use strict';
(() => {
  const G = window.Game,
    knownUnlocks = ['supply-route', 'relic-choice'];
  const empty = () => ({
    records: [],
    best: 0,
    byJob: { warrior: 0, archer: 0, mage: 0 },
    seenItems: [],
    seenRelics: [],
    unlocks: []
  });
  const integer = (v, max = 1e9) => Number.isSafeInteger(v) && v >= 0 && v <= max;
  const string = (v, max = 160) => typeof v === 'string' && v.length <= max;
  const list = (v, predicate) => Array.isArray(v) && v.length <= 500 && v.every(predicate);
  const details = r => {
    const choices = r.choices || [],
      events = r.events || [],
      gearGained = r.gearGained || [];
    if (
      !list(
        choices,
        c =>
          c &&
          integer(c.stage, 40) &&
          string(c.id, 80) &&
          [
            'defeat',
            'survival',
            'escort',
            'defense',
            'boss',
            'elite',
            'event',
            'shop',
            'rest'
          ].includes(c.type)
      ) ||
      choices.length > 40
    )
      throw Error('Invalid route history');
    if (
      !list(
        events,
        e =>
          e &&
          integer(e.stage, 40) &&
          string(e.eventId, 80) &&
          string(e.choice, 80) &&
          string(e.result, 500)
      ) ||
      events.length > 40
    )
      throw Error('Invalid event history');
    if (!list(gearGained, id => Object.hasOwn(G.items, id)) || gearGained.length > 40)
      throw Error('Invalid equipment history');
    return {
      choices: choices.map(c => ({ stage: c.stage, id: c.id, type: c.type })),
      events: events.map(e => ({
        stage: e.stage,
        eventId: e.eventId,
        choice: e.choice,
        result: e.result
      })),
      gearGained: [...gearGained],
      ...(r.outcome == null ? {} : { outcome: G.parseOutcome(r.outcome) })
    };
  };
  G.parseMeta = raw => {
    if (raw === undefined) return empty();
    if (
      !raw ||
      typeof raw !== 'object' ||
      !Array.isArray(raw.records) ||
      raw.records.length > 100 ||
      !integer(raw.best, 40) ||
      !raw.byJob
    )
      throw Error('Invalid history');
    for (const job of Object.keys(G.jobs))
      if (!integer(raw.byJob[job], 40)) throw Error('Invalid job record');
    if (
      !list(raw.seenItems, id => Object.hasOwn(G.items, id)) ||
      !list(raw.seenRelics, id => Object.hasOwn(G.relicCatalog || {}, id)) ||
      !list(raw.unlocks, id => knownUnlocks.includes(id))
    )
      throw Error('Invalid codex');
    const records = raw.records.map(r => {
      if (
        !r ||
        !string(r.id) ||
        !integer(r.seed, 4294967295) ||
        typeof r.daily !== 'boolean' ||
        !Object.hasOwn(G.jobs, r.job) ||
        !integer(r.stage, 40) ||
        !Number.isFinite(r.elapsedSeconds) ||
        r.elapsedSeconds < 0 ||
        r.elapsedSeconds > 1e8 ||
        !string(r.cause) ||
        !string(r.at, 40) ||
        typeof r.completed !== 'boolean' ||
        !list(r.builds, id => string(id, 60)) ||
        !list(r.relics, id => Object.hasOwn(G.relicCatalog || {}, id))
      )
        throw Error('Invalid run record');
      return {
        ...details(r),
        id: r.id,
        seed: r.seed,
        daily: r.daily,
        job: r.job,
        stage: r.stage,
        elapsedSeconds: r.elapsedSeconds,
        cause: r.cause,
        at: r.at,
        completed: r.completed,
        builds: [...r.builds],
        relics: [...r.relics]
      };
    });
    return {
      records,
      best: raw.best,
      byJob: { ...raw.byJob },
      seenItems: [...new Set(raw.seenItems)],
      seenRelics: [...new Set(raw.seenRelics)],
      unlocks: [...new Set(raw.unlocks)]
    };
  };
  G.meta = empty();
  G.recordCodex = () => {
    for (const id of G.p.inventory || [])
      if (!G.meta.seenItems.includes(id)) G.meta.seenItems.push(id);
    for (const id of G.p.run?.relics || [])
      if (!G.meta.seenRelics.includes(id)) G.meta.seenRelics.push(id);
  };
  G.history = () =>
    G.meta.records.map(r => ({
      ...r,
      ...details(r),
      builds: [...r.builds],
      relics: [...r.relics]
    }));
  G.codex = () => ({
    items: Object.values(G.items).map(i => ({
      id: i.id,
      name: i.name,
      seen: G.meta.seenItems.includes(i.id)
    })),
    relics: Object.entries(G.relicCatalog || {}).map(([id, r]) => ({
      id,
      name: r.name,
      seen: G.meta.seenRelics.includes(id)
    })),
    unlocks: [...G.meta.unlocks],
    best: G.meta.best,
    byJob: { ...G.meta.byJob }
  });
  G.recordRunResult = summary => {
    const r = {
      ...details(summary),
      id: String(summary.id ?? `${summary.seed}:${summary.job}:${G.p.run?.startedAt || 0}`),
      seed: summary.seed >>> 0,
      daily: summary.daily === true,
      job: summary.job || G.p.job,
      builds: summary.builds || [G.p.run?.build].filter(Boolean),
      relics: summary.relics || [],
      elapsedSeconds: Math.max(0, summary.elapsedSeconds || 0),
      stage: Math.max(0, Math.min(40, summary.stage || 0)),
      cause: String(summary.cause || 'complete'),
      completed: summary.completed === true || summary.cause === 'complete',
      at: new Date().toISOString()
    };
    if (G.meta.records.some(item => item.id === r.id)) return false;
    G.recordCodex();
    G.meta.records.unshift(r);
    G.meta.records = G.meta.records.slice(0, 100);
    G.meta.best = Math.max(G.meta.best, r.stage);
    G.meta.byJob[r.job] = Math.max(G.meta.byJob[r.job] || 0, r.stage);
    if (r.stage >= 10 && !G.meta.unlocks.includes('supply-route'))
      G.meta.unlocks.push('supply-route');
    if (r.stage >= 20 && !G.meta.unlocks.includes('relic-choice'))
      G.meta.unlocks.push('relic-choice');
    return true;
  };
  G.dailySeed = (dateISO = new Date().toISOString().slice(0, 10)) => {
    if (
      typeof dateISO !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dateISO) ||
      new Date(`${dateISO}T00:00:00Z`).toISOString().slice(0, 10) !== dateISO
    )
      throw Error('Invalid UTC date');
    let hash = 2166136261;
    for (const c of `maple-v4:${dateISO}`) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
    return hash >>> 0;
  };
  G.startDailyRun = (job = G.p.job) => {
    if (G.p.run?.active || !Object.hasOwn(G.jobs, job)) return false;
    const original = G.p;
    const previous = JSON.parse(JSON.stringify(original));
    delete previous.run;
    const next = G.defaults();
    next.job = job;
    next.materials = 0;
    G.p = next;
    G.initializeGear();
    try {
      G.startRun({ seed: G.dailySeed(), daily: true });
      if (!G.p.run?.active) {
        G.p = original;
        return false;
      }
      G.p.run.dailyReturn = previous;
      G.save();
      return true;
    } catch {
      G.p = original;
      return false;
    }
  };
  const leaveRun = G.leaveRun;
  G.leaveRun = () => {
    const result = leaveRun();
    if (result && G.restoreDailyLoadout()) {
      G.populate();
      G.save();
    }
    return result;
  };
  G.restoreDailyLoadout = () => {
    const run = G.p.run;
    if (!run?.daily || !run.dailyReturn) return false;
    if (!['complete', 'failed'].includes(run.phase)) {
      G.recordRunResult({
        id: run.id || [run.seed, run.job, run.startedAt || 0].join(':'),
        seed: run.seed,
        job: run.job,
        daily: true,
        stage: run.stage,
        elapsedSeconds: run.elapsedSeconds,
        choices: run.choices,
        events: run.events,
        gearGained: run.gearGained,
        builds: [run.build].filter(Boolean),
        relics: run.relics,
        cause: 'abandoned'
      });
      run.phase = 'failed';
    }
    const restored = run.dailyReturn;
    delete run.dailyReturn;
    run.active = false;
    restored.run = run;
    G.p = restored;
    return true;
  };
})();
