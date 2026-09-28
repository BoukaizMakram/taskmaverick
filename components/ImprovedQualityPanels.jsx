'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {IconBack} from './PhoneShell';
import {BUSINESS_PROOFS,proofSrc} from '@/lib/businessProofs.mjs';
import {BoardMenu} from './BoardNavigation';
import {ease,mix,smooth,MOTION,MICRO,QUIZ_ANSWERS,CAPTURE,PROOF_FILES,RATE_LABELS} from '@/lib/improvedQualityStory.mjs';

export const SHELVING='/demo-quality/shelving.png';
export const DAMAGE='/demo-quality/damaged-hinge.png';
const CLIP='/demo-quality/condition-report.mp4';
export function DemoVideo({time=0,src=CLIP,playing=false,speed=1,poster=DAMAGE}){
 const ref=useRef(null);
 useEffect(()=>{const v=ref.current;if(!v)return;const sync=()=>{const t=Math.max(0,time)%(v.duration||999);if(Math.abs(v.currentTime-t)>.25)v.currentTime=t;v.playbackRate=speed;if(playing)v.play().catch(()=>{});else v.pause();};sync();v.addEventListener('loadedmetadata',sync);return()=>v.removeEventListener('loadedmetadata',sync);},[time,playing,speed]);
 return <video ref={ref} src={src} poster={poster} muted playsInline preload="auto"/>;
}
export function PanelHead({title='Mission Details',translate=false}){return <header className="iq-panel-head"><span className="om-hbtn"><IconBack/></span><b>{title}</b><div>{translate&&<span className="iq-language">ES</span>}<span className="iq-close">×</span></div></header>;}
export function MediaBadge(){return <span className="iq-media-badge"><img src="/mission-logo.png" alt=""/>Media</span>;}
// Broad topics that fit any industry.
const KNOWLEDGE_ITEMS=[['Punctuality','08-28-26','09:13 PM'],['Company Culture','05-02-26','12:44 AM'],['Onboarding','08-20-26','11:54 PM'],['Procedures','04-14-26','02:03 AM'],['Timesheet Filing','03-27-26','12:15 AM'],['Workplace Safety','07-31-26','08:47 PM'],['Customer Service','07-08-26','07:41 PM']];
export function KnowledgeBase({frame}){
 const {reveal,since}=frame.kb;// since = seconds since the drawer opened
 return <div className="iq-knowledge-layer" style={{'--iq-kb-reveal':reveal}}><div className="mi-drawer-shade iq-knowledge-shade"/><aside className="iq-knowledge" aria-label="Knowledge Base" style={{transform:`translateX(${(1-reveal)*100}%)`}}>
  <PanelHead title="Knowledge Base"/>
  <div className="iq-kb-list"><div className="iq-kb-track">{KNOWLEDGE_ITEMS.map(([title,date,time],i)=>{const pop=ease((since-.15-i*.07)/.35);return <article className="iq-kb-card" key={title} data-iq-target={`kb-type-${i}`} style={{opacity:pop,transform:`translateY(${10*(1-pop)}px)`}}>
   <MediaBadge/><h3>{title}</h3><time>{date} {time}</time></article>;})}</div></div>
 </aside></div>;
}
function ChecklistSummary(){return <div className="iq-checklist-summary"><span><img src="/mission-logo.png" alt=""/>Checklist <b>25</b><em>00:08:42</em></span><h3>Opening Quality Check</h3><small>Kitchen / Food Preparation</small></div>;}
const checks=['Are the shelves clean and organized?','Are all items stored in the designated area?','Is the work area ready for the next shift?'];
function DemoCheckbox({checked}){return <span className={`iq-checkbox${checked?' is-checked':''}`} aria-hidden="true">{checked?'✓':''}</span>;}
// Proof request under a checkpoint: pink until the capture is attached, then
// the file row, named by its capture time.
export const PhotoIcon=()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 8.5h3.2l1.8-2.7h7l1.8 2.7h3.2v10.7h-17Z"/><circle cx="12" cy="13.5" r="3.4"/></svg>;
export const VideoIcon=()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="6.5" width="12.5" height="11" rx="2"/><path d="m15.5 10.5 5.5-3v9l-5.5-3Z"/></svg>;
function ProofRequest({kind,captured,target}){
 if(captured)return <div className="iq-proof-file" data-iq-target={`${kind}-file`}>{kind==='video'?<VideoIcon/>:<PhotoIcon/>}<span>{PROOF_FILES[kind]}</span></div>;
 return <div className="iq-proof-request"><small>Add at least one {kind}</small>
  <div><span className="iq-proof-add" data-iq-target={target}><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="10" cy="10" r="7.5"/><path d="M10 6.5v7M6.5 10h7"/></svg>Add {kind}</span><span>0/1</span></div>
 </div>;
}
export function GuidedMission({frame}){
 const {scene,elapsed,steps,training,capture}=frame,done=training.done;
 const training4=useRef(null),[anchor,setAnchor]=useState(0);
 // Chapter 9 scrolls until the Done training checkpoint tops the window, with
 // the proof checkpoints below it.
 useLayoutEffect(()=>{const top=training4.current?.offsetTop??0;if(top!==anchor)setAnchor(top);});
 // Chapters 10-11 keep chapter 9's scroll: training, photo and video in view.
 const scroll=scene.id==='micro'?smooth(elapsed/MOTION.cam)*265:scene.number>=9?mix(265,anchor,capture.scroll):0;
 const count=steps+(done?1:0)+(capture.photo?1:0)+(capture.video?1:0);
 const choice=(answer,checked,target)=><span role="checkbox" aria-checked={checked} className={checked?'is-selected':undefined} data-iq-target={target} key={answer}><DemoCheckbox checked={checked}/>{answer}</span>;
 return <div className="iq-panel iq-guided"><PanelHead translate/><ChecklistSummary/><div className="iq-guide-window"><div className="iq-guide-content" style={{transform:`translateY(-${scroll}px)`}}>
 <div className="iq-group-label">Checklist <span>{count}/6</span></div>
 {checks.map((text,i)=><section className="iq-checkpoint" key={text}><b>{i+1}. {text}</b><div className="iq-yes-options">{['Yes','No'].map(answer=>choice(answer,steps>i&&answer==='Yes',answer==='Yes'?`yes-${i}`:undefined))}</div></section>)}
 <section ref={training4} className="iq-checkpoint"><b>4. Please complete this training before proceeding.</b><div className={`iq-training-launch${done?' is-done':''}`} data-iq-target="training"><span>Shelving Standards</span><span className="iq-training-play"><i>▶</i> {done?'Done':'Play'}</span></div></section>
 {/* Proof checkpoints: below the fold until chapter 9 scrolls to them. */}
 <div style={{opacity:capture.reveal,visibility:capture.reveal>0?'visible':'hidden'}}>
  <section className="iq-checkpoint"><b>5. Take a photo of the organized shelves.</b><ProofRequest kind="photo" captured={capture.photo} target="add-photo"/></section>
  <section className="iq-checkpoint"><b>6. Is the equipment working properly?</b><div className="iq-yes-options">{choice('Yes',false)}{choice('No',capture.answered,'no-5')}</div>
   <div className="iq-proof-reveal" style={{gridTemplateRows:`${capture.box}fr`,opacity:capture.box}}><div><ProofRequest kind="video" captured={capture.video} target="add-video"/></div></div></section>
 </div>
 </div></div><div className={`iq-blue-action${count===6?'':' is-disabled'}`}>Close</div></div>;
}
// In-app camera (Add Photo / Add Video). There is no gallery button: proof is
// captured live inside the mission, never picked from the device.
function CameraIcon({flash}){return flash?<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7Z"/></svg>:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><path d="M9 13.5a3 3 0 0 1 5.3-1.9M15 12.5a3 3 0 0 1-5.3 1.9M14.5 10v2h-2M9.5 16v-2h2"/></svg>;}
const PlayIcon=()=><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5Z"/></svg>;
const PauseIcon=()=><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>;
function ReviewPlayer({time=0,length=MOTION.rec,running=false}){return <div className="iq-review-player"><span className="iq-review-play">{running?<PauseIcon/>:<PlayIcon/>}</span><span className="iq-review-track"><i style={{left:`${Math.min(1,time/length)*100}%`}}/></span><time>00:0{Math.floor(Math.min(time,length))}</time></div>;}
// The review shows the recording's first frame.
const REC_START=CAPTURE.video.record-CAPTURE.video.open;
export function CaptureCamera({frame,playing,speed}){
 const {camera,live,flash,review,recording,rec}=frame.capture,isVideo=camera.kind==='video';
 // Handheld drift so the viewfinder reads as a live camera; it holds still once taken.
 const drift=review?0:1,dx=Math.sin(live*1.3)*6*drift,dy=Math.cos(live*.9)*4*drift;
 return <div className="iq-camera-screen">
  <header className="iq-camera-head"><span className="iq-camera-back"><IconBack/></span><b>Add {isVideo?'Video':'Photo'}</b></header>
  <div className={`iq-camera-view${review?' is-review':''}`}>
   <div className="iq-camera-feed" style={{transform:`translate(${dx}px,${dy}px) scale(${review?1:1.08})`}}>{isVideo?<DemoVideo time={review?REC_START:Math.max(0,live)} playing={playing&&!review} speed={speed}/>:<img src={SHELVING} alt="Live camera view of the shelves"/>}</div>
   {isVideo&&recording&&<span className="iq-camera-rec"><i/>00:0{rec}</span>}
   {isVideo&&review&&<span className="iq-review-bigplay"><PlayIcon/></span>}
   <span className="iq-camera-flash" style={{opacity:flash}}/>
  </div>
  {review?<footer className="iq-review-foot">{isVideo&&<ReviewPlayer/>}<div className="iq-review-actions">
   <span className="iq-review-next" data-iq-target="review-next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>Next</span>
   <span className="iq-review-retake"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12a7 7 0 1 0 2.1-5M5 4v4h4"/></svg>Retake</span></div></footer>
  :<footer className="iq-camera-bar"><span className="iq-camera-tool"><CameraIcon flash/></span>
   <span className={`iq-shutter-btn${isVideo?' is-video':''}${recording?' is-recording':''}`} data-iq-target={isVideo?'record':'shutter'} aria-label={isVideo?(recording?'Stop recording':'Record'):'Take photo'}><i/></span>
   <span className="iq-camera-tool"><CameraIcon/></span></footer>}
 </div>;
}
// A reopened proof (chapters 10-11): the attached photo or video, full width.
// `proof` = {kind:'photo'|'video', live: seconds since the video started}.
export function ProofViewer({proof,name=PROOF_FILES[proof.kind],photo=SHELVING,alt='Standard shelving: sealed, labeled containers in their designated places',playing,speed}){
 // The video plays its recorded seconds once and stops on the last frame;
 // the photo holds still.
 const {kind,live}=proof,video=kind==='video',t=Math.min(MOTION.rec,Math.max(0,live)),running=live>0&&live<MOTION.rec;
 return <div className="iq-camera-screen iq-proof-viewer">
  <header className="iq-camera-head iq-proof-viewer-head"><span className="iq-camera-back"><IconBack/></span><b>{name}</b></header>
  <div className="iq-proof-media"><div>{video?<DemoVideo time={REC_START+t} playing={playing&&running} speed={speed}/>:<img src={photo} alt={alt}/>}</div></div>
  {video&&<ReviewPlayer time={t} running={running}/>}
  <footer className="iq-proof-close"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>Close</span></footer>
 </div>;
}
// Rate Mission sidebar (chapter 13): the closed mission, a five-step slider
// (Poor … Excellent) and Submit Rate, which turns blue once the slider moves.
export function RateMission({frame}){
 const {panel,value,moved}=frame.rating,at=value/4*100;
 return <div className="iq-rate-layer"><aside className="iq-rate" aria-label="Rate Mission" style={{transform:`translateX(${(1-panel)*100}%)`}}>
  <header className="iq-rate-head"><span className="iq-rate-back"><IconBack/></span><b>Rate Mission</b></header>
  <section className="iq-rate-mission">
   <div className="iq-rate-kind"><img src="/mission-logo.png" alt=""/><span>Checklist</span><b>25</b><em>00:08:42</em><strong>01:22:15</strong></div>
   <h3>Opening Quality Check</h3><small>Ref: <b>Kitchen / Food Preparation</b></small><small className="iq-rate-by"><i>By</i> System User</small>
   <div className="iq-rate-who"><span>Anna F</span><time>09-23-26 04:12 PM</time></div>
  </section>
  <div className="iq-rate-body"><p>Rate this mission:</p><h4>{RATE_LABELS[Math.round(value)]}</h4>
   <div className="iq-rate-slider" data-iq-target="rate-slider"><span className="iq-rate-track"><i style={{width:`${at}%`}}/></span>{RATE_LABELS.map((l,i)=><span className="iq-rate-stop" key={l} style={{left:`${i*25}%`}}/>)}<span className="iq-rate-knob" style={{left:`${at}%`}}/></div>
  </div>
  <footer className="iq-rate-foot"><span className={moved?'is-ready':undefined} data-iq-target="rate-submit">Submit Rate</span></footer>
 </aside></div>;
}
// Chapter 14: a peer's rating, announced beside the card.
export function PeerBubble({person}){
 return <div className="iq-peer-bubble" style={{opacity:person.opacity,transform:`translate(-100%,-50%) translateX(${-10*(1-person.opacity)}px)`}}>
  <span className="iq-peer-avatar">{person.initials}</span><span><b>{person.name}</b> rated it <strong>{RATE_LABELS[person.score-1]}</strong></span><span className="iq-peer-score">{person.score}</span>
 </div>;
}
// Training content viewer, inside the phone: 1/2 Video, then 2/2 Quiz.
const QUIZ=['Items can be stored on the floor when the shelves are full.','Every container must be sealed and labeled with its contents and date.','Heavier items belong on the lower shelves.'];
function Arrow({down=false,off=false,target}){return <span className={`iq-viewer-arrow${off?' is-off':''}`} data-iq-target={target}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{down?<path d="M12 4v16M5 13l7 7 7-7"/>:<path d="M12 20V4M5 11l7-7 7 7"/>}</svg></span>;}
const clock=s=>`00:${String(Math.max(0,Math.ceil(s))).padStart(2,'0')}`;
export function TrainingViewer({frame,playing,speed}){
 const {page,video,answers}=frame.training,quiz=page>=.5,running=video>0&&video<MICRO.clip;
 return <div className="iq-viewer">
  <header className="iq-viewer-head"><span className="iq-viewer-back"><IconBack/></span><b>Mission Details</b></header>
  <div className="iq-viewer-card">
   <div className="iq-viewer-bar"><span><small>{quiz?2:1}/2</small><b>{quiz?'Quiz':'Video'}</b></span><span className="iq-viewer-arrows"><Arrow/><Arrow down off={quiz} target="viewer-next"/></span></div>
   <div className="iq-viewer-pages"><div className="iq-viewer-track" style={{transform:`translateY(${-50*page}%)`}}>
    <div className="iq-viewer-page iq-viewer-video"><DemoVideo src="/demo-quality/shelving-training.mp4" poster={SHELVING} time={video} playing={playing&&running} speed={speed}/></div>
    <div className="iq-viewer-page iq-viewer-quiz">{QUIZ.map((q,i)=><section key={q}><p><span>{i+1}.</span>{q}</p><div>{['True','False'].map((label,o)=>{const checked=i<answers&&QUIZ_ANSWERS[i]===o;return <span role="checkbox" aria-checked={checked} data-iq-target={`quiz-${i}-${o}`} key={label}><DemoCheckbox checked={checked}/>{label}</span>;})}</div></section>)}</div>
   </div></div>
   <span className="iq-viewer-dots" aria-hidden="true"><i className={quiz?'':'is-on'}/><i className={quiz?'is-on':''}/></span>
  </div>
  <footer className="iq-viewer-foot">
   <div className="iq-vplayer" style={{opacity:1-page}}><span className="iq-vplayer-play" aria-label={running?'Pause':'Play'}>{running?<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>:<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 3.5v17l15-8.5Z"/></svg>}</span><span className="iq-vplayer-track"><i style={{left:`${video/MICRO.clip*100}%`}}/></span><time>{clock(MICRO.clip-video)}</time></div>
   <div className="iq-viewer-submit" data-iq-target="viewer-submit" style={{opacity:page,visibility:page>0?'visible':'hidden'}}>Submit &amp; Done</div>
  </footer>
 </div>;
}
// The phone's team menu (chapter 16); it pops from the Menu button.
export function MobileMenu({pop=1}){return <div className="iq-phone-menu" style={{'--iq-menu-pop':pop}}><BoardMenu boardType="team" onDismiss={()=>{}} onNavigate={()=>{}} businessMediaLabel="Business Media"/></div>;}
// Business Proofs (chapters 16-17): each closed mission's header, then its
// photos in a three-column grid; the sixth tile shows how many more there are.
// Photos: public domain / CC0, self-hosted (npm run fetch:proofs).
function FolderIcon(){return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" aria-hidden="true"><path d="M1.8 3.5h4.3l1.3 1.6h6.8v7.4H1.8Z"/></svg>;}
function FunnelIcon(){return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 4h18l-7 8.2V19l-4 2v-8.8Z"/></svg>;}
export function BusinessProofs({scroll=0,tablet=false}){
 const list=useRef(null),[max,setMax]=useState(0);
 // Scroll range = list height beyond the window, measured once laid out.
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
