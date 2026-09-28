'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import Navbar from './Navbar';
import DemoTypedText from './DemoTypedText';
import DemoTextEditor from './DemoTextEditor';
import {DemoTextContext} from './DemoTextContext';
import useDemoTextEditor from './useDemoTextEditor';
import savedText from '@/content/demo-text/improved-quality.json';
import Starfield from './Starfield';
import useDemoPlayback from './useDemoPlayback';
import InteractiveMissionBoard from './InteractiveMissionBoard';
import {OpenedMission} from './OpenedMission';
import PhoneShell from './PhoneShell';
import MissionChip from './MissionChip';
import UsageReport from './UsageReport';
import {KnowledgeBase,GuidedMission,TrainingViewer,CaptureCamera,ProofViewer,RateMission,PeerBubble,MobileMenu,BusinessProofs} from './ImprovedQualityPanels';
import {QUALITY_STORY,QUALITY_STORY_LENGTH,QUALITY_TEXT_SPEED,TRANSLATE_AT,TEXT_AT,LAYOUT,qualityStoryFrame,highlightPose,cameraAt,devicesAt,captionAt,clamp} from '@/lib/improvedQualityStory.mjs';
import './EfficiencyStoryDemo.css';
import './ImprovedQualityDemo.css';

const label=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
const copy={
 en:{title:'Ice Maker Filter Check',instructions:'Please verify the ice maker IOMQ filter has been replaced.',alert:'Ensure the label is updated with the new replacement date.',link:'View filter replacement guide',claim:'Claim',category:'Operations',type:'Task'},
 es:{title:'Revisar Filtro Máquina de Hielo',instructions:'Por favor, verifica que el filtro IOMQ de la máquina de hielo haya sido reemplazado.',alert:'Asegúrate de que la etiqueta se actualice con la nueva fecha de reemplazo.',link:'Ver guía de reemplazo del filtro',claim:'Reclamar',category:'Operaciones',type:'Tarea'},
};
const BOARD_MISSIONS=['Ice Maker Filter Check','Opening Quality Check','Equipment Inspection'].map((title,i)=>({id:`quality-${i}`,type:i===1?'Checklist':'Task',title,status:'open',points:null,date:'08-02-26',time:'11:19 AM',ageSeconds:10563-i*180}));
const RATED='[data-mission-id="emphasis-Opening Quality Check"]';
const TARGETS={'tablet-menu':'.iq-emphasis-tablet .tbl-header [aria-label="Menu"]','phone-menu':'.ph-header [aria-label="Menu"]','rate-0':`${RATED} .chip-rate`,'ratings-0':`${RATED} .chip-ratings`,'mission-card':'[data-mission-id="quality-0"]',menu:'.tbl-header [aria-label="Menu"]',knowledge:'.bn-menu-item:has(img[src="/board-icons/team-book.svg"])',translate:'.om-translate',instructions:'.om-sum-desc',alert:'.om-notice',link:'.om-resource-link'};
// Words start once each chapter's scene has settled (see TEXT_AT).
const TEXT_DELAY=TEXT_AT;
// Chapter 12 Team Board: only the four closed missions (frozen timers, gray
// pills) that can be rated; Open and Claimed stay empty for the words.
const mission=(title,type,points,rest)=>({id:`emphasis-${title}`,title,type,points,date:'09-23-26',...rest});
const EMPHASIS_MISSIONS=[
 ...[['Opening Quality Check','Checklist',25,'Anna F',522,4935,'04:12 PM'],['Ice Maker Filter Check','Task',20,'Anna F',190,5102,'04:03 PM'],['Fry Dispenser Cleaning','Checklist',25,'Gabriel F',77,4925,'11:51 AM'],['Brew Coffee','Task',10,'Gabriel F',23,5111,'11:49 AM']]
  .map(([title,type,points,performer,executionSeconds,ageSeconds,time],i)=>mission(title,type,points,{status:'closed',stopped:4-i,performer,executionSeconds,ageSeconds,time,rateable:true})),
];
const PROOF_TABS=[{label:'Open - 0'},{label:'Claimed - 0'},{label:'Closed - 4',active:true}];
const clockOf=s=>[s/3600,s/60%60,s%60].map(n=>String(Math.floor(n)).padStart(2,'0')).join(':');
const PHONE_TABS=[{label:'Open - 3',active:true},{label:'Claimed - 0'},{label:'Closed - 0'}];
function Mission({translated,statusBar=false}){
 const c=copy[translated?'es':'en'];
 return <OpenedMission showStatusBar={statusBar} mission={{...BOARD_MISSIONS[0],title:c.title,typeLabel:c.type,location:c.category,description:<>{c.instructions}<a className="om-resource-link" href="#filter-guide">{c.link} ↗</a></>,notice:c.alert,pillTime:'02:56:03',pillClass:'chip--red',claimLabel:c.claim}} translation={{language:translated?'EN':'ES',label:translated?'Translate to English':'Translate to Spanish'}}/>;
}
export default function ImprovedQualityDemo(){
 const [duration,setDuration]=useState(QUALITY_STORY_LENGTH);
 const {time:playerTime,playing,speed,toggle,replay,seek,cycleSpeed}=useDemoPlayback(duration);
 const player=useRef(null),stage=useRef(null),phone=useRef(null),rings=useRef([]),captionBox=useRef(null);
 const editor=useDemoTextEditor('improved-quality',QUALITY_STORY,savedText,playerTime,stage);
 const time=editor.clock.originalTime;
 useEffect(()=>setDuration(editor.clock.duration),[editor.clock.duration]);
 const frame=qualityStoryFrame(time),{scene,elapsed,menu,knowledge,translated,highlights}=frame;
 const cam=cameraAt(time),dev=devicesAt(time),caption=captionAt(time);
 const [revision,setRevision]=useState(0);
 useEffect(()=>{
  let windowedScale;
  const resize=()=>{const scale=stage.current.getBoundingClientRect().width/1600;if(document.fullscreenElement!==player.current||windowedScale==null)windowedScale=scale;stage.current.style.setProperty('--iq-caption-size',`${19/windowedScale}px`);setRevision(r=>r+1);};
  resize();const observer=new ResizeObserver(resize);observer.observe(stage.current.parentElement);document.addEventListener('fullscreenchange',resize);window.addEventListener('resize',resize);
  return()=>{observer.disconnect();document.removeEventListener('fullscreenchange',resize);window.removeEventListener('resize',resize);};
 },[]);
 const opening=scene.view==='title';
 const onPhone=dev.phoneOpacity>0;
 const enter=opening?0:dev.tabletIn;
 // Chapters 13-14: ratings land on Opening Quality Check.
 const ratedMissions=EMPHASIS_MISSIONS.map(m=>m.title==='Opening Quality Check'?{...m,ratings:frame.rating.ratings}:m);
 const translationFade=scene.id==='translation'?1-.8*Math.sin(Math.PI*clamp((elapsed-TRANSLATE_AT+.15)/.3)):1;
 const spanish=translated||scene.number>6;
 // Captions keep one screen size, so on a small stage the words could outgrow
 // the phone screen; shrink them to fit their box when that happens.
 useLayoutEffect(()=>{
  const box=captionBox.current,p=box?.querySelector('p');if(!p)return;
  box.style.setProperty('--iq-caption-fit',Math.min(1,caption.width*.92/Math.max(1,p.offsetWidth)));
 },[time,caption.width,revision]);
 // Purple rounded rectangles sit outside the camera, so their stroke never
 // scales; each frame they are fitted to their target, wherever it has moved.
 useLayoutEffect(()=>{
  const fit=()=>{
   if(!stage.current)return;
   const s=stage.current.getBoundingClientRect(),unit=s.width/1600;
   const scope=onPhone&&phone.current?phone.current:stage.current;
   highlights.forEach(({target},i)=>{
    const el=rings.current[i];if(!el)return;
    const node=scope.querySelector(TARGETS[target]||`[data-iq-target="${target}"]`);
    if(!node){el.style.visibility='hidden';return;}
    const r=node.getBoundingClientRect(),pad=7;
    Object.assign(el.style,{visibility:'visible',left:`${(r.left-s.left)/unit-pad}px`,top:`${(r.top-s.top)/unit-pad}px`,width:`${r.width/unit+pad*2}px`,height:`${r.height/unit+pad*2}px`});
   });
  };
  // Fit now, and again next frame: a target can settle one render later
  // (e.g. the checklist's measured scroll after a seek while paused).
  fit();const frame=requestAnimationFrame(fit);
  return()=>cancelAnimationFrame(frame);
 },[time,highlights,onPhone,revision]);
 return <div className="page"><Navbar returnHome/><main className="ad-page"><header className="ad-head"><span className="ad-kicker">Product Demo</span><h1>Improved Quality</h1><p>Clear Standards. Accessible Knowledge. Precise Work.</p></header>
 <DemoTextContext.Provider value={{stageRef:stage,settings:editor.config.captions[scene.id]||{},text:scene.text,elapsed:editor.clock.elapsed,remaining:editor.clock.remaining,speed:QUALITY_TEXT_SPEED,defaultDelay:TEXT_DELAY[scene.id]??0}}>
 <div className="es-player iq-player demo-text-scope" ref={player}><style>{editor.uiStyles}</style><div className="ad-fit"><div ref={stage} className="ad-stage iq-stage" data-scene={scene.id} data-view={scene.view} onClick={e=>{if(!e.target.closest('button,a,input'))toggle();}} role="button" tabIndex={0} aria-label={playing?'Pause demo':'Play demo'} onKeyDown={e=>{if(e.target===e.currentTarget&&['Enter',' '].includes(e.key)){e.preventDefault();toggle();}}}>
  <Starfield className="ad-stars" paused={!playing} speed={speed} fitParent/>
  <div className="iq-camera" style={{transform:`translate(800px,450px) scale(${cam.s}) translate(${-cam.cx}px,${-cam.cy}px)`}}>
   {/* Chapters 2-6. In chapter 3 the tablet fades away (--iq-device) and only
       its mission drawer stays, floating beside the words. */}
   {dev.tabletShown&&<div className="adx-tablet adx-tablet--engaged iq-tablet" style={{opacity:enter*dev.tabletOpacity,transform:`translate(-50%,-50%) translateY(${dev.tabletLift*-70}px) scale(${LAYOUT.tablet.scale*(.94+.06*enter)})`,filter:enter<.98?`blur(${(1-enter)*6}px)`:'none','--iq-device':1-dev.handoff,'--iq-menu-pop':frame.kb.menuPop,'--iq-detail-opacity':dev.drawer,'--iq-detail-offset':`${(1-dev.drawer)*100}%`}} aria-hidden={!enter||onPhone}>
    <InteractiveMissionBoard device="tablet" referenceLayout initialScreen="board" initialMissions={BOARD_MISSIONS}
     demoState={{missions:BOARD_MISSIONS,elapsed:0,selected:dev.drawer>0?'quality-0':null,menuOpen:menu,boardTitle:'Team Board',businessMediaLabel:'Business Media'}} demoOverlay={knowledge?<KnowledgeBase frame={frame}/>:null}
     demoDetail={<div className="mi-detail-inner" lang={spanish?'es':'en'}><div className="iq-phone-fade" style={{opacity:translationFade}}><Mission translated={spanish}/></div></div>}/>
   </div>}
   {dev.board>0&&dev.boardOut<1&&<div className="adx-tablet adx-tablet--engaged iq-tablet iq-emphasis-tablet" style={{'--iq-menu-pop':frame.visibility.pop,opacity:Math.min(1,dev.board*1.6)*(1-dev.boardOut),transform:`translate(-50%,-50%) scale(${LAYOUT.tablet.scale*(.86+.14*dev.board)})`,filter:dev.board<.98?`blur(${(1-dev.board)*6}px)`:'none'}}>
    <InteractiveMissionBoard device="tablet" referenceLayout initialScreen="board" initialMissions={EMPHASIS_MISSIONS} demoState={{missions:ratedMissions,elapsed:0,selected:null,menuOpen:frame.visibility.menu,boardTitle:'Team A',businessMediaLabel:'Business Media'}} demoOverlay={frame.rating.panel>0?<RateMission frame={frame}/>:frame.visibility.proofsIn>0?<div className="iq-bp-layer" style={{opacity:Math.min(1,frame.visibility.proofsIn*1.5),transform:`translateX(${4*(1-frame.visibility.proofsIn)}%)`}}><BusinessProofs tablet scroll={frame.visibility.scroll}/></div>:null}/>
   </div>}
   {/* Chapters 18-21: the web Usage Report, centered at (800,372) at 0.9 scale. */}
   {dev.web>0&&dev.webOut<1&&<div className="iq-report-window" style={{opacity:Math.min(1,dev.web*1.5)*(1-dev.webOut),transform:`translate(${800-800*.9*(.94+.06*dev.web)}px,${372-380*.9*(.94+.06*dev.web)}px) scale(${.9*(.94+.06*dev.web)})`}}><UsageReport web={frame.web}/></div>}
   {/* Chapter 14: peer ratings, announced left of the rated card (camera coords). */}
   {frame.rating.bubbles.map(p=>p.opacity>0&&<div className="iq-peer-anchor" key={p.initials}><PeerBubble person={p}/></div>)}
   {onPhone&&<div ref={phone} className="ph-fit iq-phone-main" style={{opacity:dev.phoneOpacity,transform:`translateY(${dev.phoneFrom*60*(1-dev.phone)}px) scale(${.88+.12*dev.phone})`,filter:dev.phone<.98?`blur(${(1-dev.phone)*8}px)`:'none'}}>
    {/* Chapters 16-17: the same Team A board, its menu, then Business Proofs. */}
    {['proofs','web'].includes(scene.view)?<PhoneShell title="Team A" tabs={PROOF_TABS} overlay={<div className="iq-phone-stack">
     {frame.proofs.menu&&<MobileMenu pop={frame.proofs.menuPop}/>}
     {frame.proofs.in>0&&<div className="iq-phone-screen iq-phone-panel" style={{transform:`translateX(${100*(1-frame.proofs.in)}%)`}}><div className="ph-status" aria-hidden="true"/><BusinessProofs scroll={frame.proofs.scroll}/></div>}
    </div>}>{ratedMissions.filter(m=>m.status==='closed').map(m=><MissionChip key={m.id} kind={m.type} points={m.points} title={m.title} who={m.performer} date={m.date} time={m.time} showExec execTime={clockOf(m.executionSeconds)} pillTime={clockOf(m.ageSeconds)} pillClass="chip--gray" rate ratings={m.ratings}/>)}</PhoneShell>
    :<PhoneShell title="Team Board" tabs={PHONE_TABS} overlay={<div className="iq-phone-stack">
     {dev.guided?<div className="iq-phone-screen iq-phone-panel" style={{transform:`translateX(${-25*Math.max(frame.training.in,frame.capture.camera.in,frame.proof.in)}%)`}}><div className="ph-status" aria-hidden="true"/><GuidedMission frame={frame}/></div>
      :<div className="iq-phone-screen mi-detail-inner" lang={spanish?'es':'en'}><div className="iq-phone-fade" style={{opacity:translationFade}}><Mission translated={spanish} statusBar/></div></div>}
     {frame.training.in>0&&<div className="iq-phone-screen iq-phone-panel" style={{transform:`translateX(${100*(1-frame.training.in)}%)`}}><div className="ph-status" aria-hidden="true"/><TrainingViewer frame={frame} playing={playing} speed={speed}/></div>}
     {frame.capture.camera.in>0&&<div className="iq-phone-screen iq-phone-panel" style={{transform:`translateX(${100*(1-frame.capture.camera.in)}%)`}}><div className="ph-status" aria-hidden="true"/><CaptureCamera frame={frame} playing={playing} speed={speed}/></div>}
     {frame.proof.in>0&&<div className="iq-phone-screen iq-phone-panel" style={{transform:`translateX(${100*(1-frame.proof.in)}%)`}}><div className="ph-status" aria-hidden="true"/><ProofViewer proof={frame.proof} playing={playing} speed={speed}/></div>}
    </div>}/>}
   </div>}
  </div>
  {opening?<DemoTypedText className="es-title" lineBeats text={scene.text} elapsed={elapsed*QUALITY_TEXT_SPEED} remaining={scene===QUALITY_STORY.at(-1)?Infinity:scene.end-time} center/>:<div ref={captionBox} className="iq-caption" style={{left:caption.left,top:caption.top,width:caption.width,opacity:Math.min(1,caption.opacity??1),transform:`translate(-50%,${caption.yp}%)`}}><DemoTypedText key={scene.id} lineBeats text={scene.text} elapsed={(elapsed-(TEXT_DELAY[scene.id]??0))*QUALITY_TEXT_SPEED} remaining={scene===QUALITY_STORY.at(-1)?Infinity:scene.end-time} center/></div>}
  {highlights.map((h,i)=>{const pose=highlightPose(elapsed,h);return <span key={`${scene.id}-${i}`} ref={el=>{rings.current[i]=el;}} className="iq-highlight" style={{opacity:pose.opacity,transform:`scale(${pose.scale})`,'--iq-highlight-fill':pose.fill}} aria-hidden="true"/>;})}
 </div></div><div className="ad-controls es-controls"><button onClick={toggle}>{playing?'Pause':playerTime>=duration?'Replay':'Play'}</button><button onClick={replay}>Restart</button><input type="range" className="ad-scrub" aria-label="Seek demo" min="0" max={duration} step=".05" value={playerTime} onChange={seek} style={{'--fill':`${playerTime/duration*100}%`}}/><span>{label(playerTime)} / {label(duration)}</span><button onClick={cycleSpeed} aria-label={`Playback speed: ${speed}×`}>{speed}×</button><button onClick={()=>document.fullscreenElement?document.exitFullscreen():player.current.requestFullscreen()}>Fullscreen</button></div></div>
 </DemoTextContext.Provider>
 <DemoTextEditor editor={editor} seek={seek} toggle={toggle} playing={playing} baseSpeed={QUALITY_TEXT_SPEED}/>
 <nav className="es-chapters" aria-label="Demo chapters">{editor.clock.timeline.map((s,i)=><button key={s.id} aria-current={scene.id===s.id?'step':undefined} onClick={()=>seek({target:{value:s.start}})}><span>{String(i+1).padStart(2,'0')}</span>{s.text}</button>)}</nav>
 </main></div>;
}
