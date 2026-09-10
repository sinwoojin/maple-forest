// Generated from src/events/events.ts. Edit the TypeScript source and run npm run build:typed.
'use strict';
(() => {
    const G = window.Game;
    class InvalidEventStateError extends Error {
        constructor(message) {
            super(message);
            this.name = 'InvalidEventStateError';
        }
    }
    const definition = (id) => {
        const data = G.runEventCatalog.find(event => event.id === id);
        if (!data)
            throw new InvalidEventStateError(`Unknown event: ${id}`);
        return data;
    };
    const resourceKey = (key) => key === 'gold' || key === 'potions' || key === 'materials' || key === 'mp';
    G.prepareRunEvent = () => {
        const r = G.p.run;
        const index = (Math.floor(G.runRandom(99) * 12) + r.events.length) % 12;
        const unseen = G.runEventCatalog.filter(e => !r.events.some(v => v.eventId === e.id));
        const data = unseen.length ? unseen[index % unseen.length] : G.runEventCatalog[index];
        if (!data)
            throw new InvalidEventStateError('Event catalog selection is missing');
        r.event = {
            id: data.id,
            roll: G.runRandom(101),
            relic: Object.keys(G.relicCatalog || {}).filter(id => !r.relics.includes(id))[Math.floor(G.runRandom(103) *
                Object.keys(G.relicCatalog || {}).filter(id => !r.relics.includes(id)).length)] || null,
            result: null,
            choice: null
        };
    };
    const reason = (c) => {
        const p = G.p;
        for (const [key, value] of Object.entries(c.cost)) {
            if (key === 'job' && p.job !== value)
                return '직업 조건 불충족';
            if (resourceKey(key) && typeof value === 'number' && (p[key] || 0) < value)
                return `${key} 부족`;
        }
        return '';
    };
    G.eventView = () => {
        const e = G.p.run.event;
        if (!e)
            return null;
        const data = definition(e.id);
        return {
            id: data.id,
            title: data.title,
            description: data.description,
            result: e.result,
            choices: [
                ...data.choices.map(c => ({
                    id: c.id,
                    title: c.title,
                    description: c.description,
                    chance: c.effect.chance,
                    randomReward: !!c.effect.relic,
                    enabled: !e.result && !reason(c),
                    reason: reason(c)
                })),
                {
                    id: 'leave',
                    title: '조용히 지나간다',
                    description: '비용과 보상 없이 계속',
                    enabled: !e.result,
                    reason: ''
                }
            ]
        };
    };
    const apply = (effect) => {
        const p = G.p, r = p.run;
        if (!r.event)
            throw new InvalidEventStateError('Cannot apply an effect without an event');
        if (effect.chance !== undefined) {
            const won = r.event.roll < effect.chance;
            apply(won ? effect.win : effect.lose);
            return won ? '행운이 따랐습니다.' : '기대와 다른 결과였습니다.';
        }
        for (const key of ['gold', 'potions', 'materials'])
            p[key] = (p[key] || 0) + (effect[key] || 0);
        for (const key of ['attack', 'defense'])
            r.buffs[key] += effect[key] || 0;
        if (effect.hurt)
            p.hp = Math.max(1, p.hp - Math.ceil(p.maxHp * effect.hurt));
        if (effect.heal)
            p.hp = Math.min(p.maxHp, p.hp + Math.ceil(p.maxHp * effect.heal));
        if (effect.mana)
            p.mp = p.maxMp;
        if (effect.relic) {
            if (r.event.relic)
                G.grantRelic?.(r.event.relic);
            else
                p.gold += 50;
        }
        return '선택한 보상을 받았습니다.';
    };
    G.chooseEventOption = id => {
        const r = G.p.run;
        if (!r.active || r.phase !== 'event' || !r.event || r.event.result)
            return false;
        const data = definition(r.event.id), c = data.choices.find(v => v.id === id);
        if (id !== 'leave' && (!c || reason(c)))
            return false;
        r.event.choice = id;
        r.event.result = '아무 일 없이 지나갔습니다.';
        if (c) {
            for (const [key, value] of Object.entries(c.cost)) {
                if (resourceKey(key) && typeof value === 'number')
                    G.p[key] -= value;
            }
            r.event.result = apply(c.effect);
        }
        r.events.push({ stage: r.stage, eventId: r.event.id, choice: id, result: r.event.result });
        G.save();
        G.openRunUI?.();
        return true;
    };
})();
