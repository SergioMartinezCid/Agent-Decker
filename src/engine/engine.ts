// Agent Decker rules engine. Pure functions: (state, action) -> result.
// Every ruling referenced here is documented in docs/rulings.md.

import {
  type CostKind,
  type Res,
  ITEM_TARGET,
  defOf,
  instancesOf,
  isMissionReward,
  keyOf,
  missionDef,
} from './cards';
import { shuffle } from './rng';
import {
  type Action,
  type Frame,
  type GameEvent,
  type GameState,
  type Line,
  type LineCard,
  type Result,
  ALARM_LIMIT,
  LINE_SIZE,
} from './types';

export class RuleError extends Error {}

interface Ctx {
  s: GameState;
  events: GameEvent[];
  frames: Frame[];
  barrier: boolean;
}

const fail = (msg: string): never => {
  throw new RuleError(msg);
};

const LOG_LIMIT = 80;

// ---------------------------------------------------------------- queries

export const obstacleOf = (id: string) => defOf(id)?.obstacle;
export const emptyLine = (): Line => Array.from({ length: LINE_SIZE }, () => null);

export function isFaceUp(lc: LineCard | null | undefined): lc is LineCard {
  return !!lc && !lc.down;
}

export function isPerson(lc: LineCard | null | undefined): boolean {
  return isFaceUp(lc) && obstacleOf(lc.id)?.type === 'person';
}

export function abilityOf(lc: LineCard | null | undefined) {
  return isFaceUp(lc) ? obstacleOf(lc.id)?.ability : undefined;
}

export function abilityInLine(line: Line, ability: string): boolean {
  return line.some((lc) => abilityOf(lc) === ability);
}

export function rightmost(line: Line): number {
  for (let i = LINE_SIZE - 1; i >= 0; i--) if (line[i]) return i;
  return -1;
}

export function faceUpPersons(line: Line): number {
  return line.filter((lc) => isPerson(lc)).length;
}

/** Sniper can't be interacted with — nor knocked out by other cards — unless it's the only face-up person. */
export function sniperProtected(line: Line, slot: number): boolean {
  const lc = line[slot];
  return abilityOf(lc) === 'sniper' && faceUpPersons(line) > 1;
}

export function interactionLimit(s: GameState): number {
  if (s.equip.includes('mission-4')) return 3;
  if (s.equip.includes('mission-2')) return 2;
  return 1;
}

export function handSize(s: GameState): number {
  return s.equip.includes('mission-3') ? 5 : 4;
}

export function isKeep(id: string): boolean {
  if (isMissionReward(id)) return missionDef(Number(id.slice(8))).rewardKeep;
  return !!defOf(id)?.top.keep;
}

export function keepCount(s: GameState): number {
  return s.equip.filter(isKeep).length;
}

export function equipBonus(id: string): [Res, number] | undefined {
  if (id === 'mission-1') return ['s', 1];
  return defOf(id)?.top.bonus;
}

export function effectiveCost(s: GameState, slot: number): [CostKind, number] {
  const lc = s.line[slot];
  const ob = lc ? obstacleOf(lc.id) : undefined;
  if (!ob) return ['a', 0];
  let n = ob.cost[1];
  for (const j of [slot - 1, slot + 1]) {
    if (j >= 0 && j < LINE_SIZE && abilityOf(s.line[j]) === 'watchtower') n += 2;
  }
  return [ob.cost[0], n];
}

export function canAfford(pool: { s: number; f: number }, [k, n]: [CostKind, number]): boolean {
  if (k === 's') return pool.s >= n;
  if (k === 'f') return pool.f >= n;
  return pool.s + pool.f >= n;
}

/** Default split for a cost: exact amounts, Stealth first for "any" costs. */
export function defaultPayment(pool: { s: number; f: number }, cost: [CostKind, number]) {
  if (!canAfford(pool, cost)) return null;
  const [k, n] = cost;
  if (k === 's') return { s: n, f: 0 };
  if (k === 'f') return { s: 0, f: n };
  const s = Math.min(pool.s, n);
  return { s, f: n - s };
}

export type Blocked = 'phase' | 'faceDown' | 'limit' | 'sniper' | 'hawk';

export interface InteractInfo {
  slot: number;
  id: string;
  cost: [CostKind, number];
  blocked?: Blocked;
  affordable: boolean;
  /** Keycard / Chloroform / E.M.P. in hand or equipped that match this obstacle's type. */
  items: string[];
  canEquip: boolean;
  clumsyTargets: number[];
}

export function interactInfo(s: GameState, slot: number): InteractInfo | null {
  const lc = s.line[slot];
  if (!lc) return null;
  const ob = obstacleOf(lc.id);
  if (!ob) return null;
  const cost = effectiveCost(s, slot);
  let blocked: Blocked | undefined;
  if (s.phase !== 'play' || s.pending) blocked = 'phase';
  else if (lc.down) blocked = 'faceDown';
  else if (s.interactions >= interactionLimit(s)) blocked = 'limit';
  else if (ob.ability === 'sniper' && faceUpPersons(s.line) > 1) blocked = 'sniper';
  else if (cost[0] === 's' && abilityInLine(s.line, 'hawk')) blocked = 'hawk';
  const items = [...s.hand, ...s.equip].filter((id) => {
    const it = defOf(id)?.top.item;
    return !!it && ITEM_TARGET[it] === ob.type;
  });
  const clumsyTargets =
    ob.ability === 'clumsy' && !lc.down
      ? [slot - 1, slot + 1].filter(
          (j) => j >= 0 && j < LINE_SIZE && isFaceUp(s.line[j]) && !sniperProtected(s.line, j),
        )
      : [];
  return {
    slot,
    id: lc.id,
    cost,
    blocked,
    affordable: canAfford(s.pool, cost),
    items,
    canEquip: !!defOf(lc.id)?.top.keep,
    clumsyTargets,
  };
}

export interface PlayInfo {
  canPlay: boolean;
  canEquip: boolean;
}

export function playInfo(s: GameState, id: string): PlayInfo {
  const top = defOf(id)?.top;
  const ok = s.phase === 'play' && !s.pending && s.hand.includes(id);
  return { canPlay: ok && !!(top?.res || top?.effect), canEquip: ok && !!top?.keep };
}

export interface MissionStatus {
  ok: boolean;
  pay?: { kind: CostKind; need: number; have: number };
  item?: { key: string; ok: boolean };
  hand?: { need: number; have: number };
  down?: { need: number; have: number };
}

export function missionStatus(s: GameState): MissionStatus {
  const g = missionDef(s.mission).goal;
  const st: MissionStatus = { ok: true };
  if (g.pay) {
    const [kind, need] = g.pay;
    const have = kind === 's' ? s.pool.s : kind === 'f' ? s.pool.f : s.pool.s + s.pool.f;
    st.pay = { kind, need, have };
    if (have < need) st.ok = false;
  }
  if (g.item) {
    const ok = s.equip.some((id) => keyOf(id) === g.item);
    st.item = { key: g.item, ok };
    if (!ok) st.ok = false;
  }
  if (g.hand) {
    st.hand = { need: g.hand, have: s.hand.length };
    if (s.hand.length < g.hand) st.ok = false;
  }
  if (g.allDown) {
    const have = s.line.filter((lc) => lc && lc.down).length;
    st.down = { need: LINE_SIZE, have };
    if (have < LINE_SIZE) st.ok = false;
  }
  if (s.phase !== 'play' || s.pending) st.ok = false;
  return st;
}

/** Alarm the next Line Scroll would add (rightmost card, if face up). */
export function nextExitAlarm(s: GameState): number {
  const i = rightmost(s.line);
  if (i < 0) return 0;
  const lc = s.line[i]!;
  return lc.down ? 0 : (obstacleOf(lc.id)?.alarm ?? 0);
}

// ---------------------------------------------------------------- helpers

function log(ctx: Ctx, k: string, p?: Record<string, string | number>) {
  ctx.s.log.push({ turn: ctx.s.turn, k, p });
  if (ctx.s.log.length > LOG_LIMIT) ctx.s.log.splice(0, ctx.s.log.length - LOG_LIMIT);
}

function frame(ctx: Ctx) {
  const { s } = ctx;
  ctx.frames.push({
    line: s.line.map((lc) => (lc ? { ...lc } : null)),
    alarm: s.alarm,
    obsDeck: s.obsDeck.length,
    obsDiscard: s.obsDiscard.length,
  });
}

function swap(line: Line, a: number, b: number) {
  [line[a], line[b]] = [line[b], line[a]];
}

function draw(ctx: Ctx, n: number): number {
  const { s } = ctx;
  let k = 0;
  for (; k < n; k++) {
    if (!s.deck.length) {
      if (!s.discard.length) break;
      s.deck = shuffle(s, s.discard);
      s.discard = [];
      log(ctx, 'shuffleDeck');
      ctx.events.push({ t: 'shuffle' });
    }
    s.hand.push(s.deck.shift()!);
  }
  if (k) {
    ctx.barrier = true;
    ctx.events.push({ t: 'draw', n: k });
  }
  return k;
}

/** Before looking at the top `n` cards: if the deck is short, shuffle the discard pile under it. */
function ensureDeck(ctx: Ctx, n: number) {
  const { s } = ctx;
  if (s.deck.length < n && s.discard.length) {
    s.deck = [...s.deck, ...shuffle(s, s.discard)];
    s.discard = [];
    log(ctx, 'shuffleDeck');
    ctx.events.push({ t: 'shuffle' });
  }
}

function takeFrom(list: string[], id: string): boolean {
  const i = list.indexOf(id);
  if (i < 0) return false;
  list.splice(i, 1);
  return true;
}

function addBonus(s: GameState, id: string) {
  const b = equipBonus(id);
  if (b) s.pool[b[0]] += b[1];
}

// ---------------------------------------------------------------- line

function patrolMove(ctx: Ctx, i: number): boolean {
  const { line } = ctx.s;
  if (i < LINE_SIZE - 1 && line[i + 1]) {
    swap(line, i, i + 1);
    log(ctx, 'patrol', { card: keyOf(line[i + 1]!.id) });
    ctx.events.push({ t: 'slide' });
    frame(ctx);
    return true;
  }
  return false;
}

function guardDog(ctx: Ctx, i: number) {
  const { line } = ctx.s;
  let best = -1;
  let bestD = Infinity;
  for (let j = 0; j < LINE_SIZE; j++) {
    if (j === i || !isPerson(line[j])) continue;
    const d = Math.abs(j - i);
    if (d < bestD || (d === bestD && j > i)) {
      best = j;
      bestD = d;
    }
  }
  if (best < 0 || bestD <= 1) return;
  const step = best > i ? 1 : -1;
  let k = i;
  while (Math.abs(best - k) > 1) {
    swap(line, k, k + step);
    k += step;
  }
  log(ctx, 'dog', { card: keyOf(line[k]!.id), target: keyOf(line[best]!.id) });
  ctx.events.push({ t: 'slide' });
  frame(ctx);
}

function radioTower(ctx: Ctx, r: number) {
  const { line } = ctx.s;
  let moved = false;
  let packed = r;
  for (let j = r + 1; j < LINE_SIZE; j++) {
    if (!isPerson(line[j])) continue;
    let k = j;
    while (k > packed + 1) {
      swap(line, k, k - 1);
      k--;
      moved = true;
    }
    packed = k;
  }
  packed = r;
  for (let j = r - 1; j >= 0; j--) {
    if (!isPerson(line[j])) continue;
    let k = j;
    while (k < packed - 1) {
      swap(line, k, k + 1);
      k++;
      moved = true;
    }
    packed = k;
  }
  if (moved) {
    log(ctx, 'tower');
    ctx.events.push({ t: 'slide' });
    frame(ctx);
  }
}

/** "When … appears" abilities: on entering the line, or when the Inspector flips a card. */
function appear(ctx: Ctx, i: number) {
  const ab = abilityOf(ctx.s.line[i]);
  if (ab === 'patrol') patrolMove(ctx, i);
  else if (ab === 'guardDog') guardDog(ctx, i);
  else if (ab === 'radioTower') radioTower(ctx, i);
}

/** Fill empty positions right to left, resolving arrival abilities one card at a time. */
function refill(ctx: Ctx): boolean {
  const { s } = ctx;
  const need = s.line.filter((lc) => !lc).length;
  if (s.obsDeck.length + s.obsDiscard.length < need) return false;
  for (;;) {
    let i = -1;
    for (let j = LINE_SIZE - 1; j >= 0; j--) {
      if (!s.line[j]) {
        i = j;
        break;
      }
    }
    if (i < 0) break;
    if (!s.obsDeck.length) {
      s.obsDeck = shuffle(s, s.obsDiscard);
      s.obsDiscard = [];
      log(ctx, 'shuffleObs');
      ctx.events.push({ t: 'shuffle' });
    }
    const id = s.obsDeck.shift()!;
    s.line[i] = { id, down: false };
    ctx.barrier = true;
    log(ctx, 'enter', { card: keyOf(id), slot: i + 1 });
    ctx.events.push({ t: 'enter' });
    frame(ctx);
    appear(ctx, i);
  }
  return true;
}

/** Move cards right as far as they can. A face-up Dormitory pins face-down cards in place. */
export function slideLine(line: Line): Line {
  const dorm = abilityInLine(line, 'dormitory');
  const out: Line = Array.from({ length: LINE_SIZE }, () => null);
  if (!dorm) {
    const cards = line.filter((lc): lc is LineCard => !!lc);
    cards.forEach((lc, i) => (out[LINE_SIZE - cards.length + i] = lc));
    return out;
  }
  const free: number[] = [];
  line.forEach((lc, i) => {
    if (lc && lc.down) out[i] = lc;
    else free.push(i);
  });
  const movers = line.filter((lc): lc is LineCard => !!lc && !lc.down);
  const slots = free.slice(free.length - movers.length);
  movers.forEach((lc, k) => (out[slots[k]] = lc));
  return out;
}

function lineScroll(ctx: Ctx) {
  const { s } = ctx;
  const last = rightmost(s.line);
  if (last >= 0) {
    const lc = s.line[last]!;
    s.line[last] = null;
    s.obsDiscard.push(lc.id);
    ctx.events.push({ t: 'exit' });
    if (lc.down) {
      log(ctx, 'exitDown', { card: keyOf(lc.id) });
    } else {
      const n = obstacleOf(lc.id)?.alarm ?? 0;
      s.alarm += n;
      log(ctx, 'exit', { card: keyOf(lc.id), n, total: s.alarm });
      if (n) ctx.events.push({ t: 'alarm', n, total: s.alarm });
      if (obstacleOf(lc.id)?.ability === 'siren') {
        for (let i = 0; i < LINE_SIZE; i++) {
          const other = s.line[i];
          if (other) {
            s.obsDiscard.push(other.id);
            s.line[i] = null;
          }
        }
        log(ctx, 'siren');
      }
    }
    frame(ctx);
  }
  if (s.alarm >= ALARM_LIMIT) return;

  const slid = slideLine(s.line);
  if (slid.some((lc, i) => lc !== s.line[i])) {
    s.line = slid;
    ctx.events.push({ t: 'slide' });
    frame(ctx);
  }

  // Line Scroll abilities, right to left (designer: a/19685897, a/27041620).
  const actors: string[] = [];
  for (let i = LINE_SIZE - 1; i >= 0; i--) {
    const ab = abilityOf(s.line[i]);
    if (ab === 'patrol' || ab === 'inspector') actors.push(s.line[i]!.id);
  }
  for (const id of actors) {
    const i = s.line.findIndex((lc) => lc?.id === id);
    if (i < 0 || !isFaceUp(s.line[i])) continue;
    const ab = abilityOf(s.line[i]);
    if (ab === 'patrol') patrolMove(ctx, i);
    else if (ab === 'inspector') {
      const li = rightmost(s.line);
      const target = s.line[li];
      if (target && target.down) {
        target.down = false;
        log(ctx, 'inspector', { card: keyOf(target.id) });
        ctx.events.push({ t: 'flip' });
        frame(ctx);
        appear(ctx, li);
      }
    }
  }
}

/** The line as the next Line Scroll will leave it, before new cards come in. For hints only. */
export function scrollPreview(s: GameState): Line {
  const ctx: Ctx = { s: structuredClone(s), events: [], frames: [], barrier: false };
  lineScroll(ctx);
  return ctx.s.line;
}

/** Distraction: pull a card back to the start of the line; the cards it passes shift right. */
function moveToStart(ctx: Ctx, k: number) {
  const { line } = ctx.s;
  let carry = line[k];
  if (!carry) fail('empty slot');
  line[k] = null;
  log(ctx, 'distraction', { card: keyOf(carry!.id) });
  for (let j = 0; j < LINE_SIZE && carry; j++) {
    const tmp = line[j];
    line[j] = carry;
    carry = tmp;
  }
  ctx.events.push({ t: 'slide' });
}

/** Knock out a card as a side effect of another obstacle (Flammable Barrel, Clumsy Guard). */
function knockOutBy(ctx: Ctx, j: number, viaInteraction: boolean): boolean {
  const lc = ctx.s.line[j];
  if (!isFaceUp(lc) || sniperProtected(ctx.s.line, j)) return false;
  lc.down = true;
  ctx.events.push({ t: 'knockout' });
  log(ctx, 'sideKnockout', { card: keyOf(lc.id) });
  // Knocking out the Barrel through Clumsy Guard is interacting with it (a/25688990).
  if (viaInteraction && obstacleOf(lc.id)?.ability === 'barrel') barrel(ctx, j);
  return true;
}

function barrel(ctx: Ctx, i: number) {
  for (const j of [i - 1, i + 1]) if (j >= 0 && j < LINE_SIZE) knockOutBy(ctx, j, false);
}

// ---------------------------------------------------------------- turn flow

function beginTurn(ctx: Ctx) {
  const { s } = ctx;
  s.turn++;
  s.pool = { s: 0, f: 0 };
  for (const id of s.equip) addBonus(s, id);
  s.interactions = 0;
  s.saveBullets = false;
  log(ctx, 'turn', { n: s.turn });
}

function gameOver(ctx: Ctx, reason: 'alarm' | 'time') {
  ctx.s.phase = 'gameOver';
  ctx.s.gameOver = reason;
  log(ctx, reason === 'alarm' ? 'gameOverAlarm' : 'gameOverTime');
  ctx.events.push({ t: 'gameOver' });
}

function completeMission(ctx: Ctx) {
  const { s } = ctx;
  const m = missionDef(s.mission);
  s.scores.push(s.alarm);
  log(ctx, 'missionComplete', { n: s.mission, alarm: s.alarm });
  if (m.reward.kind === 'win') {
    s.phase = 'won';
    ctx.events.push({ t: 'won' });
    return;
  }
  s.equip.push(m.card);
  s.phase = 'missionComplete';
  ctx.events.push({ t: 'mission' });
}

function requirePlay(s: GameState) {
  if (s.phase !== 'play') fail('not in play phase');
  if (s.pending) fail('a choice is pending');
}

function requireSubset(pool: string[], picked: string[] | undefined, max = Infinity): string[] {
  const list = picked ?? [];
  if (new Set(list).size !== list.length) fail('duplicate cards');
  if (list.length > max) fail('too many cards');
  for (const id of list) if (!pool.includes(id)) fail(`card not available: ${id}`);
  return list;
}

// ---------------------------------------------------------------- actions

function doPlay(ctx: Ctx, a: Extract<Action, { t: 'play' }>) {
  const { s } = ctx;
  requirePlay(s);
  const top = defOf(a.card)?.top;
  if (!top || (!top.res && !top.effect)) fail('card is not playable');
  if (!takeFrom(s.hand, a.card)) fail('card not in hand');
  if (top!.effect === 'toObstacles') s.obsDiscard.push(a.card);
  else s.play.push(a.card);
  if (top!.res) s.pool[top!.res[0]] += top!.res[1];
  log(ctx, 'play', { top: keyOf(a.card) });
  ctx.events.push({ t: 'play' });

  switch (top!.effect) {
    case 'draw1':
      draw(ctx, 1);
      break;
    case 'draw2':
      draw(ctx, 2);
      break;
    case 'draw3':
      draw(ctx, 3);
      break;
    case 'rockOrDraw':
      if (a.choice === 'draw') draw(ctx, 1);
      else s.pool.f += 1;
      break;
    case 'flashy':
      s.pool.f += Math.floor(s.discard.length / 2);
      break;
    case 'misdirect': {
      const cards = requireSubset(s.hand, a.cards);
      for (const id of cards) {
        takeFrom(s.hand, id);
        s.play.push(id);
      }
      s.pool.s += 2 * cards.length;
      break;
    }
    case 'bin': {
      const cards = requireSubset(s.hand, a.cards);
      for (const id of cards) {
        takeFrom(s.hand, id);
        s.removed.push(id);
      }
      if (cards.length) log(ctx, 'removed', { n: cards.length });
      break;
    }
    case 'burn': {
      const cards = requireSubset(s.discard, a.cards, 2);
      for (const id of cards) {
        takeFrom(s.discard, id);
        s.removed.push(id);
      }
      if (cards.length) log(ctx, 'removed', { n: cards.length });
      break;
    }
    case 'recall': {
      if (!s.discard.length) break;
      const [id] = requireSubset(s.discard, a.cards, 1);
      if (!id) fail('choose a card from your discard pile');
      takeFrom(s.discard, id);
      s.hand.push(id);
      break;
    }
    case 'gearUp':
      draw(ctx, Math.min(3, keepCount(s)));
      break;
    case 'planAhead':
      ensureDeck(ctx, 3);
      if (s.deck.length) s.pending = { kind: 'planAhead', cards: s.deck.slice(0, 3) };
      ctx.barrier = true;
      break;
    case 'foresight':
      ensureDeck(ctx, 5);
      if (s.deck.length) s.pending = { kind: 'foresight', cards: s.deck.slice(0, 5) };
      ctx.barrier = true;
      break;
    case 'justTheThing':
      if (s.deck.length) s.pending = { kind: 'justTheThing', cards: [...s.deck] };
      ctx.barrier = true;
      break;
    case 'swap':
      [s.deck, s.discard] = [s.discard, s.deck];
      ctx.barrier = true;
      break;
    case 'retrace':
      s.obsDeck = shuffle(s, [...s.obsDeck, ...s.obsDiscard]);
      s.obsDiscard = [];
      ctx.events.push({ t: 'shuffle' });
      break;
    case 'distraction':
      if (a.slot === undefined || !s.line[a.slot]) fail('choose a card in the line');
      moveToStart(ctx, a.slot!);
      break;
    case 'saveBullets':
      s.saveBullets = true;
      break;
    default:
      break;
  }
}

function doEquip(ctx: Ctx, id: string) {
  const { s } = ctx;
  requirePlay(s);
  if (!defOf(id)?.top.keep) fail('only KEEP cards can be equipped');
  if (!takeFrom(s.hand, id)) fail('card not in hand');
  s.equip.push(id);
  addBonus(s, id);
  log(ctx, 'equip', { top: keyOf(id) });
  ctx.events.push({ t: 'equip' });
}

function doInteract(ctx: Ctx, a: Extract<Action, { t: 'interact' }>) {
  const { s } = ctx;
  const info = interactInfo(s, a.slot);
  if (!info) fail('no obstacle there');
  if (info!.blocked) fail(`cannot interact: ${info!.blocked}`);
  const lc = s.line[a.slot]!;
  const def = defOf(lc.id)!;
  const ob = def.obstacle!;

  if ('item' in a.pay) {
    const item = a.pay.item;
    if (!info!.items.includes(item)) fail('that item cannot be used here');
    if (!takeFrom(s.hand, item)) takeFrom(s.equip, item);
    // Card text: "Place … in your discard" goes straight to the discard pile (a/38014670).
    s.discard.push(item);
    log(ctx, 'item', { item: keyOf(item), card: keyOf(lc.id) });
  } else {
    const { s: ps, f: pf } = a.pay;
    const [k, n] = info!.cost;
    const valid =
      Number.isInteger(ps) &&
      Number.isInteger(pf) &&
      ps >= 0 &&
      pf >= 0 &&
      (k === 's' ? ps === n && pf === 0 : k === 'f' ? pf === n && ps === 0 : ps + pf === n);
    if (!valid) fail('payment does not match the cost');
    if (s.pool.s < ps || s.pool.f < pf) fail('not enough resources');
    s.pool.s -= ps;
    s.pool.f -= pf;
  }
  s.interactions++;

  if (a.outcome === 'clumsy') {
    if (ob.ability !== 'clumsy') fail('only Clumsy Guard can do that');
    if (a.target === undefined || !info!.clumsyTargets.includes(a.target)) fail('invalid target');
    log(ctx, 'clumsy', { card: keyOf(s.line[a.target!]!.id) });
    knockOutBy(ctx, a.target!, true);
    return;
  }

  // Flammable Barrel triggers on any interaction, before it leaves the line.
  if (ob.ability === 'barrel') barrel(ctx, a.slot);

  if (a.outcome === 'knockout') {
    lc.down = true;
    log(ctx, 'knockout', { card: keyOf(lc.id) });
    ctx.events.push({ t: 'knockout' });
  } else if (a.outcome === 'disarm') {
    s.line[a.slot] = null;
    s.play.push(lc.id);
    log(ctx, 'disarm', { card: keyOf(lc.id) });
    ctx.events.push({ t: 'disarm' });
  } else if (a.outcome === 'equip') {
    if (!def.top.keep) fail('only KEEP cards can be equipped');
    s.line[a.slot] = null;
    s.equip.push(lc.id);
    addBonus(s, lc.id);
    log(ctx, 'disarmEquip', { card: keyOf(lc.id) });
    ctx.events.push({ t: 'disarm' });
  } else {
    fail('unknown outcome');
  }
}

function isPermutation(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const x = [...a].sort();
  const y = [...b].sort();
  return x.every((v, i) => v === y[i]);
}

function doResolve(ctx: Ctx, a: Extract<Action, { t: 'resolve' }>) {
  const { s } = ctx;
  const p = s.pending;
  if (!p) fail('nothing to resolve');
  if (p!.kind === 'planAhead') {
    const n = p!.cards.length;
    if (!a.keep || !p!.cards.includes(a.keep)) fail('choose a card to keep');
    const rest = p!.cards.filter((c) => c !== a.keep);
    const order = a.order ?? rest;
    if (!isPermutation(order, rest)) fail('invalid order');
    s.deck = [...order, ...s.deck.slice(n)];
    s.hand.push(a.keep!);
  } else if (p!.kind === 'foresight') {
    const order = a.order ?? p!.cards;
    if (!isPermutation(order, p!.cards)) fail('invalid order');
    s.deck = [...order, ...s.deck.slice(p!.cards.length)];
  } else {
    if (!a.card || !s.deck.includes(a.card)) fail('choose a card from your deck');
    const rest = s.deck.filter((c) => c !== a.card);
    s.deck = [a.card!, ...shuffle(s, rest)];
  }
  s.pending = null;
}

function doEndTurn(ctx: Ctx, save?: string) {
  const { s } = ctx;
  requirePlay(s);
  if (missionStatus(s).ok) {
    completeMission(ctx);
    return;
  }
  frame(ctx);
  lineScroll(ctx);
  if (s.alarm >= ALARM_LIMIT) {
    gameOver(ctx, 'alarm');
    return;
  }
  if (!refill(ctx)) {
    gameOver(ctx, 'time');
    return;
  }
  let saved: string | undefined;
  if (s.saveBullets && save) {
    if (!s.hand.includes(save)) fail('saved card must be in hand');
    saved = save;
  }
  s.discard.push(...s.hand.filter((id) => id !== saved), ...s.play);
  s.hand = saved ? [saved] : [];
  s.play = [];
  draw(ctx, Math.max(0, handSize(s) - s.hand.length));
  beginTurn(ctx);
  ctx.barrier = true;
}

function doNextMission(ctx: Ctx) {
  const { s } = ctx;
  if (s.phase !== 'missionComplete') fail('no mission to advance from');
  const prev = missionDef(s.mission);
  s.mission++;
  if (prev.nextSet) s.obsDiscard.push(...instancesOf(prev.nextSet));
  const lineIds = s.line.filter((lc): lc is LineCard => !!lc).map((lc) => lc.id);
  s.obsDeck = shuffle(s, [...s.obsDiscard, ...lineIds, ...s.obsDeck]);
  s.obsDiscard = [];
  s.line = emptyLine();
  s.alarm = 0;
  s.deck = shuffle(s, [...s.hand, ...s.play, ...s.discard, ...s.deck]);
  s.hand = [];
  s.play = [];
  s.discard = [];
  s.pending = null;
  s.saveBullets = false;
  s.phase = 'play';
  log(ctx, 'missionStart', { n: s.mission });
  if (!refill(ctx)) {
    gameOver(ctx, 'time');
    return;
  }
  draw(ctx, handSize(s));
  beginTurn(ctx);
  ctx.barrier = true;
}

export function applyAction(prev: GameState, action: Action): Result {
  const s = structuredClone(prev);
  const ctx: Ctx = { s, events: [], frames: [], barrier: false };
  switch (action.t) {
    case 'play':
      doPlay(ctx, action);
      break;
    case 'equip':
      doEquip(ctx, action.card);
      break;
    case 'interact':
      doInteract(ctx, action);
      break;
    case 'resolve':
      doResolve(ctx, action);
      break;
    case 'endTurn':
      doEndTurn(ctx, action.save);
      break;
    case 'nextMission':
      doNextMission(ctx);
      break;
  }
  return { state: s, events: ctx.events, frames: ctx.frames, barrier: ctx.barrier };
}

// ---------------------------------------------------------------- setup

export function blankState(seed: number): GameState {
  return {
    v: 1,
    seed,
    rng: seed,
    mission: 1,
    phase: 'play',
    alarm: 0,
    scores: [],
    line: emptyLine(),
    obsDeck: [],
    obsDiscard: [],
    deck: [],
    hand: [],
    discard: [],
    play: [],
    equip: [],
    removed: [],
    pool: { s: 0, f: 0 },
    interactions: 0,
    saveBullets: false,
    pending: null,
    turn: 0,
    log: [],
  };
}

export function newCampaign(seed: number): Result {
  const s = blankState(seed);
  const ctx: Ctx = { s, events: [], frames: [], barrier: true };
  s.deck = shuffle(s, instancesOf('start'));
  s.obsDeck = shuffle(s, instancesOf('base'));
  log(ctx, 'missionStart', { n: 1 });
  refill(ctx);
  draw(ctx, handSize(s));
  beginTurn(ctx);
  return { state: s, events: ctx.events, frames: ctx.frames, barrier: true };
}
