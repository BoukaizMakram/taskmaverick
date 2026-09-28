'use client';
// Overview (Team Board) for the Live Oversight film: the /running workspace's
// own markup and ow-* styles at a fixed 1600x760 page, driven by the film's
// frame instead of the live clock: the Running and History views (grouped by
// Unit), the mission detail panel (Response tab) and the full-page photo and
// video viewer, as in the web app.
import {Fragment,useLayoutEffect,useRef} from 'react';
import {Icon} from './OverviewWorkspace';
import {DemoVideo} from './ImprovedQualityPanels';
import {formatTimer} from '@/lib/overviewModel.mjs';
import {RUNNING,DETAIL,historyByUnit,storageSrc} from '@/lib/liveOversightData.mjs';
import {MOTION} from '@/lib/liveOversightStory.mjs';

const NAV=['Missions','People','Teams','Units','Ticket Boards','Groups','Certifications','Timesheets','Reports','Dashboards','Overview'];
const BOARDS=['Team Board','Personal Board','Unit Ticket Board','Organization Ticket Board','Process','Course','Certification'];
const VIEWS=['History','Running','Scheduled','Timeline'];
const COLUMNS=[['name',330],['ref',120],['state',130],['triggered',170],['by',140],['open',125],['claimed',125],['duration',125],['closed',170],['type',100]];
const LABELS={Running:{name:'Name',ref:'Reference',state:'Activity',triggered:'Triggered at',by:'Claimed By',open:'Open',claimed:'Claimed',duration:'Duration',closed:'Closed At',type:'Type'}};
LABELS.History={...LABELS.Running,triggered:'Opened At',by:'Closed By'};
const tone=seconds=>seconds>1800?'is-red':seconds>600?'is-orange':'is-green';

// scroll = 0..1 of the way down to the anchored unit (West Location), which
// then sits right under the column headers.
function useScroll(scroll){
 const box=useRef(null);
 useLayoutEffect(()=>{
  const el=box.current;if(!el)return;
  const row=el.querySelector('[data-ov-anchor]'),head=el.querySelector('thead');
  const k=el.getBoundingClientRect().height/el.clientHeight||1;
  const target=row?(row.getBoundingClientRect().top-el.getBoundingClientRect().top)/k+el.scrollTop-(head?.offsetHeight||0):el.scrollHeight-el.clientHeight;
  el.scrollTop=Math.max(0,Math.min(el.scrollHeight-el.clientHeight,target))*scroll;
 });
 return box;
}

function Timer({seconds,kind,frozen}){
 return <span className={`ow-timer ${kind==='duration'?(frozen?'is-gray':'is-outline'):tone(seconds)}`}>{formatTimer(seconds)}</span>;
}
// One mission row, in the /running workspace's markup. `t` = film seconds:
// open and claimed timers keep running; closed missions are frozen.
function MissionRow({row,index,t,view,target,selected}){
 const frozen=row.state==='Closed',open=row.open+(row.state==='Open'?t:0),claimed=row.claimed+(row.state==='Claimed'?t:0);
 const id=row.id,tag=key=>target&&id?`${key}-${id}`:undefined;
 const cell={
  name:<div className="ow-name-content"><span className="ow-tree"/><span className="ow-number">{index+1}.</span><span className="ow-mission-name" data-iq-target={tag('name')}>{row.name}</span><span className="ow-dots">⋮</span></div>,
  ref:row.ref,
  state:<span className={`ow-state state-${row.state.toLowerCase()}`}><i/>{row.state}</span>,
  triggered:view==='History'?row.opened:row.triggered,
  by:row.by,
  open:<Timer seconds={open}/>,
  claimed:claimed>0||row.state==='Claimed'?<Timer seconds={claimed}/>:null,
  duration:<Timer seconds={open+claimed} kind="duration" frozen={frozen}/>,
  closed:row.closed,type:row.type,
 };
 return <tr className={`ow-data-row${selected?' is-open':''}`}>{COLUMNS.map(([key])=><td key={key} className={key==='name'?'ow-name-cell':['open','claimed','duration'].includes(key)?'ow-timer-cell':''}>{cell[key]}</td>)}</tr>;
}
function GroupRow({label,index,count,rows,nested,anchor}){
 const total=state=>rows.filter(r=>r.state===state).length;
 return <tr className={`ow-group-row${nested?' is-nested':''}`} data-ov-anchor={anchor?'':undefined}>{COLUMNS.map(([key])=><td key={key} className={key==='name'?'ow-name-cell':''}>{key==='name'?<span className="ow-group-button"><span className="ow-collapse-icon"><Icon name="chevron"/></span><span className="ow-number">{index+1}.</span><span className="ow-group-label">{label}</span><span className="ow-count">{count}</span></span>:['open','claimed','closed'].includes(key)?<span className="ow-total">{total({open:'Open',claimed:'Claimed',closed:'Closed'}[key])}</span>:null}</td>)}</tr>;
}
function RunningBody({t,openId}){
 return RUNNING.map((unit,u)=>{const all=unit.teams.flatMap(team=>team.rows);return <Fragment key={unit.unit}>
  <GroupRow label={unit.unit} index={u} count={unit.teams.length} rows={all} anchor={unit.anchor}/>
  {unit.teams.map((team,i)=><Fragment key={team.team}><GroupRow nested label={team.team} index={i} count={team.rows.length} rows={team.rows}/>{team.rows.map((row,r)=><MissionRow key={row.name} row={row} index={r} t={t} view="Running" target selected={row.id===openId}/>)}</Fragment>)}
 </Fragment>;});
}
function HistoryBody(){
 return historyByUnit().map((group,g)=><Fragment key={group.label}>
  <GroupRow label={group.label} index={g} count={group.children.length} rows={group.children.flatMap(c=>c.rows)}/>
  {group.children.map((child,c)=><Fragment key={child.label}>
   <GroupRow nested label={child.label} index={c} count={child.rows.length} rows={child.rows}/>
   {child.rows.map((row,r)=><MissionRow key={`${row.name}-${row.closed}`} row={row} index={r} t={0} view="History"/>)}
  </Fragment>)}
 </Fragment>);
}

const Svg=({d,fill})=><svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} fill={fill?'currentColor':'none'} stroke={fill?'none':'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ICON={globe:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9M12 3C9.5 5.5 8.5 8.5 8.5 12s1 6.5 3.5 9',open:'M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',photo:'M3 5h18v14H3zM8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4M21 16l-6-6-9 9',video:'M3 6h13v12H3zM16 10l5-3v10l-5-3',close:'M6 6l12 12M18 6 6 18',zoom:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4M11 8v6M8 11h6',rotate:'M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4',left:'m15 5-7 7 7 7',right:'m9 5 7 7-7 7',check:'m5 12.5 4.5 4.5L19 7.5'};

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
function MediaViewer({viewer,playing,speed}){
 const video=viewer.kind==='video',photo=DETAIL.photos[viewer.index]||DETAIL.photos[0];
 const t=Math.min(MOTION.rec,Math.max(0,viewer.live)),running=viewer.live>0&&viewer.live<MOTION.rec;
 return <div className="iq-mv" style={{opacity:Math.min(1,viewer.in*1.4)}}>
  <header><b>{video?DETAIL.video.file:photo.file}</b><div><span><Svg d={ICON.zoom}/>Zoom in</span><span><Svg d={ICON.rotate}/>Rotate</span><span className="iq-mv-close">Close</span></div></header>
  <span className="iq-mv-arrow is-left"><Svg d={ICON.left}/></span><span className="iq-mv-arrow is-right" data-iq-target="viewer-next"><Svg d={ICON.right}/></span>
  <div className={`iq-mv-media${video?' is-video':''}`} style={{transform:`scale(${.94+.06*viewer.in})`}}>
   {video?<><DemoVideo time={t} playing={playing&&running} speed={speed}/><div className="iq-mv-player"><span>{running?'❚❚':'▶'}</span><i><em style={{width:`${t/MOTION.rec*100}%`}}/></i><time>00:0{Math.floor(t)} / 00:0{MOTION.rec}</time></div></>
    :<span key={photo.name} className="iq-mv-photo" role="img" aria-label="The storage room today" style={{backgroundImage:`url('${storageSrc(photo.name)}')`}}/>}
  </div>
  {!video&&<div className="iq-mv-thumbs">{DETAIL.photos.map((p,i)=><span key={p.name} className={i===viewer.index?'is-active':undefined} style={{backgroundImage:`url('${storageSrc(p.name)}')`}}/>)}</div>}
 </div>;
}

export default function OverviewScene({frame,playing,speed}){
 const {view,historyDip,scroll,drawer,viewer,time}=frame;
 const box=useScroll(scroll);
 const labels=LABELS[view],width=COLUMNS.reduce((sum,[,w])=>sum+w,0);
 return <div className="ow-workspace iq-ow" aria-label="Taskmaverick Overview">
  <header className="ow-topbar"><span className="ow-logo"><img src="/logo.svg" alt="taskmaverick"/></span><nav>{NAV.map(name=><span key={name} className={name==='Overview'?'is-active':undefined} data-iq-target={`nav-${name}`}>{name}</span>)}</nav><div className="ow-account"><span className="ow-icon-button"><Icon name="bell"/></span><span className="ow-icon-button"><Icon name="settings"/></span><span className="ow-avatar">JM</span></div></header>
  <div className="ow-subnav"><nav>{BOARDS.map(name=><span key={name} className={name==='Team Board'?'is-active':undefined}>{name}</span>)}</nav><nav className="ow-view-nav">{VIEWS.map(name=><span key={name} className={name===view?'is-active':undefined} data-iq-target={`view-${name}`}>{name}</span>)}</nav></div>
  <div className="ow-toolbar">
   {view==='Running'&&<span className="ow-tool"><Icon name="bulk"/>Bulk Action<Icon name="chevron"/></span>}
   <span className="ow-tool"><Icon name="filter"/>Filter: New Filter</span>
   <span className="ow-tool"><Icon name="group"/>Group by: Unit</span>
   <span className="ow-tool"><Icon name="expand"/>Expand/Collapse</span>
   <span className="ow-tool"><Icon name="eye"/>Hide/Show Column</span>
   <span className="ow-tool"><Icon name="export"/>Export</span>
   {view==='Running'?<label className="ow-check"><input type="checkbox" readOnly checked={false}/>Only Boosted</label>
    :<div className="ow-date-range"><span className="iq-ow-date">09/22/2026</span><span>–</span><span className="iq-ow-date">09/28/2026</span></div>}
   <span className="ow-search iq-ow-search">Search missions</span>
  </div>
  <div className="ow-table-scroll" ref={box} style={{opacity:1-.7*historyDip}}><table className="ow-table" style={{width}}><colgroup>{COLUMNS.map(([key,w])=><col key={key} style={{width:w}}/>)}</colgroup>
   <thead><tr>{COLUMNS.map(([key])=><th key={key} className={key==='name'?'ow-name-cell':''} data-iq-col={key}><div><span>{labels[key]}</span><span className="ow-dots">⋮</span></div></th>)}</tr></thead>
   <tbody>{view==='Running'?<RunningBody t={time} openId={drawer>0?'storage':null}/>:<HistoryBody/>}</tbody>
  </table></div>
  {drawer>0&&<DetailPanel open={drawer}/>}
  {viewer.in>0&&<MediaViewer viewer={viewer} playing={playing} speed={speed}/>}
 </div>;
}
