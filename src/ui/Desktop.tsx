import { useRef } from 'react';
import { effectiveCost, interactInfo, obstacleOf, playInfo, rightmost } from '../engine/engine';
import type { LineCard } from '../engine/types';
import { useI18n } from '../i18n';
import { AlarmMeter, CardImg, EquipChips, GoalStatus, LogList, Piles, PoolView, TopBar, useGame, type Target } from './game';
import { useFlip } from './hooks';
import { Modal } from './Dialogs';
import { Icon } from './icons';
import { Inspector, keyForTarget } from './Inspector';

/** Layout B: sidebar · line + hand · inspector panel that follows the pointer. */
export function DesktopLayout({ compact }: { compact: boolean }) {
  const { game, view, target, inspect, holdHover, hover, select, endTurn, undo, canUndo, animating } = useGame();
  const { t } = useI18n();
  return (
    <div className={`game desk ${compact ? 'compact' : ''}`}>
      <TopBar>
        <span className="tb-spacer" />
      </TopBar>
      <aside className="side">
        <button
          className="mission-card"
          onClick={() => select({ kind: 'mission' })}
          onPointerEnter={(e) => e.pointerType === 'mouse' && hover({ kind: 'mission' })}
          onPointerLeave={(e) => e.pointerType === 'mouse' && hover(null)}
          aria-label={t('insp.missionTitle')}
        >
          <CardImg id={`mission-${game.mission}`} />
        </button>
        <GoalStatus />
        <AlarmMeter />
        <section className="side-sec">
          <span className="lbl">{t('hud.equipped')}</span>
          <div className="eqs">{game.equip.length ? <EquipChips /> : <span className="muted">–</span>}</div>
        </section>
        <section className="side-sec pile-list">
          <Piles show={['deck', 'discard', 'play', 'removed']} />
        </section>
      </aside>
      <main className="center">
        <div className="line-head">
          <span className="lbl">
            {t('hud.obstacles')} {view.obsDeck}
          </span>
          <span className="lbl">
            {t('hud.line')} <span className="muted">({t('hud.lineDir')})</span>
          </span>
          <button className="lbl linkish" onClick={() => select({ kind: 'pile', pile: 'obsDiscard' })}>
            {t('hud.obsDiscard')} {view.obsDiscard}
          </button>
        </div>
        <LineRow />
        <div className="bar">
          <PoolView />
          <span className="spacer" />
          <button className="ghost" onClick={undo} disabled={!canUndo}>
            <Icon name="undo" /> {t('hud.undo')}
          </button>
          <button className="endturn" onClick={endTurn} disabled={animating || game.phase !== 'play' || !!game.pending}>
            {t('hud.endTurn')}
          </button>
        </div>
        <div className="lbl hand-head">{t('hud.hand')}</div>
        <HandRow />
      </main>
      {compact ? (
        target && (
          <Modal label={t('rulesView.cards')} onClose={() => select(null)} className="sheet">
            <div key={keyForTarget(target)}>
              <Inspector target={target} />
            </div>
          </Modal>
        )
      ) : (
        <aside className="insp-panel" onPointerEnter={holdHover} onPointerLeave={() => hover(null)} aria-live="polite">
          <div className="insp-scroll" key={keyForTarget(inspect)}>
            <Inspector target={inspect} />
          </div>
          <details className="log-box">
            <summary className="lbl">
              <Icon name="chevron" size={14} />
              {t('hud.log')}
            </summary>
            <LogList />
          </details>
        </aside>
      )}
    </div>
  );
}

function LineRow() {
  const { view, animating } = useGame();
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  useFlip(ref, true, view.line);
  return (
    <div className="lrow" ref={ref}>
      {view.line.map((lc, i) =>
        lc ? (
          <LineCardArt key={lc.id} lc={lc} slot={i} />
        ) : (
          <div key={`gap${i}`} className="slot gap">
            <span>
              {t('hud.empty')}
              {!animating && <small>{t('hud.disarmed')}</small>}
            </span>
            <span className="slot-n">{i + 1}</span>
          </div>
        ),
      )}
    </div>
  );
}

function LineCardArt({ lc, slot }: { lc: LineCard; slot: number }) {
  const { game, view, select, hover, target, animating } = useGame();
  const { t, name } = useI18n();
  const me: Target = { kind: 'line', slot };
  const ob = obstacleOf(lc.id)!;
  const live = !animating && view.line === game.line;
  const info = live ? interactInfo(game, slot) : null;
  const cost = effectiveCost({ ...game, line: view.line }, slot);
  const mod = cost[1] - ob.cost[1];
  const last = rightmost(view.line) === slot;
  const can = !!info && !info.blocked && (info.affordable || info.items.length > 0);
  const sel = target?.kind === 'line' && target.slot === slot;
  return (
    <button
      data-flip={lc.id}
      className={`lcard ${lc.down ? 'down' : ''} ${can ? 'can' : ''} ${sel ? 'sel' : ''}`}
      onClick={() => select(me)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && hover(me)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && hover(null)}
      onFocus={() => hover(me)}
      aria-label={`${slot + 1}. ${lc.down ? t('hud.knockedOut') : name(lc.id)}`}
    >
      <CardImg id={lc.id} down={lc.down} />
      <span className="slot-n">{slot + 1}</span>
      {mod > 0 && !lc.down && <span className="mod">+{mod}</span>}
      {lc.down && <span className="ko">{t('hud.knockedOut')}</span>}
      {last && !lc.down && (
        <span className="exit-tag">
          {t('hud.leavesNext')} +{ob.alarm}
        </span>
      )}
      {info && (info.blocked === 'sniper' || info.blocked === 'hawk') && (
        <span className="lock" title={t(`blocked.${info.blocked}`)}>
          <Icon name="lock" size={14} />
        </span>
      )}
    </button>
  );
}

function HandRow() {
  const { game, select, hover, target } = useGame();
  const { top } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  useFlip(ref, true, game.hand);
  return (
    <div className="hrow" ref={ref}>
      {game.hand.map((id) => {
        const me: Target = { kind: 'hand', id };
        const pi = playInfo(game, id);
        const sel = target?.kind === 'hand' && target.id === id;
        return (
          <button
            key={id}
            data-flip={id}
            className={`hcard ${pi.canPlay || pi.canEquip ? 'can' : ''} ${sel ? 'sel' : ''}`}
            onClick={() => select(me)}
            onPointerEnter={(e) => e.pointerType === 'mouse' && hover(me)}
            onPointerLeave={(e) => e.pointerType === 'mouse' && hover(null)}
            onFocus={() => hover(me)}
            aria-label={top(id)}
          >
            <CardImg id={id} />
          </button>
        );
      })}
    </div>
  );
}
