'use client';
// Data Board — the web Reports page (built from the product's "Sample Report
// V2" screen) at a fixed 1600x760 page: the Risk Summary and unit metrics on
// the left; Group by: Unit down to each person's missions; one mission
// expanded to its checkpoint table, where every response is listed with its
// time, and out-of-range responses are flagged red with the ticket they raised.
// Shares the Usage Report's web chrome (iq-ur-*).
import {Fragment} from 'react';
import {REPORT} from '@/lib/liveOversightData.mjs';

const NAV=['Missions','People','Teams','Units','Ticket Boards','Groups','Certifications','Timesheets','Reports','Dashboards','Overview'];
const path={back:'M19 12H5M11 6l-6 6 6 6',chev:'m6 9 6 6 6-6',right:'m9 6 6 6-6 6',search:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4',tree:'M6 3v6M6 9h6M12 9v6M6 15h12M18 15v6',collapse:'M4 4v16M20 7l-5 5 5 5',view:'M4 5h16v14H4zM4 9h16',group:'M8 6h12M8 12h12M8 18h12M4 6h.5M4 12h.5M4 18h.5',expand:'M6 3v6M6 9h6M12 9v6M6 15h12M18 15v6',gear:'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',cloud:'M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8M12 12v7M9 16l3 3 3-3',mail:'M3 6h18v12H3zM3 7l9 6 9-6',sync:'M20 11a8 8 0 0 0-14.5-4M4 13a8 8 0 0 0 14.5 4M5 3v4h4M19 21v-4h-4',bell:'M18 8a6 6 0 0 0-12 0v7l-2 3h16l-2-3zM10 21h4',arrow:'M7 17 17 7M9 7h8v8',dots:'M12 5h.01M12 12h.01M12 19h.01',clock:'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',person:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0',team:'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 13.5a7 7 0 0 1 4 6.5',doc:'M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h5',ticket:'M3 7h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4zM8 12h8'};
const Icon=({name,className='iq-ur-ic'})=><svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d={path[name]} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const Check=()=><i className="iq-ur-checkbox is-checked"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></i>;
const Toggle=({open=true})=><span className={`iq-ur-toggle${open?'':' is-closed'}`} aria-hidden="true"><Icon name={open?'chev':'right'}/></span>;
const Stat=([label,value,total,pct,dot,active])=><div key={label} className={`iq-ur-stat${active?' is-active':''}`}><span>{label}<Icon name="arrow"/></span><b>{value}<small> / {total}</small><em>{pct}<i className={`is-${dot}`}/></em></b></div>;
const barTone=pct=>pct>=80?'green':pct>=20?'orange':'red';
function Pct({pct}){return <span className="iq-dr-pct"><b>{pct.toFixed(2).replace(/\.00$/,'')}%</b><i><em className={`is-${barTone(pct)}`} style={{width:`${Math.min(100,pct)}%`}}/></i></span>;}

function Sidebar(){
 return <aside className="iq-ur-side iq-dr-side">
  <div className="iq-ur-side-top"><span className="iq-ur-link"><Icon name="back"/>Back To All Reports</span><span className="iq-ur-side-tools"><Icon name="tree"/><Icon name="collapse"/></span></div>
  <div className="iq-ur-side-search"><Icon name="search"/>Search by keyword</div>
  <div className="iq-dr-risk"><div className="iq-dr-risk-title"><Check/>Risk Summary</div>
   {REPORT.risk.map(group=><Fragment key={group.label}><div className="iq-dr-risk-row is-group"><Check/><span>{group.label}</span><em>{group.pct}</em><b>{group.count}</b><i className={`is-${group.dot}`}/></div>
    {group.items.map(([label,pct,count,dot])=><div className="iq-dr-risk-row" key={label}><span>{label}</span><em>{pct}</em><b>{count}</b><i className={`is-${dot}`}/></div>)}</Fragment>)}
  </div>
  <div className="iq-ur-side-title"><span>{REPORT.unit.code}</span><b>{REPORT.unit.name}</b><Icon name="chev"/></div>
  <section className="iq-ur-card iq-ur-card--mission is-active"><header><span className="iq-ur-badge"><Icon name="doc"/></span><b>Mission</b><Icon name="chev"/></header>
   <div className="iq-ur-total">Total Triggered <b>{REPORT.mission.total}</b></div>
   <div className="iq-ur-stats">{REPORT.mission.stats.map(Stat)}</div>
  </section>
  <section className="iq-ur-card iq-ur-card--ticket"><header><span className="iq-ur-badge"><Icon name="ticket"/></span><b>Ticket</b><Icon name="chev"/></header>
   <div className="iq-ur-total">Total Triggered <b>{REPORT.ticket.total}</b></div>
   <div className="iq-ur-stats">{REPORT.ticket.stats.map(Stat)}</div>
  </section>
 </aside>;
}

const HEAD=['Name','Reference','Posted','Closed','Closed %','Position','Type','Folder','Process','Course'];
function GroupRow({depth,index,label,count,posted,closed,pct,position,open=true,muted}){
 return <div className={`iq-dr-row is-group depth-${depth}${muted?' is-muted':''}`}>
  <span><Toggle open={open}/><em>{index}.</em><b>{label}</b><small>{count}</small></span><span/><span className="is-num">{posted}</span><span className="is-num">{closed}</span><span><Pct pct={pct}/></span><span>{position&&<i className="iq-dr-chip">{position}</i>}</span><span/><span/><span/><span/>
 </div>;
}
function Statements(){
 return <div className="iq-dr-statements">
  <div className="iq-dr-st-head">{['Statement','Divider','Response','Question Type','Responded At','Ticket Title','Ticket Status','Ticket By','Ticket Closed At'].map(h=><span key={h}>{h}</span>)}</div>
  {REPORT.statements.map((s,i)=><div className="iq-dr-st-row" key={s.key}>
   <span data-iq-target={`stmt-${s.key}`} className="iq-dr-st-text">{i+1}. {s.text}</span>
   <span className="is-center">{s.divider}</span>
   <span className="is-stack is-center">{s.responses.map(([value,,ticket])=><b key={value+ticket} className={ticket?'is-anomaly':undefined} data-iq-target={ticket?`anomaly-${s.key}`:undefined}>{value}</b>)}</span>
   <span className="is-stack is-center">{s.responses.map((r,j)=><i key={j} className="iq-dr-chip">Number</i>)}</span>
   <span className="is-stack is-center">{s.responses.map(([,at])=><em key={at}>{at}</em>)}</span>
   <span className="is-stack is-center">{s.responses.map(([,at,ticket])=><em key={at} className={ticket?'is-ticket':undefined}>{ticket||'-'}</em>)}</span>
   <span className="is-stack is-center">{s.responses.map(([,at,,status])=><em key={at} className={status?`is-status is-${status.toLowerCase()}`:undefined}>{status||'-'}</em>)}</span>
   <span className="is-stack is-center">{s.responses.map(([,at,,,by])=><em key={at}>{by||'-'}</em>)}</span>
   <span className="is-stack is-center">{s.responses.map(([,at,,status])=><em key={at}>{status==='Resolved'?'09/24/2026, 11:02 AM':'-'}</em>)}</span>
  </div>)}
 </div>;
}

export default function DataReport(){
 const {unitRow,teamRow,person,missions,others}=REPORT;
 return <div className="iq-ur iq-dr" aria-label="Taskmaverick web: Data Board">
  <header className="iq-ur-topbar"><img src="/logo.svg" alt="taskmaverick"/><nav>{NAV.map(n=><span key={n} className={n==='Reports'?'is-active':undefined} data-iq-target={`nav-${n}`}>{n}</span>)}</nav><div><Icon name="bell"/><Icon name="gear"/><span className="iq-ur-avatar">JM</span></div></header>
  <div className="iq-ur-page"><Sidebar/>
   <main className="iq-ur-main">
    <div className="iq-ur-head"><b>{REPORT.title}</b><span className="iq-ur-link">Show Details</span><span className="iq-ur-range iq-dr-hours"><Icon name="clock"/>{REPORT.hours}</span><span className="iq-ur-range iq-dr-range">{REPORT.range}<Icon name="chev"/></span><span className="iq-ur-btn iq-dr-btn-muted">Update Default View</span><span className="iq-ur-btn is-primary">Save To My View</span></div>
    <div className="iq-ur-tools"><span><Icon name="view" className="iq-ur-ic is-blue"/>My View:Default</span><span><Icon name="group"/>Group by: Unit</span><span><Icon name="expand"/>Expand/Collapse</span><span className="iq-ur-gallery"><i className="iq-ur-checkbox"/>Daily Distribution</span>
     <span className="iq-ur-icons"><Icon name="gear"/><Icon name="cloud"/><Icon name="mail"/><Icon name="sync"/></span></div>
    <div className="iq-ur-summary"><span>{REPORT.summary.total}</span><span className="iq-ur-pill is-active"><i><Icon name="team"/></i>Team <b>{REPORT.summary.team}</b></span><span className="iq-ur-pill"><i><Icon name="person"/></i>Personal <b>{REPORT.summary.personal}</b></span></div>
    <div className="iq-dr-table">
     <div className="iq-dr-row is-head">{HEAD.map(h=><span key={h}>{h}<Icon name="dots"/></span>)}</div>
     <div className="iq-dr-body">
      <GroupRow depth={0} index={1} {...unitRow}/>
      <GroupRow depth={1} index={1} {...teamRow}/>
      <GroupRow depth={2} index={1} {...person}/>
      {missions.map(([name,posted,closed,type,folder,expanded],i)=><Fragment key={name}>
       <div className={`iq-dr-row is-mission${expanded?' is-expanded':''}`}><span>{expanded?<Toggle/>:<i className="iq-dr-branch"/>}<em>{i+1}.</em><b>{name}</b><small>1</small></span><span/><span className="is-num">{posted}</span><span className="is-num">{closed}</span><span><Pct pct={closed/posted*100}/></span><span/><span>{type}</span><span>{folder}</span><span/><span/></div>
       {expanded&&<Statements/>}
      </Fragment>)}
      {others.map(([label,count,posted,closed,pct],i)=><GroupRow key={label} depth={2} index={i+2} label={label} count={count} posted={posted} closed={closed} pct={pct} position="WL Staff" open={false}/>)}
     </div>
    </div>
   </main>
  </div>
 </div>;
}
