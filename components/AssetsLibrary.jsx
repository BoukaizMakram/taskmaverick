'use client';
// Assets Library (/assets-library): every animation we have as a card. Hover a
// card to watch it; click it to open it with its rating and notes. Search finds
// clips by what they show ("alert", "mission details", "timer", "performer"…).
// The clips are listed in lib/assetsLibrary.mjs; ratings and notes save to
// content/assets-library.json (through /api/assets-library, in local
// development) and to this browser. The notes in the file are pushed with the
// code, so a deployed copy shows them too (read-only there: edits stay in the
// browser).
import {useEffect,useMemo,useRef,useState} from 'react';
import Navbar from './Navbar';
import {searchAssets} from '@/lib/assetsSearch.mjs';
import {mergeReviews} from '@/lib/assetsLibrary.mjs';
import {SUGGESTIONS} from '@/lib/assetElements.mjs';
import './AssetsLibrary.css';

const LOCAL='assets-library';
const STATUS=[['all','All'],['unrated','Not rated'],['rated','Rated'],['notes','Has notes']];
const clock=s=>`${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`;
const readLocal=key=>{try{return localStorage.getItem(key);}catch{return null;}};
const writeLocal=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
const embedUrl=(asset,mode)=>`${asset.src}?clip=${asset.clip}&mode=${mode}${mode==='still'?`&still=${asset.poster}`:''}${mode==='player'?'&autoplay=1':''}`;

const Icon={
 search:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="9" cy="9" r="5.8"/><path d="m13.4 13.4 3.6 3.6"/></svg>,
 close:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg>,
 left:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 4-6 6 6 6"/></svg>,
 right:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 4 6 6-6 6"/></svg>,
 play:<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6.5 4.4v11.2a.6.6 0 0 0 .9.5l8.6-5.6a.6.6 0 0 0 0-1L7.4 3.9a.6.6 0 0 0-.9.5Z"/></svg>,
 out:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 5H5.5A1.5 1.5 0 0 0 4 6.5v8A1.5 1.5 0 0 0 5.5 16h8a1.5 1.5 0 0 0 1.5-1.5V12M11 4h5v5M16 4l-7 7"/></svg>,
 note:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 3.5h10a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1ZM7 8h6M7 11.5h4"/></svg>,
};

function Stars({value,onChange,size}){
 return <div className={`al-stars${size?` al-stars--${size}`:''}`} role="radiogroup" aria-label="Rating">{[1,2,3,4,5].map(n=>
  <button key={n} type="button" role="radio" aria-checked={value===n} aria-label={`${n} of 5`} className={n<=(value??0)?'is-on':undefined} onClick={()=>onChange(value===n?null:n)}>★</button>)}
 </div>;
}

// What a clip shows: the elements the search hit first, then the rest.
function Shows({asset,matched=[],budget=26,all=false,onPick}){
 const hit=new Set(matched),sorted=[...asset.shows.filter(n=>hit.has(n)),...asset.shows.filter(n=>!hit.has(n))];
 let used=0;const list=all?sorted:sorted.filter((name,i)=>{used+=name.length;return i===0||used<=budget;});
 const chip=name=>onPick?<button type="button" key={name} className={`al-tag${hit.has(name)?' is-hit':''}`} onClick={()=>onPick(name)}>{name}</button>:<span key={name} className={`al-tag${hit.has(name)?' is-hit':''}`}>{name}</span>;
 return <div className="al-tags">{list.map(chip)}{!all&&sorted.length>list.length&&<span className="al-tag al-tag--more">+{sorted.length-list.length}</span>}</div>;
}

function Card({asset,review,matched,onOpen}){
 const [hover,setHover]=useState(false),[ready,setReady]=useState(false);
 const timer=useRef(null),frame=useRef(null);
 const enter=event=>{if(event.pointerType&&event.pointerType!=='mouse')return;clearTimeout(timer.current);timer.current=setTimeout(()=>setHover(true),140);};
 const leave=()=>{clearTimeout(timer.current);setHover(false);setReady(false);};
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 // The preview fades in once its first frame is drawn.
 useEffect(()=>{
  if(!hover)return;
  const heard=event=>{if(event.origin===window.location.origin&&event.data?.type==='asset-ready'&&event.source===frame.current?.contentWindow)setReady(true);};
  window.addEventListener('message',heard);
  return()=>window.removeEventListener('message',heard);
 },[hover]);
 return <article className="al-card" onPointerEnter={enter} onPointerLeave={leave} onFocus={()=>setHover(true)} onBlur={leave}>
  <button type="button" className="al-open" onClick={()=>onOpen(asset.id)} aria-label={`Open ${asset.title}`}>
   <span className="al-thumb">
    <img src={asset.image} alt="" loading="lazy" draggable="false"/>
    {hover&&<iframe ref={frame} className={ready?'is-ready':undefined} src={embedUrl(asset,'preview')} title="" tabIndex={-1} aria-hidden="true"/>}
    {hover&&!ready&&<i className="al-loading" aria-hidden="true"/>}
    <span className="al-badges"><b>{asset.number?`Ch. ${asset.number}`:asset.kind}</b><time>{clock(asset.seconds)}</time></span>
    <span className="al-playmark" aria-hidden="true">{Icon.play}</span>
   </span>
   <span className="al-body">
    <span className="al-title">{asset.title}</span>
    <Shows asset={asset} matched={matched}/>
    {review?.notes?.trim()&&<span className="al-note">{review.notes.trim()}</span>}
    <span className="al-foot">
     {review?.rating?<span className="al-mini" aria-label={`${review.rating} of 5`}>{'★'.repeat(review.rating)}<i>{'★'.repeat(5-review.rating)}</i></span>:<span className="al-unrated">Not rated</span>}
     {review?.notes?.trim()&&<span className="al-has-notes" title="Has notes">{Icon.note}Notes</span>}
    </span>
   </span>
  </button>
 </article>;
}

function Detail({asset,position,total,review,matched,onChange,onClose,onStep,onPick,status}){
 const src=embedUrl(asset,'player');
 return <div className="al-overlay" role="dialog" aria-modal="true" aria-label={asset.title} onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
  <div className="al-dialog">
   <header className="al-dhead">
    <div><small>{asset.demoName} · {asset.number?`Chapter ${asset.number}`:asset.kind} · {clock(asset.seconds)}</small><h2>{asset.title}</h2></div>
    <div className="al-dnav">
     {position>0&&<span>{position} of {total}</span>}
     <button type="button" onClick={()=>onStep(-1)} disabled={position===1} aria-label="Previous clip">{Icon.left}</button>
     <button type="button" onClick={()=>onStep(1)} disabled={position===total} aria-label="Next clip">{Icon.right}</button>
     <button type="button" onClick={onClose} aria-label="Close" className="al-x">{Icon.close}</button>
    </div>
   </header>
   <div className="al-dbody">
    <section className="al-dplayer">
     <div className="al-player"><iframe key={asset.id} src={src} title={asset.title}/></div>
     {asset.words&&<blockquote className="al-words">{asset.words}</blockquote>}
     <p className="al-about">{asset.about}</p>
     <div className="al-shown"><span>Shows</span><Shows asset={asset} matched={matched} all onPick={onPick}/></div>
     <a className="al-fulllink" href={asset.page} target="_blank" rel="noreferrer">Open the full {asset.demoName} demo {Icon.out}</a>
    </section>
    <section className="al-review">
     <div className="al-field"><span>Rating</span><Stars value={review.rating??null} onChange={rating=>onChange({rating})} size="lg"/></div>
     <label className="al-field al-field--grow"><span>Notes</span><textarea value={review.notes??''} onChange={e=>onChange({notes:e.target.value})} placeholder="What should change? Timing, where the words sit, what is circled…"/></label>
     <p className="al-status" role="status">{status||(review.updatedAt?`Edited ${new Date(review.updatedAt).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})}`:'')}</p>
    </section>
   </div>
  </div>
 </div>;
}

export default function AssetsLibrary({assets,demos,saved={}}){
 const [reviews,setReviews]=useState({}),[loaded,setLoaded]=useState(false),[toFile,setToFile]=useState(true),[status,setStatus]=useState('');
 const [query,setQuery]=useState(''),[demo,setDemo]=useState('all'),[filter,setFilter]=useState('all'),[openId,setOpenId]=useState(null);
 const edited=useRef(false),search=useRef(null),restored=useRef(false),address=useRef(null);
 // Load what was saved (the file first, else this browser) and what the address remembers.
 useEffect(()=>{
  let live=true;
  address.current??=new URLSearchParams(window.location.search);// read once: development mounts twice and the address is rewritten in between
  const p=address.current;
  setQuery(p.get('q')||'');if(demos.some(d=>d.id===p.get('demo')))setDemo(p.get('demo'));if(STATUS.some(([k])=>k===p.get('show')))setFilter(p.get('show'));if(assets.some(a=>a.id===p.get('clip')))setOpenId(p.get('clip'));
  restored.current=true;
  // the saved notes plus anything only this browser has; a note found only here goes back to the file on the next save
  const combine=base=>{
   let mine={};try{mine=JSON.parse(readLocal(LOCAL)||'{}').reviews||{};}catch{}
   const {reviews:merged,changed}=mergeReviews(base,mine);
   if(changed)edited.current=true;
   setReviews(merged);
  };
  (async()=>{
   try{
    const response=await fetch('/api/assets-library',{cache:'no-store'});
    if(!response.ok)throw new Error();
    const data=await response.json();
    if(live)combine(data.reviews||{});
   }catch{
    if(live){setToFile(false);combine(saved);}
   }finally{if(live)setLoaded(true);}
  })();
  return()=>{live=false;};
 },[assets,demos]);
 useEffect(()=>{// the address follows the search and the open clip
  if(!restored.current)return;
  const p=new URLSearchParams();
  if(query.trim())p.set('q',query.trim());if(demo!=='all')p.set('demo',demo);if(filter!=='all')p.set('show',filter);if(openId)p.set('clip',openId);
  const text=p.toString();window.history.replaceState(null,'',`${window.location.pathname}${text?`?${text}`:''}`);
 },[query,demo,filter,openId]);
 // Save half a second after the last change.
 useEffect(()=>{
  if(!loaded||!edited.current)return;
  setStatus('Saving…');
  const timer=setTimeout(async()=>{
   const body=JSON.stringify({version:1,reviews});
   writeLocal(LOCAL,body);
   if(!toFile){setStatus('Saved in this browser');return;}
   try{
    const response=await fetch('/api/assets-library',{method:'POST',headers:{'Content-Type':'application/json'},body});
    if(!response.ok)throw new Error((await response.json().catch(()=>({}))).error||'Save failed');
    setStatus('Saved');
   }catch(error){setStatus(`Not saved to the file (${error.message}); kept in this browser.`);}
  },500);
  return()=>clearTimeout(timer);
 },[reviews,loaded,toFile]);
 const update=(id,patch)=>{
  edited.current=true;
  setReviews(previous=>({...previous,[id]:{rating:previous[id]?.rating??null,notes:previous[id]?.notes??'',...patch,updatedAt:new Date().toISOString()}}));
 };
 const results=useMemo(()=>searchAssets(query,assets).filter(({asset})=>{
  const r=reviews[asset.id];
  if(demo!=='all'&&asset.demo!==demo)return false;
  if(filter==='unrated')return !r?.rating;
  if(filter==='rated')return !!r?.rating;
  if(filter==='notes')return !!r?.notes?.trim();
  return true;
 }),[query,assets,reviews,demo,filter]);
 // With a search, the demo holding the best match comes first.
 const groups=demos.map(d=>({demo:d,items:results.filter(r=>r.asset.demo===d.id)})).filter(g=>g.items.length).sort((x,y)=>(y.items[0].score-x.items[0].score)||0);
 const flat=groups.flatMap(g=>g.items),at=flat.findIndex(r=>r.asset.id===openId),current=at>=0?flat[at]:openId?{asset:assets.find(a=>a.id===openId),matched:[]}:null;
 const ratedCount=assets.filter(a=>reviews[a.id]?.rating).length;
 const open=id=>{setStatus('');setOpenId(id);};
 const close=()=>setOpenId(null);
 const step=delta=>{const next=flat[at+delta];if(next)open(next.asset.id);};
 const pick=name=>{setQuery(name);close();window.scrollTo({top:0,behavior:'smooth'});};
 // Keys: / searches, Esc closes (or clears), arrows step through the open clip.
 useEffect(()=>{
  const onKey=event=>{
   const typing=/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
   if(event.key==='Escape'){if(openId)close();else if(query){setQuery('');}return;}
   if(typing||event.metaKey||event.ctrlKey||event.altKey)return;
   if(event.key==='/'&&!openId){event.preventDefault();search.current?.focus();}
   if(openId&&event.key==='ArrowLeft')step(-1);
   if(openId&&event.key==='ArrowRight')step(1);
  };
  window.addEventListener('keydown',onKey);
  return()=>window.removeEventListener('keydown',onKey);
 });
 useEffect(()=>{if(!openId)return;const was=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=was;};},[openId]);
 const searching=query.trim().length>0;
 return <div className="page"><Navbar returnHome/><main className="al-page">
  <header className="al-head">
   <div><span className="al-kicker">Internal</span><h1>Assets Library</h1>
    <p>{assets.length} animation clips · {ratedCount} rated. Hover a clip to watch it, click it to rate it and write notes.</p></div>
  </header>
  <div className="al-search">
   <span className="al-search-icon">{Icon.search}</span>
   <input ref={search} type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search clips — alert, mission chip, timer, performer…" aria-label="Search the library" spellCheck="false" autoComplete="off"/>
   {query?<button type="button" className="al-clear" onClick={()=>{setQuery('');search.current?.focus();}} aria-label="Clear search">{Icon.close}</button>:<kbd>/</kbd>}
  </div>
  <div className="al-suggest" aria-label="Suggested searches"><span>Try</span>{SUGGESTIONS.map(name=><button key={name} type="button" className={query.trim().toLowerCase()===name.toLowerCase()?'is-on':undefined} onClick={()=>setQuery(query.trim().toLowerCase()===name.toLowerCase()?'':name)}>{name}</button>)}</div>
  <div className="al-filters">
   <div className="al-seg" role="group" aria-label="Demo">{[{id:'all',name:'All demos'},...demos].map(d=><button key={d.id} type="button" aria-pressed={demo===d.id} onClick={()=>setDemo(d.id)}>{d.name}</button>)}</div>
   <div className="al-seg" role="group" aria-label="Review status">{STATUS.map(([key,label])=><button key={key} type="button" aria-pressed={filter===key} onClick={()=>setFilter(key)}>{label}</button>)}</div>
   <span className="al-count" aria-live="polite">{flat.length} {flat.length===1?'clip':'clips'}{searching?` for “${query.trim()}”`:''}</span>
  </div>
  {groups.map(({demo:d,items})=><section className="al-group" key={d.id} aria-label={d.name}>
   <header><h2>{d.name}</h2><span>{items.length}</span><a href={d.page} target="_blank" rel="noreferrer">Full demo {Icon.out}</a></header>
   <div className="al-grid">{items.map(({asset,matched})=><Card key={asset.id} asset={asset} matched={matched} review={reviews[asset.id]} onOpen={open}/>)}</div>
  </section>)}
  {!groups.length&&<div className="al-empty"><b>No clips match{searching?` “${query.trim()}”`:' these filters'}.</b><p>Search by what the clip shows, like an element of the product.</p>
   <div className="al-suggest">{SUGGESTIONS.slice(0,6).map(name=><button key={name} type="button" onClick={()=>{setDemo('all');setFilter('all');setQuery(name);}}>{name}</button>)}</div>
   {(demo!=='all'||filter!=='all')&&<button type="button" className="al-reset" onClick={()=>{setDemo('all');setFilter('all');}}>Clear filters</button>}</div>}
 </main>
 {current?.asset&&<Detail asset={current.asset} matched={current.matched} position={at+1} total={flat.length||1} review={reviews[current.asset.id]||{}} status={status} onChange={patch=>update(current.asset.id,patch)} onClose={close} onStep={step} onPick={pick}/>}
 </div>;
}
