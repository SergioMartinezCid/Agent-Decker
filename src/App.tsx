import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { I18nProvider, useI18n } from './i18n';
import { useApp } from './state/store';
import { GameScreen } from './ui/GameScreen';
import { Overlays, StartScreen } from './ui/Screens';

export function App() {
  const lang = useApp((s) => s.settings.lang);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return (
    <I18nProvider lang={lang}>
      <Shell />
    </I18nProvider>
  );
}

function Shell() {
  const screen = useApp((s) => s.screen);
  const hasSave = useApp((s) => !!s.saved);
  return (
    <>
      {screen === 'game' && hasSave ? <GameScreen /> : <StartScreen />}
      <Overlays />
      <Toast />
      <UpdatePrompt />
    </>
  );
}

function Toast() {
  const toast = useApp((s) => s.toast);
  if (!toast) return null;
  return (
    <div className="toast" role="status">
      {toast}
    </div>
  );
}

function UpdatePrompt() {
  const { t } = useI18n();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div className="toast update" role="status">
      {t('pwa.update')}
      <button className="primary" onClick={() => updateServiceWorker(true)}>
        {t('pwa.reload')}
      </button>
      <button className="ghost" onClick={() => setNeedRefresh(false)}>
        {t('common.close')}
      </button>
    </div>
  );
}
