// Shared game-screen state (selection, hover, dialogs) and small building blocks.
import { createContext, useContext, useEffect, useMemo, useRef, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { keyOf, missionDef, type CostKind } from '../engine/cards';
import { interactionLimit, missionStatus, nextExitAlarm } from '../engine/engine';
import type { Action, GameState, Line } from '../engine/types';
import { useI18n } from '../i18n';
import { AlarmBadge, Badge, Icon, type IconName } from './icons';
import { lineMarks, type Mark } from './marks';
import { Rich } from './Rich';

export type Pile = 'deck' | 'discard' | 'play' | 'obsDiscard' | 'removed';

export type Target =
  | { kind: 'line'; slot: number }
  | { kind: 'hand'; id: string }
  | { kind: 'equip'; id: string }
  | { kind: 'play'; id: string }
  | { kind: 'mission' }
  | { kind: 'pile'; pile: Pile };

export const sameTarget = (a: Target | null, b: Target | null) => JSON.stringify(a) === JSON.stringify(b);

export interface ChoiceSpec {
  title: string;
  text: string;
  cards: string[];
  mode: 'multi' | 'single' | 'order';
  max?: number;
  min?: number;
  /** Label for an extra "choose nothing" button. */
  skip?: string;
  cancellable: boolean;
  /** Shows face-down backs for these ids (line choices). */
  down?: string[];
  /** Label cards with their obstacle name instead of their top-half name. */
  obstacleNames?: boolean;
  onConfirm: (picked: string[]) => void;
}

export interface GameUI {
  game: GameState;
  view: { line: Line; alarm: number; obsDeck: number; obsDiscard: number };
  animating: boolean;
  target: Target | null;
  inspect: Target | null;
  select: (t: Target | null) => void;
  hover: (t: Target | null) => void;
  holdHover: () => void;
  act: (a: Action) => boolean;
  playCard: (id: string, opts?: { choice?: 'fight' | 'draw' }) => void;
  endTurn: () => void;
  undo: () => void;
  canUndo: boolean;
  /** Playing the tutorial rather than the campaign. */
  tutorial: boolean;
  openMenu: () => void;
  openRules: () => void;
  /** Show a card full screen. */
  zoom: (id: string) => void;
  /** Show a card full screen while it's pressed (null hides it). */
  peek: (id: string | null) => void;
}

const Ctx = createContext<GameUI | null>(null);
export const GameProvider = ({ value, children }: { value: GameUI; children: ReactNode }) => <Ctx.Provider value={value}>{children}</Ctx.Provider>;
export function useGame(): GameUI {
  const v = useContext(Ctx);
  if (!v) throw new Error('useGame outside GameProvider');
  return v;
}

/**
 * Press and hold a card (touch or pen) to see it full size until you let go; the tap that
 * ends the hold doesn't select the card. Returns a function giving a card element's props;
 * pass null for cards that can't be shown (face down).
 */
export function usePeek() {
  const { peek } = useGame();
  const st = useRef({ timer: 0, x: 0, y: 0, shown: false, touch: false });
  useEffect(() => () => clearTimeout(st.current.timer), []);
  return (id: string | null) => {
    if (!id) return {};
    const s = st.current;
    return {
      onPointerDown: (e: PointerEvent<HTMLElement>) => {
        s.touch = e.pointerType !== 'mouse';
        s.shown = false;
        clearTimeout(s.timer);
        if (!s.touch) return;
        s.x = e.clientX;
        s.y = e.clientY;
        s.timer = window.setTimeout(() => {
          s.shown = true;
          peek(id);
          navigator.vibrate?.(8);
        }, 380);
      },
      onPointerMove: (e: PointerEvent<HTMLElement>) => {
        if (!s.shown && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 10) clearTimeout(s.timer);
      },
      onPointerUp: () => clearTimeout(s.timer),
      onPointerCancel: () => clearTimeout(s.timer),
      onClickCapture: (e: MouseEvent<HTMLElement>) => {
        if (!s.shown) return;
        s.shown = false;
        e.preventDefault();
        e.stopPropagation();
      },
      onContextMenu: (e: MouseEvent<HTMLElement>) => {
        if (s.touch) e.preventDefault();
      },
    };
  };
}

export const cardSrc = (key: string, size: 240 | 480 = 240) => `${import.meta.env.BASE_URL}cards/${size}/${key}.webp`;

export function CardImg({ id, size = 240, down, className }: { id: string; size?: 240 | 480; down?: boolean; className?: string }) {
  const { name } = useI18n();
  const key = down ? 'back' : keyOf(id);
  return <img className={className} src={cardSrc(key, size)} alt={down ? '' : name(id)} draggable={false} decoding="async" />;
}

// ---------------------------------------------------------------- line marks

/** What other obstacles will do to each card of the line; null while the line is animating. */
export function useLineMarks(): Mark[][] | null {
  const { game, view, animating } = useGame();
  const live = !animating && view.line === game.line;
  return useMemo(() => (live ? lineMarks(game) : null), [live, game]);
}

const MARK_ICON: Record<Mark, IconName> = { burn: 'flame', clumsy: 'burst', pinned: 'pin', flip: 'flip', swept: 'siren' };

export function MarkIcon({ mark, size = 14 }: { mark: Mark; size?: number }) {
  const { t } = useI18n();
  const label = t(`marks.${mark}.label`);
  return (
    <span className={`mk mk-${mark}`} role="img" aria-label={label} title={label}>
      <Icon name={MARK_ICON[mark]} size={size} />
    </span>
  );
}

// ---------------------------------------------------------------- HUD pieces

export function AlarmMeter({ compact }: { compact?: boolean }) {
  const { game, view } = useGame();
  const { t } = useI18n();
  const next = view.alarm === game.alarm ? nextExitAlarm(game) : 0;
  const pct = Math.min(100, view.alarm * 2);
  const level = view.alarm >= 40 ? 'hot' : view.alarm >= 25 ? 'warm' : 'cool';
  return (
    <div className={`am ${compact ? 'am-compact' : ''} am-${level}`} data-tut="alarm" role="meter" aria-valuemin={0} aria-valuemax={50} aria-valuenow={view.alarm} aria-label={t('hud.alarm')}>
      <div className="am-num">
        {view.alarm}
        <span>/50</span>
      </div>
      <div className="am-bar">
        <i className="am-fill" style={{ width: `${pct}%` }} />
        {next > 0 && <i className="am-next" style={{ left: `${pct}%`, width: `${Math.min(100 - pct, next * 2)}%` }} />}
      </div>
      <div className="am-cap">
        {t('hud.alarm')}
        {next > 0 && (
          <>
            {' · '}
            <b>{t('hud.nextScroll', { n: next })}</b>
          </>
        )}
      </div>
    </div>
  );
}

const resKey = (k: CostKind) => (k === 's' ? 's' : k === 'f' ? 'f' : 'a');

export function GoalStatus({ compact }: { compact?: boolean }) {
  const { game, select } = useGame();
  const { t, d, top } = useI18n();
  const st = missionStatus(game);
  const m = d.missions[game.mission];
  const parts: ReactNode[] = [];
  if (st.pay) {
    parts.push(
      <span key="pay" className={`gp ${st.pay.have >= st.pay.need ? 'ok' : ''}`}>
        <Badge kind={resKey(st.pay.kind)} size={18} label={t(`res.${st.pay.kind}`)} /> {t('hud.goalPay', st.pay)}
      </span>,
    );
  }
  if (st.item) {
    parts.push(
      <span key="item" className={`gp ${st.item.ok ? 'ok' : ''}`}>
        <Icon name={st.item.ok ? 'check' : 'cross'} size={14} /> {t(st.item.ok ? 'hud.goalItem' : 'hud.goalItemNo', { item: top(st.item.key) })}
      </span>,
    );
  }
  if (st.hand) parts.push(<span key="hand" className={`gp ${st.hand.have >= st.hand.need ? 'ok' : ''}`}>{t('hud.goalHand', st.hand)}</span>);
  if (st.down) parts.push(<span key="down" className={`gp ${st.down.have >= st.down.need ? 'ok' : ''}`}>{t('hud.goalDown', st.down)}</span>);
  return (
    <button className={`goal ${compact ? 'goal-compact' : ''} ${st.ok ? 'goal-ready' : ''}`} data-tut="goal" onClick={() => select({ kind: 'mission' })}>
      <span className="goal-k">{t('hud.goal')}</span>
      <span className="goal-text">
        <Rich text={m.goal} size={compact ? 22 : 26} />
      </span>
      <span className="goal-parts">{st.ok ? <span className="gp ok">{t('hud.goalReady')}</span> : parts}</span>
    </button>
  );
}

export function PoolView() {
  const { game } = useGame();
  const { t } = useI18n();
  const max = interactionLimit(game);
  return (
    <div className="pool" data-tut="pool" aria-label={t('hud.resources')}>
      <span className={`pl ${game.pool.s ? '' : 'zero'}`}>
        <Badge kind="s" size={22} label={t('res.s')} />
        {game.pool.s}
      </span>
      <span className={`pl ${game.pool.f ? '' : 'zero'}`}>
        <Badge kind="f" size={22} label={t('res.f')} />
        {game.pool.f}
      </span>
      <span className="ints" title={t('hud.interactions', { used: game.interactions, max })}>
        {Array.from({ length: max }, (_, i) => (
          <i key={i} className={i < game.interactions ? 'on' : ''} />
        ))}
        <span>{t('hud.interactions', { used: game.interactions, max })}</span>
      </span>
    </div>
  );
}

export function Piles({ show = ['deck', 'discard', 'play'] }: { show?: Pile[] }) {
  const { game, select } = useGame();
  const { t } = useI18n();
  const count: Record<Pile, number> = {
    deck: game.deck.length,
    discard: game.discard.length,
    play: game.play.length,
    obsDiscard: game.obsDiscard.length,
    removed: game.removed.length,
  };
  const label: Record<Pile, string> = {
    deck: t('hud.deck'),
    discard: t('hud.discard'),
    play: t('hud.played'),
    obsDiscard: t('hud.obsDiscard'),
    removed: t('hud.removed'),
  };
  return (
    <>
      {show.map((p) => (
        <button key={p} className="pile" data-tut={`pile-${p}`} onClick={() => select({ kind: 'pile', pile: p })}>
          <span>{label[p]}</span>
          <b>{count[p]}</b>
        </button>
      ))}
    </>
  );
}

/** Short label for an equipped card or mission reward. */
export function useEquipLabel() {
  const { t, top } = useI18n();
  return (id: string) => {
    if (!id.startsWith('mission-')) return top(id);
    const r = missionDef(Number(id.slice(8))).reward;
    if (r.kind === 'interactions') return t('hud.ruleInteractions', { n: r.n });
    if (r.kind === 'handSize') return t('hud.ruleHand', { n: r.n });
    return top(id);
  };
}

export function EquipChips() {
  const { game, select, hover } = useGame();
  const label = useEquipLabel();
  const peek = usePeek();
  return (
    <>
      {game.equip.map((id) => (
        <button
          key={id}
          {...peek(id)}
          className="eq"
          onClick={() => select({ kind: 'equip', id })}
          onPointerEnter={(e) => e.pointerType === 'mouse' && hover({ kind: 'equip', id })}
          onPointerLeave={(e) => e.pointerType === 'mouse' && hover(null)}
        >
          <CardImg id={id} />
          <span>{label(id)}</span>
        </button>
      ))}
    </>
  );
}

export function LogList({ limit = 30 }: { limit?: number }) {
  const { game } = useGame();
  const { logLine } = useI18n();
  const items = game.log.slice(-limit).reverse();
  return (
    <ol className="log">
      {items.map((e, i) => (
        <li key={`${game.log.length - i}`} className={`log-${e.k}`}>
          {logLine(e.k, e.p)}
        </li>
      ))}
    </ol>
  );
}

export function TopBar({ children }: { children?: ReactNode }) {
  const { game, openMenu, openRules, tutorial } = useGame();
  const { t } = useI18n();
  return (
    <header className="tb">
      <button className="ib" onClick={openMenu} aria-label={t('hud.menu')}>
        <Icon name="menu" />
      </button>
      <span className="logo" aria-hidden="true">
        AGENT<b>DECKER</b>
      </span>
      <span className={`chip ${tutorial ? 'chip-tut' : ''}`}>{tutorial ? t('tut.title') : t('hud.mission', { n: game.mission })}</span>
      {children}
      <button className="ib" onClick={openRules} aria-label={t('hud.rules')}>
        <Icon name="rules" />
      </button>
    </header>
  );
}

export { AlarmBadge, Badge };
