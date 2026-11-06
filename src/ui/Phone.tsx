import { useRef } from 'react';
import { defOf } from '../engine/cards';
import { effectiveCost, interactInfo, obstacleOf, playInfo, rightmost } from '../engine/engine';
import type { LineCard } from '../engine/types';
import { useI18n } from '../i18n';
import { Modal } from './Dialogs';
import { AlarmBadge, AlarmMeter, Badge, CardImg, EquipChips, GoalStatus, Piles, PoolView, TopBar, useGame } from './game';
import { useFlip } from './hooks';
import { Icon, TypeIcon } from './icons';
import { Inspector, keyForTarget } from './Inspector';
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
      <HandStrip />
      <footer className="pbar">
        <Piles />
        <span className="spacer" />
        <button className="ib" onClick={undo} disabled={!canUndo} aria-label={t('hud.undo')}>
          <Icon name="undo" />
        </button>
        <button className="endturn" onClick={endTurn} disabled={animating || game.phase !== 'play' || !!game.pending}>
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
  useFlip(ref, true, view.line);
  return (
    <div className="conv" ref={ref}>
      {view.line.map((lc, i) => (lc ? <Row key={lc.id} lc={lc} slot={i} /> : <GapRow key={`g${i}`} slot={i} />))}
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

function Row({ lc, slot }: { lc: LineCard; slot: number }) {
  const { game, view, select, animating } = useGame();
  const { t, card } = useI18n();
  const last = rightmost(view.line) === slot;
  if (lc.down) {
    return (
      <button data-flip={lc.id} className="row down" onClick={() => select({ kind: 'line', slot })}>
        <span className="row-n">{slot + 1}</span>
        <CardImg id={lc.id} down className="row-art" />
        <span className="row-main">
          <span className="row-name">{t('hud.knockedOut')}</span>
          {last && <span className="row-text">{t('hud.silent')}</span>}
        </span>
      </button>
    );
  }
  const ob = obstacleOf(lc.id)!;
  const c = card(lc.id);
  const live = !animating && view.line === game.line;
  const info = live ? interactInfo(game, slot) : null;
  const cost = effectiveCost({ ...game, line: view.line }, slot);
  const mod = cost[1] - ob.cost[1];
  const can = !!info && !info.blocked && (info.affordable || info.items.length > 0);
  const locked = info && (info.blocked === 'sniper' || info.blocked === 'hawk');
  const top = defOf(lc.id)?.top;
  return (
    <button data-flip={lc.id} className={`row ${last ? 'exit' : ''} ${can ? 'can' : ''}`} onClick={() => select({ kind: 'line', slot })}>
      <span className="row-n">{slot + 1}</span>
      <CardImg id={lc.id} className="row-art" />
      <span className="row-main">
        <span className="row-name">
          {c.name} <TypeIcon type={ob.type} label={t(`types.${ob.type}`)} />
          {locked && <Icon name="lock" size={13} />}
        </span>
        <span className="row-text">
          {c.ability ? (
            <Rich text={c.ability} size={15} />
          ) : (
            <>
              → {top?.res && <Badge kind={top.res[0]} n={top.res[1]} size={15} />} <b>{c.top}</b>
              {top?.keep && <span className="keep">KEEP</span>}
            </>
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

function HandStrip() {
  const { game, select } = useGame();
  const { top } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  useFlip(ref, true, game.hand);
  return (
    <div className="hstrip" ref={ref} style={{ ['--n' as string]: Math.max(1, game.hand.length) }}>
      {game.hand.map((id) => {
        const pi = playInfo(game, id);
        return (
          <button key={id} data-flip={id} className={`hcard ${pi.canPlay || pi.canEquip ? 'can' : ''}`} onClick={() => select({ kind: 'hand', id })} aria-label={top(id)}>
            <CardImg id={id} />
          </button>
        );
      })}
    </div>
  );
}
