import { useState } from 'react';
import { CARDS, MISSIONS, type CardSet } from '../engine/cards';
import type { Block } from '../content/types';
import { useI18n } from '../i18n';
import { Modal } from './Dialogs';
import { cardSrc } from './game';
import { Rich } from './Rich';

type Tab = 'rules' | 'faq' | 'cards';

export function RulesView({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('rules');
  return (
    <Modal label={t('rulesView.title')} onClose={onClose} className="panel rules">
      <h2>{t('rulesView.title')}</h2>
      <div className="seg tabs" role="tablist">
        {(['rules', 'faq', 'cards'] as Tab[]).map((x) => (
          <button key={x} role="tab" aria-selected={tab === x} className={tab === x ? 'on' : ''} onClick={() => setTab(x)}>
            {t(`rulesView.${x}`)}
          </button>
        ))}
      </div>
      <div className="rules-body">
        {tab === 'rules' && <Rulebook />}
        {tab === 'faq' && <Faq />}
        {tab === 'cards' && <CardGallery />}
      </div>
    </Modal>
  );
}

function BlockView({ b }: { b: Block }) {
  if (typeof b === 'string')
    return (
      <p>
        <Rich text={b} />
      </p>
    );
  if ('h' in b) return <h4>{b.h}</h4>;
  if ('list' in b)
    return (
      <ul>
        {b.list.map((x, i) => (
          <li key={i}>
            <Rich text={x} />
          </li>
        ))}
      </ul>
    );
  if ('steps' in b)
    return (
      <ol className="steps">
        {b.steps.map(([h, x], i) => (
          <li key={i}>
            <b>{h}</b> <Rich text={x} />
          </li>
        ))}
      </ol>
    );
  if ('defs' in b)
    return (
      <dl className="defs">
        {b.defs.map(([k, v], i) => (
          <div key={i}>
            <dt>{k}</dt>
            <dd>
              <Rich text={v} />
            </dd>
          </div>
        ))}
      </dl>
    );
  return <img className={`rules-img ${b.wide ? 'wide' : ''}`} src={`${import.meta.env.BASE_URL}${b.img}`} alt={b.alt} loading="lazy" />;
}

function Rulebook() {
  const { rules, t } = useI18n();
  return (
    <div className="prose">
      <nav className="toc">
        {rules.sections.map((s) => (
          <a key={s.id} href={`#r-${s.id}`} onClick={(e) => {
            e.preventDefault();
            document.getElementById(`r-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}>
            {s.title}
          </a>
        ))}
      </nav>
      {rules.sections.map((s) => (
        <section key={s.id} id={`r-${s.id}`}>
          <h3>{s.title}</h3>
          {s.blocks.map((b, i) => (
            <BlockView key={i} b={b} />
          ))}
        </section>
      ))}
      <p className="muted small">{t('rulesView.source')}</p>
    </div>
  );
}

function Faq() {
  const { rules, t } = useI18n();
  return (
    <div className="prose">
      <p className="muted">{t('rulesView.faqIntro')}</p>
      {rules.faq.map((g) => (
        <section key={g.title}>
          <h3>{g.title}</h3>
          {g.items.map((it) => (
            <details key={it.q} className="faq">
              <summary>
                <Rich text={it.q} />
              </summary>
              <p>
                <Rich text={it.a} />
              </p>
            </details>
          ))}
        </section>
      ))}
    </div>
  );
}

function CardGallery() {
  const { t, name } = useI18n();
  const [big, setBig] = useState<string | null>(null);
  const groups: { title: string; keys: string[] }[] = [
    { title: t('rulesView.starting'), keys: CARDS.filter((c) => c.set === 'start').map((c) => c.key) },
    { title: t('rulesView.obstacleDeck'), keys: CARDS.filter((c) => c.set === 'base').map((c) => c.key) },
    ...(['B', 'D', 'F', 'H'] as CardSet[]).map((set) => ({
      title: t('rulesView.missionSet', { set }),
      keys: CARDS.filter((c) => c.set === set).map((c) => c.key),
    })),
    { title: t('rulesView.missionCards'), keys: MISSIONS.map((m) => m.card) },
  ];
  return (
    <div className="gallery">
      {groups.map((g) => (
        <section key={g.title}>
          <h3>{g.title}</h3>
          <div className="gallery-grid">
            {g.keys.map((k) => {
              const count = CARDS.find((c) => c.key === k)?.count ?? 1;
              return (
                <button key={k} className="gallery-card" onClick={() => setBig(k)}>
                  <img src={cardSrc(k)} alt={name(k)} loading="lazy" />
                  <span>
                    {name(k)}
                    {count > 1 && <small> ×{count}</small>}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
      {big && (
        <Modal label={name(big)} onClose={() => setBig(null)} className="zoom">
          <img src={cardSrc(big, 480)} alt={name(big)} />
        </Modal>
      )}
    </div>
  );
}
