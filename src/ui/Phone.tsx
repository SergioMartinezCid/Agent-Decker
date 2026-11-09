import { useRef } from 'react';
import { defOf, ITEM_TARGET, keyOf } from '../engine/cards';
import { effectiveCost, interactInfo, obstacleOf, playInfo, rightmost } from '../engine/engine';
import type { LineCard } from '../engine/types';
import { useI18n } from '../i18n';
import { Modal } from './Dialogs';
import { AlarmBadge, AlarmMeter, Badge, EquipChips, GoalStatus, MarkIcon, Piles, PoolView, TopBar, useGame, useLineMarks, usePeek } from './game';
import { useFlip } from './hooks';
import { CardsIcon, Icon, TypeIcon } from './icons';
import { Inspector, keyForTarget } from './Inspector';
import type { Mark } from './marks';
import { Rich } from './Rich';

/** Layout C: the line runs top to bottom and leaves toward the alarm. */
export function PhoneLayout() {
  const { game, view, target, select, endTurn, undo, canUndo, animating } = useGame();
  const { t } = useI18n();
  return (
    <div className="game phone">
      <TopBar>
        <AlarmMeter compact />
      </TopBar>
      <GoalStatus compact />
      <div className="flow">
        ▼ {t('hud.enter')} · {view.obsDeck}
      </div>
      <Conveyor />
      <button className="flow out" onClick={() => select({ kind: 'pile', pile: 'obsDiscard' })}>
        ▼ {t('hud.exit')} · {view.obsDiscard}
      </button>
      <div className="tray">
        <PoolView />
        <EquipChips />
      </div>
      <HandTiles />
      <footer className="pbar">
        <Piles />
        <span className="spacer" />
        <button className="ib" data-tut="undo" onClick={undo} disabled={!canUndo} aria-label={t('hud.undo')}>
          <Icon name="undo" />
        </button>
        <button className="endturn" data-tut="end-turn" onClick={endTurn} disabled={animating || game.phase !== 'play' || !!game.pending}>
          {t('hud.endTurn')}
        </button>
      </footer>
      {target && (
        <Modal label={t('rulesView.cards')} onClose={() => select(null)} className="sheet">
          <div key={keyForTarget(target)}>
            <Inspector target={target} />
          </div>
        </Modal>
      )}
    </div>
  );
}

function Conveyor() {
  const { view } = useGame();
  const ref = useRef<HTMLDivElement>(null);
  const marks = useLineMarks();
  useFlip(ref, true, view.line);
  return (
    <div className="conv" data-tut="line" ref={ref}>
      {view.line.map((lc, i) => (lc ? <Row key={lc.id} lc={lc} slot={i} marks={marks?.[i] ?? []} /> : <GapRow key={`g${i}`} slot={i} />))}
    </div>
  );
}

function GapRow({ slot }: { slot: number }) {
  const { t } = useI18n();
  const { animating } = useGame();
  return (
    <div className="row gap">
      <span className="row-n">{slot + 1}</span>
      <span className="row-gap-text">
        {t('hud.empty')}
        {!animating && ` · ${t('hud.disarmed')}`}
      </span>
    </div>
  );
}

function Row({ lc, slot, marks }: { lc: LineCard; slot: number; marks: Mark[] }) {
  const { game, view, select, animating } = useGame();
  const { t, card, short } = useI18n();
  const peek = usePeek();
  const last = rightmost(view.line) === slot;
  if (lc.down) {
    return (
      <button data-flip={lc.id} data-tut="line-card" data-id={lc.id} className="row down" onClick={() => select({ kind: 'line', slot })}>
        <span className="row-n">{slot + 1}</span>
        <span className="row-main">
          <span className="row-name">
            {t('hud.knockedOut')}
            {marks.map((m) => (
              <MarkIcon key={m} mark={m} />
            ))}
          </span>
          {last && <span className="row-text">{t('hud.silent')}</span>}
        </span>
      </button>
    );
  }
  const ob = obstacleOf(lc.id)!;
  const c = card(lc.id);
  const sh = short(lc.id);
  const live = !animating && view.line === game.line;
  const info = live ? interactInfo(game, slot) : null;
  const cost = effectiveCost({ ...game, line: view.line }, slot);
  const mod = cost[1] - ob.cost[1];
  const can = !!info && !info.blocked && (info.affordable || info.items.length > 0);
  const locked = info && (info.blocked === 'sniper' || info.blocked === 'hawk');
  const top = defOf(lc.id)?.top;
  const ability = sh.ability ?? c.ability;
  return (
    <button {...peek(lc.id)} data-flip={lc.id} data-tut="line-card" data-id={lc.id} className={`row ${last ? 'exit' : ''} ${can ? 'can' : ''} ${ability ? 'ab' : ''}`} onClick={() => select({ kind: 'line', slot })}>
      <span className="row-n">{slot + 1}</span>
      <span className="row-main">
        <span className="row-name">
          {c.name} <TypeIcon type={ob.type} label={t(`types.${ob.type}`)} />
          {locked && <Icon name="lock" size={13} />}
          {marks.map((m) => (
            <MarkIcon key={m} mark={m} />
          ))}
        </span>
        {ability && (
          <span className="row-ab">
            <Icon name="bolt" size={12} />
            <span>
              <Rich text={ability} size={14} />
            </span>
          </span>
        )}
        <span className="row-get">
          <span className="arrow">→</span>
          {top?.res && <Badge kind={top.res[0]} n={top.res[1]} size={15} />}
          <b>{c.top}</b>
          {top?.keep && <span className="keep">KEEP</span>}
          {sh.effect && (
            <span className="row-eff">
              <Rich text={sh.effect} size={14} />
            </span>
          )}
        </span>
      </span>
      <span className="row-cost">
        <Badge kind={cost[0]} n={cost[1]} size={34} />
        {mod > 0 && <i className="mod">+{mod}</i>}
      </span>
      <span className="row-alarm">
        <AlarmBadge n={ob.alarm} size={30} />
        {last && <i className="row-exit">{t('hud.leavesNext')}</i>}
      </span>
    </button>
  );
}

/** The hand as tiles: what each card gives, big enough to read on a phone. */
function HandTiles() {
  const { game } = useGame();
  const ref = useRef<HTMLDivElement>(null);
  useFlip(ref, true, game.hand);
  return (
    <div className="htiles" data-tut="hand" ref={ref}>
      {/* Seven cards or more: three columns of names, so a full hand still fits. */}
      <div className={`ht-grid ${game.hand.length > 6 ? 'many' : ''}`}>
        {game.hand.map((id) => (
          <HandTile key={id} id={id} />
        ))}
      </div>
    </div>
  );
}

function HandTile({ id }: { id: string }) {
  const { game, select } = useGame();
  const { top, short } = useI18n();
  const peek = usePeek();
  const def = defOf(id);
  if (!def) return null;
  const pi = playInfo(game, id);
  const name = top(id);
  const text = short(id).effect;
  return (
    <button
      {...peek(id)}
      data-flip={id}
      data-tut="hand-card"
      data-id={id}
      data-card={keyOf(id)}
      data-set={def.set}
      className={`htile ${pi.canPlay || pi.canEquip ? 'can' : ''} ${text ? '' : 'solo'}`}
      onClick={() => select({ kind: 'hand', id })}
      aria-label={name}
    >
      <span className="ht-lead">
        <TileLead id={id} />
      </span>
      <span className={`ht-name ${name.length > 14 ? 'long' : ''}`}>
        <span className="ht-nm">{name}</span>
        {def.top.keep && <span className="keep">KEEP</span>}
      </span>
      {text && (
        <span className="ht-text">
          <Rich text={text} size={14} />
        </span>
      )}
    </button>
  );
}

/** What a tile leads with: the resource it gives, the type an item pays for, or a draw/effect mark. */
function TileLead({ id }: { id: string }) {
  const { t } = useI18n();
  const tp = defOf(id)!.top;
  if (tp.res) return <Badge kind={tp.res[0]} n={tp.res[1]} size={30} label={`${tp.res[1]} ${t(`res.${tp.res[0]}`)}`} />;
  if (tp.effect === 'flashy') return <Badge kind="f" n="X" size={30} label={t('res.f')} />;
  if (tp.item) {
    const type = ITEM_TARGET[tp.item];
    return (
      <span className="ht-type">
        <TypeIcon type={type} label={t(`types.${type}`)} />
      </span>
    );
  }
  if (tp.effect?.startsWith('draw')) return <CardsIcon size={26} label={t('hud.cardsIcon')} />;
  return <Icon name="bolt" size={22} />;
}
