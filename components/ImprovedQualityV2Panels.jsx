'use client';
// Panels for the Improved Quality storytelling cut (/improved-quality-v2).
// Everything is frame-driven (derived from the demo clock), so seeking works.
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {IconBack} from './PhoneShell';
import MissionChip from './MissionChip';
import {BUSINESS_PROOFS,proofSrc} from '@/lib/businessProofs.mjs';
import {ease,MOTION,MICRO,QUIZ_ANSWERS,PROOF_FILES,RATE_LABELS,KNOWLEDGE} from '@/lib/improvedQualityV2Story.mjs';

export const SHELVING='/demo-quality/shelving.png';
export const DAMAGE='/demo-quality/damaged-hinge.png';
const CLIP='/demo-quality/condition-report.mp4';
const TRAINING='/demo-quality/shelving-training.mp4';
const ONBOARDING='/videos/training%20video%201.mp4';
export function DemoVideo({time=0,src=CLIP,playing=false,speed=1,poster=DAMAGE}){
 const ref=useRef(null);
 useEffect(()=>{const v=ref.current;if(!v)return;const sync=()=>{const t=Math.max(0,time)%(v.duration||999);if(Math.abs(v.currentTime-t)>.25)v.currentTime=t;v.playbackRate=speed;if(playing)v.play().catch(()=>{});else v.pause();};sync();v.addEventListener('loadedmetadata',sync);return()=>v.removeEventListener('loadedmetadata',sync);},[time,playing,speed]);
 return <video ref={ref} src={src} poster={poster} muted playsInline preload="auto"/>;
}
export function PanelHead({title='Mission Details'}){return <header className="iq-panel-head"><span className="om-hbtn"><IconBack/></span><b>{title}</b><div><span className="iq-close">×</span></div></header>;}
function MediaBadge(){return <span className="iq-media-badge"><img src="/mission-logo.png" alt=""/>Media</span>;}
const PlayIcon=()=><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5Z"/></svg>;
const PauseIcon=()=><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>;
const CheckIcon=()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>;
export const PhotoIcon=()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 8.5h3.2l1.8-2.7h7l1.8 2.7h3.2v10.7h-17Z"/><circle cx="12" cy="13.5" r="3.4"/></svg>;
export const VideoIcon=()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="6.5" width="12.5" height="11" rx="2"/><path d="m15.5 10.5 5.5-3v9l-5.5-3Z"/></svg>;
const clock=s=>{s=Math.max(0,Math.floor(s));return [s/3600,s/60%60,s%60].map(n=>String(Math.floor(n)).padStart(2,'0')).join(':');};
// A player bar: play/pause, progress, time left.
function PlayerBar({time,length,running}){return <div className="iq2-bar"><span>{running?<PauseIcon/>:<PlayIcon/>}</span><span className="iq2-bar-track"><i style={{width:`${Math.min(1,time/length)*100}%`}}/></span><time>0:0{Math.max(0,Math.ceil(length-time))}</time></div>;}

// ---- Chapter 2: Knowledge Base, then Onboarding's video ------------------------
const KNOWLEDGE_ITEMS=[['Punctuality','08-28-26','09:13 PM'],['Company Culture','05-02-26','12:44 AM'],['Onboarding','08-20-26','11:54 PM'],['Procedures','04-14-26','02:03 AM'],['Timesheet Filing','03-27-26','12:15 AM'],['Workplace Safety','07-31-26','08:47 PM'],['Customer Service','07-08-26','07:41 PM']];
export function KnowledgeBase({frame,playing,speed}){
 const {reveal,since,viewer,video}=frame.kb,running=video>0&&video<KNOWLEDGE.clip;
 return <div className="iq-knowledge-layer"><div className="mi-drawer-shade iq-knowledge-shade"/><aside className="iq-knowledge" aria-label="Knowledge Base" style={{transform:`translateX(${(1-reveal)*100}%)`}}>
  <PanelHead title="Knowledge Base"/>
  <div className="iq-kb-list"><div className="iq-kb-track">{KNOWLEDGE_ITEMS.map(([title,date,time],i)=>{const pop=ease((since-.15-i*.07)/.35);return <article className="iq-kb-card" key={title} data-iq-target={`kb-type-${i}`} style={{opacity:pop,transform:`translateY(${10*(1-pop)}px)`}}>
   <MediaBadge/><h3>{title}</h3><time>{date} {time}</time></article>;})}</div></div>
  {viewer>0&&<div className="iq2-kb-viewer" style={{transform:`translateX(${(1-viewer)*100}%)`}}>
   <PanelHead title="Onboarding"/>
   <div className="iq2-kb-body">
    <div className="iq2-kb-step"><small>1/2</small><b>Video</b></div>
    <div className="iq2-kb-video" data-iq-target="kb-video"><DemoVideo src={ONBOARDING} poster={null} time={video} playing={playing&&running} speed={speed}/>{video===0&&<span className="iq2-bigplay"><PlayIcon/></span>}</div>
    <PlayerBar time={video} length={KNOWLEDGE.clip} running={running}/>
    <h3>Badging In On Your First Day</h3>
    <p>Tap your badge at the front door reader. The light turns green and the door unlocks.</p>
   </div>
  </div>}
 </aside></div>;
}

// ---- Chapters 3-11: the mission, by itself ----------------------------------------
const COPY={
 en:{details:'Mission Details',kind:'Checklist',title:'Opening Quality Check',location:'Kitchen / Food Preparation',
  instructions:'Before opening, check that the kitchen is clean, organized and ready for service.',alert:"Every container must be labeled with today's date.",link:'View opening standards guide',
  checklist:'Checklist',yes:'Yes',no:'No',questions:['Are the shelves clean and organized?','Are all items stored in the designated area?','Is the work area ready for the next shift?'],
  training:'Please complete this training before proceeding.',trainingTitle:'Shelving Standards',video:'Video',done:'Done',quiz:'Quiz',submit:'Submit',
  photoQ:'Take a photo of the organized shelves.',equipQ:'Is the equipment working properly?',addAtLeast:k=>`Add at least one ${k}`,add:k=>`Add ${k}`},
 es:{details:'Detalles de la Misión',kind:'Lista',title:'Control de Calidad de Apertura',location:'Cocina / Preparación de Alimentos',
  instructions:'Antes de abrir, verifica que la cocina esté limpia, organizada y lista para el servicio.',alert:'Cada recipiente debe estar etiquetado con la fecha de hoy.',link:'Ver guía de estándares de apertura',
  checklist:'Lista de verificación',yes:'Sí',no:'No',questions:['¿Los estantes están limpios y organizados?','¿Todos los artículos están en su área designada?','¿El área de trabajo está lista para el siguiente turno?'],
  training:'Completa esta capacitación antes de continuar.',trainingTitle:'Estándares de Estanterías',video:'Video',done:'Hecho',quiz:'Cuestionario',submit:'Enviar',
  photoQ:'Toma una foto de los estantes organizados.',equipQ:'¿El equipo funciona correctamente?',addAtLeast:k=>`Agrega al menos un ${k==='photo'?'foto':'video'}`,add:k=>`Agregar ${k==='photo'?'foto':'video'}`},
};
const QUIZ=['Items can be stored on the floor when the shelves are full.','Every container must be sealed and labeled with its contents and date.','Heavier items belong on the lower shelves.'];
function Box({checked}){return <span className={`iq-checkbox${checked?' is-checked':''}`} aria-hidden="true">{checked?'✓':''}</span>;}
const Reveal=({open,children})=><div className="iq2-reveal" style={{gridTemplateRows:`${open}fr`,opacity:Math.min(1,open*1.4),visibility:open>0?'visible':'hidden'}}><div>{children}</div></div>;
function Request({kind,target,t}){
 return <div className="iq-proof-request"><small>{t.addAtLeast(kind)}</small>
  <div><span className="iq-proof-add" data-iq-target={target}><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="10" cy="10" r="7.5"/><path d="M10 6.5v7M6.5 10h7"/></svg>{t.add(kind)}</span><span>0/1</span></div>
 </div>;
}
// Frame parts used: mission {translated, clock}, steps, training, photo, video.
export function StoryMission({frame,playing,speed}){
 const {mission,steps,training,photo,video}=frame,t=COPY[mission.translated?'es':'en'];
 const count=steps+(training.done?1:0)+(photo.taken?1:0)+(video.attached?1:0);
 const choice=(label,checked,target)=><span role="checkbox" aria-checked={checked} className={checked?'is-selected':undefined} data-iq-target={target} key={label}><Box checked={checked}/>{label}</span>;
 const playingTraining=training.seconds>0&&training.seconds<MICRO.clip;
 return <div className="iq2-m" lang={mission.translated?'es':'en'}>
  <header className="iq2-m-head"><span className="iq2-m-back"><IconBack/></span><b>{t.details}</b><span className="iq2-m-translate" data-iq-target="translate">{mission.translated?'EN':'ES'}</span></header>
  <div className="iq2-m-window"><div className="iq2-m-content">
   <section className="iq2-m-summary" data-iq-target="mission-chip">
    <div className="iq2-m-kind"><img src="/mission-logo.png" alt=""/><span>{t.kind}</span><b>25</b><em>{clock(522+mission.clock)}</em></div>
    <h3>{t.title}</h3><small>{t.location}</small>
    <div className="iq2-m-meta"><span>Anna F</span><time>09-23-26 04:03 PM</time></div>
   </section>
   <section className="iq2-m-brief">
    <p data-iq-target="instructions">{t.instructions}</p>
    <div className="iq2-m-alert" data-iq-target="alert">{t.alert}</div>
    <span className="iq2-m-link" data-iq-target="link">{t.link} ↗</span>
   </section>
   <div className="iq2-m-group" data-iq-target="checklist">{t.checklist}<span>{count}/6</span></div>
   {t.questions.map((q,i)=><section className="iq2-m-cp" key={i} data-iq-target={`cp${i+1}`}><b>{i+1}. {q}</b><div className="iq2-m-options">{choice(t.yes,steps>i,`yes-${i}`)}{choice(t.no,false)}</div></section>)}
   <section className="iq2-m-cp" data-iq-target="cp4"><b>4. {t.training}</b>
    <div className={`iq2-m-tile${training.done?' is-done':''}`} data-iq-target="training-tile">
     <span className="iq2-m-thumb" data-iq-target="training-play" style={{backgroundImage:`url('${SHELVING}')`}}><i>{training.done?<CheckIcon/>:<PlayIcon/>}</i></span>
     <span className="iq2-m-tile-text"><b>{t.trainingTitle}</b><small>{training.done?`${t.video} · ${t.quiz}`:`${t.video} · 0:06`}</small></span>
     {training.done&&<em className="iq2-m-done"><CheckIcon/>{t.done}</em>}
    </div>
    <Reveal open={training.video}><div className="iq2-m-player" data-iq-target="training-video"><div className="iq2-m-frame"><DemoVideo src={TRAINING} poster={SHELVING} time={training.seconds} playing={playing&&playingTraining} speed={speed}/></div><PlayerBar time={training.seconds} length={MICRO.clip} running={playingTraining}/></div></Reveal>
    <Reveal open={training.quiz}><div className="iq2-m-quiz" data-iq-target="training-quiz"><header><small>2/2</small><b>{t.quiz}</b></header>
     {QUIZ.map((q,i)=><section key={q}><p><span>{i+1}.</span>{q}</p><div>{['True','False'].map((label,o)=>{const checked=i<training.answers&&QUIZ_ANSWERS[i]===o;return <span role="checkbox" aria-checked={checked} data-iq-target={`quiz-${i}-${o}`} key={label}><Box checked={checked}/>{label}</span>;})}</div></section>)}
     <span className={`iq2-m-submit${training.answers===3?' is-ready':''}`} data-iq-target="quiz-submit">{t.submit}</span>
    </div></Reveal>
   </section>
   <div data-iq-target="proof-block">
    <section className="iq2-m-cp" data-iq-target="cp5"><b>5. {t.photoQ}</b>
     {photo.taken?<Reveal open={photo.in}><div className="iq2-m-proof" data-iq-target="photo-proof"><div className="iq2-m-frame iq2-m-shot" style={{backgroundImage:`url('${SHELVING}')`}}><i className="iq2-flash" style={{opacity:photo.flash}}/></div><div className="iq2-m-file"><PhotoIcon/><span>{PROOF_FILES.photo}</span></div></div></Reveal>
      :<Request kind="photo" target="add-photo" t={t}/>}
    </section>
    <section className="iq2-m-cp" data-iq-target="cp6"><b>6. {t.equipQ}</b><div className="iq2-m-options">{choice(t.yes,false)}{choice(t.no,video.answered,'no-5')}</div>
     {video.in===0?<Reveal open={video.box}><Request kind="video" target="add-video" t={t}/></Reveal>
      :<Reveal open={video.in}><div className="iq2-m-proof" data-iq-target="video-proof"><div className="iq2-m-frame">
        <DemoVideo time={video.attached?video.playback:Math.max(0,video.live)} playing={playing&&(video.recording||(video.attached&&video.playback>0&&video.playback<MOTION.rec))} speed={speed}/>
        {!video.attached&&<span className="iq2-rec"><i/>REC 00:0{video.rec}</span>}
       </div>{video.attached&&<div className="iq2-m-file"><VideoIcon/><span>{PROOF_FILES.video}</span></div>}</div></Reveal>}
    </section>
   </div>
  </div></div>
 </div>;
}

// ---- Chapters 12-15: one mission lifted out of the board -----------------------
// Rendered in the tablet's own card styles (a 1080px board: 1 unit = 1px) and
// scaled by the page. The rating opens under the card; peers are announced
// under it too.
export function IsoMission({mission,frame,width}){
 const {box,value,moved,bubbles}=frame.rating,at=value/4*100;
 const bubble=bubbles.find(b=>b.opacity>0);
 return <div className="mi-interactive mi-interactive--tablet mi-reference iq2-iso"><div className="mi-tablet-board iq2-iso-board"><div className="iq2-iso-stack" style={{width}}>
  <MissionChip kind={mission.type} points={mission.points} title={mission.title} who={mission.performer} date={mission.date} time={mission.time} showExec execTime={clock(mission.executionSeconds)} pillTime={clock(mission.ageSeconds)} pillClass="chip--gray" rate ratings={mission.ratings}/>
  <Reveal open={box}><div className="iq2-rate" data-iq-target="rate-box">
   <p>Rate this mission:</p><h4>{RATE_LABELS[Math.round(value)]}</h4>
   <div className="iq-rate-slider" data-iq-target="rate-slider"><span className="iq-rate-track"><i style={{width:`${at}%`}}/></span>{RATE_LABELS.map((l,i)=><span className="iq-rate-stop" key={l} style={{left:`${i*25}%`}}/>)}<span className="iq-rate-knob" style={{left:`${at}%`}}/></div>
   <span className={`iq2-rate-submit${moved?' is-ready':''}`} data-iq-target="rate-submit">Submit Rate</span>
  </div></Reveal>
  {bubble&&<div className="iq2-peer" style={{opacity:bubble.opacity,transform:`translateY(${8*(1-bubble.opacity)}px)`}}>
   <span className="iq-peer-avatar">{bubble.initials}</span><span><b>{bubble.name}</b> rated it <strong>{RATE_LABELS[bubble.score-1]}</strong></span><span className="iq-peer-score">{bubble.score}</span>
  </div>}
 </div></div></div>;
}

// ---- Chapters 20-21: a report item scaled up (the page places it) --------------
// The same content as the report's cell: "└ 1. Nelson P" or its date & time,
// for the two missions in view (3 and 4).
const POP_ROWS=BUSINESS_PROOFS.slice(2,4);
const webDate=d=>{const [date,...time]=d.split(' ');const [m,day,y]=date.split('-');return `${m}/${day}/20${y}, ${time.join(' ')}`;};
export function PopCell({kind,i,style}){
 const m=POP_ROWS[i];
 return <span className={`iq2-pop iq2-pop--${kind}`} style={style}>{kind==='date'?<time>{webDate(m.date)}</time>:<><i className="iq-ur-branch"/><em>1.</em><b>{m.performer}</b></>}</span>;
}

// ---- Chapters 15-17: Business Proofs in the tablet ---------------------------------
function FolderIcon(){return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" aria-hidden="true"><path d="M1.8 3.5h4.3l1.3 1.6h6.8v7.4H1.8Z"/></svg>;}
function FunnelIcon(){return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 4h18l-7 8.2V19l-4 2v-8.8Z"/></svg>;}
export function BusinessProofs({scroll=0,tablet=false}){
 const list=useRef(null),[max,setMax]=useState(0);
 useLayoutEffect(()=>{const el=list.current;if(!el)return;const m=Math.max(0,el.scrollHeight-el.parentElement.clientHeight);if(Math.abs(m-max)>1)setMax(m);});
 return <div className={`iq-bp${tablet?' iq-bp--tablet':''}`}>
  <header className="iq-bp-head"><span className="iq-bp-back"><IconBack/></span><b>Business Proofs</b><span className="iq-bp-filter"><FunnelIcon/></span></header>
  <div className="iq-bp-search"><span><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4.5 4.5"/></svg>Search</span><i>×</i></div>
  <div className="iq-bp-window"><div ref={list} className="iq-bp-list" style={{transform:`translateY(${-max*scroll}px)`}}>
   {BUSINESS_PROOFS.map(m=><article className="iq-bp-mission" key={m.id}>
    <header><div className="iq-bp-kind"><img src="/mission-logo.png" alt=""/><b>{m.kind}</b><span>{m.execution}</span><strong>{m.duration}</strong></div>
     <small><FolderIcon/>{m.category}</small><h3>{m.title}</h3><div className="iq-bp-meta"><span>{m.performer}</span><time>{m.date}</time></div></header>
    <div className="iq-bp-grid">{m.photos.map(({name,alt},i)=><span className="iq-bp-photo" key={name} role="img" aria-label={alt} style={{backgroundImage:`url('${proofSrc(name)}')`}}>{m.more&&i===m.photos.length-1&&<em>+{m.more}</em>}</span>)}</div>
   </article>)}
  </div></div>
 </div>;
}
