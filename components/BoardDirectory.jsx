'use client';

import { useState } from 'react';
import { IconBack, IconMenu } from './PhoneShell';
import { MenuIcon } from './BoardNavigation';
import TabletHome from './TabletHome';
import PersonalDashboard from './PersonalDashboard';

export const LOCATIONS = ['Back Up Storage', 'Controls', 'Crepe Station', 'Deliveries', 'Food Preparation', 'Kitchen', 'Outside Duties', 'Register', 'Training'];

export default function BoardDirectory({ view, onNavigate, onBoard, getCounts, onMenu, device = 'phone' }) {
  const [period, setPeriod] = useState('1W');
  if (view === 'home') return <PersonalDashboard device={device} onNavigate={onNavigate} onBoard={onBoard} getCounts={getCounts}/>;
  return <section className={`bd-directory ${view === 'home' ? 'bd-directory--home' : ''}`} aria-label={view === 'home' ? 'My personal board home' : 'L001 - Sweet Beverly'}>
    <header className="bd-header">
      {view === 'unit' && <button className="ph-iconbtn" aria-label="Back to home" onClick={() => onNavigate('home')}><IconBack/></button>}
      <img className="bd-logo" src="/logo.svg" alt="Taskmaverick"/>
      {view === 'unit' && <h2>L001 - Sweet Beverly</h2>}
    </header>
    {view === 'home' ? <>
      <div className="bd-home-content">
        <div className="bd-home">
          <div className="bd-identity"><h1>Makram Boukaiz</h1><div className="bd-home-actions"><span className="ph-iconbtn" aria-label="Notifications"><svg viewBox="0 0 24 24"><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5zM10 21h4M18 4l2-2" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg></span><button className="ph-iconbtn" aria-label="Home menu" onClick={onMenu}><IconMenu/></button></div></div>
          <p>sweetbeverly</p>
          <div className="bd-home-tiles">
            <button className="bd-row bd-tile" onClick={() => onBoard('personal')}><MenuIcon kind="profile-green" color="green"/><span className="bd-tile-count">00 <i>›</i></span><b>My Board</b></button>
            <div className="bd-row bd-tile"><MenuIcon kind="course" color="orange"/><span className="bd-tile-count">00 <i>›</i></span><b>My Courses</b></div>
            <button className="bd-row bd-tile bd-unit-tile" onClick={() => onNavigate('unit')}><MenuIcon kind="units" color="purple"/><span className="bd-chevron">›</span><b>L001 - Sweet Beverly</b></button>
          </div>
        </div>
        <section className="bd-performance" aria-label="My Performance"><h2>My Performance</h2><div className="bd-periods">{['1W','4W','12W','52W','All'].map(value => <button key={value} aria-pressed={period === value} onClick={() => setPeriod(value)}>{value}</button>)}</div><div className="bd-metrics"><div><span>Objectivity</span><b>-</b></div><div><span>Work Quality</span><b>-</b></div><div><span>Total Closed</span><b>{getCounts('personal')[2]}</b></div></div></section>
      </div>
      <nav className="bd-bottom-nav" aria-label="Main navigation">
        <button aria-current="page" onClick={() => onNavigate('home')}><svg viewBox="0 0 24 24"><path d="M3 10 12 3l9 7v11h-6v-7H9v7H3z" fill="currentColor"/></svg><span>Home</span></button>
        <button onClick={() => onNavigate('unit')}><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 5v14M5 12h14"/></svg><span>Missions</span></button>
        <span><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M7 1v6M17 1v6M3 10h18"/></svg><span>Activity</span></span>
        <span><svg viewBox="0 0 24 24"><circle cx="12" cy="6" r="4"/><path d="M20 22H4v-3c0-7 16-7 16 0"/></svg><span>Profile</span></span>
      </nav>
    </> : <><div className="bd-sort">Name⌄ <span>Grid View</span></div><div className="bd-locations">{LOCATIONS.map(name => <button key={name} className="bd-location" onClick={() => onBoard(name)}><h3><img src="/mission-logo.png" alt=""/>{name}</h3><div className="bd-counts">{['Open','Claimed','Closed'].map((status, i) => <span key={status}><small>{status}</small><b>{getCounts(name)[i]}</b></span>)}</div></button>)}</div></>}
  </section>;
}
