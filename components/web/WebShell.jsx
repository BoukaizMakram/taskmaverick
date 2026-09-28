'use client';

// ---------------------------------------------------------------------------
// WebShell — the web app's chrome for the sections beyond Overview (Missions,
// Reports, Dashboards…): the same top bar and sub-nav markup as the Overview
// workspace (.ow-*), so switching sections never changes the frame.
// ---------------------------------------------------------------------------

import { Icon } from '@/components/OverviewWorkspace';

export const NAV = ['Missions', 'People', 'Teams', 'Units', 'Ticket Boards', 'Groups', 'Certifications', 'Timesheets', 'Reports', 'Dashboards', 'Overview'];
export const LIVE_SECTIONS = ['Missions', 'Reports', 'Dashboards', 'Overview'];

export function WebTopbar({ active, onSection }) {
  return <header className="ow-topbar">
    <a href="/" className="ow-logo" aria-label="Taskmaverick home" onClick={e => { if (onSection) { e.preventDefault(); onSection('Overview'); } }}><img src="/logo.svg" alt="taskmaverick"/></a>
    <nav aria-label="Main navigation">{NAV.map(name => <button type="button" key={name} className={name === active ? 'is-active' : ''} aria-current={name === active ? 'page' : undefined} title={LIVE_SECTIONS.includes(name) ? undefined : 'Not part of this replica'} onClick={() => LIVE_SECTIONS.includes(name) && onSection?.(name)}>{name}</button>)}</nav>
    <div className="ow-account"><button type="button" className="ow-icon-button" aria-label="Notifications"><Icon name="bell"/></button><button type="button" className="ow-icon-button" aria-label="Settings"><Icon name="settings"/></button><span className="ow-avatar" aria-label="James Miller">JM</span></div>
  </header>;
}

export function WebSubnav({ tabs, active, onTab, right }) {
  return <div className="ow-subnav"><nav aria-label="Section views">{tabs.map(t => <button type="button" key={t} className={t === active ? 'is-active' : ''} aria-pressed={t === active} onClick={() => onTab(t)}>{t}</button>)}</nav>{right}</div>;
}

export default function WebShell({ active, onSection, embedded, children, className = '' }) {
  return <main className={`ow-workspace wa-app${embedded ? ' is-embedded' : ''} ${className}`} aria-label={`Taskmaverick ${active}`}>
    <WebTopbar active={active} onSection={onSection}/>
    {children}
  </main>;
}
