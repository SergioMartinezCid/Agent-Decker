import { useState } from 'react';
import { defOf, ITEM_TARGET, keyOf, missionDef } from '../engine/cards';
import { defaultPayment, equipBonus, interactInfo, missionStatus, playInfo, rightmost } from '../engine/engine';
import { useI18n } from '../i18n';
import { AlarmBadge, Badge, CardImg, useGame, type Target } from './game';
import { Icon } from './icons';
import { Rich } from './Rich';

export function Inspector({ target }: { target: Target | null }) {
  const { t } = useI18n();
  if (!target) return <p className="insp-hint">{t('hud.hint')}</p>;
  switch (target.kind) {
    case 'line':
      return <LineInspector key={`l${target.slot}`} slot={target.slot} />;
    case 'hand':
      return <HandInspector key={target.id} id={target.id} />;
    case 'equip':
      return <EquipInspector id={target.id} />;
    case 'play':
      return <CardInfo id={target.id} sub={t('insp.playedTitle')} />;
    case 'mission':
      return <MissionInspector />;
    case 'pile':
      return <PileInspector pile={target.pile} />;
  }
}

function TopText({ id }: { id: string }) {
  const { card } = useI18n();
  const def = defOf(id);
  const c = card(id);
  return (
    <div className="insp-top">
      <div className="insp-row">
        {def?.top.res && <Badge kind={def.top.res[0]} n={def.top.res[1]} size={26} />}
        <b>{c.top}</b>
        {def?.top.keep && <span className="keep">KEEP</span>}
      </div>
      {c.effect && (
        <p>
          <Rich text={c.effect} />
        </p>
      )}
    </div>
  );
}

/** The inspected card's art; click it to see the card full screen. */
function InspArt({ id, down }: { id: string; down?: boolean }) {
  const { zoom } = useGame();
  const { t } = useI18n();
  if (down || id === 'back') return <CardImg id={id} down={down} size={480} className="insp-art" />;
  return (
    <button className="insp-art-btn" onClick={() => zoom(id)} aria-label={t('insp.zoom')} title={t('insp.zoom')}>
      <CardImg id={id} size={480} className="insp-art" />
      <span className="zoom-hint" aria-hidden="true">
        <Icon name="zoom" size={16} />
      </span>
    </button>
  );
}

function CardInfo({ id, sub }: { id: string; sub: string }) {
  const { top } = useI18n();
  return (
    <div className="insp">
      <InspArt id={id} />
      <div className="insp-body">
        <h3>{top(id)}</h3>
        <div className="insp-sub">{sub}</div>
        <TopText id={id} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- line

function LineInspector({ slot }: { slot: number }) {
  const { game, view, act, select, animating } = useGame();
  const { t, card, top } = useI18n();
  const lc = view.line[slot];
  const info = interactInfo(game, slot);
  const def = lc ? defOf(lc.id) : undefined;
  const [itemPick, setItemPick] = useState<string | null>(null);
  const [split, setSplit] = useState<number | null>(null);

  if (!lc || !def?.obstacle) {
    return (
      <div className="insp">
        <div className="insp-body">
          <h3>{t('hud.empty')}</h3>
          <p className="insp-why">{t('hud.disarmed')}</p>
        </div>
      </div>
    );
  }
  if (lc.down) {
    return (
      <div className="insp">
        <InspArt id={lc.id} down />
        <div className="insp-body">
          <h3>{t('insp.faceDownTitle')}</h3>
          <div className="insp-sub">{t('insp.position', { n: slot + 1 })}</div>
          <p className="insp-why">{t('insp.faceDownText')}</p>
        </div>
      </div>
    );
  }
  const ob = def.obstacle;
  const c = card(lc.id);
  const cost = info?.cost ?? ob.cost;
  const mod = cost[1] - ob.cost[1];
  const isLast = rightmost(game.line) === slot;
  const have = cost[0] === 's' ? game.pool.s : cost[0] === 'f' ? game.pool.f : game.pool.s + game.pool.f;
  const usingItem = itemPick && info?.items.includes(itemPick) ? itemPick : null;

  // "Any" costs with both resources available: let the player choose the split.
  const minS = Math.max(0, cost[1] - game.pool.f);
  const maxS = Math.min(game.pool.s, cost[1]);
  const def0 = defaultPayment(game.pool, cost);
  const sPart = cost[0] === 'a' ? Math.min(maxS, Math.max(minS, split ?? def0?.s ?? 0)) : 0;
  const payment = usingItem
    ? { item: usingItem }
    : cost[0] === 'a'
      ? { s: sPart, f: cost[1] - sPart }
      : def0;
  const canPay = !!usingItem || (info?.affordable ?? false);
  const blocked = info?.blocked;
  const disabled = animating || !!blocked || !canPay || !payment;

  const run = (outcome: 'disarm' | 'equip' | 'knockout' | 'clumsy', target?: number) => {
    if (!payment) return;
    if (act({ t: 'interact', slot, pay: payment, outcome, target })) select(null);
  };

  return (
    <div className="insp" data-insp={lc.id}>
      <InspArt id={lc.id} />
      <div className="insp-body">
        <h3>{c.name}</h3>
        <div className="insp-sub">
          {t('insp.position', { n: slot + 1 })} · {t(`types.${ob.type}`)}
        </div>
        <div className="insp-row insp-costs">
          <span>{t('insp.cost')}</span>
          <Badge kind={cost[0]} n={cost[1]} size={28} />
          {mod > 0 && <small className="warn">{t('insp.watchtower', { n: mod })}</small>}
          <span className="sep" />
          <span>{t('insp.alarm')}</span>
          <AlarmBadge n={ob.alarm} size={26} />
        </div>
        {c.ability && (
          <p className="insp-ability">
            <Rich text={c.ability} />
          </p>
        )}
        <div className="insp-gets">
          <span className="lbl">{t('insp.whenDisarmed')}</span>
          <TopText id={lc.id} />
        </div>
        {isLast && <p className="insp-why danger">{t('insp.leavesNext', { n: ob.alarm })}</p>}
        {blocked ? (
          <p className="insp-why danger">
            <Rich text={t(`blocked.${blocked}`)} />
          </p>
        ) : (
          !usingItem && (
            <p className={`insp-why ${canPay ? 'ok' : 'danger'}`}>
              {canPay ? `${t('insp.youHave', { have })} ${t('insp.affordable')}` : t('insp.short', { have, need: cost[1] })}
            </p>
          )
        )}

        {!blocked && info && info.items.length > 0 && (
          <div className="paywith" role="radiogroup" aria-label={t('insp.payWith')}>
            <span className="lbl">{t('insp.payWith')}</span>
            <button role="radio" aria-checked={!usingItem} className={!usingItem ? 'on' : ''} onClick={() => setItemPick(null)}>
              {t('insp.payResources')}
            </button>
            {info.items.map((it) => (
              <button key={it} role="radio" aria-checked={usingItem === it} className={usingItem === it ? 'on' : ''} onClick={() => setItemPick(it)}>
                {t('act.useItem', { item: top(it) })} <small>({game.hand.includes(it) ? t('insp.inHand') : t('insp.equipped')})</small>
              </button>
            ))}
          </div>
        )}
        {!blocked && !usingItem && cost[0] === 'a' && canPay && maxS > minS && (
          <div className="split">
            <span className="lbl">{t('insp.split')}</span>
            <button onClick={() => setSplit(Math.max(minS, sPart - 1))} disabled={sPart <= minS} aria-label="−">
              −
            </button>
            <span className="split-v">
              <Badge kind="s" n={sPart} size={24} /> + <Badge kind="f" n={cost[1] - sPart} size={24} />
            </span>
            <button onClick={() => setSplit(Math.min(maxS, sPart + 1))} disabled={sPart >= maxS} aria-label="+">
              +
            </button>
          </div>
        )}

        <div className="acts">
          {usingItem && <p className="insp-why ok">{t('act.useItemNote')}</p>}
          <button className="act go" data-tut="act-disarm" disabled={disabled} onClick={() => run('disarm')}>
            {t('act.disarm')} <small>{t('act.disarmNote')}</small>
          </button>
          {info?.canEquip && (
            <button className="act go" data-tut="act-equip" disabled={disabled} onClick={() => run('equip')}>
              {t('act.disarmEquip')} <small>{t('act.disarmEquipNote')}</small>
            </button>
          )}
          <button className="act" data-tut="act-knockout" disabled={disabled} onClick={() => run('knockout')}>
            {t('act.knockout')} <small>{t('act.knockoutNote')}</small>
          </button>
          {info?.clumsyTargets.map((j) => (
            <button key={j} className="act" disabled={disabled} onClick={() => run('clumsy', j)}>
              {t('act.clumsy', { card: card(game.line[j]!.id).name })}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- hand

function HandInspector({ id }: { id: string }) {
  const { game, playCard, act, select, animating } = useGame();
  const { t, top } = useI18n();
  const def = defOf(id);
  const pi = playInfo(game, id);
  if (!def) return null;
  const tp = def.top;
  const item = tp.item;
  const dis = animating;
  return (
    <div className="insp" data-insp={id}>
      <InspArt id={id} />
      <div className="insp-body">
        <h3>{top(id)}</h3>
        <div className="insp-sub">{t('insp.inHandTitle')}</div>
        <TopText id={id} />
        {item && (
          <p className="insp-why">
            <Rich text={t('insp.itemHint', { type: `{${ITEM_TARGET[item]}} ${t(`types.${ITEM_TARGET[item]}`)}` })} />
          </p>
        )}
        {tp.bonus && (
          <p className="insp-why">
            <Rich text={t('insp.bonusHint', { res: `{${tp.bonus[0]}${tp.bonus[1]}}` })} />
          </p>
        )}
        <div className="acts">
          {pi.canPlay && tp.effect === 'rockOrDraw' && (
            <>
              <button className="act go" data-tut="act-play" disabled={dis} onClick={() => playCard(id, { choice: 'fight' })}>
                <Rich text={t('act.playFight')} />
              </button>
              <button className="act go" disabled={dis} onClick={() => playCard(id, { choice: 'draw' })}>
                {t('act.playDraw')}
              </button>
            </>
          )}
          {pi.canPlay && tp.effect !== 'rockOrDraw' && (
            <button className="act go" data-tut="act-play" disabled={dis} onClick={() => playCard(id)}>
              {tp.res ? <Rich text={t('act.playRes', { res: `{${tp.res[0]}${tp.res[1]}}` })} /> : t('act.play')}
            </button>
          )}
          {pi.canEquip && (
            <button
              className="act go"
              data-tut="act-equip"
              disabled={dis}
              onClick={() => {
                if (act({ t: 'equip', card: id })) select(null);
              }}
            >
              {t('act.equip')} <small>{t('act.equipNote')}</small>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- equip / mission / piles

function EquipInspector({ id }: { id: string }) {
  const { t, d, top } = useI18n();
  if (id.startsWith('mission-')) {
    const n = Number(id.slice(8));
    const m = d.missions[n];
    const keep = missionDef(n).rewardKeep;
    return (
      <div className="insp">
        <InspArt id={id} />
        <div className="insp-body">
          <h3>{m.title}</h3>
          <div className="insp-sub">
            {t('insp.equippedTitle')}
            {keep && <span className="keep">KEEP</span>}
          </div>
          <p>
            <Rich text={m.reward} />
          </p>
        </div>
      </div>
    );
  }
  const def = defOf(id);
  const bonus = equipBonus(id);
  return (
    <div className="insp">
      <InspArt id={id} />
      <div className="insp-body">
        <h3>{top(id)}</h3>
        <div className="insp-sub">{t('insp.equippedTitle')}</div>
        <TopText id={id} />
        {bonus && (
          <p className="insp-why ok">
            <Rich text={t('insp.bonusHint', { res: `{${bonus[0]}${bonus[1]}}` })} />
          </p>
        )}
        {def?.top.item && (
          <p className="insp-why">
            <Rich text={t('insp.itemHint', { type: `{${ITEM_TARGET[def.top.item]}} ${t(`types.${ITEM_TARGET[def.top.item]}`)}` })} />
          </p>
        )}
      </div>
    </div>
  );
}

function MissionInspector() {
  const { game } = useGame();
  const { t, d } = useI18n();
  const m = d.missions[game.mission];
  const st = missionStatus(game);
  return (
    <div className="insp">
      <InspArt id={`mission-${game.mission}`} />
      <div className="insp-body">
        <h3>{m.title}</h3>
        <div className="insp-sub">{t('insp.missionTitle')}</div>
        <p className="quote">{m.quote}</p>
        <p>
          <span className="lbl">{t('hud.goal')} </span>
          <Rich text={m.goal} />
        </p>
        <p>
          <span className="lbl">{t('insp.reward')} </span>
          <Rich text={m.reward} />
        </p>
        {st.ok && <p className="insp-why ok">{t('hud.goalReady')}</p>}
      </div>
    </div>
  );
}

function PileInspector({ pile }: { pile: 'deck' | 'discard' | 'play' | 'obsDiscard' | 'removed' }) {
  const { game, select } = useGame();
  const { t, top, name } = useI18n();
  const title = {
    deck: t('hud.deck'),
    discard: t('hud.discard'),
    play: t('hud.played'),
    obsDiscard: t('hud.obsDiscard'),
    removed: t('hud.removed'),
  }[pile];
  if (pile === 'deck') {
    return (
      <div className="insp">
        <InspArt id="back" />
        <div className="insp-body">
          <h3>{title}</h3>
          <p className="insp-why">{t('insp.deckHidden', { n: game.deck.length })}</p>
        </div>
      </div>
    );
  }
  const ids = [...game[pile]].reverse();
  return (
    <div className="insp insp-pile">
      <div className="insp-body">
        <h3>
          {title} · {ids.length}
        </h3>
        {!ids.length && <p className="insp-why">{t('insp.pileEmpty')}</p>}
        <div className="pile-grid">
          {ids.map((id) => (
            <button key={id} className="pile-card" onClick={() => pile === 'play' && select({ kind: 'play', id })} title={pile === 'obsDiscard' ? name(id) : top(id)}>
              <CardImg id={id} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export const keyForTarget = (t: Target | null) => (t ? JSON.stringify(t) : 'none');
export { keyOf };
