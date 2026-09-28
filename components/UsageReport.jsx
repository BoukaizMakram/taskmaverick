'use client';
// Web Usage Report (Improved Quality demo, chapters 18-21): the Reports page
// of the web app at a fixed 1600x760 size, in the Overview (/running) look.
// Frame-driven: `web.gallery` checks Gallery View, `web.rows` opens each
// response's media row, `web.scroll` scrolls the table (to the row marked
// data-ur-anchor, if any). Performers and dates carry data-iq-target so the
// demo can highlight them. The Live Oversight film passes its own grouped
// rows (ReportTree), group label and Group by menu.
import {Fragment,useLayoutEffect,useRef,useState} from 'react';
import {BUSINESS_PROOFS,proofSrc} from '@/lib/businessProofs.mjs';

const NAV=['Missions','People','Teams','Units','Ticket Boards','Groups','Certifications','Timesheets','Reports','Dashboards','Overview'];
const POSITIONS={'Nelson P':['Staff','Cleaning','+2'],'Anna F':['Manager','Safety','+1'],'Ben R':['Technician','Maintenance','+3']};
const QUESTIONS={restroom:'Take photos of the cleaned restroom.',fire:'Take photos of the fire safety equipment.',storage:'Provide photos of the organized storage room.',equipment:'Take photos of the equipment readings.'};
// '09-23-26 08:29 PM' -> '09/23/2026, 08:29 PM' (the web app's format)
const webDate=d=>{const [date,...time]=d.split(' ');const [m,day,y]=date.split('-');return `${m}/${day}/20${y}, ${time.join(' ')}`;};

const path={back:'M19 12H5M11 6l-6 6 6 6',chev:'m6 9 6 6 6-6',right:'m9 6 6 6-6 6',search:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4',tree:'M6 3v6M6 9h6M12 9v6M6 15h12M18 15v6',collapse:'M4 4v16M20 7l-5 5 5 5',view:'M4 5h16v14H4zM4 9h16',group:'M8 6h12M8 12h12M8 18h12M4 6h.5M4 12h.5M4 18h.5',expand:'M6 3v6M6 9h6M12 9v6M6 15h12M18 15v6',summary:'M3 16l5-7 4 5 3-4 6 8',gear:'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',cloud:'M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8M12 12v7M9 16l3 3 3-3',mail:'M3 6h18v12H3zM3 7l9 6 9-6',sync:'M20 11a8 8 0 0 0-14.5-4M4 13a8 8 0 0 0 14.5 4M5 3v4h4M19 21v-4h-4',bell:'M18 8a6 6 0 0 0-12 0v7l-2 3h16l-2-3zM10 21h4',arrow:'M7 17 17 7M9 7h8v8',filter:'M4 5h16l-6 7v6l-4 2v-8z',dots:'M12 5h.01M12 12h.01M12 19h.01',chart:'M4 20V10M10 20V4M16 20v-8M22 20H2',video:'M3 6h13v12H3zM16 10l5-3v10l-5-3',image:'M3 5h18v14H3zM8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4M21 16l-6-6-9 9',person:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0',team:'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 13.5a7 7 0 0 1 4 6.5'};
const Icon=({name,className='iq-ur-ic'})=><svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d={path[name]} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const Toggle=()=><span className="iq-ur-toggle" aria-hidden="true"><Icon name="chev"/></span>;
const Stat=({label,value,total,pct,dot,active})=><div className={`iq-ur-stat${active?' is-active':''}`}><span>{label}<Icon name="arrow"/></span><b>{value}<small> / {total}</small><em>{pct}<i className={`is-${dot}`}/></em></b></div>;

function Sidebar(){
 return <aside className="iq-ur-side">
  <div className="iq-ur-side-top"><span className="iq-ur-link"><Icon name="back"/>Back To All Reports</span><span className="iq-ur-side-tools"><Icon name="tree"/><Icon name="collapse"/></span></div>
  <div className="iq-ur-side-search"><Icon name="search"/>Search by keyword</div>
  <div className="iq-ur-side-title"><span>UR</span><b>Usage Report</b><Icon name="chev"/></div>
  <section className="iq-ur-card iq-ur-card--mission"><header><span className="iq-ur-badge"><Icon name="view"/></span><b>Mission</b><Icon name="chev"/></header>
   <div className="iq-ur-total">Total Triggered <b>1045</b></div>
   <div className="iq-ur-stats"><Stat label="Closed" value="892" total="1045" pct="85.4%" dot="green"/><Stat label="Running" value="2" total="1045" pct="0.2%" dot="red"/><Stat label="Canceled" value="151" total="1045" pct="14.4%" dot="red"/></div>
  </section>
  <section className="iq-ur-card iq-ur-card--ticket"><header><span className="iq-ur-badge"><Icon name="mail"/></span><b>Ticket</b><small><b>2</b> Total Triggered</small><Icon name="right"/></header></section>
  <section className="iq-ur-card iq-ur-card--response is-active"><header><span className="iq-ur-badge"><Icon name="summary"/></span><b>Response</b><Icon name="chev"/></header>
   <div className="iq-ur-total">Total Triggered <b>1045</b></div>
   <div className="iq-ur-stats"><Stat label="Missions" value="355" total="1045" pct="34%" dot="red" active/><Stat label="Tickets Triggered" value="0" total="1045" pct="0%" dot="red"/><Stat label="Pending" value="13" total="1045" pct="1.2%" dot="red"/></div>
  </section>
 </aside>;
}

// Grouped report rows: group rows (unit / mission / person / checkpoint), then
// one row per response with its media row, opened by Gallery View.
const VIDEO_POSTER='/demo-quality/damaged-hinge.png';
function Media({row,rows}){
 const video=row.media.kind==='video';
 return <div className="iq-ur-gallery-row" style={{gridTemplateRows:`${rows}fr`}}><div><div className="iq-ur-images" style={{paddingLeft:row.indent}} data-ur-anchor={row.anchor?'':undefined}><small>{video?'Video':'Images'}</small><div>{video?<span className="iq-ur-video" role="img" aria-label="Recorded video" style={{backgroundImage:`url('${VIDEO_POSTER}')`}}><i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7Z" fill="currentColor"/></svg></i></span>:<span role="img" aria-label={row.media.alt||row.checkpoint} style={{backgroundImage:`url('${proofSrc(row.media.name)}')`}}/>}</div></div></div></div>;
}
export function ReportTree({nodes,rows=0,depth=0}){
 const pad=14+depth*24;
 return nodes.map((node,i)=>node.leaf
  ?<Fragment key={`${node.person}-${node.date}-${node.checkpoint}`}>
   <div className="iq-ur-row iq-ur-person"><span style={{paddingLeft:pad+4}}><i className="iq-ur-branch"/><em>{i+1}.</em><b>{node.person}</b></span><span/><span className="iq-ur-chips">{node.positions.map(p=>p.startsWith('+')?<small key={p}>({p})</small>:<i key={p}>{p}</i>)}</span><span/><span>{node.response}</span><span className="iq-ur-proof"><Icon name={node.media.kind==='video'?'video':'image'}/>1</span><span><time>{node.date}</time></span></div>
   <Media row={{...node,indent:pad+30}} rows={rows}/>
  </Fragment>
  :<Fragment key={node.label}>
   <div className={`iq-ur-row ${node.kind==='checkpoint'?'iq-ur-question':'iq-ur-mission'}`}><span style={{paddingLeft:pad}}><Toggle/><em>{i+1}.</em><b>{node.label}</b><small>{node.children.length}</small></span><span>{node.type}</span><span/><span/><span className={node.kind==='checkpoint'?'iq-ur-statlink':undefined}>{node.kind==='checkpoint'&&<><Icon name="chart"/>Statistics</>}</span><span/><span/></div>
   <ReportTree nodes={node.children} rows={rows} depth={depth+1}/>
  </Fragment>);
}
// Group by menu: opens under its toolbar button (the button turns light blue).
function GroupMenu({open,value,options}){
 return <div className="iq-ur-menu" style={{opacity:open,transform:`translateY(${(1-open)*-6}px) scale(${.96+.04*open})`}}>
  <header><b>Group by</b><span>Expand All</span><span>Collapse All</span></header>
  <div>{options.map(o=><span key={o} className={o===value?'is-active':undefined} data-iq-target={`group-${o}`}><i>{o===value&&<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8.5 3.2 3.2L13 4.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}</i>{o}</span>)}</div>
 </div>;
}

export default function UsageReport({web,range='09/21/2026 – 09/27/2026',groupBy='Person',menu=0,options=[],dip=0,children}){
 const body=useRef(null),[max,setMax]=useState(0);
 // Scroll range: to the anchored row's bottom if one is marked, else to the
 // end of the table body; measured once laid out.
 useLayoutEffect(()=>{
  const el=body.current;if(!el)return;
  const anchor=el.querySelector('[data-ur-anchor]'),view=el.parentElement.clientHeight;
  const k=el.getBoundingClientRect().height/el.offsetHeight||1;
  const m=Math.max(0,anchor?(anchor.getBoundingClientRect().bottom-el.getBoundingClientRect().top)/k-view+12:el.scrollHeight-view);
  if(Math.abs(m-max)>1)setMax(m);
 });
 return <div className="iq-ur" aria-label="Taskmaverick web: Usage Report">
  <header className="iq-ur-topbar"><img src="/logo.svg" alt="taskmaverick"/><nav>{NAV.map(n=><span key={n} className={n==='Reports'?'is-active':undefined}>{n}</span>)}</nav><div><Icon name="bell"/><Icon name="gear"/><span className="iq-ur-avatar">JM</span></div></header>
  <div className="iq-ur-page"><Sidebar/>
   <main className="iq-ur-main">
    <div className="iq-ur-head"><b>Usage Report</b><span className="iq-ur-link">Show Details</span><span className="iq-ur-range" data-iq-target="date-range">{range}<Icon name="chev"/></span><span className="iq-ur-btn">Update Default View</span><span className="iq-ur-btn is-primary">Save To My View</span></div>
    <div className="iq-ur-tools"><span><Icon name="view" className="iq-ur-ic is-blue"/>My View:Default</span><span className={`iq-ur-group${menu>0?' is-open':''}`} data-iq-target="group-by"><Icon name="group"/>Group by: {groupBy}{menu>0&&<GroupMenu open={menu} value={groupBy} options={options}/>}</span><span><Icon name="expand"/>Expand/Collapse</span><span><Icon name="summary"/>Report Summary</span>
     <span className="iq-ur-gallery" data-iq-target="gallery-view"><i className={`iq-ur-checkbox${web.gallery?' is-checked':''}`}>{web.gallery&&<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}</i>Gallery View</span>
     <span className="iq-ur-icons"><Icon name="gear"/><Icon name="cloud"/><Icon name="mail"/><Icon name="sync"/></span></div>
    <div className="iq-ur-summary"><span>Total Missions: 355 of 1045 / 34%</span><span className="iq-ur-pill is-active"><i><Icon name="team"/></i>Team <b>355 of 1045 / 34%</b></span><span className="iq-ur-pill"><i><Icon name="person"/></i>Personal <b>0 of 0 / 0%</b></span></div>
    <div className="iq-ur-filters">Table Filter: <span>Proof</span><em>Photo ×</em><span>or</span><em>Video ×</em><u>Clear All</u></div>
    <div className="iq-ur-table">
     <div className="iq-ur-row iq-ur-th">{['Name','Type','Positions','Reference','Response','Proof','Date & Time'].map(h=><span key={h}>{h}{['Name','Proof'].includes(h)&&<Icon name="filter" className="iq-ur-ic is-solid"/>}<Icon name="dots"/></span>)}</div>
     <div className="iq-ur-window" style={{opacity:1-.7*dip}}><div ref={body} style={{transform:`translateY(${-max*web.scroll}px)`}}>
      {children??BUSINESS_PROOFS.map((m,i)=>{const count=m.photos.length+(m.more||0);return <section key={m.id}>
       <div className="iq-ur-row iq-ur-mission"><span><Toggle/><em>{i+1}.</em><b>{m.title}</b><small>1</small></span><span>{m.kind}</span><span/><span/><span/><span/><span/></div>
       <div className="iq-ur-row iq-ur-question"><span><Toggle/><em>1.</em><b>{QUESTIONS[m.id]}</b><small>1</small></span><span/><span/><span/><span className="iq-ur-statlink"><Icon name="chart"/>Statistics</span><span/><span/></div>
       <div className="iq-ur-row iq-ur-person"><span><i className="iq-ur-branch"/><em>1.</em><b data-iq-target={`web-name-${i}`}>{m.performer}</b></span><span/><span className="iq-ur-chips">{POSITIONS[m.performer].map(p=>p.startsWith('+')?<small key={p}>({p})</small>:<i key={p}>{p}</i>)}</span><span/><span>Yes</span><span className="iq-ur-proof"><Icon name="image"/>{count}</span><span><time data-iq-target={`web-date-${i}`}>{webDate(m.date)}</time></span></div>
       <div className="iq-ur-gallery-row" style={{gridTemplateRows:`${web.rows}fr`}}><div><div className="iq-ur-images"><small>Images</small><div>{m.photos.map((p,j)=><span key={p.name} role="img" aria-label={p.alt} style={{backgroundImage:`url('${proofSrc(p.name)}')`}}>{m.more&&j===m.photos.length-1&&<em>+{m.more}</em>}</span>)}</div></div></div></div>
      </section>;})}
     </div></div>
    </div>
   </main>
  </div>
 </div>;
}
