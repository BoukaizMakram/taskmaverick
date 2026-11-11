'use client';
// Overview (Team Board) for the Live Oversight film: the /running workspace's
// own markup and ow-* styles at a fixed 1600x760 page, driven by the film's
// frame instead of the live clock: the Running and History views (grouped by
// Unit), the mission detail panel (Response tab) and the full-page photo and
// video viewer, as in the web app. The look is the product's Team Board (the
// user's screenshot, 2026-10-19): the column header is its own table above the
// rows, so it is always there however far the rows scroll (the storyboard
// films a scroll as a move of the rows' table, not of the page).
import {Fragment,useLayoutEffect,useRef} from 'react';
import {Icon} from './OverviewWorkspace';
import {DemoVideo} from './ImprovedQualityPanels';
import {formatTimer} from '@/lib/overviewModel.mjs';
import {RUNNING,DETAIL,POSITIONS_OF,historyByUnit,historyByPerson,storageSrc} from '@/lib/liveOversightData.mjs';
import {GroupMenu} from './UsageReport';
import {MOTION} from '@/lib/liveOversightStory.mjs';

const NAV=['Missions','People','Teams','Units','Ticket Boards','Groups','Certifications','Timesheets','Reports','Dashboards','Overview'];
const BOARDS=['Team Board','Personal Board','Unit Ticket Board','Organization Ticket Board','Process','Course','Certification'];
const VIEWS=['History','Running','Scheduled','Timeline'];
// (Position runs past the page's right edge, as it does in the product.) History has its own columns, in its own order (the real History, 2026-10-20: Name, Reference,
// Closed By, Opened At ↓, Open, Claimed, Duration, Closed At, Type, Position - Closed by; no Activity).
const RUNNING_COLUMNS=[['name',320],['ref',120],['state',120],['triggered',180],['by',135],['open',115],['claimed',115],['duration',115],['closed',180],['type',100],['position',130]];
const HISTORY_COLUMNS=[['name',320],['ref',120],['by',150],['triggered',190],['open',115],['claimed',115],['duration',115],['closed',190],['type',100],['position',190]];
const columnsOf=view=>view==='History'?HISTORY_COLUMNS:RUNNING_COLUMNS;
const LABELS={Running:{name:'Name',ref:'Reference',state:'Activity',triggered:'Triggered at',by:'Claimed By',open:'Open',claimed:'Claimed',duration:'Duration',closed:'Closed At',type:'Type',position:'Position'}};
LABELS.History={...LABELS.Running,triggered:'Opened At',by:'Closed By',position:'Position - Closed by'};
const PEOPLE=['Emily Carter','James Miller','Michael Davis','Sarah Wilson']; // (the Closed By column's People filter)
const GROUPS=['Unit','Mission','Team','Person']; // (the toolbar's Group by: the real Team Board's Unit, Mission, Team (admin.taskmaverick.com), and Person, which the CEO asked for (2026-10-20: the real one has it on the Personal Board); its menu is the Usage report's)
const slug=text=>String(text).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const openedAt=row=>Date.parse(String(row.opened).replace(',',''))||0;
const SORTED='triggered',NO_MENU=['closed']; // (the board is sorted by Triggered at ↓; Closed At has no column menu)
const CENTERED=['open','claimed','duration','closed'];
const FROZEN=['Closed','Canceled'];
const tone=seconds=>seconds>1800?'is-red':seconds>600?'is-orange':'is-green';
const when=value=>value?value.replace(', ',' '):''; // (the product writes 09/28/2026 10:07 AM)

// scroll = 0..1 of the way down to the anchored unit (West Location), which
// then sits right under the column headers.
function useScroll(scroll){
 const box=useRef(null);
 useLayoutEffect(()=>{
  const el=box.current;if(!el)return;
  const row=el.querySelector('[data-ov-anchor]');
  const k=el.getBoundingClientRect().height/el.clientHeight||1;
  const target=row?(row.getBoundingClientRect().top-el.getBoundingClientRect().top)/k+el.scrollTop:el.scrollHeight-el.clientHeight;
  el.scrollTop=Math.max(0,Math.min(el.scrollHeight-el.clientHeight,target))*scroll;
 });
 return box;
}

function Timer({seconds,kind,frozen}){
 return <span className={`ow-timer ${kind==='duration'?(frozen?'is-gray':'is-outline'):tone(seconds)}`}>{formatTimer(seconds)}</span>;
}
// The tree's lines in the Name column: `rail` = the unit's line going on down
// past this row (to its next team), `branch` = the line into a team's icon.
const Rail=()=><span className="iq-ow-rail" aria-hidden="true"/>;
// One mission row, in the /running workspace's markup. `t` = film seconds:
// open and claimed timers keep running; closed and canceled ones are frozen.
function MissionRow({row,index,t,view,target,selected,rail,cols}){
 const frozen=FROZEN.includes(row.state),open=row.open+(row.state==='Open'?t:0),claimed=row.claimed+(row.state==='Claimed'?t:0);
 const id=row.id,tag=key=>target&&id?`${key}-${id}`:undefined;
 const cell={
  name:<div className="ow-name-content">{rail&&<Rail/>}<span className="ow-tree"/><span className="ow-number">{index+1}.</span><span className="ow-mission-name" data-iq-target={tag('name')}>{row.name}</span>{row.boosted&&<svg className="iq-ow-flag" viewBox="0 0 24 24" aria-label="Boosted"><path d="M6 3v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M6 4h12l-3 4.5 3 4.5H6z" fill="currentColor"/></svg>}<span className="ow-dots">⋮</span></div>,
  ref:row.ref,
  state:<span className={`ow-state state-${row.state.toLowerCase()}`}><i/>{row.state}</span>,
  triggered:when(view==='History'?row.opened:row.triggered),
  by:row.by,
  open:<Timer seconds={open}/>,
  claimed:claimed>0||row.state==='Claimed'?<Timer seconds={claimed}/>:null,
  duration:<Timer seconds={open+claimed} kind="duration" frozen={frozen}/>,
  closed:when(row.closed),type:row.type,
  position:row.by&&POSITIONS_OF[row.by]?<span className="ow-position">{POSITIONS_OF[row.by][0]}</span>:null,
 };
 const history=view==='History',empty=key=>history&&key!=='name'&&(cell[key]==null||cell[key]===''); // (History writes "-" where there is nothing)
 return <tr className={`ow-data-row${row.boosted?' is-boosted':''}${selected?' is-open':''}`} data-ov-state={row.state.toLowerCase()}>{cols.map(([key])=><td key={key} className={key==='name'?'ow-name-cell':['open','claimed','duration'].includes(key)||empty(key)?'ow-timer-cell':''}>{empty(key)?'-':cell[key]}</td>)}</tr>;
}
function GroupRow({label,index,count,rows,nested,last,anchor,cols,dashes}){ // (`dashes`: History's group rows show "-" in every column, no totals)
 const total=state=>rows.filter(r=>r.state===state).length;
 return <tr className={`ow-group-row${nested?' is-nested':''}`} data-ov-anchor={anchor?'':undefined}>{cols.map(([key])=><td key={key} className={key==='name'?'ow-name-cell':CENTERED.includes(key)||dashes?'iq-ow-center':''}>{key==='name'?<span className="ow-group-button">{nested&&<span className={`iq-ow-branch${last?' is-last':''}`} aria-hidden="true"/>}<span className="ow-collapse-icon"><Icon name="chevron"/></span><span className="ow-number">{index+1}.</span><span className="ow-group-label">{label}</span><span className="ow-count">{count}</span></span>:dashes?'-':['open','claimed','closed'].includes(key)?<span className="ow-total">{total({open:'Open',claimed:'Claimed',closed:'Closed'}[key])}</span>:null}</td>)}</tr>;
}
function RunningBody({t,openId}){
 return RUNNING.map((unit,u)=>{const all=unit.teams.flatMap(team=>team.rows);return <Fragment key={unit.unit}>
  <GroupRow label={unit.unit} index={u} count={unit.teams.length} rows={all} anchor={unit.anchor} cols={RUNNING_COLUMNS}/>
  {unit.teams.map((team,i)=>{const last=i===unit.teams.length-1;return <Fragment key={team.team}><GroupRow nested last={last} label={team.team} index={i} count={team.rows.length} rows={team.rows} cols={RUNNING_COLUMNS}/>{team.rows.map((row,r)=><MissionRow key={row.name} row={row} index={r} t={t} view="Running" target selected={row.id===openId} rail={!last} cols={RUNNING_COLUMNS}/>)}</Fragment>;})}
 </Fragment>;});
}
// History: every run of a mission is a row of its own, newest first, under its unit and team (the real History), or under the person who closed it (`group` 'Person': the toolbar's
// Group by). `filter`: what the columns' menus keep ({name: a mission, by: a person}); a group with nothing left is not shown.
function HistoryBody({filter,group='Unit'}){
 const keep=row=>(!filter?.name||row.name===filter.name)&&(!filter?.by||row.by===filter.by);
 const groups=(group==='Person'?historyByPerson():historyByUnit()).map(group=>({...group,children:group.children.map(child=>({...child,rows:child.rows.filter(keep).sort((a,b)=>openedAt(b)-openedAt(a))})).filter(child=>child.rows.length)})).filter(group=>group.children.length);
 return groups.map((group,g)=><Fragment key={group.label}>
  <GroupRow label={group.label} index={g} count={group.children.length} rows={group.children.flatMap(c=>c.rows)} cols={HISTORY_COLUMNS} dashes/>
  {group.children.map((child,c)=>{const last=c===group.children.length-1,nested=child.label!=null;return <Fragment key={child.label??group.label}>
   {nested&&<GroupRow nested last={last} label={child.label} index={c} count={child.rows.length} rows={child.rows} cols={HISTORY_COLUMNS} dashes/>}
   {child.rows.map((row,r)=><MissionRow key={`${row.name}-${row.closed}`} row={row} index={r} t={0} view="History" rail={nested&&!last} cols={HISTORY_COLUMNS}/>)}
  </Fragment>;})}
 </Fragment>);
}
// A column's ⋮ menu (the real board's, 2026-10-20: "it's just the three dots on all of the boards ... it's like the filter to search by whatever you want"): View Options, then the
// column's filter: a keyword (Sort by A-Z / Z-A, Search By Keyword) or, for a person's column, People and Positions to pick from (the People list opens under its box: a search,
// the people with their boxes, Close); Hide Column, Apply (blue once there is something to apply), Close. It hangs under the column's ⋮, its right edge on the column's.
// `menu`: {col, kw (the keyword typed), people (the list is open), picked: [names]}.
const BOX=({on})=><span className={`iq-ow-cm-box${on?' is-on':''}`} aria-hidden="true">{on&&<svg viewBox="0 0 20 20"><path d="M4.6 10.6 8.4 14.4 15.6 6.2" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}</span>;
const MenuSelect=({target,value})=><div className={`iq-ow-cm-select${value?' has-value':''}`} data-iq-target={target}>{value||'Select'}<Icon name="chevron"/></div>;
function ColumnMenu({menu,cols}){
 const at=cols.findIndex(([k])=>k===menu.col);
 if(at<0)return null;
 const right=cols.slice(0,at+1).reduce((sum,[,w])=>sum+w,0),person=menu.col==='by',picked=menu.picked??[],ready=person?picked.length>0:!!menu.kw;
 return <div className={`iq-ow-cm${person?' is-person':''}`} style={{left:right-(person?318:300)-2}} data-iq-target={`menu-${menu.col}`}>
  <div className="iq-ow-cm-view">View Options<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l7 6-7 6z" fill="currentColor"/></svg></div>
  {person?<>
   <b className="iq-ow-cm-head">People</b>
   <div className="iq-ow-cm-field">
    <MenuSelect target="select-people" value={picked.join(', ')}/>
    {menu.people&&<div className="iq-ow-cm-drop">
     <div className="iq-ow-cm-find">Search<Icon name="chevron"/></div>
     {PEOPLE.map(name=><div key={name} className="iq-ow-cm-person" data-iq-target={`person-${slug(name)}`}><BOX on={picked.includes(name)}/>{name}</div>)}
     <footer><span className="iq-ow-cm-close" data-iq-target="close-people">Close</span></footer>
    </div>}
   </div>
   <b className="iq-ow-cm-head">Positions</b>
   <MenuSelect target="select-positions"/>
  </>:<>
   <div className="iq-ow-cm-filter"><b>Filter</b><span>Sort by:<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16m-3-3 3 3 3-3M14 4h5l-5 7h5M14 15h5M14 19h5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 20V4m-3 3 3-3 3 3M14 4h5l-5 7h5M14 15h5M14 19h5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg></span></div>
   <div className={`iq-ow-cm-search${menu.kw?' has-value':''}`} data-iq-target={`kw-${menu.col}`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>{menu.kw||'Search By Keyword'}</div>
  </>}
  <footer>{menu.col!=='name'&&<span className="iq-ow-cm-hide"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.7M6.3 7.6A17 17 0 0 0 2 12s4 6 10 6a9.6 9.6 0 0 0 4.4-1.1M9.9 10a3 3 0 0 0 4.1 4.1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>Hide Column</span>}<span className={`iq-ow-cm-apply${ready?' is-ready':''}`} data-iq-target={`apply-${menu.col}`}>Apply</span><span className="iq-ow-cm-close">Close</span></footer>
 </div>;
}

const Svg=({d,fill,className})=><svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d={d} fill={fill?'currentColor':'none'} stroke={fill?'none':'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ICON={globe:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9M12 3C9.5 5.5 8.5 8.5 8.5 12s1 6.5 3.5 9',open:'M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',photo:'M3 5h18v14H3zM8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4M21 16l-6-6-9 9',video:'M3 6h13v12H3zM16 10l5-3v10l-5-3',close:'M6 6l12 12M18 6 6 18',zoom:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4M11 8v6M8 11h6',rotate:'M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4',left:'m15 5-7 7 7 7',right:'m9 5 7 7-7 7',check:'m5 12.5 4.5 4.5L19 7.5',
 // the Team Board's toolbar and top bar
 filter:'M4 5h16l-6 7.5V18l-4 2v-7.5z',list:'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',tree:'M5 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4M17 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4M17 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4M17 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4M7 12h8M7 11l8-5M7 13l8 5',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',cloud:'M7.5 18H7a4.5 4.5 0 0 1-.6-8.96 6 6 0 0 1 11.4 1.46A3.75 3.75 0 0 1 17 18h-.5M12 11v10m-3-3 3 3 3-3',sort:'M12 4v16m-5-5 5 5 5-5',
 gear:'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'};
const BulkIcon=()=><svg className="ow-icon iq-ow-bulk" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="currentColor"/><path d="m7.5 12.5 3 3 6-7" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;

// The mission detail panel (Response tab): the performer, then one card per
// checkpoint with its question type and response; photo / video proofs open
// the viewer.
function DetailPanel({open}){
 return <aside className="iq-od" aria-label="Mission details" style={{transform:`translateX(${(1-open)*104}%)`}}>
  <header><h2>{DETAIL.name}</h2><span className="iq-od-close"><Svg d={ICON.close}/></span></header>
  <div className="iq-od-chips">{DETAIL.chips.map(c=><span key={c}>{c}</span>)}</div>
  <div className="iq-od-actions"><span className="iq-od-language"><span><Svg d={ICON.globe}/></span><b>Language</b><span><Icon name="chevron"/></span></span><span className="iq-od-open"><Svg d={ICON.open}/><i/>Open</span></div>
  <nav className="iq-od-tabs"><span className="is-active">Response</span><span>Info</span><span>Content</span></nav>
  <div className="iq-od-body">
   <div className="iq-od-performer"><i><Svg d={ICON.check}/></i>{DETAIL.performer}</div>
   {DETAIL.responses.map((r,i)=><section className={`iq-od-card${r.proof?'':' is-data'}`} key={r.key} data-iq-target={r.proof?undefined:`data-${r.key}`}>
    <div className="iq-od-q"><span><small>{i+1}.</small>{r.question}</span><em>{r.type}</em></div>
    <small className="iq-od-label">Response</small>
    <div className="iq-od-value"><b>{r.value}</b>{r.proof&&<span className="iq-od-proof" data-iq-target={`file-${r.proof.kind}`}><Svg d={ICON[r.proof.kind]}/>{r.proof.count}</span>}</div>
   </section>)}
  </div>
 </aside>;
}
// Full-page viewer (web app): file name on top, Zoom in / Rotate / Close,
// the media in the middle, arrows on both sides, thumbnails below.
function MediaViewer({viewer,playing,speed,Video=DemoVideo}){ // (`Video`: what plays the clip; a Remotion cut gives its own, played by the cut's clock)
 const video=viewer.kind==='video',photo=DETAIL.photos[viewer.index]||DETAIL.photos[0];
 const t=Math.min(MOTION.rec,Math.max(0,viewer.live)),running=viewer.live>0&&viewer.live<MOTION.rec;
 return <div className="iq-mv" style={{opacity:Math.min(1,viewer.in*1.4)}}>
  <header><b>{video?DETAIL.video.file:photo.file}</b><div><span><Svg d={ICON.zoom}/>Zoom in</span><span><Svg d={ICON.rotate}/>Rotate</span><span className="iq-mv-close">Close</span></div></header>
  <span className="iq-mv-arrow is-left"><Svg d={ICON.left}/></span><span className="iq-mv-arrow is-right" data-iq-target="viewer-next"><Svg d={ICON.right}/></span>
  <div className={`iq-mv-media${video?' is-video':''}`} style={{transform:`scale(${.94+.06*viewer.in})`}}>
   {video?<><Video time={t} playing={playing&&running} speed={speed}/><div className="iq-mv-player"><span>{running?'❚❚':'▶'}</span><i><em style={{width:`${t/MOTION.rec*100}%`}}/></i><time>00:0{Math.floor(t)} / 00:0{MOTION.rec}</time></div></>
    :<span key={photo.name} className="iq-mv-photo" role="img" aria-label="The storage room today" style={{backgroundImage:`url('${storageSrc(photo.name)}')`}}/>}
  </div>
  {!video&&<div className="iq-mv-thumbs">{DETAIL.photos.map((p,i)=><span key={p.name} className={i===viewer.index?'is-active':undefined} style={{backgroundImage:`url('${storageSrc(p.name)}')`}}/>)}</div>}
 </div>;
}

export default function OverviewScene({frame,playing,speed,Video}){
 const {view,historyDip,scroll,drawer,viewer,time,menu=null,filter=null,group='Unit',groupMenu=false}=frame; // (`group`, `groupMenu`: the toolbar's Group by and its menu open)
 const box=useScroll(scroll);
 const COLUMNS=columnsOf(view),labels=LABELS[view],width=COLUMNS.reduce((sum,[,w])=>sum+w,0);
 return <div className="ow-workspace iq-ow" aria-label="Taskmaverick Overview">
  <header className="ow-topbar"><span className="ow-logo"><img src="/logo.svg" alt="taskmaverick"/></span><nav>{NAV.map(name=><span key={name} className={name==='Overview'?'is-active':undefined} data-iq-target={`nav-${name}`}>{name}</span>)}</nav><div className="ow-account"><span className="ow-icon-button"><Icon name="bell"/></span><span className="ow-icon-button"><Svg className="ow-icon" d={ICON.gear}/></span><span className="ow-avatar">JM</span></div></header>
  <div className="ow-subnav"><nav>{BOARDS.map(name=><span key={name} className={name==='Team Board'?'is-active':undefined}>{name}</span>)}</nav><nav className="ow-view-nav">{VIEWS.map(name=><span key={name} className={name===view?'is-active':undefined} data-iq-target={`view-${name}`}>{name}</span>)}</nav></div>
  <div className="ow-toolbar">
   {view==='Running'&&<span className="ow-tool"><BulkIcon/>Bulk Action<Icon name="chevron"/></span>}
   <span className={`ow-tool iq-ow-filter${view==='History'?' is-plain':''}`}><Svg className="ow-icon" d={ICON.filter}/>Filter: New Filter</span>
   <span className={`ow-tool iq-ow-group${groupMenu?' is-open':''}`} data-iq-target="board-group-by"><Svg className="ow-icon" d={ICON.list}/>Group by: {group}{groupMenu&&<GroupMenu open={1} value={group} options={GROUPS} target="board-group-"/>}</span>
   <span className="ow-tool"><Svg className="ow-icon" d={ICON.tree}/>Expand/Collapse</span>
   <span className="ow-tool"><Svg className="ow-icon" d={ICON.eye}/>Hide/Show Column</span>
   <span className="ow-tool"><Svg className="ow-icon" d={ICON.cloud}/>Export</span>
   {view==='Running'?<label className="ow-check"><input type="checkbox" readOnly checked={false}/>Only Boosted</label>
    :<div className="iq-ow-range" data-iq-target="date-range">09/22/2026 – 09/28/2026<Icon name="chevron"/></div>}
  </div>
  {/* the header is its own table: it stays when the rows scroll (or are filtered down) under it */}
  <div className="ow-table-scroll" style={{opacity:1-.7*historyDip}}>
   <table className="ow-table iq-ow-head" style={{width}}><colgroup>{COLUMNS.map(([key,w])=><col key={key} style={{width:w}}/>)}</colgroup>
    <thead><tr>{COLUMNS.map(([key])=><th key={key} className={key==='name'?'ow-name-cell':''} data-iq-col={key}><div><span>{labels[key]}</span>{key===SORTED&&<Svg className="iq-ow-sort" d={ICON.sort}/>}{!NO_MENU.includes(key)&&<span className={`ow-dots${menu?.col===key?' is-open':''}`} data-iq-target={`dots-${key}`}>⋮</span>}</div></th>)}</tr></thead>
   </table>
   <div className="iq-ow-rows" ref={box}><table className="ow-table" style={{width}}><colgroup>{COLUMNS.map(([key,w])=><col key={key} style={{width:w}}/>)}</colgroup>
    <tbody>{view==='Running'?<RunningBody t={time} openId={drawer>0?'storage':null}/>:<HistoryBody filter={filter} group={group}/>}</tbody>
   </table></div>
   {menu&&<ColumnMenu menu={menu} cols={COLUMNS}/>}
  </div>
  {drawer>0&&<DetailPanel open={drawer}/>}
  {viewer.in>0&&<MediaViewer viewer={viewer} playing={playing} speed={speed} Video={Video}/>}
 </div>;
}
