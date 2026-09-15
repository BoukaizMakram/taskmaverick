'use client';

import useDragScroll from './useDragScroll';

// ---------------------------------------------------------------------------
// PhoneShell — the reusable phone chrome (status bar, header, tab selector).
// Pass `tabs` ([{ label, active }]) and the mission cards as children. Wrap it
// in a `.ph-fit` container (with a ref) to scale + drive animations.
// ---------------------------------------------------------------------------

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };
export const IconPlus = () => (<svg viewBox="0 0 18 18"><path d="M9 3.5v11M3.5 9h11" {...stroke} /></svg>);
export const IconMenu = () => (<svg viewBox="0 0 18 18"><path d="M3.5 5.5h11M3.5 9h11M3.5 12.5h11" {...stroke} /></svg>);
export const IconBack = () => (<svg viewBox="0 0 20 20"><path d="M15 10H5.5M9.5 5.5 5 10l4.5 4.5" {...stroke} /></svg>);

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

export default function PhoneShell({ title = 'Personal Board', tabs = [], children, overlay, viewer, onAdd, onMenu, onBack }) {
  const dragScroll = useDragScroll();
  return (
    <div className="ph-phone">
      <span className="ph-side ph-side-left ph-side-action" aria-hidden="true" />
      <span className="ph-side ph-side-left ph-side-up" aria-hidden="true" />
      <span className="ph-side ph-side-left ph-side-down" aria-hidden="true" />
      <span className="ph-side ph-side-right ph-side-power" aria-hidden="true" />
      <div className="ph-screen" {...dragScroll}>
        <div className="ph-status ph-status--persistent">
          <span className="ph-time">9:41</span>
          <span className="ph-island" aria-hidden="true" />
          <StatusIcons />
        </div>
        <div className="ph-board">
          <div className="ph-status" aria-hidden="true" />

          <header className="ph-header">
            <button type="button" className="ph-iconbtn ph-back" aria-label="Back" onClick={onBack}><IconBack /></button>
            <span className="ph-title">{title}</span>
            <div className="ph-actions">
              <button type="button" className="ph-iconbtn" aria-label="Add" onClick={onAdd}><IconPlus /></button>
              <button type="button" className="ph-iconbtn" aria-label="Menu" onClick={onMenu}><IconMenu /></button>
            </div>
          </header>

          <div className="ph-body">
            <div className="ph-tabs">
              {tabs.map((t) => (
                t.onClick ? <button type="button" key={t.label} className={`ph-tab ${t.active ? 'is-active' : ''}`} onClick={t.onClick} aria-pressed={t.active}>{t.label}</button> : <div key={t.label} className={`ph-tab ${t.active ? 'is-active' : ''}`}>{t.label}</div>
              ))}
            </div>
            <div className="ph-cards">{children}</div>
          </div>
        </div>

        {/* an opened mission navigated to inside the same phone */}
        {overlay ? <div className="ph-overlay">{overlay}</div> : null}
        {/* a media content viewer (video player) opened above the mission detail */}
        {viewer ? <div className="ph-overlay ph-overlay--viewer">{viewer}</div> : null}
      </div>
    </div>
  );
}
