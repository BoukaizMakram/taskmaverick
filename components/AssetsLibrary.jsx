'use client';
// Assets Library (/assets-library): all of the product's UI as a grid of thumbnails
// by category (Missions, Mission details, Boards, Navigation, Screens, Web app,
// Annotations) — the same pieces Shift+A brings into the storyboard. Search finds a
// piece by its name, its category or what it is also called; click one to see it
// larger. The pieces come from lib/storyboardParts.mjs (captured by
// `npm run gen:storyboard -- --parts`, pictures in public/storyboard/ui/). The
// animation clips are in the Video Library (/video-library).
import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import Navbar from './Navbar';
import {ELEMENTS} from '@/lib/assetElements.mjs';
import {CATEGORIES,groupParts,searchParts,sizeLabel} from '@/lib/storyboardParts.mjs';
import './AssetsLibrary.css';

const SUGGESTIONS=['tablet','phone','checklist','media','board','timer','report','hand'];
const pictureOf=part=>`/storyboard/ui/${part.id}.jpg`;
// The other names a piece is found by (not the ones already in its own name).
const aliasesOf=part=>{
 const own=new Set(part.name.toLowerCase().split(/\W+/).filter(Boolean));
 return [...new Set([...(ELEMENTS[part.name]??[]),...String(part.keywords??'').split(/\s+/)].map(s=>s.trim()).filter(Boolean))].filter(word=>!own.has(word.toLowerCase()));
};

const Icon={
 search:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="9" cy="9" r="5.8"/><path d="m13.4 13.4 3.6 3.6"/></svg>,
 close:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg>,
 left:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 4-6 6 6 6"/></svg>,
 right:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 4 6 6-6 6"/></svg>,
 open:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 3h6v6M17 3l-8 8M14 11v4.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 3 15.5v-8A1.5 1.5 0 0 1 4.5 6H9"/></svg>,
};

function Tile({part,onOpen}){
 return <button type="button" className="al-tile" onClick={()=>onOpen(part.id)} aria-label={`Open ${part.name}`}>
  <span className="al-pic"><img src={pictureOf(part)} alt="" loading="lazy" draggable="false"/></span>
  <span className="al-name">{part.name}</span>
  <span className="al-size">{sizeLabel(part)}</span>
 </button>;
}

function Detail({part,position,total,onClose,onStep,onPick}){
 const aliases=aliasesOf(part);
 return <div className="al-overlay" role="dialog" aria-modal="true" aria-label={part.name} onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
  <div className="al-dialog">
   <header className="al-dhead">
    <div><small>{part.category}</small><h2>{part.name}</h2></div>
    <div className="al-dnav">
     {position>0&&<span>{position} of {total}</span>}
     <button type="button" onClick={()=>onStep(-1)} disabled={position<=1} aria-label="Previous">{Icon.left}</button>
     <button type="button" onClick={()=>onStep(1)} disabled={position>=total} aria-label="Next">{Icon.right}</button>
     <button type="button" onClick={onClose} aria-label="Close" className="al-x">{Icon.close}</button>
    </div>
   </header>
   <div className="al-dbody">
    <section className="al-view"><img key={part.id} src={pictureOf(part)} alt={part.name} draggable="false"/></section>
    <aside className="al-info">
     <a className="al-open" href={`/assets-library/${part.id}`} target="_blank" rel="noopener">{Icon.open}Open the asset</a>
     <div className="al-field"><span>Category</span><b>{part.category}</b></div>
     <div className="al-field"><span>Size in a frame</span><b>{sizeLabel(part)} px</b></div>
     {aliases.length>0&&<div className="al-field"><span>Also called</span><div className="al-tags">{aliases.map(word=><button key={word} type="button" className="al-tag" onClick={()=>onPick(word)}>{word}</button>)}</div></div>}
     <p className="al-hint">In the <Link href="/storyboard">Storyboard</Link>, <kbd>Shift</kbd> + <kbd>A</kbd> brings it into a frame.</p>
    </aside>
   </div>
  </div>
 </div>;
}

export default function AssetsLibrary({parts}){
 const [query,setQuery]=useState(''),[category,setCategory]=useState('all'),[openId,setOpenId]=useState(null);
 const search=useRef(null),restored=useRef(false),address=useRef(null);
 const categories=useMemo(()=>CATEGORIES.map(name=>({name,count:parts.filter(p=>p.category===name).length})).filter(c=>c.count),[parts]);
 // What the address remembers (read once: development mounts twice and the address is rewritten in between).
 useEffect(()=>{
  address.current??=new URLSearchParams(window.location.search);
  const p=address.current;
  setQuery(p.get('q')||'');
  if(categories.some(c=>c.name===p.get('category')))setCategory(p.get('category'));
  if(parts.some(a=>a.id===p.get('asset')))setOpenId(p.get('asset'));
  restored.current=true;
 },[parts,categories]);
 useEffect(()=>{// the address follows the search, the category and the open piece
  if(!restored.current)return;
  const p=new URLSearchParams();
  if(query.trim())p.set('q',query.trim());if(category!=='all')p.set('category',category);if(openId)p.set('asset',openId);
  const text=p.toString();window.history.replaceState(null,'',`${window.location.pathname}${text?`?${text}`:''}`);
 },[query,category,openId]);
 const results=useMemo(()=>searchParts(query,category==='all'?parts:parts.filter(p=>p.category===category)),[query,category,parts]);
 const groups=useMemo(()=>groupParts(results),[results]);
 const flat=groups.flatMap(g=>g.items),at=flat.findIndex(p=>p.id===openId),current=parts.find(p=>p.id===openId)??null;
 const close=()=>setOpenId(null);
 const step=delta=>{const next=flat[at+delta];if(next)setOpenId(next.id);};
 const pick=word=>{setQuery(word);setCategory('all');close();window.scrollTo({top:0,behavior:'smooth'});};
 // Keys: / searches, Esc closes (or clears), arrows step through the open piece.
 useEffect(()=>{
  const onKey=event=>{
   const typing=/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
   if(event.key==='Escape'){if(openId)close();else if(query)setQuery('');return;}
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
   <span className="al-kicker">Internal</span><h1>Assets Library</h1>
   <p>{parts.length} pieces of the product’s UI in {categories.length} categories — the same ones <kbd>Shift</kbd> + <kbd>A</kbd> brings into the <Link href="/storyboard">Storyboard</Link>. The animation clips are in the <Link href="/video-library">Video Library</Link>.</p>
  </header>
  <div className="al-search">
   <span className="al-search-icon">{Icon.search}</span>
   <input ref={search} type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search the UI — tablet board, checklist, timer, report…" aria-label="Search the library" spellCheck="false" autoComplete="off"/>
   {query?<button type="button" className="al-clear" onClick={()=>{setQuery('');search.current?.focus();}} aria-label="Clear search">{Icon.close}</button>:<kbd>/</kbd>}
  </div>
  <div className="al-suggest" aria-label="Suggested searches"><span>Try</span>{SUGGESTIONS.map(word=><button key={word} type="button" className={query.trim().toLowerCase()===word?'is-on':undefined} onClick={()=>setQuery(query.trim().toLowerCase()===word?'':word)}>{word}</button>)}</div>
  <div className="al-filters">
   <div className="al-seg" role="group" aria-label="Category">{[{name:'all',label:'All',count:parts.length},...categories.map(c=>({...c,label:c.name}))].map(c=><button key={c.name} type="button" aria-pressed={category===c.name} onClick={()=>setCategory(c.name)}>{c.label}<i>{c.count}</i></button>)}</div>
   <span className="al-count" aria-live="polite">{flat.length} {flat.length===1?'piece':'pieces'}{searching?` for “${query.trim()}”`:''}</span>
  </div>
  {groups.map(({category:name,items})=><section className="al-group" key={name} aria-label={name}>
   <header><h2>{name}</h2><span>{items.length}</span></header>
   <div className="al-grid">{items.map(part=><Tile key={part.id} part={part} onOpen={setOpenId}/>)}</div>
  </section>)}
  {!groups.length&&<div className="al-empty">
   <b>{parts.length?`Nothing matches${searching?` “${query.trim()}”`:''}.`:'No UI pieces captured yet.'}</b>
   <p>{parts.length?'Search by a name or what it is also called, like a tablet, a checklist or a timer.':'Run npm run gen:storyboard -- --parts (with the site running) to capture them.'}</p>
   {parts.length>0&&(category!=='all'||searching)&&<button type="button" className="al-reset" onClick={()=>{setCategory('all');setQuery('');}}>Show everything</button>}
  </div>}
 </main>
 {current&&<Detail part={current} position={at+1} total={flat.length} onClose={close} onStep={step} onPick={pick}/>}
 </div>;
}
