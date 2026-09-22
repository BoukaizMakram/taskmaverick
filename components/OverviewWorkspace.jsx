'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { BOARDS, viewsForBoard, defaultGroup, columnsForBoard, TYPES, EMPTY_FILTER, seedMissions, counters, formatTimer, dateLabel, dateOnly, localDate, changeMissions, filterMissions, groupMissions, occurrences, csvText } from '@/lib/overviewModel.mjs';

const STORAGE = 'tm-overview-replica-generic-v1';
const NAV = ['Missions','People','Teams','Units','Ticket Boards','Groups','Certifications','Timesheets','Reports','Dashboards','Overview'];
function Icon({name}) {
  const paths = { filter:'M3 4h18l-7 8v7l-4 2v-9z', group:'M8 5h13M8 12h13M8 19h13M3 5h1M3 12h1M3 19h1', expand:'M8 3H3v5M3 3l6 6M16 21h5v-5M21 21l-6-6', eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0', export:'M12 3v12m-4-4 4 4 4-4M4 15v5h16v-5', bulk:'m3 11 18-8-6 18-4-8-8-2zM11 13l10-10', bell:'M18 8a6 6 0 0 0-12 0v7l-2 3h16l-2-3zM10 21h4', settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2', calendar:'M4 5h16v16H4zM8 2v6M16 2v6M4 10h16', close:'M5 5l14 14M5 19 19 5', chevron:'m6 9 6 6 6-6', clock:'M12 5v7l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0' };
  return <svg className="ow-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]||paths.group} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function Dialog({title,children,onClose,className=''}) {
  const ref=useRef(null);
  useEffect(()=>{const previous=document.activeElement; const node=ref.current; node.showModal(); return ()=>{node.close();previous?.focus?.();};},[]);
  return <dialog ref={ref} className={`ow-dialog ${className}`} aria-label={title} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <header><h2>{title}</h2><button type="button" className="ow-icon-button" aria-label="Close dialog" onClick={onClose}><Icon name="close"/></button></header>{children}
  </dialog>;
}

function FilterDialog({rows,board,filters,saved,onSave,onApply,onClose}) {
  const [draft,setDraft]=useState(filters), [name,setName]=useState(''), [saving,setSaving]=useState(false), [selected,setSelected]=useState('New Filter');
  const source=rows.filter(row=>row.board===board);
  const peopleBoard=['Personal Board','Course','Certification'].includes(board);
  const ticketBoard=board.includes('Ticket');
  const field=(key,label,options)=> <label key={key}>{label}<select value={draft[key]||''} onChange={e=>setDraft({...draft,[key]:e.target.value})}><option value="">All</option>{(options||[...new Set(source.map(row=>row[key]).filter(Boolean))]).map(value=><option key={value}>{value}</option>)}</select></label>;
  return <Dialog title="Filter Settings" onClose={onClose} className="ow-filter-dialog">
    <div className="ow-filter-layout"><aside><h3>Saved Filters</h3><button className={selected==='New Filter'?'is-active':''} onClick={()=>{setDraft({...EMPTY_FILTER});setSelected('New Filter');}}>New Filter</button>{saved.map(item=><button key={item.name} className={selected===item.name?'is-active':''} onClick={()=>{setDraft(item.filters);setSelected(item.name);}}>{item.name}</button>)}</aside>
      <form onSubmit={e=>{e.preventDefault();onApply(draft,selected);}}>
        <h3>{ticketBoard?'Ticket Board':board==='Process'?'Process':peopleBoard?'People':'Team'} Filter</h3>
        <div className="ow-fields">
          {ticketBoard?<>{board==='Organization Ticket Board'&&field('tag','Tag')}{field('ticketBoard',`${board} Name`)}</>:board==='Process'?<>{field('category','Category')}{field('tag','Tag')}{field('process','Process')}</>:<>{field('unit','Unit')}{field('team','Team')}{peopleBoard&&<>{field('role','Role')}{field('position','Positions')}{field('person','People')}</>}{field('tag','Tag')}</>}
        </div>
        {board==='Certification'&&<><h3>Certificate Filter</h3><div className="ow-fields">{field('certificate','Certificate Name')}</div></>}
        <h3>{['Course','Certification'].includes(board)?'Course':'Mission'} Filter</h3><div className="ow-fields">
          {['Course','Certification'].includes(board)?<>{field('category','Course Category')}{field('missionTag','Course Tag')}{field('course','Course Name')}</>:<>{field('category','Category')}{field('missionTag','Tag')}{!ticketBoard&&field('type',board==='Process'?'Activity Type':'Type',TYPES)}{field('status','Activity',['Open','Claimed','Closed','Canceled','Not Resolved'])}<label className="ow-field-wide">Mission<input value={draft.name} placeholder="All" onChange={e=>setDraft({...draft,name:e.target.value})} list="ow-mission-names"/><datalist id="ow-mission-names">{[...new Set(source.map(row=>row.name))].map(value=><option key={value}>{value}</option>)}</datalist></label></>}
          {board==='Process'&&<>{field('unit','Destination Unit')}{field('team','Destination Team')}{field('person','Destination Person')}{field('ticketBoard','Destination Ticket Board')}</>}
        </div>
        {saving&&<label className="ow-save-filter">Filter name<input autoFocus required value={name} onChange={e=>setName(e.target.value)} placeholder="Enter a filter name"/></label>}
        <footer><button type="button" className="ow-secondary" onClick={()=>{if(!saving){setSaving(true);return;}if(!name.trim())return;onSave({name:name.trim(),filters:draft});setSelected(name.trim());setSaving(false);}}>Save as New</button><button type="button" className="ow-text-button" onClick={()=>{setDraft({...EMPTY_FILTER});setSelected('New Filter');}}>Reset</button><button className="ow-primary" type="submit">Generate</button></footer>
      </form></div>
  </Dialog>;
}

function ScheduleEditor({row,onSave,onClose}) {
  const [draft,setDraft]=useState({...row.schedule,days:[...row.schedule.days]});
  return <Dialog title="Edit Schedule" onClose={onClose}><form className="ow-form" onSubmit={e=>{e.preventDefault();onSave(draft);}}>
    <div className="ow-fields"><label>Start Date<input type="date" required value={draft.start} onInput={e=>setDraft({...draft,start:e.target.value})}/></label><label>Start Time<input type="time" required value={draft.time} onInput={e=>setDraft({...draft,time:e.target.value})}/></label><label>Repeat<select value={draft.repeat} onChange={e=>setDraft({...draft,repeat:e.target.value})}>{['Once','Daily','Weekly','Monthly On Days'].map(value=><option key={value}>{value}</option>)}</select></label><label>Every<input type="number" min="1" max="365" required disabled={draft.repeat==='Once'} value={draft.every} onChange={e=>setDraft({...draft,every:Number(e.target.value)})}/></label><label className="ow-field-wide">End Date<input type="date" min={draft.start} value={draft.end} onInput={e=>setDraft({...draft,end:e.target.value})}/><small>Leave blank to repeat indefinitely.</small></label></div>
    {draft.repeat==='Monthly On Days'&&<fieldset><legend>Repeat days</legend><div className="ow-day-grid">{Array.from({length:31},(_,i)=>i+1).map(day=><button type="button" key={day} aria-pressed={draft.days.includes(day)} onClick={()=>setDraft({...draft,days:draft.days.includes(day)?draft.days.filter(d=>d!==day):[...draft.days,day]})}>{day}</button>)}</div></fieldset>}
    <label className="ow-check"><input type="checkbox" checked={draft.enabled} onChange={e=>setDraft({...draft,enabled:e.target.checked})}/>Schedule enabled</label>
    <footer><button className="ow-secondary" type="button" onClick={onClose}>Cancel</button><button className="ow-primary" disabled={draft.repeat==='Monthly On Days'&&!draft.days.length}>Save Schedule</button></footer>
  </form></Dialog>;
}

function AssignmentDialog({rows,onSave,onClose}) {
  const [person,setPerson]=useState('James Miller');
  return <Dialog title="Assign to Personal Board" onClose={onClose}><form className="ow-form" onSubmit={e=>{e.preventDefault();onSave(person);}}><label>Person<select value={person} onChange={e=>setPerson(e.target.value)}>{[...new Set(['James Miller',...rows.map(row=>row.person).filter(Boolean)])].map(name=><option key={name}>{name}</option>)}</select></label><footer><button type="button" className="ow-secondary" onClick={onClose}>Cancel</button><button className="ow-primary">Assign</button></footer></form></Dialog>;
}

export default function OverviewWorkspace() {
  const [rows,setRows]=useState([]), [ready,setReady]=useState(false), [now,setNow]=useState(0);
  const [board,setBoard]=useState('Personal Board'), [view,setView]=useState('Running');
  const [filters,setFilters]=useState({...EMPTY_FILTER}), [filterName,setFilterName]=useState('New Filter'), [saved,setSaved]=useState([]);
  const [groupBy,setGroupBy]=useState('Person'), [collapsed,setCollapsed]=useState([]), [hidden,setHidden]=useState([]), [widths,setWidths]=useState({});
  const [sort,setSort]=useState(null), [boosted,setBoosted]=useState(false), [idle,setIdle]=useState(false), [search,setSearch]=useState('');
  const [selected,setSelected]=useState([]), [detail,setDetail]=useState(null), [detailTab,setDetailTab]=useState('Schedule');
  const [menu,setMenu]=useState(null), [modal,setModal]=useState(null), [message,setMessage]=useState(''), [undo,setUndo]=useState(null);
  const [from,setFrom]=useState(''), [to,setTo]=useState(''), [span,setSpan]=useState(1), [hours,setHours]=useState({start:0,end:24});
  const menuRef=useRef(null), triggerRef=useRef(null), drawerRef=useRef(null), tableRef=useRef(null);
  const [draftContent,setDraftContent]=useState(null);

  useEffect(()=>{
    const time=Date.now();setNow(time);setFrom(localDate(time));setTo(localDate(time));
    let restored=null;try{restored=JSON.parse(localStorage.getItem(STORAGE));}catch{}
    setRows(Array.isArray(restored?.rows)&&restored.rows.every(row=>row.id&&row.schedule)?restored.rows:seedMissions(time));
    if(Array.isArray(restored?.saved))setSaved(restored.saved);
    if(Array.isArray(restored?.hidden))setHidden(restored.hidden);
    if(restored?.widths&&typeof restored.widths==='object')setWidths(restored.widths);
    const readLocation=()=>{const query=new URLSearchParams(location.search);const b=BOARDS.find(b=>b===query.get('board'))||'Personal Board';setBoard(b);setView(viewsForBoard(b).find(v=>v===query.get('view'))||(b==='Certification'?'Overview':'Running'));setGroupBy(defaultGroup(b));setSelected([]);setDetail(null);setFilters({...EMPTY_FILTER});setFilterName('New Filter');setSearch('');setBoosted(false);setCollapsed([]);setSort(null);setMenu(null);};
    readLocation();window.addEventListener('popstate',readLocation);setReady(true);
    const timer=setInterval(()=>setNow(Date.now()),1000);
    return ()=>{clearInterval(timer);window.removeEventListener('popstate',readLocation);};
  },[]);
  useEffect(()=>{if(!ready)return;try{localStorage.setItem(STORAGE,JSON.stringify({rows,saved,hidden,widths}));}catch{setMessage('Browser storage is unavailable. Changes will last until this page closes.');}},[rows,saved,hidden,widths,ready]);
  useEffect(()=>{if(!message)return;const timer=setTimeout(()=>setMessage(''),6000);return()=>clearTimeout(timer);},[message]);
  useEffect(()=>{
    if(!menu)return;
    menuRef.current?.querySelector('button,input')?.focus();
    const close=e=>{if(!menuRef.current?.contains(e.target)&&!triggerRef.current?.contains(e.target))setMenu(null);};
    const escape=e=>{if(e.key==='Escape'){setMenu(null);triggerRef.current?.focus();}};
    document.addEventListener('pointerdown',close);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape);};
  },[menu]);
  useEffect(()=>{if(detail)drawerRef.current?.focus();},[detail]);
  useEffect(()=>{if(detail){const close=e=>{if(e.key==='Escape'&&!modal&&!menu){setDetail(null);triggerRef.current?.focus();}};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close);}},[detail,modal,menu]);

  const navigate=(nextBoard,nextView)=>{
    if(!viewsForBoard(nextBoard).includes(nextView))nextView=nextBoard==='Certification'?'Overview':'Running';
    setBoard(nextBoard);setView(nextView);setMenu(null);setDetail(null);setSelected([]);setCollapsed([]);setSort(null);
    if(nextBoard!==board){setGroupBy(defaultGroup(nextBoard));setFilters({...EMPTY_FILTER});setFilterName('New Filter');setBoosted(false);setIdle(false);setSearch('');}
    const query=new URLSearchParams({board:nextBoard,view:nextView});history.pushState(null,'',`/running?${query}`);
  };
  const openMenu=(kind,e,extra={})=>{triggerRef.current=e.currentTarget;const rect=e.currentTarget.getBoundingClientRect();setMenu(menu?.kind===kind&&menu?.id===extra.id?null:{kind,left:Math.min(rect.left,window.innerWidth-270),top:Math.min(rect.bottom+5,window.innerHeight-350),...extra});};
  const notify=text=>setMessage(text);
  const action=(ids,kind,payload={})=>{setUndo(rows);setRows(previous=>changeMissions(previous,ids,kind,Date.now(),payload));setMenu(null);setModal(null);notify(`${ids.length} mission${ids.length===1?'':'s'} updated`);};
  const openDetail=(row,e)=>{if(e)triggerRef.current=e.currentTarget;setDetail(row.id);setDetailTab('Schedule');setDraftContent(null);setMenu(null);};
  const mission=rows.find(row=>row.id===detail);
  const scheduled=['Scheduled','Timeline','Deployed'].includes(view);
  const boardViews=viewsForBoard(board);
  const specialCancel=board==='Process'?'Cancel Process':board==='Course'?'Cancel Course':null;
  const baseColumns=columnsForBoard(board,view).map(col=>view==='History'&&col.key==='triggered'?{...col,label:'Opened At'}:view==='History'&&col.key==='by'?{...col,label:'Closed By'}:col);
  const visibleColumns=baseColumns.filter(col=>!hidden.includes(col.key));
  const getValue=(row,key)=>{
    if(['open','claimed','duration'].includes(key))return counters(row,now)[key];
    if(key==='scheduleState')return row.schedule.enabled?'Scheduled':'Idle';
    if(key==='start'||key==='end')return row.schedule[key];
    if(['today','week','month','quarter','year'].includes(key))return occurrences(row,localDate(now),{today:1,week:7,month:30,quarter:90,year:365}[key]).length;
    if(key==='next')return occurrences(row,localDate(now),366).find(date=>date.getTime()>=now)?.toISOString()||'';
    return row[key]||'';
  };
  const displayValue=(row,key)=>['open','claimed','duration'].includes(key)?formatTimer(getValue(row,key)):['triggered','closed','next'].includes(key)?dateLabel(getValue(row,key)):['start','end'].includes(key)?dateOnly(getValue(row,key))||(key==='end'?'Indefinitely':''):getValue(row,key);
  const filtered=useMemo(()=>filterMissions(rows,{board,view,filters,boosted:!scheduled&&boosted,idle,search,from,to}),[rows,board,view,filters,boosted,scheduled,idle,search,from,to]);
  const sorted=[...filtered].sort((a,b)=>{if(!sort)return 0;const x=getValue(a,sort.key),y=getValue(b,sort.key);return (typeof x==='number'?x-y:String(x).localeCompare(String(y),undefined,{numeric:true}))*sort.direction;});
  const groups=groupMissions(sorted,groupBy,board);
  const groupKeys=groups.flatMap(group=>[group.key,...(group.children||[]).map(child=>child.key)]);
  const currentSelected=selected.filter(id=>filtered.some(row=>row.id===id));
  const targets=menu?.id?[menu.id]:currentSelected;
  const selectRow=(id,add)=>setSelected(prev=>add?(prev.includes(id)?prev.filter(item=>item!==id):[...prev,id]):[id]);
  const toggleGroup=key=>setCollapsed(prev=>prev.includes(key)?prev.filter(k=>k!==key):[...prev,key]);
  const expandAll=expand=>{setCollapsed(expand?[]:groupKeys);setMenu(null);};
  const changeSort=(key,direction)=>{setSort({key,direction});setMenu(null);};
  const exportRows=()=>{const data=currentSelected.length?filtered.filter(row=>currentSelected.includes(row.id)):sorted;const cols=view==='Timeline'?baseColumns:visibleColumns;const url=URL.createObjectURL(new Blob(['\ufeff',csvText(data,cols,displayValue)],{type:'text/csv;charset=utf-8;'}));const link=document.createElement('a');link.href=url;link.download=`${board.replaceAll(' ','-')}-${view}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify(`Exported ${data.length} missions`);};
  const resize=(e,key,width)=>{e.preventDefault();e.stopPropagation();const x=e.clientX;const handle=e.currentTarget;handle.setPointerCapture(e.pointerId);const move=event=>setWidths(prev=>({...prev,[key]:Math.max(key==='name'?250:90,width+event.clientX-x)}));const end=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',end);handle.removeEventListener('pointercancel',end);};handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);};
  const shiftDate=direction=>{const date=new Date(`${from}T12:00:00`);date.setDate(date.getDate()+direction*span);setFrom(localDate(date));};
  const timeSlots=Array.from({length:span===1?hours.end-hours.start:span},(_,i)=>{const date=new Date(`${from||'2026-09-21'}T00:00:00`);if(span===1)date.setHours(i+hours.start);else date.setDate(date.getDate()+i);return date;});
  const timelineEvents=useMemo(()=>new Map(filtered.map(row=>[row.id,occurrences(row,from,span)])),[filtered,from,span]);
  const tableColumns=view==='Timeline'?[{key:'name',label:'Name',width:500},...(board==='Personal Board'?[{key:'position',label:'Positions',width:200}]:[]),...timeSlots.map((date,i)=>({key:`slot-${i}`,label:span===1?date.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):date.toLocaleDateString('en-US',{month:'short',day:'numeric'}),width:span===1?68:100}))]:visibleColumns;
  const totalWidth=tableColumns.reduce((sum,col)=>sum+(widths[col.key]||col.width),0);

  const nameCell=(row,index)=> <div className="ow-name-content"><span className="ow-tree"/><span className="ow-number">{index+1}.</span><button className="ow-mission-name" title={row.name} onClick={e=>{e.stopPropagation();openDetail(row,e);}}>{row.name}</button>{row.boosted&&<span className="ow-flag" title="Boosted">⚑</span>}<button className="ow-dots" aria-label={`Actions for ${row.name}`} onClick={e=>{e.stopPropagation();openMenu('row',e,{id:row.id});}}>⋮</button></div>;
  const renderCell=(row,col,index)=>{
    if(col.key==='name')return nameCell(row,index);
    if(col.key.startsWith('slot-')){const slot=timeSlots[Number(col.key.slice(5))];const count=(timelineEvents.get(row.id)||[]).filter(date=>span===1?date.getHours()===slot.getHours():localDate(date)===localDate(slot)).length;return count?<button className="ow-event" aria-label={`${row.name}: ${count} runs at ${col.label}`} onClick={e=>openDetail(row,e)}>{count}</button>:<span className="ow-zero">0</span>;}
    if(['open','claimed','duration'].includes(col.key)){if(col.key==='claimed'&&!row.claimed&&row.state!=='Claimed')return null;const frozen=['Closed','Canceled'].includes(row.state);return <span className={`ow-timer ${col.key==='duration'?(frozen?'is-gray':'is-outline'):getValue(row,col.key)>1800?'is-red':getValue(row,col.key)>600?'is-orange':'is-green'}`}>{displayValue(row,col.key)}</span>;}
    if(col.key==='state')return <span className={`ow-state state-${row.state.toLowerCase()}`}><i/>{row.state}</span>;
    if(col.key==='position')return row.position?<span className="ow-position">{row.position}</span>:null;
    return displayValue(row,col.key);
  };
  const renderRows=items=>items.map((row,index)=><tr key={row.id} className={`ow-data-row${row.boosted?' is-boosted':''}${selected.includes(row.id)?' is-selected':''}${row.id===detail?' is-open':''}`} tabIndex={0} aria-selected={selected.includes(row.id)} onClick={e=>selectRow(row.id,e.ctrlKey||e.metaKey||e.shiftKey)} onDoubleClick={e=>openDetail(row,e)} onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key===' '){e.preventDefault();selectRow(row.id,true);}if(e.key==='Enter')openDetail(row,e);}} onContextMenu={e=>{e.preventDefault();openMenu('row',e,{id:row.id});}}>{tableColumns.map(col=><td key={col.key} className={col.key==='name'?'ow-name-cell':['open','claimed','duration'].includes(col.key)?'ow-timer-cell':''}>{renderCell(row,col,index)}</td>)}</tr>);
  const groupRow=(group,index,nested=false)=><tr className={`ow-group-row${nested?' is-nested':''}`} key={group.key}>{tableColumns.map(col=><td key={col.key} className={col.key==='name'?'ow-name-cell':''}>{col.key==='name'?<button className="ow-group-button" aria-expanded={!collapsed.includes(group.key)} onClick={()=>toggleGroup(group.key)}><span className={`ow-collapse-icon${collapsed.includes(group.key)?' is-collapsed':''}`}><Icon name="chevron"/></span><span className="ow-number">{index+1}.</span><span className="ow-group-label" title={group.label}>{group.label}</span><span className="ow-count">{group.children?.length||group.rows.length}</span></button>:['open','claimed','closed'].includes(col.key)?<span className="ow-total">{group.rows.filter(row=>row.state===({open:'Open',claimed:'Claimed',closed:'Closed'}[col.key])).length}</span>:null}</td>)}</tr>;

  return <main className="ow-workspace" aria-label="Taskmaverick Overview">
    <header className="ow-topbar"><a href="/" className="ow-logo" aria-label="Taskmaverick home"><img src="/logo.svg" alt="taskmaverick"/></a><nav aria-label="Main navigation">{NAV.map(name=>name==='Overview'?<button key={name} className="is-active" aria-current="page" onClick={()=>{setDetail(null);setMenu(null);}}>{name}</button>:<button key={name} onClick={e=>openMenu('navigation',e,{name})}>{name}</button>)}</nav><div className="ow-account"><button className="ow-icon-button" aria-label="Notifications" onClick={e=>openMenu('notifications',e)}><Icon name="bell"/></button><button className="ow-icon-button" aria-label="Settings" onClick={e=>openMenu('settings',e)}><Icon name="settings"/></button><button className="ow-avatar" aria-label="User menu" onClick={e=>openMenu('user',e)}>JM</button></div></header>
    <div className="ow-subnav"><nav aria-label="Overview boards">{BOARDS.map(name=><button key={name} className={board===name?'is-active':''} aria-pressed={board===name} onClick={()=>navigate(name,view)}>{name}</button>)}</nav><nav className="ow-view-nav" aria-label="Overview views">{boardViews.map(name=><button key={name} className={view===name?'is-active':''} aria-pressed={view===name} onClick={()=>navigate(board,name)}>{name}</button>)}</nav></div>
    <div className="ow-toolbar">
      {view!=='History'&&<button className="ow-tool" onClick={e=>specialCancel?setModal({kind:'cancel',ids:currentSelected}):view==='Scheduled'?setModal({kind:'assign',ids:currentSelected}):openMenu('bulk',e)} disabled={(view==='Scheduled'||!!specialCancel)&&!currentSelected.length}><Icon name="bulk"/>{specialCancel||(view==='Scheduled'?'Assign to Personal Board':'Bulk Action')}<Icon name="chevron"/>{currentSelected.length>0&&<span className="ow-selection-count">{currentSelected.length}</span>}</button>}
      <button className="ow-tool" onClick={()=>setModal({kind:'filter'})}><Icon name="filter"/>Filter: {filterName}{Object.values(filters).some(Boolean)&&<span className="ow-filter-dot"/>}</button>
      <button className="ow-tool" onClick={e=>openMenu('group',e)}><Icon name="group"/>Group by: {groupBy}</button>
      <button className="ow-tool" onClick={e=>openMenu('expand',e)}><Icon name="expand"/>Expand/Collapse</button>
      {view!=='Timeline'&&<button className="ow-tool" onClick={e=>openMenu('columns',e)}><Icon name="eye"/>Hide/Show Column</button>}
      <button className="ow-tool" disabled={!filtered.length} onClick={exportRows}><Icon name="export"/>Export</button>
      {view!=='History'&&!specialCancel&&<label className="ow-check"><input type="checkbox" checked={scheduled||board==='Certification'?idle:boosted} onChange={e=>scheduled||board==='Certification'?setIdle(e.target.checked):setBoosted(e.target.checked)}/>{board==='Certification'?'Show All Activities':scheduled?'Idle':'Only Boosted'}</label>}
      {(view==='History'||board==='Certification')&&<div className="ow-date-range"><input aria-label="History start date" type="date" value={from} max={to} onInput={e=>setFrom(e.target.value)}/><span>–</span><input aria-label="History end date" type="date" value={to} min={from} onInput={e=>setTo(e.target.value)}/></div>}
      {view==='Timeline'?<div className="ow-timeline-tools"><button className="ow-secondary" onClick={e=>openMenu('hours',e)}><Icon name="clock"/>{hours.start%12||12} {hours.start<12?'AM':'PM'} – {hours.end%12||12} {hours.end<12||hours.end===24?'AM':'PM'}</button>{[1,7,31].map(days=><button key={days} className={span===days?'is-active':''} onClick={()=>setSpan(days)}>{days}D</button>)}<button aria-label="Previous period" onClick={()=>shiftDate(-1)}>‹</button><input type="date" aria-label="Timeline start date" value={from} onInput={e=>e.target.value&&setFrom(e.target.value)}/><button aria-label="Next period" onClick={()=>shiftDate(1)}>›</button></div>:<input className="ow-search" aria-label="Search missions" placeholder="Search missions" value={search} onChange={e=>setSearch(e.target.value)}/>}
    </div>
    <div className="ow-table-scroll" ref={tableRef} onScroll={()=>menu&&setMenu(null)}><table className="ow-table" style={{width:totalWidth}} aria-label={`${board} ${view}`}><colgroup>{tableColumns.map(col=><col key={col.key} style={{width:widths[col.key]||col.width}}/>)}</colgroup><thead><tr>{tableColumns.map(col=><th key={col.key} className={col.key==='name'?'ow-name-cell':''} aria-sort={sort?.key===col.key?(sort.direction===1?'ascending':'descending'):'none'}><div><button onClick={()=>changeSort(col.key,sort?.key===col.key?-sort.direction:1)}>{col.label}{sort?.key===col.key&&<span className="ow-sort">{sort.direction===1?'↑':'↓'}</span>}</button>{!col.key.startsWith('slot-')&&<button className="ow-dots" aria-label={`${col.label} column menu`} onClick={e=>openMenu('header',e,{column:col.key})}>⋮</button>}</div><span role="separator" aria-label={`Resize ${col.label}`} aria-orientation="vertical" tabIndex={0} className="ow-resizer" onPointerDown={e=>resize(e,col.key,widths[col.key]||col.width)} onKeyDown={e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();setWidths({...widths,[col.key]:Math.max(90,(widths[col.key]||col.width)+(e.key==='ArrowRight'?20:-20))});}}}/></th>)}</tr></thead><tbody>
      {groups.map((group,index)=><Fragment key={group.key}>{group.label&&groupRow(group,index)}{!collapsed.includes(group.key)&&(group.children?.length?group.children.map((child,i)=><Fragment key={child.key}>{groupRow(child,i,true)}{!collapsed.includes(child.key)&&renderRows(child.rows)}</Fragment>):renderRows(group.rows))}</Fragment>)}
    </tbody></table>{!filtered.length&&<div className="ow-empty"><Icon name="filter"/><p>{ready?'No Results Match The Current Filter':'Loading Overview…'}</p>{ready&&<button className="ow-secondary" onClick={()=>{setFilters({...EMPTY_FILTER});setSearch('');setBoosted(false);setFilterName('New Filter');setModal({kind:'filter'});}}>Apply a Filter</button>}</div>}</div>

    {menu&&<div className="ow-menu" ref={menuRef} style={{left:Math.max(8,menu.left),top:Math.max(8,menu.top)}} role="region" aria-label="Board options">
      {menu.kind==='group'&&<><strong>Group by</strong>{[...new Set([defaultGroup(board),'Person','Unit','Team','Mission','Status','Type','None'])].map(value=><button key={value} className={groupBy===value?'is-active':''} onClick={()=>{setGroupBy(value);setCollapsed([]);setMenu(null);}}>{value}{groupBy===value?' ✓':''}</button>)}</>}
      {['group','expand'].includes(menu.kind)&&<><hr/><button onClick={()=>expandAll(true)}>Expand All</button><button onClick={()=>expandAll(false)}>Collapse All</button></>}
      {menu.kind==='columns'&&<><strong>Hide/Show Column</strong>{baseColumns.filter(col=>col.key!=='name').map(col=><label className="ow-check" key={col.key}><input type="checkbox" checked={!hidden.includes(col.key)} onChange={()=>setHidden(prev=>prev.includes(col.key)?prev.filter(key=>key!==col.key):[...prev,col.key])}/>{col.label}</label>)}<hr/><button onClick={()=>{setHidden([]);setWidths({});}}>Restore all columns</button></>}
      {menu.kind==='header'&&<><button onClick={()=>changeSort(menu.column,1)}>Sort ascending</button><button onClick={()=>changeSort(menu.column,-1)}>Sort descending</button><button onClick={()=>{setSort(null);setMenu(null);}}>Clear sorting</button>{menu.column!=='name'&&<button onClick={()=>{setHidden([...hidden,menu.column]);setMenu(null);}}>Hide column</button>}<button onClick={()=>{setWidths(prev=>({...prev,[menu.column]:baseColumns.find(col=>col.key===menu.column)?.width||140}));setMenu(null);}}>Reset column width</button></>}
      {menu.kind==='bulk'&&<><button onClick={()=>{setSelected(filtered.map(row=>row.id));setMenu(null);}}>Select all ({filtered.length})</button><button disabled={!currentSelected.length} onClick={()=>{setSelected([]);setMenu(null);}}>Clear selection</button><hr/><button disabled={!targets.some(id=>rows.find(row=>row.id===id)?.state==='Claimed')} onClick={()=>action(targets,'bounce')}>Bounce Back</button><button disabled={!targets.length} onClick={()=>{setModal({kind:'assign',ids:targets});setMenu(null);}}>Assign to Personal Board</button><button disabled={!targets.length} onClick={()=>{setModal({kind:'cancel',ids:targets});setMenu(null);}}>Cancel</button></>}
      {menu.kind==='row'&&<><button onClick={()=>openDetail(rows.find(row=>row.id===menu.id))}>Open</button><button onClick={()=>action(targets,'boost')}>{rows.find(row=>row.id===menu.id)?.boosted?'Unboost':'Boost'}</button><button onClick={()=>{setModal({kind:'cancel',ids:targets});setMenu(null);}}>Cancel</button></>}
      {menu.kind==='detail'&&<><button onClick={()=>{setModal({kind:'stop',ids:[detail]});setMenu(null);}}>Clear Schedule &amp; Stop Running</button><button onClick={()=>{setModal({kind:'cancel',ids:[detail]});setMenu(null);}}>Cancel</button></>}
      {menu.kind==='hours'&&<><strong>Visible hours</strong><label>From<select value={hours.start} onChange={e=>setHours({...hours,start:Number(e.target.value)})}>{Array.from({length:hours.end},(_,i)=><option key={i} value={i}>{String(i).padStart(2,'0')}:00</option>)}</select></label><label>To<select value={hours.end} onChange={e=>setHours({...hours,end:Number(e.target.value)})}>{Array.from({length:24-hours.start},(_,i)=>i+hours.start+1).map(i=><option key={i} value={i}>{String(i).padStart(2,'0')}:00</option>)}</select></label><button onClick={()=>setMenu(null)}>Apply</button></>}
      {menu.kind==='navigation'&&<><strong>{menu.name}</strong><p>This replica covers Overview. Browse its boards and views using the tabs above.</p><a href="/missions">Open local mission preview ↗</a></>}
      {menu.kind==='notifications'&&<><strong>Notifications</strong><p>No new notifications.</p></>}
      {menu.kind==='settings'&&<><strong>Overview settings</strong><button onClick={()=>{setHidden([]);setWidths({});setSort(null);setMenu(null);notify('Table layout restored');}}>Reset table layout</button><a href="/running?preview=1">Animation preview ↗</a><button onClick={()=>{setModal({kind:'reset'});setMenu(null);}}>Reset local demo data</button></>}
      {menu.kind==='user'&&<><strong>James Miller</strong><p>Local preview · Changes are saved in this browser.</p><button onClick={()=>{setMenu(null);navigate('Personal Board','Running');}}>Personal Board</button></>}
    </div>}

    {mission&&<aside className="ow-drawer" role="region" aria-label="Mission details" ref={drawerRef} tabIndex={-1}><header><div><h2>{mission.name}</h2><span className="ow-position">{mission.person||mission.team}</span></div><button className="ow-icon-button" aria-label="Close mission details" onClick={()=>{setDetail(null);triggerRef.current?.focus();}}><Icon name="close"/></button></header><div className="ow-drawer-actions"><button className="ow-primary" onClick={e=>openMenu('detail',e)}>Actions <Icon name="chevron"/></button><span className={`ow-state state-${mission.state.toLowerCase()}`}><i/>{mission.state}</span></div><div role="tablist" className="ow-detail-tabs">{['Schedule','Content'].map(tab=><button key={tab} role="tab" aria-selected={detailTab===tab} className={detailTab===tab?'is-active':''} onClick={()=>{setDetailTab(tab);setDraftContent(null);}}>{tab}</button>)}</div>
      {detailTab==='Schedule'?<div className="ow-drawer-body" role="tabpanel" aria-label="Schedule"><button className="ow-edit-schedule" onClick={()=>setModal({kind:'schedule'})}>♢ Edit Schedule</button><section className="ow-card"><h3><Icon name="settings"/>Schedule</h3><dl><dt>Start Date:</dt><dd>{dateOnly(mission.schedule.start)}</dd><dt>Repeat:</dt><dd>{mission.schedule.repeat}</dd><dt>Every:</dt><dd>{mission.schedule.every} {mission.schedule.repeat==='Daily'?'days':mission.schedule.repeat==='Weekly'?'weeks':'months'}</dd><dt>Frequency:</dt><dd>Once</dd><dt>Start Time:</dt><dd>{mission.schedule.time}</dd><dt>End:</dt><dd>{dateOnly(mission.schedule.end)||'Indefinitely'}</dd><dt>Status:</dt><dd>{mission.schedule.enabled?'Scheduled':'Idle'}</dd></dl></section>{mission.schedule.repeat==='Monthly On Days'&&<section className="ow-card"><h3><Icon name="calendar"/>Repeat days</h3><div className="ow-day-grid">{Array.from({length:31},(_,i)=>i+1).map(day=><span key={day} className={mission.schedule.days.includes(day)?'is-active':''}>{day}</span>)}</div></section>}</div>:<div className="ow-drawer-body" role="tabpanel" aria-label="Content">
        <section className="ow-card"><h3>Mission content <span className="ow-position">{mission.type}</span></h3>{draftContent?<form className="ow-form" onSubmit={e=>{e.preventDefault();action([mission.id],'content',draftContent);setDraftContent(null);}}><label>Name<input required value={draftContent.name} onChange={e=>setDraftContent({...draftContent,name:e.target.value})}/></label><label>Description<textarea value={draftContent.description} onChange={e=>setDraftContent({...draftContent,description:e.target.value})}/></label><footer><button type="button" className="ow-secondary" onClick={()=>setDraftContent(null)}>Cancel</button><button className="ow-primary">Save Content</button></footer></form>:<><p>{mission.description}</p><button className="ow-text-button" onClick={()=>setDraftContent({name:mission.name,description:mission.description})}>Edit Content</button></>}
          {mission.checks.map((check,i)=><label className="ow-check ow-checklist" key={i}><input type="checkbox" disabled={['Closed','Canceled'].includes(mission.state)} checked={check.done} onChange={()=>action([mission.id],'content',{checks:mission.checks.map((c,index)=>index===i?{...c,done:!c.done}:c)})}/>{check.label}</label>)}
        </section><section className="ow-card"><h3>Activity</h3><dl><dt>Triggered at</dt><dd>{dateLabel(mission.triggered)}</dd><dt>Claimed by</dt><dd>{mission.by||'—'}</dd><dt>Open</dt><dd>{formatTimer(counters(mission,now).open)}</dd><dt>Claimed</dt><dd>{formatTimer(counters(mission,now).claimed)}</dd><dt>Duration</dt><dd>{formatTimer(counters(mission,now).duration)}</dd></dl></section>
        <section className="ow-card"><label>Notes<textarea value={mission.notes} onChange={e=>setRows(previous=>previous.map(row=>row.id===mission.id?{...row,notes:e.target.value}:row))} placeholder="Add a note…"/></label></section>
        {['Open','Claimed'].includes(mission.state)&&<button className="ow-primary ow-execute" disabled={mission.state==='Claimed'&&mission.checks.some(check=>!check.done)} onClick={()=>action([mission.id],mission.state==='Open'?'claim':'close')}>{mission.state==='Open'?'Claim':'Close Mission'}</button>}
      </div>}
    </aside>}

    {modal?.kind==='filter'&&<FilterDialog rows={rows} board={board} filters={filters} saved={saved.filter(item=>!item.board||item.board===board)} onSave={item=>{setSaved(previous=>[...previous.filter(filter=>filter.name!==item.name||filter.board!==board),{...item,board}]);notify('Filter saved');}} onApply={(draft,name)=>{setFilters(draft);setFilterName(name);setSelected([]);setCollapsed([]);setModal(null);}} onClose={()=>setModal(null)}/>}
    {modal?.kind==='schedule'&&mission&&<ScheduleEditor row={mission} onSave={draft=>action([mission.id],'schedule',draft)} onClose={()=>setModal(null)}/>}
    {modal?.kind==='assign'&&<AssignmentDialog rows={rows} onSave={person=>action(modal.ids,'assign',{person})} onClose={()=>setModal(null)}/>}
    {['cancel','stop','reset'].includes(modal?.kind)&&<Dialog title={modal.kind==='reset'?'Reset local demo data':modal.kind==='stop'?'Clear Schedule & Stop Running':'Cancel missions'} onClose={()=>setModal(null)}><div className="ow-form"><p>{modal.kind==='reset'?'Restore the sample missions and clear saved filters and table preferences?':`Apply this action to ${modal.ids.length} selected mission${modal.ids.length===1?'':'s'}?`}</p><footer><button className="ow-secondary" onClick={()=>setModal(null)}>Keep as is</button><button className="ow-primary" onClick={()=>{if(modal.kind==='reset'){setRows(seedMissions(Date.now()));setSaved([]);setHidden([]);setWidths({});setFilters({...EMPTY_FILTER});setFilterName('New Filter');setSearch('');setBoosted(false);setSelected([]);setDetail(null);setUndo(null);setModal(null);notify('Local demo reset');}else action(modal.ids,modal.kind);}}>Confirm</button></footer></div></Dialog>}
    {message&&<div className="ow-toast" role="status">{message}{undo&&<button onClick={()=>{setRows(undo);setUndo(null);setMessage('Change undone');}}>Undo</button>}<button aria-label="Dismiss notification" onClick={()=>setMessage('')}>×</button></div>}
  </main>;
}
