'use client';

// ---------------------------------------------------------------------------
// Quality storyboard — device screens for the /quality page. Each screen is
// the real Taskmaverick mobile UI, recreated in code (self-contained, no
// external assets) so the "Improving Quality" scenes look like the product.
//
// Reuses the existing product UI where it exists (OpenedMission, MissionChip,
// the .om-*/.chip-*/.ph-* classes). New surfaces the site didn't have yet —
// star ratings, the alert Ticket, checkpoint photo capture, the media-proof
// feed and the Gallery — are built here with namespaced .q-* classes, modelled
// on the Figma "Taskmaverick Mobile" Ticket screen and the storyboard art.
// ---------------------------------------------------------------------------

import { OpenedMission } from '@/components/OpenedMission';
import MissionChip from '@/components/MissionChip';
import { checklist } from '@/lib/openedMissions';

// ------------------------------ shared chrome ------------------------------

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };
const IconBack = () => (<svg viewBox="0 0 22 22"><path d="M16 11H6.5M10.5 6 5.5 11l5 5" {...stroke} /></svg>);
const IconPlus = () => (<svg viewBox="0 0 18 18"><path d="M9 3.5v11M3.5 9h11" {...stroke} /></svg>);
const IconMenu = () => (<svg viewBox="0 0 18 18"><path d="M3.5 5.5h11M3.5 9h11M3.5 12.5h11" {...stroke} /></svg>);

function StatusIcons() {
  return (
    <span className="ph-status-icons" aria-hidden="true">
      <svg width="18" height="12" viewBox="0 0 18 12">
        <rect x="0" y="8" width="3" height="4" rx="1" fill="#000" />
        <rect x="5" y="5" width="3" height="7" rx="1" fill="#000" />
        <rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#000" />
        <rect x="15" y="0" width="3" height="12" rx="1" fill="#000" />
      </svg>
      <svg width="17" height="12" viewBox="0 0 17 12">
        <path d="M8.5 3.2c2.2 0 4.2.8 5.7 2.2l1.4-1.5A10 10 0 0 0 8.5 1 10 10 0 0 0 1.4 3.9l1.4 1.5A8 8 0 0 1 8.5 3.2z" fill="#000" />
        <path d="M8.5 6.6c1.3 0 2.5.5 3.4 1.4l1.4-1.5a7 7 0 0 0-9.6 0l1.4 1.5A4.8 4.8 0 0 1 8.5 6.6z" fill="#000" />
        <circle cx="8.5" cy="10" r="1.8" fill="#000" />
      </svg>
      <svg width="26" height="13" viewBox="0 0 26 13">
        <rect x="0.6" y="0.6" width="22" height="11.8" rx="3" fill="none" stroke="#000" strokeOpacity="0.4" />
        <rect x="2" y="2" width="18" height="9" rx="1.6" fill="#000" />
        <rect x="23.4" y="4" width="1.8" height="5" rx="0.9" fill="#000" fillOpacity="0.4" />
      </svg>
    </span>
  );
}

function StatusBar() {
  return (
    <div className="ph-status">
      <span className="ph-time">9:41</span>
      <span className="ph-island" aria-hidden="true" />
      <StatusIcons />
    </div>
  );
}

// A titanium phone bezel that scales to its `.q-device` box (reuses .ph-*).
export function PhoneBezel({ width = 300, children }) {
  return (
    <div className="ph-fit q-fit" style={{ width }}>
      <div className="ph-phone">
        <div className="ph-screen">{children}</div>
      </div>
    </div>
  );
}

// Screen header used by the custom screens (mirrors OpenedMission's header).
function ScreenHead({ title = 'Mission Details', right = 'plus-menu' }) {
  return (
    <header className="om-header">
      <button type="button" className="om-hbtn om-hbtn--back" aria-label="Back"><IconBack /></button>
      <span className="om-header-title">{title}</span>
      <div className="om-head-actions">
        {right === 'es-menu' && <span className="om-es" aria-hidden="true">ES</span>}
        <button type="button" className="om-hbtn" aria-label="Add"><IconPlus /></button>
        <button type="button" className="om-hbtn" aria-label="Menu"><IconMenu /></button>
      </div>
    </header>
  );
}

const Logo = () => <img className="chip-logo" src="/mission-logo.png" alt="" aria-hidden="true" />;

// ------------------------------ primitives ------------------------------

export function Stars({ value = 0, total = 5, size = 22 }) {
  return (
    <span className="q-stars" aria-label={`${value} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" className={i < value ? 'is-on' : ''} aria-hidden="true">
          <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.45 6.19 20.5 7.3 14.03 2.6 9.45l6.5-.95L12 2.6z" />
        </svg>
      ))}
    </span>
  );
}

// A self-contained "photo" tile — a soft scene illustration, optional
// timestamp watermark and optional corner badge (cloud / lock).
export function ProofPhoto({ tone = 'a', stamp, badge, label, ratio = '4 / 3' }) {
  return (
    <div className={`q-photo q-photo--${tone}`} style={{ aspectRatio: ratio }}>
      <svg className="q-photo-art" viewBox="0 0 120 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect x="0" y="58" width="120" height="32" fill="rgba(0,0,0,0.14)" />
        <rect x="10" y="30" width="34" height="28" rx="2" fill="rgba(255,255,255,0.55)" />
        <rect x="52" y="20" width="26" height="38" rx="2" fill="rgba(255,255,255,0.4)" />
        <rect x="86" y="36" width="24" height="22" rx="2" fill="rgba(255,255,255,0.5)" />
        <circle cx="98" cy="18" r="9" fill="rgba(255,255,255,0.6)" />
      </svg>
      {label ? <span className="q-photo-label" aria-hidden="true">{label}</span> : null}
      {stamp ? <span className="q-photo-stamp">{stamp}</span> : null}
      {badge === 'cloud' ? (
        <span className="q-photo-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="15" height="15"><path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.4A3.5 3.5 0 0 1 18 18H7z" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" /><path d="M12 15V9m0 0-2 2m2-2 2 2" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      ) : null}
      {badge === 'lock' ? (
        <span className="q-photo-badge q-photo-badge--lock" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14"><rect x="5" y="10.5" width="14" height="9.5" rx="2" fill="#fff" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="#fff" strokeWidth="1.9" /></svg>
        </span>
      ) : null}
    </div>
  );
}

const IconStarSm = ({ on }) => (
  <svg viewBox="0 0 24 24" width="15" height="15" className={on ? 'q-mini-star is-on' : 'q-mini-star'} aria-hidden="true">
    <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.45 6.19 20.5 7.3 14.03 2.6 9.45l6.5-.95L12 2.6z" />
  </svg>
);
const IconMissionSm = () => (
  <svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true"><rect x="2.5" y="2.5" width="13" height="13" rx="3" fill="none" stroke="#1271b7" strokeWidth="1.6" /><path d="M5.5 9l2.2 2.2L12.5 6.5" fill="none" stroke="#1271b7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

// ------------------------------ screens ------------------------------

// A completed mission card used to head the rating screens.
function DoneChip({ title = 'Closing Checklist', who = 'Anna F. - Staff' }) {
  return (
    <MissionChip
      kind="Checklist"
      points={10}
      title={title}
      who={who}
      date="04-01-24"
      time="06:56 PM"
      showExec
      execTime="00:06:12"
      pillTime="00:07:53"
      pillClass="chip--green"
    />
  );
}

// Scenes 3 & 4 — ratings. variant: 'self' | 'peer'
export function RatingScreen({ variant = 'self' }) {
  return (
    <div className="om">
      <StatusBar />
      <ScreenHead title="Mission Details" />
      <div className="q-body">
        <DoneChip />
        {variant === 'self' ? (
          <div className="q-rate-card">
            <p className="q-rate-q">Rate your completed mission</p>
            <Stars value={4} />
            <p className="q-rate-note">Self-rating · builds personal accountability</p>
          </div>
        ) : (
          <div className="q-rate-card">
            <p className="q-rate-q">Peer review</p>
            <ul className="q-peers">
              {[
                { who: 'Julian D', v: 5 },
                { who: 'Maria S', v: 4 },
                { who: 'Miguel A', v: 4 },
              ].map((p) => (
                <li key={p.who} className="q-peer">
                  <span className="q-avatar" aria-hidden="true">{p.who[0]}</span>
                  <span className="q-peer-who">{p.who}</span>
                  <span className="q-peer-stars">
                    {[1, 2, 3, 4, 5].map((n) => <IconStarSm key={n} on={n <= p.v} />)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="q-rate-note">Crowdsourced quality control</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Scene 5 — the alert Ticket (Figma node 9091:15890). A low rating triggered it.
export function AlertTicketScreen() {
  return (
    <div className="om">
      <StatusBar />
      <ScreenHead title="Ticket" right="plus-menu" />
      <div className="q-body">
        <div className="q-ticket">
          <div className="q-tk-top">
            <span className="q-tk-id"><Logo /> <span className="om-sum-kind">Ticket</span> <span className="chip-points">25</span></span>
            <span className="chip-pill q-pill-red">00:07:40</span>
          </div>
          <div className="q-tk-head">
            <span>
              <h3 className="om-sum-title">Ticket Details</h3>
              <span className="om-sum-loc">Kitchen / 1</span>
              <span className="om-sum-by">Posted by: Anna F. - Staff</span>
            </span>
            <span className="om-sum-date">04-01-24&nbsp;&nbsp;06:56 PM</span>
          </div>
          <div className="om-sum-divider" />
          <div className="q-tk-rules">
            <div className="q-tk-rule"><IconMissionSm /> <span>Timer &amp; Rating Task</span></div>
            <div className="q-tk-rule q-hl-rule"><IconStarSm /> <span>If Any Rating Is Below: 4</span></div>
            <div className="q-tk-rule"><IconStarSm on /> <span>Rating: 2</span></div>
          </div>
          <div className="om-sum-divider" />
          <p className="om-sum-desc">This is the description it can be one line or more if they really want it to.</p>
          <div className="om-notice"><span>Do Not Cross Contaminate. Use The Designated Mops And Tools For Every Surface</span></div>
          <p className="q-tk-report">Is there anything you should report to the manager?</p>
          <div className="q-tk-inputs">
            <span className="q-input" />
            <span className="q-input" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Scenes 6/7/8 — checkpoint photo. variant: 'capture' | 'cloud' | 'stamped'
export function CheckpointScreen({ variant = 'capture' }) {
  const badge = variant === 'cloud' ? 'cloud' : variant === 'stamped' ? 'lock' : null;
  const stamp = variant === 'stamped' ? '07-15-2026  10:00:35 AM' : null;
  return (
    <div className="om">
      <StatusBar />
      <ScreenHead title="Mission Details" right="es-menu" />
      <div className="q-body">
        <div className="q-cp-head">
          <span className="q-cp-n">2.</span>
          <span className="q-cp-q">Verify the walk-in cooler is clean and confirm the condition with a photo.</span>
        </div>

        <ProofPhoto tone="a" stamp={stamp} badge={badge} label="Walk-in cooler" />

        <div className="q-cp-actions">
          <button type="button" className={`q-capture ${variant === 'capture' ? 'q-hl-btn' : ''}`}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 8.5h3l1.4-2h7.2L17 8.5h3a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="12" cy="13" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
            Take Photo
          </button>
          <button type="button" className="q-capture q-capture--ghost">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="3" y="6.5" width="12.5" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M15.5 10.5 21 7.5v9l-5.5-3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
            Video
          </button>
        </div>

        {variant === 'cloud' ? (
          <p className="q-cp-note"><b>Uploaded to the cloud.</b> Not saved on this phone.</p>
        ) : variant === 'stamped' ? (
          <p className="q-cp-note"><b>Date &amp; time stamped.</b> Cannot be reused in a future instance.</p>
        ) : (
          <p className="q-cp-note">Captured in-app to confirm real conditions.</p>
        )}
      </div>
    </div>
  );
}

// Scene 9 — media-proof feed (browse past audits like social media).
export function ProofFeedScreen() {
  const items = [
    { who: 'Julian D', loc: 'Kitchen / 1', time: '07-15-26  10:00 AM', exec: '00:06:12', tone: 'a', mission: 'Closing Checklist' },
    { who: 'Maria S', loc: 'Line / 3', time: '07-15-26  09:42 AM', exec: '00:04:51', tone: 'b', mission: 'Cooler Audit' },
  ];
  return (
    <div className="om">
      <StatusBar />
      <ScreenHead title="Media Proof" right="plus-menu" />
      <div className="q-body q-feed">
        {items.map((it) => (
          <article className="q-post" key={it.who}>
            <header className="q-post-head">
              <span className="q-avatar" aria-hidden="true">{it.who[0]}</span>
              <span className="q-post-id">
                <b>{it.who}</b>
                <small>{it.mission} · {it.loc}</small>
              </span>
              <span className="chip-pill q-pill-mini">{it.exec}</span>
            </header>
            <ProofPhoto tone={it.tone} ratio="16 / 10" stamp={it.time} />
            <footer className="q-post-foot">
              <span>Closed {it.time}</span>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}

// Scene 10 — the Gallery: review conditions by mission, person or date.
export function GalleryScreen() {
  const tiles = ['a', 'b', 'a', 'b', 'b', 'a', 'b', 'a', 'a'];
  return (
    <div className="om">
      <StatusBar />
      <ScreenHead title="Gallery" right="plus-menu" />
      <div className="q-body">
        <div className="q-filters q-hl-filters">
          {['By Mission', 'By Person', 'By Date'].map((f, i) => (
            <span key={f} className={`q-filter ${i === 0 ? 'is-active' : ''}`}>{f}</span>
          ))}
        </div>
        <div className="q-grid">
          {tiles.map((t, i) => (
            <ProofPhoto key={i} tone={t} ratio="1 / 1" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Scenes 1 & 2 — reuse the real OpenedMission Checklist. Scene 2 shows the same
// mission translated to Spanish (ES button highlighted).
const checklistES = {
  ...checklist,
  claimedFooter: { label: 'Cerrar', variant: 'muted' },
  description: 'Esta es la descripción, puede ser una línea o más si realmente lo desean.',
  notice: 'No Contaminar. Use Los Trapeadores Y Herramientas Designados Para Cada Superficie',
  sectionTitle: 'Lista de verificación',
  groups: [
    { title: 'Estante', done: 2, total: 2, items: [{ n: 1, label: 'Platos', value: 2 }, { n: 2, label: 'Tazas', value: 2 }] },
    { title: 'Estante 2', done: 2, total: 2, items: [{ n: 1, label: 'Platos', value: 2 }, { n: 2, label: 'Tazas', value: 2 }] },
    { title: 'Almacén', done: 0, total: 4, collapsed: true },
    { title: 'Estante', done: 2, total: 4, collapsed: true },
    { title: 'Total', tone: 'yellow', items: [{ n: 1, label: 'Plato', value: 4 }] },
  ],
};

export function ChecklistStepsScreen() {
  return <OpenedMission mission={{ ...checklist, headerRight: 'es-undo' }} state="claimed" showExec />;
}

// Two stacked language layers so the scene can cross-fade EN -> ES on the tap.
export function TranslateScreen() {
  return (
    <div className="q-translate">
      <div className="q-lang q-lang-en"><OpenedMission mission={{ ...checklist, headerRight: 'es-undo' }} state="claimed" showExec /></div>
      <div className="q-lang q-lang-es"><OpenedMission mission={{ ...checklistES, headerRight: 'es-undo' }} state="claimed" showExec /></div>
    </div>
  );
}
