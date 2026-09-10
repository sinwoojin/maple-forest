'use strict';
(() => {
  const G = window.Game;
  const types = ['defeat', 'survival', 'escort', 'defense', 'elite', 'boss'];
  const number = (v, min, max) =>
    typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
  G.parseOutcome = raw => {
    if (raw === undefined || raw === null) return null;
    if (
      typeof raw !== 'object' ||
      Array.isArray(raw) ||
      typeof raw.cause !== 'string' ||
      raw.cause.length === 0 ||
      raw.cause.length > 100 ||
      !types.includes(raw.objectiveType) ||
      !Number.isInteger(raw.stage) ||
      !number(raw.stage, 1, 40) ||
      !number(raw.current, 0, 3000) ||
      !number(raw.target, 1, 2000) ||
      !number(raw.health, 0, 100) ||
      !number(raw.timeLeft, 0, 300) ||
      !number(raw.maxHp, 1, 1e7) ||
      !number(raw.hp, 0, raw.maxHp)
    )
      throw Error('Invalid expedition outcome');
    return {
      cause: raw.cause,
      objectiveType: raw.objectiveType,
      stage: raw.stage,
      current: raw.current,
      target: raw.target,
      health: raw.health,
      timeLeft: raw.timeLeft,
      hp: raw.hp,
      maxHp: raw.maxHp
    };
  };
  G.parseRunDetails = r => {
    if (r.rulesVersion === undefined) r.rulesVersion = 1;
    if (![1, 2].includes(r.rulesVersion)) throw Error('Unknown expedition rules');
    r.nextEncounter ??= null;
    if (r.nextEncounter !== null && !types.slice(0, 4).includes(r.nextEncounter))
      throw Error('Invalid upcoming encounter');
    if (r.seenObjectives === undefined) r.seenObjectives = [];
    if (
      !Array.isArray(r.seenObjectives) ||
      r.seenObjectives.length > 6 ||
      r.seenObjectives.some(type => !types.includes(type)) ||
      new Set(r.seenObjectives).size !== r.seenObjectives.length
    )
      throw Error('Invalid objective guidance');
    r.outcome = G.parseOutcome(r.outcome);
    if (
      r.outcome &&
      (!['complete', 'failed'].includes(r.phase) ||
        r.outcome.stage !== r.stage ||
        r.outcome.objectiveType !== r.nodeType)
    )
      throw Error('Unexpected expedition outcome');
    if (r.routes !== undefined && !Array.isArray(r.routes)) throw Error('Invalid route offers');
    for (const route of r.routes || [])
      if (
        r.rulesVersion === 2 &&
        (!route ||
          typeof route !== 'object' ||
          !types.includes(route.encounter) ||
          (!['event', 'shop', 'rest'].includes(route.type) && route.encounter !== route.type) ||
          (route.type === 'boss' ? route.encounter !== 'boss' : route.encounter === 'boss') ||
          (['event', 'shop', 'rest'].includes(route.type) &&
            !types.slice(0, 4).includes(route.encounter)))
      )
        throw Error('Invalid route encounter');
    if (r.rulesVersion === 2 && r.started) {
      const pending = ['event', 'shop', 'rest'].includes(r.phase);
      if (pending !== (r.nextEncounter !== null)) throw Error('Missing upcoming encounter');
    }
    return r;
  };
})();
