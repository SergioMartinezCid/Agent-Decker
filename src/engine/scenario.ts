// Build exact game states for tests and the developer scenario menu.

import { CARDS, MISSIONS, defOf, instancesOf, keyOf } from './cards';
import { blankState } from './engine';
import type { GameState, LineCard } from './types';

export interface ScenarioSpec {
  seed?: number;
  mission?: number;
  alarm?: number;
  scores?: number[];
  /** Card keys or ids; `{ c, down }` for knocked-out cards; null for gaps. Index 0 = entry side. */
  line?: (string | { c: string; down?: boolean } | null)[];
  hand?: string[];
  equip?: string[];
  deck?: string[];
  discard?: string[];
  play?: string[];
  obsDeck?: string[];
  obsDiscard?: string[];
  pool?: { s: number; f: number };
  interactions?: number;
  turn?: number;
  /** Fill the obstacle deck with the unused obstacles available at this mission. Default true. */
  fillObstacles?: boolean;
  /** Fill the player's deck with Hide/Punch cards not already used. Default true. */
  fillDeck?: boolean;
}

/** Turns keys into unique instance ids (`guard` -> `guard#1`, then `guard#2`, …). */
export function idMaker() {
  const used = new Set<string>();
  return (ref: string): string => {
    if (ref.includes('#') || ref.startsWith('mission-')) {
      used.add(ref);
      return ref;
    }
    if (!defOf(ref)) throw new Error(`unknown card ${ref}`);
    for (let i = 1; ; i++) {
      const id = `${ref}#${i}`;
      if (!used.has(id)) {
        used.add(id);
        return id;
      }
    }
  };
}

export function scenario(spec: ScenarioSpec): GameState {
  const s = blankState(spec.seed ?? 12345);
  const id = idMaker();
  s.mission = spec.mission ?? 1;
  s.alarm = spec.alarm ?? 0;
  s.scores = spec.scores ?? [];
  s.turn = spec.turn ?? 1;
  const line = spec.line ?? [];
  s.line = Array.from({ length: 6 }, (_, i): LineCard | null => {
    const ref = line[i];
    if (ref === null || ref === undefined) return null;
    if (typeof ref === 'string') return { id: id(ref), down: false };
    return { id: id(ref.c), down: !!ref.down };
  });
  s.hand = (spec.hand ?? []).map(id);
  s.equip = (spec.equip ?? []).map(id);
  s.play = (spec.play ?? []).map(id);
  s.discard = (spec.discard ?? []).map(id);
  s.deck = (spec.deck ?? []).map(id);
  s.obsDiscard = (spec.obsDiscard ?? []).map(id);
  s.obsDeck = (spec.obsDeck ?? []).map(id);

  const taken = new Set([
    ...s.line.filter(Boolean).map((lc) => lc!.id),
    ...s.hand,
    ...s.equip,
    ...s.play,
    ...s.discard,
    ...s.deck,
    ...s.obsDiscard,
    ...s.obsDeck,
  ]);
  if (spec.fillObstacles !== false && !spec.obsDeck) {
    const sets = ['base', ...MISSIONS.slice(0, s.mission - 1).map((m) => m.nextSet!)] as const;
    for (const set of sets) for (const oid of instancesOf(set)) if (!taken.has(oid)) s.obsDeck.push(oid);
  }
  if (spec.fillDeck !== false && !spec.deck) {
    for (const oid of instancesOf('start')) if (!taken.has(oid)) s.deck.push(oid);
  }
  s.pool = spec.pool ?? { s: 0, f: 0 };
  s.interactions = spec.interactions ?? 0;
  return s;
}

/** All card keys that have an obstacle half, for UI galleries. */
export const OBSTACLE_KEYS = CARDS.filter((c) => c.obstacle).map((c) => c.key);
export const keyList = (ids: string[]) => ids.map(keyOf);
