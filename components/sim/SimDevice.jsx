'use client';

// ---------------------------------------------------------------------------
// SimDevice — the Taskmaverick app on a phone or a tablet, driven by the
// shared simulator store (lib/sim/store.mjs). Two devices on one store stay in
// sync: claim on the phone and the tablet's Claimed column updates, answer
// "No" on a checklist and the ticket board raises the alert.
//
// Screens: home (personal dashboard) → unit (team boards) → board (Open /
// Claimed / Closed) and the ticket boards. Layers: Mission Details, personal
// code, board menu, On-Demand requests, camera, lessons, photo viewer, Media
// Proofs, Rate, Knowledge Base, Test Completed.
//
// `remote` = { id, cmd, ...args } lets a presenter (the /demo-ai AI) drive the
// device; see runCommand() for the vocabulary. `onView` reports what's showing.
// Reuses PhoneShell, MissionChip, OpenedMission, BoardMenu, PersonalCodeDialog
// and PersonalDashboard; new UI is .sim-* (components/sim/sim.css).
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';
import PhoneShell, { IconBack, IconPlus, IconMenu } from '@/components/PhoneShell';
import PersonalDashboard from '@/components/PersonalDashboard';
import MissionChip from '@/components/MissionChip';
import { OpenedMission } from '@/components/OpenedMission';
import { BoardMenu } from '@/components/BoardNavigation';
import PersonalCodeDialog from '@/components/PersonalCodeDialog';
import LoadingLogo from '@/components/LoadingLogo';
import { PERFORMERS, ON_DEMAND } from '@/lib/sim/data.mjs';
import { clock, stamp, timers, pillTone, column, counts, canClose, unitLabel, outOfRange } from '@/lib/sim/store.mjs';
import SimMissionBody from './SimMissionBody';
import { CameraLayer, LessonLayer, PhotoViewer, ProofsFeed, RatePanel, KnowledgePanel, TestResult, useEventToast } from './SimLayers';
import { useSim, useNow } from './useSim';
import '../ReferenceBoard.css';
import './sim.css';

const STATUSES = ['open', 'claimed', 'closed'];
const title = s => s[0].toUpperCase() + s.slice(1);
const short = name => (name || '').replace(' - Staff', '');
const lower = v => String(v ?? '').toLowerCase();

function ExpandIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 3H3v4M13 3h4v4M17 3l-5 5M3 13v4h4M3 17l5-5M17 13v4h-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function StatusBar() {
  const now = new Date();
  return <div className="mi-status-bar"><span>{now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}&nbsp;&nbsp; {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span><span className="mi-status-icons" aria-label="Wi-Fi connected, battery 95 percent"><svg viewBox="0 0 20 16" aria-hidden="true"><path d="M2 5q8-7 16 0M5 8q5-4 10 0M8 11q2-2 4 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="10" cy="14" r="1.3" fill="currentColor"/></svg>95%<svg viewBox="0 0 28 14" aria-hidden="true"><rect x="1" y="1" width="23" height="12" rx="3" fill="none" stroke="currentColor"/><rect x="3" y="3" width="19" height="8" rx="1" fill="currentColor"/><path d="M26 5v4" stroke="currentColor" strokeWidth="2"/></svg></span></div>;
}

export function TicketChip({ m, now }) {
  const t = timers(m, now), tr = m.trigger || {}, s = stamp(m.postedAt);
  return <article className={`chip sim-ticket chip--${pillTone(m, t.pill)}`}>
    <div className="chip-top"><div className="chip-id"><img className="chip-logo" src="/mission-logo.png" alt="" aria-hidden="true"/><span className="chip-kind">{m.title}</span></div>
      <div className="chip-timers">{m.status !== 'open' && <span className="chip-exec">{clock(t.exec).text}</span>}<span className="chip-pill">{clock(t.pill).text}</span></div></div>
    <p className="sim-ticket-line"><span className="sim-x">✕</span>{tr.responses > 1 ? `${tr.responses} Responses Triggered This Ticket` : tr.question}</p>
    <p className="sim-ticket-line is-answer"><span className="sim-x">✕</span>{tr.answer}</p>
    <div className="sim-ticket-src"><span>{tr.source}</span><em>{short(tr.performer)}</em></div>
    <div className="chip-bottom"><span className="sim-ticket-loc">{m.status === 'open' ? tr.location : short(m.performer)}</span><span className="chip-when"><span className="chip-date">{s.date}</span><span className="chip-time">{s.time}</span></span></div>
  </article>;
}

export default function SimDevice({ store, device = 'phone', initialScreen = 'home', initialBoard, initialUnit = 'L001', remote = null, onView, muted = false, codeFor = '123456' }) {
  const state = useSim(store);
  const now = useNow();
  const isPhone = device === 'phone';
  const [started] = useState(() => Date.now());
  const [screen, setScreen] = useState(initialScreen);
  const [unitId, setUnitId] = useState(initialUnit);
  const [boardId, setBoardId] = useState(initialBoard || (isPhone ? 'personal' : 'L001-team-a'));
  const [tab, setTab] = useState('open');
  const [expanded, setExpanded] = useState(null);
  const [selected, setSelected] = useState(null);
  const [code, setCode] = useState(null);
  const [menu, setMenu] = useState(false);
  const [demand, setDemand] = useState(false);
  const [layer, setLayer] = useState(null);
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [unitView, setUnitView] = useState(isPhone ? 'list' : 'grid');
  const [note, setNote] = useState('');
  const menuButton = useRef(null);
  const rootRef = useRef(null);
  const timersRef = useRef([]);
  const [toast, dismissToast] = useEventToast(state.events, started);

  const board = state.boards.find(b => b.id === boardId) || state.boards[0];
  const mission = state.missions.find(m => m.id === selected);
  const personal = board.kind === 'personal';
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timersRef.current.push(t); return t; };
  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);
  const blink = () => { setLoading(true); later(() => setLoading(false), 900); };

  const resetOverlays = () => { setSelected(null); setCode(null); setMenu(false); setDemand(false); setLayer(null); setNote(''); };
  const openBoard = id => { blink(); resetOverlays(); setBoardId(id); setScreen('board'); setTab('open'); setExpanded(null); };
  const go = (next, unit) => { blink(); resetOverlays(); if (unit) setUnitId(unit); setScreen(next); };
  const back = () => {
    if (layer) return setLayer(null);
    if (selected) { setSelected(null); setLang('en'); setNote(''); return; }
    if (demand) return setDemand(false);
    if (screen === 'board') return go(board.kind === 'personal' ? 'home' : board.kind === 'ticket' ? 'tickets' : 'unit', board.unit !== 'ORG' ? board.unit : undefined);
    go('home');
  };
  const select = id => { setSelected(id); setLang('en'); setNote(''); setLayer(null); };
  // A board or tab starts at the top of its list (lists scroll on their own).
  useEffect(() => { rootRef.current?.querySelectorAll('.mi-column-cards, .ph-cards').forEach(l => { l.scrollTop = 0; }); }, [boardId, tab, expanded]);

  // ---- claim / close through the personal code (auto-typed for a presenter) ----
  const perform = useCallback((action, missionId, performer) => {
    if (action === 'Claim') { store.claim(missionId, performer); if (isPhone) setTab('claimed'); return; }
    const result = store.close(missionId, performer);
    if (!result) return;
    if (result.result) { setLayer({ kind: 'result', missionId, assigned: result.assigned }); return; }
    setSelected(null); setLang('en'); if (isPhone) setTab('closed');
  }, [store, isPhone]);
  // Reads the mission fresh from the store: a presenter may have just filled it in.
  const request = (action, auto = false, missionId = selected) => {
    const m = store.get(missionId);
    if (!m) return;
    if (action === 'Close' && !canClose(m)) return;
    const onPersonal = store.getState().boards.find(b => b.id === m.boardId)?.kind === 'personal';
    if (onPersonal) return perform(action, m.id, store.getState().identity);
    if (!auto) return setCode({ action, missionId: m.id });
    const digits = codeFor.split('');
    setCode({ action, missionId: m.id, demo: { code: '', loading: false, activeKey: null, activeDigit: 0 } });
    digits.forEach((d, i) => later(() => setCode(c => c && ({ ...c, demo: { ...c.demo, code: codeFor.slice(0, i + 1), activeKey: d, activeDigit: i + 1 } })), 260 + i * 230));
    later(() => setCode(c => c && ({ ...c, demo: { ...c.demo, activeKey: null, loading: true } })), 260 + digits.length * 230);
    later(() => { setCode(null); perform(action, m.id, PERFORMERS[codeFor] || 'Anna F. - Staff'); }, 1100 + digits.length * 230);
  };

  // ---- presenter commands -------------------------------------------------------
  const findBoard = q => { const s = store.getState(); return s.boards.find(b => b.id === q) || s.boards.find(b => lower(b.title) === lower(q)) || s.boards.find(b => lower(b.title).includes(lower(q))); };
  const findMission = (q, scope) => {
    const list = store.getState().missions.filter(m => !scope || m.boardId === scope);
    const rank = s => (s === 'open' ? 0 : s === 'claimed' ? 1 : 2);
    return list.find(m => m.id === q) || [...list].sort((a, b) => rank(a.status) - rank(b.status)).find(m => lower(m.title) === lower(q)) || [...list].sort((a, b) => rank(a.status) - rank(b.status)).find(m => lower(m.title).includes(lower(q)));
  };
  const findItem = (m, q) => (m.items || []).find(it => it.id === q) || (m.items || []).find(it => lower(it.label).includes(lower(q))) || (m.items || [])[Number(q) - 1];
  const fillHappyPath = m => {
    for (const item of m.items || []) {
      if (item.kind === 'lesson') { store.completeLesson(m.id, item.id); continue; }
      const has = store.get(m.id).answers[item.id];
      if (item.kind === 'photo') { if (!store.get(m.id).proofs[item.id]) store.attachProof(m.id, item.id, { kind: 'photo', src: '/demo-quality/proofs/storage-shelves.jpg' }); continue; }
      if (has == null || has === '') {
        const value = item.kind === 'number' ? String(item.min != null && item.max != null ? +(((item.min + item.max) / 2).toFixed(1)) : item.max != null ? item.max - 2 : item.min != null ? item.min + 1 : 12)
          : item.kind === 'text' ? '4252025021' : item.kind === 'passfail' ? 'Pass' : 'Yes';
        store.answer(m.id, item.id, m.type === 'Survey' && item.ticketOn?.Yes ? 'No' : value);
      }
      const now2 = store.get(m.id);
      const v = now2.answers[item.id];
      const kind = item.proofOn?.[v] || (item.photo ? 'photo' : null);
      if (kind && !now2.proofs[item.id]) store.attachProof(m.id, item.id, { kind, src: kind === 'video' ? '/demo-quality/condition-report.mp4' : '/demo-quality/proofs/equipment-gauge.jpg' });
    }
    for (const l of m.lessons || []) store.completeLesson(m.id, l.id);
    if (m.type === 'Test') m.questions.forEach(q => store.answer(m.id, q.id, q.correct));
  };
  const runCommand = c => {
    const cmd = lower(c.cmd);
    const current = store.get(selected);
    if (cmd === 'home') return go('home');
    if (cmd === 'reset') { store.reset(); return go(isPhone ? 'home' : 'unit'); }
    if (cmd === 'unit') { const units = store.getState().units; const u = units.find(x => lower(x.id) === lower(c.unit) || lower(`${x.code} - ${x.name}`).includes(lower(c.unit || ''))) || units[0]; return go('unit', u.id); }
    if (cmd === 'tickets') return go('tickets');
    if (cmd === 'board') { const b = findBoard(c.board || c.name || ''); if (b) openBoard(b.id); return; }
    if (cmd === 'tab') { setTab(STATUSES.includes(lower(c.status)) ? lower(c.status) : 'open'); setExpanded(null); return; }
    if (cmd === 'expand') { setSelected(null); setExpanded(STATUSES.includes(lower(c.status)) ? lower(c.status) : 'closed'); return; }
    if (cmd === 'collapse') return setExpanded(null);
    if (cmd === 'open') {
      const m = findMission(c.mission || c.title || '', screen === 'board' ? boardId : null) || findMission(c.mission || c.title || '');
      if (!m) return;
      if (m.boardId !== boardId || screen !== 'board') { setBoardId(m.boardId); setScreen('board'); resetOverlays(); }
      if (isPhone) setTab(m.status);
      select(m.id);
      return;
    }
    if (cmd === 'back') return back();
    if (cmd === 'menu') { setMenu(true); return; }
    if (cmd === 'proofs') { setMenu(false); return setLayer({ kind: 'proofs' }); }
    if (cmd === 'knowledge') { setMenu(false); return setLayer({ kind: 'knowledge' }); }
    if (cmd === 'request') { setMenu(false); setDemand(true); if (c.title) later(() => { const options = board.requests || ON_DEMAND; const t = options.find(o => lower(o.title).includes(lower(c.title))) || options[0]; store.addMission(boardId, t, short(store.getState().identity)); setDemand(false); }, 900); return; }
    if (cmd === 'translate') return setLang(l => (l === 'en' ? 'es' : 'en'));
    if (!current) return;
    if (cmd === 'claim') return request('Claim', true, current.id);
    if (cmd === 'close') { if (!canClose(current)) fillHappyPath(current); later(() => request('Close', true, current.id), 150); return; }
    if (cmd === 'complete') return fillHappyPath(current);
    if (cmd === 'answer') {
      if (current.type === 'Test') { const q = current.questions[(Number(c.item) || 1) - 1]; if (q) store.answer(current.id, q.id, c.value === 'wrong' ? (q.correct + 1) % q.options.length : c.value === 'right' ? q.correct : Number(c.value)); return; }
      const item = findItem(current, c.item || '');
      if (item) store.answer(current.id, item.id, item.kind === 'number' || item.kind === 'text' ? String(c.value) : (item.options || ['Yes', 'No', 'N/A', 'Pass', 'Fail']).find(o => lower(o) === lower(c.value)) || c.value);
      return;
    }
    if (cmd === 'capture') {
      const item = findItem(current, c.item || '') || (current.items || []).find(it => { const v = current.answers[it.id]; return (it.proofOn?.[v] || it.photo || it.kind === 'photo') && !current.proofs[it.id]; });
      if (item) setLayer({ kind: 'camera', missionId: current.id, itemId: item.id, media: item.proofOn?.[current.answers[item.id]] || 'photo', auto: true });
      return;
    }
    if (cmd === 'lesson') {
      const item = (current.items || []).find(it => it.kind === 'lesson');
      if (item) setLayer({ kind: 'lesson', missionId: current.id, itemId: item.id, auto: true });
      else if (current.lessons) current.lessons.forEach(l => store.completeLesson(current.id, l.id));
      return;
    }
    if (cmd === 'rate') { store.rate(current.id, short(store.getState().identity), Math.max(1, Math.min(5, Number(c.score) || 5))); return; }
    if (cmd === 'boost') store.toggleBoost(current.id);
  };
  const lastRemote = useRef(null);
  useEffect(() => {
    if (!remote || remote.id === lastRemote.current) return;
    lastRemote.current = remote.id;
    runCommand(remote);
  }, [remote]);

  useEffect(() => { onView?.({ device, screen, unit: unitLabel(unitId, state.units), unitId, board: screen === 'board' ? board.title : null, boardId: screen === 'board' ? board.id : null, tab, expanded, mission: mission?.title || null, missionId: mission?.id || null, missionStatus: mission?.status || null, layer: layer?.kind || (menu ? 'menu' : code ? 'personal code' : demand ? 'on-demand requests' : null) }); }, [device, screen, unitId, board.title, board.id, tab, expanded, mission?.id, mission?.title, mission?.status, layer?.kind, menu, code, demand]);

  // ---- cards ---------------------------------------------------------------------
  const cardFor = m => {
    if (m.type === 'Ticket') return <TicketChip m={m} now={now}/>;
    const t = timers(m, now), pill = clock(t.pill), s = stamp(m.postedAt);
    return <MissionChip kind={m.type} points={m.points} title={m.title} reference={m.reference} who={m.status === 'open' ? (m.postedBy || undefined) : short(m.performer)} date={s.date} time={s.time}
      showExec={m.status !== 'open'} execTime={clock(t.exec).text} pillTime={pill.text} days={pill.days} pillClass={`chip--${pillTone(m, t.pill)}`}
      className={m.boosted && m.status !== 'closed' ? 'chip--boosted' : ''} rate={m.status === 'closed' && !!m.rateable} ratings={m.ratings}/>;
  };
  const cards = status => column(state.missions, board.id, status).map(m => <button type="button" className="mi-card-button" data-mission-id={m.id} key={m.id} aria-label={`Open mission ${m.title}`}
    onClick={e => { if (e.target.closest('.chip-rate') && m.status === 'closed' && m.rateable) setLayer({ kind: 'rate', missionId: m.id }); else select(m.id); }}>{cardFor(m)}</button>);
  const [nOpen, nClaimed, nClosed] = counts(state.missions, board.id);
  const count = { open: nOpen, claimed: nClaimed, closed: nClosed };

  // ---- directories ------------------------------------------------------------------
  const unit = state.units.find(u => u.id === unitId) || state.units[0];
  const tile = b => {
    const open = column(state.missions, b.id, 'open');
    const hot = open.some(m => m.boosted), red = open.some(m => pillTone(m, timers(m, now).pill) === 'red');
    const [o, c, d] = counts(state.missions, b.id);
    return <button type="button" key={b.id} className={`bd-location sim-tile${hot ? ' is-boosted' : ''}${red ? ' is-alert' : ''}`} onClick={() => openBoard(b.id)}>
      <h3><img src="/mission-logo.png" alt=""/>{b.title}</h3>
      <div className="bd-counts">{[['Open', o], ['Claimed', c], ['Closed', d]].map(([label, n]) => <span key={label}><small>{label}</small><b>{n}</b></span>)}</div>
    </button>;
  };
  const directoryHeader = (heading, extra) => <header className="bd-header sim-dir-header">
    <button type="button" className="ph-iconbtn" aria-label="Back to home" onClick={() => go('home')}><IconBack/></button>
    <img className="bd-logo" src="/logo.svg" alt="Taskmaverick"/>
    <h2>{heading}</h2>{extra}
  </header>;
  const unitScreen = <section className={`bd-directory sim-directory sim-directory--${device}`} aria-label={`${unit.code} - ${unit.name}`}>
    {directoryHeader(`${unit.code} - ${unit.name}`, <button type="button" className="sim-switch" onClick={() => go('unit', state.units[(state.units.indexOf(unit) + 1) % state.units.length].id)} aria-label="Switch unit">⇄</button>)}
    <div className="bd-sort">Name⌄ <button type="button" className="sim-view-toggle" onClick={() => setUnitView(v => (v === 'grid' ? 'list' : 'grid'))}>{unitView === 'grid' ? 'Grid View' : 'List View'}</button></div>
    <div className={`bd-locations${unitView === 'list' ? ' sim-list' : ''}`}>{state.boards.filter(b => b.kind === 'team' && b.unit === unit.id).map(tile)}</div>
  </section>;
  const ticketScreen = <section className={`bd-directory sim-directory sim-directory--${device}`} aria-label="Ticket Boards">
    {directoryHeader('Ticket Boards')}
    <div className="bd-sort">Unit &amp; Organization tickets</div>
    <div className={`bd-locations${isPhone ? ' sim-list' : ''}`}>{state.boards.filter(b => b.kind === 'ticket').map(tile)}</div>
  </section>;
  const ticketOpen = state.missions.filter(m => m.type === 'Ticket' && m.status === 'open').length;
  const home = <PersonalDashboard device={device} userName={short(state.identity)} company={state.industry?.name || 'Taskmaverick Demo'} onBoard={id => openBoard(id === 'personal' ? 'personal' : id)} onNavigate={() => go('unit')} getCounts={id => counts(state.missions, id === 'personal' ? 'personal' : id)}
    units={state.units.map(u => ({ name: `${u.code} - ${u.name}`, teams: state.boards.filter(b => b.kind === 'team' && b.unit === u.id).length, onClick: () => go('unit', u.id) }))}
    onTickets={() => go('tickets')} ticketCount={String(ticketOpen).padStart(2, '0')}/>;
  const directory = screen === 'home' ? home : screen === 'unit' ? unitScreen : screen === 'tickets' ? ticketScreen : null;

  // ---- mission detail -----------------------------------------------------------------
  const detail = mission && (() => {
    const m = mission, t = timers(m, now), pill = clock(t.pill), s = stamp(m.postedAt), es = lang === 'es' && m.es;
    const live = { ...m, title: es?.title || m.title, description: es?.description || m.description, notice: es?.notice || m.notice, typeLabel: m.type === 'Ticket' ? 'Ticket' : m.type,
      location: m.reference ? `Ref: ${m.reference}` : unitLabel(board.unit, state.units), openWho: m.type === 'Ticket' ? `By ${short(m.trigger?.performer)}` : m.postedBy || (personal ? 'Organization' : `${board.title}`), claimedWho: short(m.performer),
      pillTime: pill.text, pillClass: `chip--${pillTone(m, t.pill)}`, date: s.date, time: s.time };
    const translatable = m.es || m.lessons?.some(l => l.textEs);
    return <div className="mi-detail-inner sim-detail">
      <OpenedMission key={m.id} mission={live} state={m.status} showExec={m.status !== 'open'} execTime={clock(t.exec).text} days={pill.days} showStatusBar={isPhone}
        onBack={back} onClaim={() => request('Claim')} onClose={() => request('Close')}
        closable={canClose(m)} closeLabel={m.type === 'Test' ? 'Submit & Close' : 'Close'}
        translation={translatable ? { label: 'Translate', language: lang === 'en' ? 'ES' : 'EN', onClick: () => setLang(l => (l === 'en' ? 'es' : 'en')) } : undefined}
        body={<>{note && <p className="sim-quiz-failed" role="alert">{note}</p>}<SimMissionBody m={m} store={store} lang={lang} now={now} editable={m.status === 'claimed'} onLayer={setLayer}/></>}/>
    </div>;
  })();

  // ---- layers ----------------------------------------------------------------------------
  const layerMission = layer?.missionId ? state.missions.find(m => m.id === layer.missionId) : null;
  const layerEl = (() => {
    if (!layer) return null;
    const close = () => setLayer(null);
    if (layer.kind === 'camera' && layerMission) return <CameraLayer media={layer.media} feedKey={layer.itemId} auto={layer.auto} onBack={close} onCapture={proof => { store.attachProof(layerMission.id, layer.itemId, proof); close(); }}/>;
    if (layer.kind === 'lesson' && layerMission) {
      const item = layer.itemId && layerMission.items?.find(it => it.id === layer.itemId);
      const index = layerMission.lessons?.findIndex(l => l.id === layer.lessonId);
      const lesson = item ? item.lesson : layerMission.lessons?.[index];
      if (!lesson) return null;
      return <LessonLayer key={`${layer.itemId || layer.lessonId}-${lang}`} lesson={lesson} index={item ? 1 : index + 1} total={item ? 1 : layerMission.lessons.length} lang={lang} muted={muted} auto={layer.auto}
        onToggleLang={() => setLang(l => (l === 'en' ? 'es' : 'en'))} onBack={close}
        onPass={() => { store.completeLesson(layerMission.id, layer.itemId || layer.lessonId); setNote(''); close(); }}
        onFail={() => { store.resetLessons(layerMission.id); setNote(lang === 'es' ? 'No aprobó. La lección se repetirá hasta que apruebe el cuestionario.' : 'You did not pass the quiz. The lesson will repeat until you pass.'); close(); }}/>;
    }
    if (layer.kind === 'photo') return <PhotoViewer src={layer.src} media={layer.media} name={layer.name} onClose={close}/>;
    if (layer.kind === 'proofs') return <ProofsFeed missions={state.missions} onBack={close} onPhoto={p => setLayer({ kind: 'photo', ...p, back: 'proofs' })}/>;
    if (layer.kind === 'rate' && layerMission) return <RatePanel mission={layerMission} now={now} onBack={close} onSubmit={score => { store.rate(layerMission.id, short(state.identity), score); close(); }}/>;
    if (layer.kind === 'knowledge') return <KnowledgePanel muted={muted} onBack={close}/>;
    if (layer.kind === 'result' && layerMission) return <TestResult mission={layerMission} assigned={layer.assigned} onClose={() => { close(); setSelected(null); if (isPhone) setTab('open'); }}/>;
    return null;
  })();
  const fullLayer = layer && ['photo', 'proofs'].includes(layer.kind);

  const demandPanel = demand && <section className="bn-demand sim-demand" aria-label="On-Demand">
    <header className="bn-demand-header"><button type="button" className="ph-iconbtn" aria-label="Back to board" onClick={() => setDemand(false)}><IconBack/></button><h2>On-Demand - {board.title}</h2></header>
    <div className="bn-demand-body"><div className="bn-demand-tabs"><button type="button" className="is-active" aria-pressed="true">By Mission</button><button type="button" aria-pressed="false">By Reference</button></div>
      <div className="bn-demand-list">{(board.requests || ON_DEMAND).map(o => <button type="button" className="bn-demand-card" key={o.title} onClick={() => { store.addMission(board.id, o, short(state.identity)); setDemand(false); if (isPhone) setTab('open'); }}><div><img src="/mission-logo.png" alt=""/>{o.type}</div><h3>{o.title}</h3></button>)}</div></div>
  </section>;

  const menuLayer = menu && <BoardMenu anchor={menuButton.current} boardType={personal ? 'personal' : 'team'} businessMediaLabel="Media Proofs" onDismiss={() => setMenu(false)}
    onNavigate={to => { setMenu(false); if (to === 'personal') openBoard('personal'); else go(to === 'home' ? 'home' : 'unit'); }}
    onAction={kind => {
      setMenu(false);
      if (kind === 'ticket') go('tickets');
      else if (kind === 'building' || kind === 'units') go('unit');
      else if (kind === 'book') setLayer({ kind: 'knowledge' });
      else if (kind === 'plus' || kind === 'link') setDemand(true);
      else if (kind === 'image') setLayer({ kind: 'proofs' });
      else if (kind === 'like') { if (isPhone) setTab('closed'); else setExpanded('closed'); }
    }}/>;
  const codeLayer = code && <PersonalCodeDialog action={code.action} demo={code.demo || null} onDismiss={() => setCode(null)} onClaim={performer => { const c = code; setCode(null); perform(c.action, c.missionId, performer); }}/>;
  const loader = loading && <div className="mi-screen-loader" role="status" aria-label="Loading screen"><LoadingLogo/></div>;
  const toastEl = toast && <button type="button" className="sim-toast" onClick={() => { dismissToast(); if (toast.kind === 'ticket') openBoard(toast.boardId); else openBoard('personal'); }}>
    <span className="sim-toast-icon">{toast.kind === 'ticket' ? '!' : '★'}</span>
    <span><b>{toast.kind === 'ticket' ? toast.title : 'Training assigned'}</b><small>{toast.kind === 'ticket' ? `by ${short(toast.performer)} · ${Math.max(0, Math.round((now - toast.at) / 1000))} seconds ago` : toast.title}</small></span>
  </button>;

  const header = <header className="tbl-header">
    <div className="mi-brand"><button type="button" className="ph-iconbtn" aria-label="Back" onClick={back}><IconBack/></button><img className="mi-full-logo" src="/logo.svg" alt="Taskmaverick" width="220" height="30"/></div>
    <span className={`mi-department${board.kind === 'ticket' ? ' sim-ticket-title-head' : ''}`}>{board.title}</span>
    <div className="tbl-header-actions"><button type="button" className="ph-iconbtn" aria-label="Add" onClick={() => setDemand(true)}><IconPlus/></button><button type="button" ref={menuButton} className="ph-iconbtn" aria-label="Menu" onClick={() => setMenu(true)}><IconMenu/></button></div>
  </header>;

  if (isPhone) {
    const overlay = directory || (layer && !['rate'].includes(layer.kind) && !selected && layerEl) || detail || demandPanel;
    const viewer = loader || codeLayer || menuLayer || (layer && (selected || layer.kind === 'rate') ? layerEl : null);
    return <div className="sim-device sim-device--phone" ref={rootRef}>
      <div className="ph-fit mi-phone sim-phone">
        <PhoneShell title={board.title} onBack={back} onAdd={() => setDemand(true)} onMenu={e => { menuButton.current = e.currentTarget; setMenu(true); }}
          tabs={STATUSES.map(s => ({ label: `${title(s)} - ${count[s]}`, active: tab === s, onClick: () => setTab(s) }))} overlay={overlay} viewer={viewer}>
          <div className="mi-phone-cards">{cards(tab)}{!count[tab] && <p className="mi-empty">No {tab} missions</p>}</div>
        </PhoneShell>
        {toastEl}
      </div>
    </div>;
  }

  return <div className="mi-interactive mi-interactive--tablet mi-reference sim-device sim-device--tablet" ref={rootRef}>
    <div className="tbl-fit"><div className="tbl-tablet"><div className="tbl-screen mi-tablet-screen">
      <div className="mi-tablet-board">
        <StatusBar/>{header}
        <div className={`mi-columns${expanded ? ' sim-expanded' : ''}`}>{(expanded ? [expanded] : STATUSES).map(status => <section key={status} aria-label={`${status} missions`}>
          <h2 className="tbl-tab">{title(status)} - {count[status]}<button type="button" className="sim-expand" aria-label={expanded ? 'Collapse column' : `Expand ${status}`} onClick={() => setExpanded(expanded ? null : status)}><ExpandIcon/></button>{expanded && <span className="sim-pages" aria-hidden="true">{Array.from({ length: Math.min(8, Math.ceil(count[status] / 9)) }, (_, i) => <i key={i} className={i === 0 ? 'is-on' : ''}/>)}</span>}</h2>
          <div className="mi-column-cards">{cards(status)}{!count[status] && <p className="mi-empty">No {status} missions</p>}</div>
        </section>)}</div>
      </div>
      {directory && <div className="bd-tablet-overlay sim-tablet-dir">{directory}</div>}
      {(mission || demand || (layer && !fullLayer)) && <button type="button" className="mi-drawer-shade" aria-label="Back to board" onClick={back}/>}
      {mission && <aside className="mi-drawer" aria-label="Mission Details">{detail}</aside>}
      {demand && !mission && <aside className="mi-drawer" aria-label="On-Demand panel">{demandPanel}</aside>}
      {layer && !fullLayer && <aside className="mi-drawer sim-drawer-layer" aria-label="Mission screen">{layerEl}</aside>}
      {fullLayer && <div className="sim-full">{layerEl}</div>}
      {menuLayer}{codeLayer}{loader}{toastEl}
    </div></div></div>
  </div>;
}
