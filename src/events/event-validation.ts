'use strict';
(() => {
  const G = window.Game;
  class EventSnapshotError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'EventSnapshotError';
    }
  }
  const record = (raw: unknown): raw is Record<string, unknown> =>
    typeof raw === 'object' && raw !== null && !Array.isArray(raw);
  const validSnapshot = (raw: unknown): raw is MapleForest.EventSnapshot => {
    if (!record(raw)) return false;
    const data = G.runEventCatalog.find(event => event.id === raw['id']);
    if (!data) return false;
    const roll = raw['roll'],
      relic = raw['relic'],
      result = raw['result'],
      choice = raw['choice'];
    if (typeof roll !== 'number' || !Number.isFinite(roll) || roll < 0 || roll > 1) return false;
    if (
      relic !== undefined &&
      relic !== null &&
      relic !== false &&
      relic !== 0 &&
      relic !== '' &&
      (typeof relic !== 'string' || !Object.hasOwn(G.relicCatalog || {}, relic))
    )
      return false;
    if (result !== null && typeof result !== 'string') return false;
    if (choice !== null && choice !== 'leave' && !data.choices.some(option => option.id === choice))
      return false;
    return true;
  };
  // The run parser retains its recursive safe(raw) boundary before this structural check.
  G.parseEventSnapshot = raw => {
    if (raw === null) return null;
    if (!validSnapshot(raw)) throw new EventSnapshotError('Invalid event');
    if ((raw.result === null) !== (raw.choice === null))
      throw new EventSnapshotError('Invalid event result');
    return raw;
  };
})();
