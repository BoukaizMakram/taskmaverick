'use client';

// ---------------------------------------------------------------------------
// WebApp — the Taskmaverick web app replica: Overview (OverviewWorkspace) plus
// Missions (Library, Marketplace, builder, processes), Reports and Dashboards.
// On /running the section lives in the URL (?section=reports …). In /demo-ai
// it runs `embedded` inside the shared-screen browser window and the AI drives
// it with `remote` commands (see run() below). `onView` reports what's shown.
// `library` / `teams` add rows on top of the fixtures (the industries the AI
// loaded into the simulator show up in the Library and under In Teams).
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from 'react';
import OverviewWorkspace from '@/components/OverviewWorkspace';
import WebShell from './WebShell';
import WebMissions, { MISSION_TABS } from './WebMissions';
import WebReports from './WebReports';
import WebDashboards from './WebDashboards';
import { LIBRARY, REPORTS, PROCESSES, CATALOGS, DASH_TABS } from '@/lib/web/data.mjs';
import './web.css';

const SECTIONS = ['Overview', 'Missions', 'Reports', 'Dashboards'];
const lower = v => String(v ?? '').toLowerCase();
const flatten = rows => rows.flatMap(r => (r.folder ? r.children.map(c => ({ ...c, folder: r.title })) : [r]));

export default function WebApp({ embedded = false, remote = null, onView, library = [], teams = [] }) {
  const flatLibrary = useMemo(() => flatten([...library, ...LIBRARY]), [library]);
  const [section, setSection] = useState('Overview');
  const [missionTab, setMissionTab] = useState('In Library');
  const [missionView, setMissionView] = useState(null);
  const [reportId, setReportId] = useState(null);
  const [group, setGroup] = useState('Unit');
  const [gallery, setGallery] = useState(false);
  const [dashTab, setDashTab] = useState('Reference');
  const [typing, setTyping] = useState(null);
  const [overviewRemote, setOverviewRemote] = useState(null);
  const ready = useRef(false);

  // /running: read and write ?section= (Overview keeps its own board/view params).
  useEffect(() => {
    if (embedded) return;
    const read = () => { const q = new URLSearchParams(location.search); const s = SECTIONS.find(x => lower(x) === lower(q.get('section'))); setSection(s || 'Overview'); };
    read(); ready.current = true;
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, [embedded]);
  const go = name => {
    setSection(name);
    if (!embedded && ready.current) history.pushState(null, '', name === 'Overview' ? '/running' : `/running?section=${lower(name)}`);
  };

  const lastRemote = useRef(null);
  useEffect(() => {
    if (!remote || remote.id === lastRemote.current) return;
    lastRemote.current = remote.id;
    const c = remote, cmd = lower(c.cmd);
    if (cmd === 'section') { const s = SECTIONS.find(x => lower(x) === lower(c.name)) || 'Overview'; go(s); if (s === 'Reports') setReportId(null); if (s === 'Missions') setMissionView(null); return; }
    if (cmd === 'overview') { go('Overview'); setOverviewRemote({ id: c.id, board: c.board || 'Team Board', view: c.view || 'Running', mission: c.mission }); return; }
    if (cmd === 'library' || cmd === 'missions') { go('Missions'); setMissionTab(MISSION_TABS.find(t => lower(t).includes(lower(c.tab || 'library'))) || 'In Library'); setMissionView(null); return; }
    if (cmd === 'create') { go('Missions'); setMissionTab('In Library'); setMissionView({ kind: 'builder', type: ['Task', 'Checklist', 'Survey', 'Media', 'Test', 'Audit'].find(t => lower(t) === lower(c.type)) || 'Task', key: `new-${c.id}` }); return; }
    if (cmd === 'edit') { const m = flatLibrary.find(x => lower(x.title).includes(lower(c.mission))) || flatLibrary.find(x => x.title === 'Lobby Restroom Clean'); go('Missions'); setMissionTab('In Library'); setMissionView({ kind: 'builder', mission: m, key: `edit-${c.id}` }); return; }
    if (cmd === 'type') { setTyping({ id: c.id, field: c.field || 'title', text: c.text || '' }); return; }
    if (cmd === 'marketplace') { go('Missions'); setMissionTab('In Marketplace'); setMissionView(null); return; }
    if (cmd === 'catalog') { go('Missions'); setMissionTab('In Marketplace'); setMissionView({ kind: 'catalog', id: (CATALOGS.find(x => lower(x.name).includes(lower(c.name || c.catalog || ''))) || CATALOGS[0]).id }); return; }
    if (cmd === 'process') { go('Missions'); setMissionTab('Within Processes'); setMissionView({ kind: 'process', id: (PROCESSES.find(p => lower(p.name).includes(lower(c.name || '')) || p.id === c.name) || PROCESSES[0]).id }); return; }
    if (cmd === 'reports') { go('Reports'); setReportId(null); return; }
    if (cmd === 'report') { go('Reports'); const r = REPORTS.find(x => x.id === c.report || lower(x.name).includes(lower(c.report || c.name || ''))) || REPORTS[0]; setReportId(r.id); setGroup(['Unit', 'Team', 'Person'].find(g => lower(g) === lower(c.group)) || r.group || 'Unit'); setGallery(/^(yes|true|on|1)$/i.test(String(c.gallery ?? (r.gallery ? 'yes' : '')))); return; }
    if (cmd === 'dashboard' || cmd === 'dashboards') { go('Dashboards'); setDashTab(DASH_TABS.find(t => lower(t) === lower(c.tab)) || 'Reference'); }
  }, [remote]);

  useEffect(() => {
    onView?.({ section, detail: section === 'Missions' ? (missionView?.kind === 'builder' ? `mission builder (${missionView.mission?.title || `new ${missionView.type}`})` : missionView?.kind || missionTab) : section === 'Reports' ? (REPORTS.find(r => r.id === reportId)?.name || 'All Reports') + (gallery ? ' · Gallery View' : '') : section === 'Dashboards' ? dashTab : 'Overview' });
  }, [section, missionTab, missionView, reportId, gallery, dashTab]);

  if (section === 'Overview') return <OverviewWorkspace embedded={embedded} onSection={go} remote={overviewRemote}/>;
  return <WebShell active={section} onSection={go} embedded={embedded}>
    {section === 'Missions' && <WebMissions tab={missionTab} onTab={setMissionTab} view={missionView} onView={setMissionView} typing={typing} library={library} teams={teams}/>}
    {section === 'Reports' && <WebReports reportId={reportId} onReport={setReportId} group={group} onGroup={setGroup} gallery={gallery} onGallery={setGallery}/>}
    {section === 'Dashboards' && <WebDashboards tab={dashTab} onTab={setDashTab}/>}
  </WebShell>;
}
