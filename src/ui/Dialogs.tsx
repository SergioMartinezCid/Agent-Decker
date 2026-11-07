import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MISSIONS, keyOf } from '../engine/cards';
import { useI18n } from '../i18n';
import { dispatch, finishTutorial, newGame, retryMission, retryTutorial, setScreen, useApp } from '../state/store';
import { CardImg, cardSrc, useGame, type ChoiceSpec } from './game';
import { Icon } from './icons';
import { Rich } from './Rich';

const openModals: object[] = [];

/** Modal shell: bottom sheet on phones, centred dialog elsewhere. */
export function Modal({
  children,
  onClose,
  label,
  className = '',
}: {
  children: ReactNode;
  onClose?: () => void;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const me = {};
    openModals.push(me);
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    // Escape closes only the topmost dialog (e.g. a zoomed card over the card sheet).
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openModals[openModals.length - 1] === me) close.current?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      openModals.splice(openModals.indexOf(me), 1);
      prev?.focus?.();
    };
  }, []);
  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={ref} className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        <span className="handle" aria-hidden="true" />
        {onClose && (
          <button className="ib modal-x" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

/** A card shown as large as the screen allows, as in the card gallery. */
export function CardZoom({ id, onClose }: { id: string; onClose: () => void }) {
  const { name } = useI18n();
  return (
    <Modal label={name(id)} onClose={onClose} className="zoom">
      <img src={cardSrc(keyOf(id), 480)} alt={name(id)} />
    </Modal>
  );
}

export function ChoiceDialog({ spec, onDone }: { spec: ChoiceSpec; onDone: () => void }) {
  const { t, name, top } = useI18n();
  const [picked, setPicked] = useState<string[]>([]);
  const max = spec.mode === 'single' ? 1 : (spec.max ?? Infinity);
  const toggle = (id: string) => {
    setPicked((p) => {
      if (p.includes(id)) return spec.mode === 'order' ? p : p.filter((x) => x !== id);
      if (spec.mode === 'single') return [id];
      if (p.length >= max) return p;
      return [...p, id];
    });
  };
  const ready =
    spec.mode === 'order' ? true : spec.mode === 'single' ? picked.length === 1 : picked.length >= (spec.min ?? 0);
  const confirm = () => {
    let out = picked;
    if (spec.mode === 'order') out = [...picked, ...spec.cards.filter((c) => !picked.includes(c))];
    spec.onConfirm(out);
    onDone();
  };
  const down = new Set(spec.down ?? []);
  return (
    <Modal label={spec.title} onClose={spec.cancellable ? onDone : undefined} className="choice">
      <h2>{spec.title}</h2>
      <p>
        <Rich text={spec.text} />
      </p>
      {!spec.cards.length && <p className="muted">{t('dlg.none')}</p>}
      <div className="choice-grid">
        {spec.cards.map((id) => {
          const i = picked.indexOf(id);
          return (
            <button key={id} className={`choice-card ${i >= 0 ? 'on' : ''}`} onClick={() => toggle(id)} aria-pressed={i >= 0}>
              <CardImg id={id} down={down.has(id)} />
              <span className="choice-name">{down.has(id) ? t('hud.knockedOut') : spec.obstacleNames ? name(id) : top(id)}</span>
              {i >= 0 && <span className="choice-mark">{spec.mode === 'order' ? i + 1 : <Icon name="check" size={16} />}</span>}
            </button>
          );
        })}
      </div>
      <div className="modal-acts">
        {spec.mode === 'order' && picked.length > 0 && (
          <button className="ghost" onClick={() => setPicked([])}>
            {t('dlg.reset')}
          </button>
        )}
        {spec.mode === 'multi' && <span className="muted">{t('dlg.selected', { n: picked.length })}</span>}
        {spec.skip && (
          <button
            className="ghost"
            onClick={() => {
              spec.onConfirm([]);
              onDone();
            }}
          >
            {spec.skip}
          </button>
        )}
        {spec.cancellable && (
          <button className="ghost" onClick={onDone}>
            {t('common.cancel')}
          </button>
        )}
        <button className="primary" disabled={!ready} onClick={confirm}>
          {t('common.confirm')}
        </button>
      </div>
    </Modal>
  );
}

/** Pending choices created by Plan Ahead, Foresight and Just the Thing. */
export function PendingDialog() {
  const { game, act } = useGame();
  const { t } = useI18n();
  const [keep, setKeep] = useState<string | null>(null);
  const p = game.pending;
  if (!p) return null;
  if (p.kind === 'justTheThing') {
    const sorted = [...p.cards].sort();
    return (
      <ChoiceDialog
        key="jtt"
        spec={{
          title: t('dlg.justTheThing.title'),
          text: t('dlg.justTheThing.text'),
          cards: sorted,
          mode: 'single',
          cancellable: false,
          onConfirm: ([card]) => act({ t: 'resolve', card }),
        }}
        onDone={() => {}}
      />
    );
  }
  if (p.kind === 'foresight') {
    return (
      <ChoiceDialog
        key="fs"
        spec={{
          title: t('dlg.foresight.title'),
          text: t('dlg.foresight.text'),
          cards: p.cards,
          mode: 'order',
          cancellable: false,
          onConfirm: (order) => act({ t: 'resolve', order }),
        }}
        onDone={() => {}}
      />
    );
  }
  // Plan Ahead: pick the card to keep, then order the rest.
  if (!keep) {
    return (
      <ChoiceDialog
        key="pa1"
        spec={{
          title: t('dlg.planAhead.title'),
          text: t('dlg.planAhead.text'),
          cards: p.cards,
          mode: 'single',
          cancellable: false,
          onConfirm: ([k]) => {
            const rest = p.cards.filter((c) => c !== k);
            if (rest.length <= 1) act({ t: 'resolve', keep: k, order: rest });
            else setKeep(k);
          },
        }}
        onDone={() => {}}
      />
    );
  }
  return (
    <ChoiceDialog
      key="pa2"
      spec={{
        title: t('dlg.planAhead.title'),
        text: t('dlg.foresight.text'),
        cards: p.cards.filter((c) => c !== keep),
        mode: 'order',
        cancellable: false,
        onConfirm: (order) => {
          act({ t: 'resolve', keep, order });
          setKeep(null);
        },
      }}
      onDone={() => {}}
    />
  );
}

export function PhaseModal() {
  const { game, animating, tutorial } = useGame();
  const { t, d } = useI18n();
  if (animating) return null;
  if (tutorial) return <TutorialEnd />;
  if (game.phase === 'missionComplete') {
    const n = game.mission;
    const m = d.missions[n];
    return (
      <Modal label={t('modal.missionComplete', { n })} className="phase">
        <div className="phase-art">
          <CardImg id={`mission-${n}`} size={480} />
        </div>
        <h2>{t('modal.missionComplete', { n })}</h2>
        <p className="big">{t('modal.alarmRecorded', { alarm: game.scores[n - 1] })}</p>
        <p>
          <span className="lbl">{t('modal.reward')} </span>
          <Rich text={m.reward} />
        </p>
        <p className="muted">{t('modal.nextInfo')}</p>
        <div className="modal-acts">
          <button className="primary" onClick={() => dispatch({ t: 'nextMission' })}>
            {t('modal.startMission', { n: n + 1 })}
          </button>
        </div>
      </Modal>
    );
  }
  if (game.phase === 'gameOver') {
    const alarm = game.gameOver === 'alarm';
    return (
      <Modal label={t(alarm ? 'modal.gameOverAlarm' : 'modal.gameOverTime')} className="phase danger">
        <h2>{t(alarm ? 'modal.gameOverAlarm' : 'modal.gameOverTime')}</h2>
        <p className="big">{t(alarm ? 'modal.gameOverAlarmText' : 'modal.gameOverTimeText')}</p>
        <ScoreTable scores={game.scores} />
        <p className="muted">{t('modal.retryNote')}</p>
        <div className="modal-acts">
          <button className="ghost" onClick={() => setScreen('start')}>
            {t('menu.mainMenu')}
          </button>
          <button className="ghost" onClick={() => newGame()}>
            {t('modal.newCampaign')}
          </button>
          <button className="primary" onClick={retryMission}>
            {t('modal.retry', { n: game.mission })}
          </button>
        </div>
      </Modal>
    );
  }
  if (game.phase === 'won') return <WonModal />;
  return null;
}

/** The end of the tutorial game: mission complete, or caught. */
function TutorialEnd() {
  const { game } = useGame();
  const { t, d } = useI18n();
  const campaign = useApp((s) => s.saved?.game);
  const inCampaign = !!campaign && (campaign.phase === 'play' || campaign.phase === 'missionComplete');
  if (game.phase === 'missionComplete') {
    return (
      <Modal label={t('tut.doneTitle')} className="phase">
        <div className="phase-art">
          <CardImg id="mission-1" size={480} />
        </div>
        <h2>{t('tut.doneTitle')}</h2>
        <p className="big">{t('tut.doneText', { alarm: game.scores[0] })}</p>
        <p>
          <Rich text={t('tut.doneNext', { reward: d.missions[1].reward })} />
        </p>
        <div className="modal-acts">
          <button className="ghost" onClick={() => finishTutorial('start')}>
            {t('menu.mainMenu')}
          </button>
          <button className="primary" onClick={() => finishTutorial('campaign')}>
            {inCampaign ? t('tut.backToCampaign') : t('tut.playCampaign')}
          </button>
        </div>
      </Modal>
    );
  }
  if (game.phase === 'gameOver') {
    const alarm = game.gameOver === 'alarm';
    return (
      <Modal label={t(alarm ? 'modal.gameOverAlarm' : 'modal.gameOverTime')} className="phase danger">
        <h2>{t(alarm ? 'modal.gameOverAlarm' : 'modal.gameOverTime')}</h2>
        <p className="big">{t(alarm ? 'modal.gameOverAlarmText' : 'modal.gameOverTimeText')}</p>
        <p className="muted">{t('tut.retryNote')}</p>
        <div className="modal-acts">
          <button className="ghost" onClick={() => finishTutorial('start')}>
            {t('tut.leave')}
          </button>
          <button className="primary" onClick={retryTutorial}>
            {t('tut.retry')}
          </button>
        </div>
      </Modal>
    );
  }
  return null;
}

function WonModal() {
  const { game } = useGame();
  const { t } = useI18n();
  const total = game.scores.reduce((a, b) => a + b, 0);
  return (
    <Modal label={t('modal.wonTitle')} className="phase won">
      <div className="phase-art">
        <CardImg id="mission-5" size={480} />
      </div>
      <h2>{t('modal.wonTitle')}</h2>
      <p className="big">{t('modal.wonText')}</p>
      <ScoreTable scores={game.scores} />
      <p className="big">
        {t('modal.total')}: <b>{total}</b>
      </p>
      <div className="modal-acts">
        <button className="ghost" onClick={() => setScreen('start')}>
          {t('menu.mainMenu')}
        </button>
        <button className="primary" onClick={() => newGame()}>
          {t('modal.newCampaign')}
        </button>
      </div>
    </Modal>
  );
}

export function ScoreTable({ scores }: { scores: number[] }) {
  const { t } = useI18n();
  return (
    <table className="scores">
      <tbody>
        {MISSIONS.map((m, i) => (
          <tr key={m.n}>
            <th>{t('modal.missionN', { n: m.n })}</th>
            <td>{scores[i] ?? '–'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
