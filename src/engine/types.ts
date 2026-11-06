export interface LineCard {
  id: string;
  down: boolean;
}

/** Six positions; index 0 is where cards enter, index 5 is the exit. */
export type Line = (LineCard | null)[];

export const LINE_SIZE = 6;
export const ALARM_LIMIT = 50;

export type Pending =
  | { kind: 'planAhead'; cards: string[] }
  | { kind: 'foresight'; cards: string[] }
  | { kind: 'justTheThing'; cards: string[] };

export type Phase = 'play' | 'missionComplete' | 'gameOver' | 'won';

export interface LogEntry {
  turn: number;
  k: string;
  p?: Record<string, string | number>;
}

export interface GameState {
  v: 1;
  seed: number;
  rng: number;
  mission: number;
  phase: Phase;
  gameOver?: 'alarm' | 'time';
  alarm: number;
  /** Alarm recorded at each completed mission. */
  scores: number[];
  line: Line;
  /** Index 0 is the top of each deck. */
  obsDeck: string[];
  /** Last element is the top of each discard pile. */
  obsDiscard: string[];
  deck: string[];
  hand: string[];
  discard: string[];
  play: string[];
  equip: string[];
  removed: string[];
  pool: { s: number; f: number };
  interactions: number;
  saveBullets: boolean;
  pending: Pending | null;
  turn: number;
  log: LogEntry[];
}

export type Payment = { s: number; f: number } | { item: string };

export type Action =
  | { t: 'play'; card: string; choice?: 'fight' | 'draw'; cards?: string[]; slot?: number }
  | { t: 'equip'; card: string }
  | {
      t: 'interact';
      slot: number;
      pay: Payment;
      /** 'clumsy' = Clumsy Guard's option to knock out the adjacent card at `target`. */
      outcome: 'disarm' | 'equip' | 'knockout' | 'clumsy';
      target?: number;
    }
  | { t: 'resolve'; keep?: string; order?: string[]; card?: string }
  | { t: 'endTurn'; save?: string }
  | { t: 'nextMission' };

export type GameEvent =
  | { t: 'draw'; n: number }
  | { t: 'shuffle' }
  | { t: 'play' }
  | { t: 'equip' }
  | { t: 'disarm' }
  | { t: 'knockout' }
  | { t: 'alarm'; n: number; total: number }
  | { t: 'exit' }
  | { t: 'slide' }
  | { t: 'enter' }
  | { t: 'flip' }
  | { t: 'mission' }
  | { t: 'gameOver' }
  | { t: 'won' };

/** Snapshot of the public table, used to animate the end of a turn step by step. */
export interface Frame {
  line: Line;
  alarm: number;
  obsDeck: number;
  obsDiscard: number;
}

export interface Result {
  state: GameState;
  events: GameEvent[];
  frames: Frame[];
  /** True when the action revealed hidden information, so undo history must be cleared. */
  barrier: boolean;
}
