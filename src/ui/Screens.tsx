import { useRef, useState, type ReactNode } from 'react';
import { SCENARIOS, devEnabled } from '../dev/scenarios';
import { LANGS, useI18n } from '../i18n';
import {
  exportSave,
  importSave,
  loadState,
  newGame,
  openTutorial,
  setOverlay,
  setScreen,
  setSettings,
  showToast,
  startTutorial,
  useApp,
  type Overlay,
} from '../state/store';
import { Modal, ScoreTable } from './Dialogs';
import { cardSrc } from './game';
import { Icon, type IconName } from './icons';
import { RulesView } from './RulesView';

const REPO = 'https://github.com/SergioMartinezCid/Agent-Decker';

export function StartScreen() {
  const saved = useApp((s) => s.saved);
  const tutorial = useApp((s) => !!s.tutorial);
  // First visit: nothing played yet, so the tutorial is the suggested start.
  const firstVisit = useApp((s) => !s.saved && !s.tutorial && !s.settings.tutorialSeen && !s.highScores.length);
  const { t } = useI18n();
  const [confirm, setConfirm] = useState(false);
  const inProgress = saved && (saved.game.phase === 'play' || saved.game.phase === 'missionComplete');
  return (
    <div className="start">
      <div className="start-card">
        <img src={cardSrc('back', 480)} alt="" className="start-logo" />
        <h1 className="visually-hidden">{t('app.title')}</h1>
        <p className="start-by">{t('app.byline')}</p>
        <p className="start-unofficial">{t('app.unofficial')}</p>
        <div className="start-acts">
          {saved && (
            <button className="primary big" onClick={() => setScreen('game')}>
              {t('start.continue')}
              <small>{t('start.continueInfo', { mission: saved.game.mission, turn: saved.game.turn, alarm: saved.game.alarm })}</small>
            </button>
          )}
          {firstVisit && (
            <button className="primary big" onClick={openTutorial}>
              {t('start.tutorial')}
              <small>{t('start.tutorialInfo')}</small>
            </button>
          )}
          <button className={saved || firstVisit ? 'ghost big' : 'primary big'} onClick={() => (inProgress ? setConfirm(true) : newGame())}>
            {t('start.newCampaign')}
          </button>
          {!firstVisit && (
            <button className="ghost" onClick={openTutorial}>
              <Icon name="school" />
              {tutorial ? t('start.tutorialContinue') : t('start.tutorial')}
            </button>
          )}
          <div className="start-row">
            <button className="ghost" onClick={() => setOverlay('rules')}>
              {t('start.rules')}
            </button>
            <button className="ghost" onClick={() => setOverlay('scores')}>
              {t('start.highScores')}
            </button>
            <button className="ghost" onClick={() => setOverlay('settings')}>
              {t('start.settings')}
            </button>
            <button className="ghost" onClick={() => setOverlay('about')}>
              {t('start.about')}
            </button>
          </div>
        </div>
        <LangSwitch />
      </div>
      {confirm && (
        <Modal label={t('start.newCampaign')} onClose={() => setConfirm(false)}>
          <h2>{t('start.newCampaign')}</h2>
          <p>{t('start.confirmNew')}</p>
          <div className="modal-acts">
            <button className="ghost" onClick={() => setConfirm(false)}>
              {t('common.cancel')}
            </button>
            <button
              className="primary"
              onClick={() => {
                setConfirm(false);
                newGame();
              }}
            >
              {t('start.confirmYes')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function LangSwitch() {
  const lang = useApp((s) => s.settings.lang);
  const { d } = useI18n();
  void d;
  return (
    <div className="seg" role="radiogroup" aria-label="Language">
      {LANGS.map((l) => (
        <button key={l} role="radio" aria-checked={lang === l} className={lang === l ? 'on' : ''} onClick={() => setSettings({ lang: l })}>
          {l === 'en' ? 'English' : 'Español'}
        </button>
      ))}
    </div>
  );
}

function Panel({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <Modal label={title} onClose={onClose} className="panel">
      <h2>{title}</h2>
      {children}
    </Modal>
  );
}

export function Overlays() {
  const overlay = useApp((s) => s.overlay);
  const close = () => setOverlay(null);
  if (!overlay) return null;
  const C: Record<Exclude<Overlay, null>, ReactNode> = {
    menu: <MenuPanel onClose={close} />,
    rules: <RulesView onClose={close} />,
    settings: <SettingsPanel onClose={close} />,
    about: <AboutPanel onClose={close} />,
    scores: <ScoresPanel onClose={close} />,
    scenarios: <ScenariosPanel onClose={close} />,
  };
  return <>{C[overlay]}</>;
}

function MenuPanel({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const file = useRef<HTMLInputElement>(null);
  const tutorial = useApp((s) => s.screen === 'tutorial');
  const item = (label: string, fn: () => void, icon: IconName) => (
    <button className="menu-item" onClick={fn}>
      <Icon name={icon} />
      {label}
    </button>
  );
  if (tutorial) {
    return (
      <Panel title={t('menu.title')} onClose={onClose}>
        <div className="menu-list">
          {item(t('menu.resumeTutorial'), onClose, 'play')}
          {item(t('menu.restartTutorial'), startTutorial, 'undo')}
          {item(t('menu.leaveTutorial'), () => setScreen('start'), 'home')}
          {item(t('start.rules'), () => setOverlay('rules'), 'rules')}
          {item(t('start.settings'), () => setOverlay('settings'), 'settings')}
          {item(t('start.about'), () => setOverlay('about'), 'info')}
        </div>
        <p className="muted small">{t('menu.tutorialNote')}</p>
      </Panel>
    );
  }
  return (
    <Panel title={t('menu.title')} onClose={onClose}>
      <div className="menu-list">
        {item(t('menu.resume'), onClose, 'play')}
        {item(t('menu.mainMenu'), () => setScreen('start'), 'home')}
        {item(t('start.rules'), () => setOverlay('rules'), 'rules')}
        {item(t('start.settings'), () => setOverlay('settings'), 'settings')}
        {item(t('start.highScores'), () => setOverlay('scores'), 'trophy')}
        {item(t('menu.exportSave'), exportSave, 'download')}
        {item(t('menu.importSave'), () => file.current?.click(), 'upload')}
        {devEnabled() && item(t('menu.scenarios'), () => setOverlay('scenarios'), 'flask')}
        {item(t('start.about'), () => setOverlay('about'), 'info')}
      </div>
      <input
        ref={file}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          showToast((await importSave(f)) ? t('menu.importOk') : t('menu.importBad'));
        }}
      />
    </Panel>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const { t } = useI18n();
  return (
    <div className="setting">
      <span>{label}</span>
      <div className="seg" role="radiogroup" aria-label={label}>
        <button role="radio" aria-checked={value} className={value ? 'on' : ''} onClick={() => onChange(true)}>
          {t('common.on')}
        </button>
        <button role="radio" aria-checked={!value} className={!value ? 'on' : ''} onClick={() => onChange(false)}>
          {t('common.off')}
        </button>
      </div>
    </div>
  );
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const settings = useApp((s) => s.settings);
  return (
    <Panel title={t('settings.title')} onClose={onClose}>
      <div className="setting">
        <span>{t('settings.language')}</span>
        <LangSwitch />
      </div>
      <Toggle label={t('settings.sound')} value={settings.sound} onChange={(sound) => setSettings({ sound })} />
      <Toggle label={t('settings.music')} value={settings.music} onChange={(music) => setSettings({ music })} />
      <div className="setting">
        <label htmlFor="music-volume">{t('settings.musicVolume')}</label>
        <input
          id="music-volume"
          className="range"
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(settings.musicVolume * 100)}
          disabled={!settings.music}
          onChange={(e) => setSettings({ musicVolume: Number(e.target.value) / 100 })}
        />
      </div>
      <Toggle label={t('settings.animations')} value={settings.anim} onChange={(anim) => setSettings({ anim })} />
    </Panel>
  );
}

function AboutPanel({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Panel title={t('about.title')} onClose={onClose}>
      <div className="prose">
        <p>{t('about.p1')}</p>
        <p>{t('about.p2')}</p>
        <p>{t('about.p3')}</p>
        <p>{t('about.p4')}</p>
        <ul className="links">
          <li>
            <a href="https://gr9yfox.itch.io/agent-decker" target="_blank" rel="noreferrer">
              {t('about.original')}
            </a>
          </li>
          <li>
            <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noreferrer">
              {t('about.license')}
            </a>
          </li>
          <li>
            <a href={REPO} target="_blank" rel="noreferrer">
              {t('about.source')}
            </a>
          </li>
        </ul>
      </div>
    </Panel>
  );
}

function ScoresPanel({ onClose }: { onClose: () => void }) {
  const { t, lang } = useI18n();
  const scores = useApp((s) => s.highScores);
  return (
    <Panel title={t('scores.title')} onClose={onClose}>
      {!scores.length && <p className="muted">{t('scores.empty')}</p>}
      {scores.length > 0 && (
        <div className="table-wrap">
          <table className="scores wide">
            <thead>
              <tr>
                <th>{t('scores.date')}</th>
                {[1, 2, 3, 4, 5].map((n) => (
                  <th key={n}>M{n}</th>
                ))}
                <th>{t('scores.total')}</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s, i) => (
                <tr key={i}>
                  <td>
                    {new Date(s.date).toLocaleDateString(lang)}
                    {s.retries > 0 && <span className="tag">{t('scores.retried')}</span>}
                  </td>
                  {s.scores.map((v, j) => (
                    <td key={j}>{v}</td>
                  ))}
                  <td>
                    <b>{s.total}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function ScenariosPanel({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Panel title={t('menu.scenarios')} onClose={onClose}>
      <p className="muted small">{t('menu.scenariosHint')}</p>
      <div className="menu-list">
        {SCENARIOS.map((sc) => (
          <button key={sc.name} className="menu-item" onClick={() => loadState(sc.build())}>
            {sc.name}
          </button>
        ))}
      </div>
    </Panel>
  );
}

export { ScoreTable };
