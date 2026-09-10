declare namespace MapleForest {
  type EventId =
    | 'spring'
    | 'bridge'
    | 'smith'
    | 'shrine'
    | 'fox'
    | 'archive'
    | 'garden'
    | 'gambler'
    | 'ghost'
    | 'nest'
    | 'crystal'
    | 'caravan';
  type RunPhase = 'battle' | 'route' | 'event' | 'shop' | 'rest' | 'reward' | 'complete' | 'failed';
  type JobId = 'warrior' | 'archer' | 'mage';
  type ResourceKey = 'gold' | 'potions' | 'materials' | 'mp';
  type EventCost = Readonly<Partial<Record<ResourceKey, number>>> & { readonly job?: JobId };
  interface EffectRewards {
    readonly gold?: number;
    readonly potions?: number;
    readonly materials?: number;
    readonly attack?: number;
    readonly defense?: number;
    readonly hurt?: number;
    readonly heal?: number;
    readonly mana?: number;
    readonly relic?: boolean;
  }
  type Effect =
    | (EffectRewards & { readonly chance?: never; readonly win?: never; readonly lose?: never })
    | ({ readonly chance: number; readonly win: Effect; readonly lose: Effect } & {
        readonly [Key in keyof EffectRewards]?: never;
      });
  interface EventOption {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly effect: Effect;
    readonly cost: EventCost;
  }
  interface EventDefinition {
    readonly id: EventId;
    readonly title: string;
    readonly description: string;
    readonly choices: readonly EventOption[];
  }
  // Snapshots and player state are deliberately mutable: the legacy engine owns them.
  interface EventSnapshot {
    id: EventId;
    roll: number;
    relic?: string | null | false | 0 | undefined;
    result: string | null;
    choice: string | null;
  }
  interface EventHistoryEntry {
    readonly stage: number;
    readonly eventId: EventId;
    readonly choice: string;
    readonly result: string;
  }
  interface EventRunState {
    active: boolean;
    phase: RunPhase;
    stage: number;
    event: EventSnapshot | null;
    events: EventHistoryEntry[];
    relics: string[];
    buffs: { attack: number; defense: number };
  }
  interface EventPlayerState {
    job: JobId;
    gold: number;
    potions: number;
    materials: number;
    mp: number;
    hp: number;
    maxHp: number;
    maxMp: number;
    run: EventRunState;
  }
  interface EventChoiceView {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly chance?: number | undefined;
    readonly randomReward?: boolean;
    readonly enabled: boolean;
    readonly reason: string;
  }
  interface EventView {
    readonly id: EventId;
    readonly title: string;
    readonly description: string;
    readonly result: string | null;
    readonly choices: readonly EventChoiceView[];
  }
  // This is the event slice's JavaScript adapter contract, not whole-engine coverage.
  interface LegacyEventHost {
    p: EventPlayerState;
    runEventCatalog: readonly EventDefinition[];
    relicCatalog?: Readonly<Record<string, unknown>>;
    runRandom(salt: number): number;
    grantRelic?: (id: string) => boolean;
    save(): boolean;
    openRunUI?: () => void;
    prepareRunEvent(): void;
    eventView(): EventView | null;
    chooseEventOption(id: string): boolean;
    parseEventSnapshot(raw: unknown): EventSnapshot | null;
  }
}
interface Window {
  Game: MapleForest.LegacyEventHost;
}
