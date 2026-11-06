// Card data for Agent Decker by Manuel Correia (CC BY-NC 4.0).
// Transcribed from AgentDecker_cards_full_art.pdf (Nov 2016). Names and texts
// live in the i18n dictionaries under `cards.<key>`.

export type Res = 's' | 'f';
export type CostKind = 's' | 'f' | 'a';
export type ObstacleType = 'person' | 'location' | 'animal' | 'electronic' | 'door';
export type CardSet = 'start' | 'base' | 'B' | 'D' | 'F' | 'H';
export type ItemKind = 'keycard' | 'chloroform' | 'emp';

export type Ability =
  | 'patrol'
  | 'guardDog'
  | 'radioTower'
  | 'siren'
  | 'inspector'
  | 'dormitory'
  | 'sniper'
  | 'watchtower'
  | 'barrel'
  | 'clumsy'
  | 'hawk';

export type Effect =
  | 'draw1'
  | 'draw2'
  | 'draw3'
  | 'rockOrDraw'
  | 'flashy'
  | 'misdirect'
  | 'bin'
  | 'burn'
  | 'recall'
  | 'gearUp'
  | 'planAhead'
  | 'foresight'
  | 'justTheThing'
  | 'swap'
  | 'retrace'
  | 'distraction'
  | 'toObstacles'
  | 'saveBullets';

export interface ObstacleDef {
  type: ObstacleType;
  cost: [CostKind, number];
  alarm: number;
  ability?: Ability;
}

export interface TopDef {
  res?: [Res, number];
  effect?: Effect;
  keep?: boolean;
  item?: ItemKind;
  /** Resource granted once per turn while equipped. */
  bonus?: [Res, number];
}

export interface CardDef {
  key: string;
  set: CardSet;
  count: number;
  obstacle?: ObstacleDef;
  top: TopDef;
}

const o = (type: ObstacleType, cost: [CostKind, number], alarm: number, ability?: Ability): ObstacleDef => ({
  type,
  cost,
  alarm,
  ability,
});

export const CARDS: CardDef[] = [
  // Starting deck
  { key: 'hide', set: 'start', count: 3, top: { res: ['s', 1] } },
  { key: 'punch', set: 'start', count: 5, top: { res: ['f', 1] } },

  // Obstacle deck (22)
  { key: 'guard', set: 'base', count: 3, obstacle: o('person', ['f', 2], 4), top: { res: ['f', 2] } },
  { key: 'patrolling-guard', set: 'base', count: 2, obstacle: o('person', ['a', 5], 5, 'patrol'), top: { effect: 'draw2' } },
  { key: 'motion-sensor-hall', set: 'base', count: 1, obstacle: o('location', ['a', 6], 6), top: { res: ['s', 3] } },
  { key: 'waste-room', set: 'base', count: 2, obstacle: o('location', ['a', 6], 3), top: { effect: 'bin' } },
  { key: 'guard-dog', set: 'base', count: 2, obstacle: o('animal', ['f', 5], 6, 'guardDog'), top: { res: ['s', 1], effect: 'draw1' } },
  { key: 'sentry-gun', set: 'base', count: 1, obstacle: o('electronic', ['f', 5], 6), top: { res: ['f', 3] } },
  { key: 'security-camera', set: 'base', count: 5, obstacle: o('electronic', ['s', 2], 8), top: { res: ['s', 2] } },
  { key: 'gym-door', set: 'base', count: 1, obstacle: o('door', ['a', 9], 3), top: { effect: 'flashy' } },
  { key: 'sleeping-guard', set: 'base', count: 1, obstacle: o('person', ['s', 3], 0), top: { item: 'keycard', keep: true } },
  { key: 'infirmary', set: 'base', count: 1, obstacle: o('location', ['s', 3], 3), top: { item: 'chloroform', keep: true } },
  { key: 'yard-door', set: 'base', count: 2, obstacle: o('door', ['s', 4], 4), top: { effect: 'rockOrDraw' } },
  { key: 'radio-tower', set: 'base', count: 1, obstacle: o('location', ['a', 7], 6, 'radioTower'), top: { effect: 'misdirect' } },

  // Mission obstacles B (added after Mission 1)
  { key: 'siren', set: 'B', count: 1, obstacle: o('electronic', ['a', 12], 5, 'siren'), top: { effect: 'gearUp' } },
  { key: 'locker-room', set: 'B', count: 1, obstacle: o('location', ['a', 8], 3), top: { res: ['s', 1], keep: true, bonus: ['s', 1] } },
  { key: 'inspector', set: 'B', count: 1, obstacle: o('person', ['s', 7], 5, 'inspector'), top: { effect: 'recall' } },

  // Mission obstacles D (added after Mission 2)
  { key: 'archive-door', set: 'D', count: 1, obstacle: o('door', ['f', 8], 4), top: { effect: 'planAhead' } },
  { key: 'dormitory', set: 'D', count: 1, obstacle: o('location', ['a', 16], 7, 'dormitory'), top: { effect: 'distraction' } },
  { key: 'engineering-bay', set: 'D', count: 1, obstacle: o('location', ['s', 8], 6), top: { item: 'emp', keep: true } },
  { key: 'cctv-room-door', set: 'D', count: 1, obstacle: o('door', ['s', 12], 7), top: { effect: 'retrace' } },

  // Mission obstacles F (added after Mission 3)
  { key: 'sniper', set: 'F', count: 1, obstacle: o('person', ['f', 10], 6, 'sniper'), top: { effect: 'justTheThing' } },
  { key: 'watchtower', set: 'F', count: 1, obstacle: o('location', ['s', 12], 7, 'watchtower'), top: { effect: 'foresight' } },
  { key: 'prison-door', set: 'F', count: 1, obstacle: o('door', ['f', 10], 5), top: { res: ['f', 1], keep: true, bonus: ['f', 1] } },
  { key: 'flammable-barrel', set: 'F', count: 1, obstacle: o('electronic', ['a', 14], 3, 'barrel'), top: { effect: 'burn' } },
  { key: 'guard-with-bazooka', set: 'F', count: 1, obstacle: o('person', ['f', 8], 10), top: { res: ['f', 5], effect: 'toObstacles' } },

  // Mission obstacles H (added after Mission 4)
  { key: 'tech-container', set: 'H', count: 1, obstacle: o('electronic', ['a', 10], 5), top: { res: ['s', 4], effect: 'toObstacles' } },
  { key: 'chain-link-fence', set: 'H', count: 1, obstacle: o('location', ['s', 7], 5), top: { effect: 'saveBullets' } },
  { key: 'laser-hall', set: 'H', count: 1, obstacle: o('location', ['s', 14], 10), top: { effect: 'draw3' } },
  { key: 'clumsy-guard', set: 'H', count: 1, obstacle: o('person', ['f', 8], 6, 'clumsy'), top: { res: ['f', 3] } },
  { key: 'armored-guard', set: 'H', count: 1, obstacle: o('person', ['f', 12], 8), top: { res: ['f', 4] } },
  { key: 'hawk', set: 'H', count: 1, obstacle: o('animal', ['f', 12], 6, 'hawk'), top: { effect: 'swap' } },
];

export const CARD_BY_KEY: Record<string, CardDef> = Object.fromEntries(CARDS.map((c) => [c.key, c]));

/** Instance ids look like `guard#2`; mission rewards are `mission-1` … `mission-4`. */
export const keyOf = (id: string): string => id.split('#')[0];
export const defOf = (id: string): CardDef | undefined => CARD_BY_KEY[keyOf(id)];

export function instancesOf(set: CardSet): string[] {
  const ids: string[] = [];
  for (const c of CARDS) {
    if (c.set !== set) continue;
    for (let i = 1; i <= c.count; i++) ids.push(`${c.key}#${i}`);
  }
  return ids;
}

export const ITEM_TARGET: Record<ItemKind, ObstacleType> = {
  keycard: 'door',
  chloroform: 'person',
  emp: 'electronic',
};

// ---------- Missions ----------

export type Reward =
  | { kind: 'bonus'; res: [Res, number] } // Map
  | { kind: 'interactions'; n: number }
  | { kind: 'handSize'; n: number }
  | { kind: 'win' };

export interface MissionDef {
  n: number;
  card: string; // image key and equip id of the reward
  goal: { pay?: [CostKind, number]; item?: string; hand?: number; allDown?: boolean };
  reward: Reward;
  rewardKeep: boolean;
  /** Mission obstacles added to the obstacles discard when this mission is completed. */
  nextSet?: CardSet;
}

export const MISSIONS: MissionDef[] = [
  { n: 1, card: 'mission-1', goal: { pay: ['s', 6] }, reward: { kind: 'bonus', res: ['s', 1] }, rewardKeep: true, nextSet: 'B' },
  { n: 2, card: 'mission-2', goal: { pay: ['f', 6], item: 'locker-room' }, reward: { kind: 'interactions', n: 2 }, rewardKeep: true, nextSet: 'D' },
  { n: 3, card: 'mission-3', goal: { hand: 7 }, reward: { kind: 'handSize', n: 5 }, rewardKeep: false, nextSet: 'F' },
  { n: 4, card: 'mission-4', goal: { pay: ['a', 18], item: 'prison-door' }, reward: { kind: 'interactions', n: 3 }, rewardKeep: false, nextSet: 'H' },
  { n: 5, card: 'mission-5', goal: { allDown: true }, reward: { kind: 'win' }, rewardKeep: false },
];

export const missionDef = (n: number): MissionDef => MISSIONS[n - 1];
export const isMissionReward = (id: string) => id.startsWith('mission-');
