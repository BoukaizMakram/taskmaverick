'use client';

import { useEffect, useRef, useState } from 'react';
import PhoneShell, { IconBack, IconPlus, IconMenu } from '@/components/PhoneShell';
import BoardDirectory from '@/components/BoardDirectory';
import { trainingMission, entriesComplete } from './MissionEntries';
import LoadingLogo from './LoadingLogo';
import MissionChip from '@/components/MissionChip';
import { OpenedMission } from '@/components/OpenedMission';
import { BoardMenu, OnDemand } from '@/components/BoardNavigation';
import PersonalCodeDialog from '@/components/PersonalCodeDialog';
import { task, checklist } from '@/lib/openedMissions';

function BoardIcon({ kind }) {
  const paths = {
    back: 'M15 10H5M9 5l-5 5 5 5',
    add: 'M10 3v14M3 10h14',
    menu: 'M4 5h12M4 10h12M4 15h12',
    expand: 'M7 3H3v4M13 3h4v4M3 13v4h4M17 13v4h-4M3 7l5-5M12 18l5-5',
  };
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d={paths[kind]} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

const format = seconds => [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(n => String(n).padStart(2, '0')).join(':');
const initial = device => [
  { ...trainingMission, entries: { ...trainingMission.entries } },
  { ...task, id: 'pasta', title: 'Cook Pasta', status: 'open', age: 460 },
  { ...task, id: 'tiramisu', title: 'Cook Tiramisu', status: 'open', age: 320 },
  ...(device === 'tablet' ? [{ ...checklist, id: 'cleaning', title: 'Closing Checklist', status: 'claimed', age: 200, started: 0, performer: 'J. Maverick' }] : []),
];

export default function InteractiveMissionBoard({ device = 'phone' }) {
  const [transitioning, setTransitioning] = useState(false);
  const transitionTimer = useRef(null);
  useEffect(() => () => clearTimeout(transitionTimer.current), []);
  const showTransition = () => {
    clearTimeout(transitionTimer.current);
    setTransitioning(true);
    transitionTimer.current = setTimeout(() => setTransitioning(false), 900);
  };
  const [screen, setScreen] = useState('home');
  const [boardId, setBoardId] = useState(device === 'phone' ? 'personal' : 'Kitchen');
  const savedBoards = useRef({});
  const [missions, setMissions] = useState(() => initial(device));
  const [elapsed, setElapsed] = useState(0);
  const clockStart = useRef(null);
  const [tab, setTab] = useState('open');
  const [selected, setSelected] = useState(null);
  const [codeAction, setCodeAction] = useState('Claim');
  const [codeOpen, setCodeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [onDemand, setOnDemand] = useState(false);
  const navigationTrigger = useRef(null);
  const openNavigation = (event, kind) => { navigationTrigger.current = event.currentTarget; if (kind === 'menu') setMenuOpen(true); else { showTransition(); setOnDemand(true); } };
  const closeNavigation = () => { if (onDemand) showTransition(); setMenuOpen(false); setOnDemand(false); requestAnimationFrame(() => navigationTrigger.current?.focus({ preventScroll: true })); };
  const [announcement, setAnnouncement] = useState('');
  const claimLock = useRef(false);
  const boardRef = useRef(null);
  const detailRef = useRef(null);
  const hadSelection = useRef(false);
  const isPhone = device === 'phone';
  const mission = missions.find(m => m.id === selected);

  useEffect(() => {
    clockStart.current = Date.now();
    const tick = () => setElapsed(Math.floor((Date.now() - clockStart.current) / 1000));
    const id = setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, []);
  useEffect(() => {
    const board = isPhone ? boardRef.current?.closest('.ph-board') : boardRef.current;
    if (board) board.inert = Boolean(selected || codeOpen || menuOpen || onDemand || screen !== 'board');
    if (detailRef.current) detailRef.current.inert = codeOpen;
    if (selected && !codeOpen) detailRef.current?.querySelector('.om-cta')?.focus({ preventScroll: true });
    if (!selected && hadSelection.current) boardRef.current?.querySelector('.mi-card-button')?.focus({ preventScroll: true });
    hadSelection.current = Boolean(selected);
  }, [selected, codeOpen, isPhone, menuOpen, onDemand, screen]);

  const select = m => { setSelected(m.id); setCodeOpen(false); claimLock.current = false; };
  const claim = performer => {
    if (!mission || mission.status !== 'open' || claimLock.current) return;
    claimLock.current = true;
    setMissions(previous => [{ ...previous.find(m => m.id === selected), status: 'claimed', performer, started: elapsed }, ...previous.filter(m => m.id !== selected)]);
    setCodeOpen(false);
    setTab('claimed');
    setAnnouncement(`${mission.title} claimed by ${performer}`);
  };
  const close = performer => {
    if (!mission || mission.status !== 'claimed' || claimLock.current || (mission.entries && !entriesComplete(mission.entries))) return;
    claimLock.current = true;
    setCodeOpen(false);
    setAnnouncement(`${mission.title} closed by ${performer}`);
    setMissions(previous => [{ ...previous.find(m => m.id === selected), status: 'closed', stopped: elapsed, closedBy: performer, ...(mission.entries ? { savedEntries: { ...mission.entries } } : {}) }, ...previous.filter(m => m.id !== selected)]);
    setTab('closed'); setSelected(null);
  };
  const back = () => { setCodeOpen(false); setSelected(null); };
  const live = m => ({ ...m, pillTime: format(m.age + (m.stopped ?? elapsed)), claimedWho: m.performer, claimer: m.performer });
  const counts = status => missions.filter(m => m.status === status).length;
  const changeEntry = (key, value) => setMissions(previous => previous.map(m => m.id === selected && m.status === 'claimed' ? { ...m, entries: { ...m.entries, [key]: value } } : m));
  const detail = mission && <div className="mi-detail-inner" ref={detailRef}><OpenedMission onEntryChange={changeEntry} mission={live(mission)} state={mission.status} showExec={mission.status !== 'open'} execTime={format((mission.stopped ?? elapsed) - (mission.started ?? elapsed))} onBack={back} onClaim={() => { claimLock.current = false; setCodeAction('Claim'); setCodeOpen(true); }} onClose={() => { claimLock.current = false; setCodeAction('Close'); setCodeOpen(true); }} showStatusBar={isPhone}/></div>;
  const switchBoard = id => { showTransition();
    savedBoards.current[boardId] = missions;
    setMissions(savedBoards.current[id] || initial(id === 'personal' ? 'phone' : 'tablet'));
    setBoardId(id); setScreen('board'); setMenuOpen(false); setOnDemand(false); setSelected(null); setCodeOpen(false); setTab('open');
  };
  const navigate = destination => {
    if (destination === 'personal') return switchBoard('personal');
    showTransition(); setMenuOpen(false); setOnDemand(false); setSelected(null); setCodeOpen(false); setScreen(destination);
  };
  const department = boardId === 'personal' ? 'Personal Board' : boardId;
  const directory = screen !== 'board' && <BoardDirectory device={device} onMenu={event => openNavigation(event, 'menu')} view={screen} onNavigate={navigate} onBoard={switchBoard} getCounts={id => {
    const list = id === boardId ? missions : savedBoards.current[id] || initial(id === 'personal' ? 'phone' : 'tablet');
    return ['open','claimed','closed'].map(status => list.filter(m => m.status === status).length);
  }}/>;
  const navigation = menuOpen && <BoardMenu boardType={boardId === 'personal' ? 'personal' : 'team'} onNavigate={navigate} onDismiss={closeNavigation}/>;
  const demand = onDemand && <OnDemand department={department} onBack={closeNavigation}/>;
  const loader = transitioning && <div className="mi-screen-loader" role="status" aria-label="Loading screen"><LoadingLogo/></div>;
  const dialog = codeOpen && <PersonalCodeDialog action={codeAction} onClaim={codeAction === 'Close' ? close : claim} onDismiss={() => setCodeOpen(false)} />;
  const cards = status => missions.filter(m => m.status === status).map(m => <button className="mi-card-button" type="button" key={m.id} aria-label={`Open mission ${m.title}`} onClick={() => select(m)}>
    <MissionChip kind={m.type} title={m.title} who={m.status === 'open' ? undefined : m.performer} points={m.points} date={m.date} time={m.time} showExec={m.status !== 'open'} execTime={format((m.stopped ?? elapsed) - (m.started ?? elapsed))} pillTime={live(m).pillTime} pillClass={m.status === 'closed' ? 'chip--gray' : 'chip--green'} />
  </button>);

  return <div className={`mi-interactive mi-interactive--${device}`}>
    {isPhone ? <div className="ph-fit mi-phone"><PhoneShell onBack={() => navigate(boardId === 'personal' ? 'home' : 'unit')} onAdd={event => openNavigation(event, 'demand')} onMenu={event => openNavigation(event, 'menu')} title={department} tabs={['open','claimed','closed'].map(status => ({ label: `${status[0].toUpperCase()+status.slice(1)} - ${counts(status)}`, active: tab === status, onClick: () => setTab(status) }))} overlay={directory || detail || demand} viewer={loader || dialog || navigation}>
      <div ref={boardRef} className="mi-phone-cards">{cards(tab)}{!counts(tab) && <p className="mi-empty">No {tab} missions</p>}</div>
    </PhoneShell></div> : <div className="tbl-fit"><div className="tbl-tablet"><div className="tbl-screen mi-tablet-screen">
      <div ref={boardRef} className="mi-tablet-board">
        <header className="tbl-header">
          <div className="mi-brand"><button type="button" className="ph-iconbtn" aria-label="Back" onClick={() => navigate(boardId === 'personal' ? 'home' : 'unit')}><IconBack/></button><img className="mi-full-logo" src="/logo.svg" alt="Taskmaverick" width="220" height="30"/></div>
          <span className="mi-department">{department}</span>
          <div className="tbl-header-actions"><button type="button" className="ph-iconbtn" aria-label="Add" onClick={event => openNavigation(event, 'demand')}><IconPlus/></button><button type="button" className="ph-iconbtn" aria-label="Menu" onClick={event => openNavigation(event, 'menu')}><IconMenu/></button></div>
        </header>
        <div className="mi-columns">{['open','claimed','closed'].map(status => <section key={status} aria-label={`${status} missions`}><h2 className="tbl-tab">{status[0].toUpperCase()+status.slice(1)} - {counts(status)}<BoardIcon kind="expand"/></h2><div className="mi-column-cards">{cards(status)}</div></section>)}</div>
      </div>
      {mission && <><button type="button" className="mi-drawer-shade" aria-label="Back to board" onClick={back}/><aside className="mi-drawer" aria-label="Mission Details">{detail}</aside></>}
      {onDemand && <><button type="button" className="mi-drawer-shade" aria-label="Back to board" onClick={closeNavigation}/><aside className="mi-drawer" aria-label="On-Demand panel">{demand}</aside></>}
      {directory && <div className="bd-tablet-overlay">{directory}</div>}
      {navigation}
      {dialog}
      {loader}
    </div></div></div>}
    <div className="mi-recording-controls"><button type="button" className="ov-btn" onClick={() => { savedBoards.current = {}; setMissions(initial(boardId === 'personal' ? 'phone' : 'tablet')); clockStart.current = Date.now(); setElapsed(0); setSelected(null); setCodeOpen(false); setTab('open'); setMenuOpen(false); setOnDemand(false); setAnnouncement('Board reset'); claimLock.current = false; }}>Reset interaction</button><span>Recording code: <b>123456</b> · Anna F.</span></div>
    <span className="mi-announcement" role="status" aria-live="polite">{announcement}</span>
  </div>;
}
