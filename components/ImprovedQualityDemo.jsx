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
import {KnowledgeBase,GuidedMission,TrainingPopup} from './ImprovedQualityPanels';
import {QUALITY_STORY,QUALITY_STORY_LENGTH,QUALITY_TEXT_SPEED,TRANSLATE_AT,HANDOFF,MICRO,LAYOUT,KNOWLEDGE,qualityStoryFrame,highlightPose,cameraAt,devicesAt,captionAt,ease,clamp} from '@/lib/improvedQualityStory.mjs';
import './EfficiencyStoryDemo.css';
import './ImprovedQualityDemo.css';

const label=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
const copy={
 en:{title:'Ice Maker Filter Check',instructions:'Please verify the ice maker IOMQ filter has been replaced.',alert:'Ensure the label is updated with the new replacement date.',link:'View filter replacement guide',claim:'Claim',category:'Operations',type:'Task'},
 es:{title:'Revisar Filtro Máquina de Hielo',instructions:'Por favor, verifica que el filtro IOMQ de la máquina de hielo haya sido reemplazado.',alert:'Asegúrate de que la etiqueta se actualice con la nueva fecha de reemplazo.',link:'Ver guía de reemplazo del filtro',claim:'Reclamar',category:'Operaciones',type:'Tarea'},
};
const BOARD_MISSIONS=['Ice Maker Filter Check','Opening Quality Check','Equipment Inspection'].map((title,i)=>({id:`quality-${i}`,type:i===1?'Checklist':'Task',title,status:'open',points:null,date:'08-02-26',time:'11:19 AM',ageSeconds:10563-i*180}));
const TARGETS={menu:'.tbl-header [aria-label="Menu"]',knowledge:'.bn-menu-item:has(img[src="/board-icons/team-book.svg"])',translate:'.om-translate',instructions:'.om-sum-desc',alert:'.om-notice',link:'.om-resource-link'};
// Words wait for the camera before typing inside the phone.
const TEXT_DELAY={instructions:HANDOFF.text,micro:MICRO.text};
const PHONE_TABS=[{label:'Open - 3',active:true},{label:'Claimed - 0'},{label:'Closed - 0'}];
function Mission({translated,statusBar=false}){
 const c=copy[translated?'es':'en'];
 return <OpenedMission showStatusBar={statusBar} mission={{...BOARD_MISSIONS[0],title:c.title,typeLabel:c.type,location:c.category,description:<>{c.instructions}<a className="om-resource-link" href="#filter-guide">{c.link} ↗</a></>,notice:c.alert,pillTime:'02:56:03',pillClass:'chip--red',claimLabel:c.claim}} translation={{language:translated?'EN':'ES',label:translated?'Translate to English':'Translate to Spanish'}}/>;
}
export default function ImprovedQualityDemo(){
 const [duration,setDuration]=useState(QUALITY_STORY_LENGTH);
 const {time:playerTime,playing,speed,toggle,replay,seek,cycleSpeed}=useDemoPlayback(duration);
 const player=useRef(null),stage=useRef(null),phone=useRef(null),rings=useRef([]);
 const editor=useDemoTextEditor('improved-quality',QUALITY_STORY,savedText,playerTime,stage);
 const time=editor.clock.originalTime;
 useEffect(()=>setDuration(editor.clock.duration),[editor.clock.duration]);
 const frame=qualityStoryFrame(time),{scene,elapsed,menu,knowledge,mission,translated,highlights}=frame;
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
 // The Knowledge Base sequence starts after the words have moved down.
 const kbFrame={...frame,elapsed:elapsed-KNOWLEDGE.shift,scene:{...scene,duration:scene.duration-KNOWLEDGE.shift}};
 const kbElapsed=elapsed-KNOWLEDGE.shift;
 const translationFade=scene.id==='translation'?1-.8*Math.sin(Math.PI*clamp((elapsed-TRANSLATE_AT+.15)/.3)):1;
 const spanish=translated||scene.number>6;
 // Purple rounded rectangles sit outside the camera, so their stroke never
 // scales; each frame they are fitted to their target, wherever it has moved.
 useLayoutEffect(()=>{
  const s=stage.current.getBoundingClientRect(),unit=s.width/1600;
  const scope=onPhone&&phone.current?phone.current:stage.current;
  highlights.forEach(({target},i)=>{
   const el=rings.current[i];if(!el)return;
   const node=scope.querySelector(TARGETS[target]||`[data-iq-target="${target}"]`);
   if(!node){el.style.visibility='hidden';return;}
   const r=node.getBoundingClientRect(),pad=7;
   Object.assign(el.style,{visibility:'visible',left:`${(r.left-s.left)/unit-pad}px`,top:`${(r.top-s.top)/unit-pad}px`,width:`${r.width/unit+pad*2}px`,height:`${r.height/unit+pad*2}px`});
  });
 },[time,highlights,onPhone,revision]);
 return <div className="page"><Navbar returnHome/><main className="ad-page"><header className="ad-head"><span className="ad-kicker">Product Demo</span><h1>Improved Quality</h1><p>Clear Standards. Accessible Knowledge. Precise Work.</p></header>
 <DemoTextContext.Provider value={{stageRef:stage,settings:editor.config.captions[scene.id]||{},text:scene.text,elapsed:editor.clock.elapsed,remaining:editor.clock.remaining,speed:QUALITY_TEXT_SPEED,defaultDelay:TEXT_DELAY[scene.id]??0}}>
 <div className="es-player iq-player demo-text-scope" ref={player}><style>{editor.uiStyles}</style><div className="ad-fit"><div ref={stage} className="ad-stage iq-stage" data-scene={scene.id} data-view={scene.view} onClick={e=>{if(!e.target.closest('button,a,input'))toggle();}} role="button" tabIndex={0} aria-label={playing?'Pause demo':'Play demo'} onKeyDown={e=>{if(e.target===e.currentTarget&&['Enter',' '].includes(e.key)){e.preventDefault();toggle();}}}>
  <Starfield className="ad-stars" paused={!playing} speed={speed} fitParent/>
  <div className="iq-camera" style={{transform:`translate(800px,450px) scale(${cam.s}) translate(${-cam.cx}px,${-cam.cy}px)`}}>
   {dev.handoff<1&&<div className="adx-tablet adx-tablet--engaged iq-tablet" style={{opacity:enter*(1-dev.handoff),transform:`translate(-50%,-50%) translateY(${dev.tabletLift*-70}px) scale(${LAYOUT.tablet.scale*(.94+.06*enter)*(1-.2*dev.handoff)})`,filter:enter<.98&&!dev.handoff?`blur(${(1-enter)*6}px)`:'none','--iq-menu-opacity':ease((kbElapsed-2.9)/.2)*(1-ease((kbElapsed-3.7)/.2)),'--iq-detail-opacity':dev.drawer,'--iq-detail-offset':`${(1-dev.drawer)*100}%`}} aria-hidden={!enter||onPhone}>
    <InteractiveMissionBoard device="tablet" referenceLayout initialScreen="board" initialMissions={BOARD_MISSIONS}
     demoState={{missions:BOARD_MISSIONS,elapsed:0,selected:mission?'quality-0':null,menuOpen:menu,boardTitle:'Team Board',businessMediaLabel:'Media Proofs'}} demoOverlay={knowledge?<KnowledgeBase frame={kbFrame}/>:null}
     demoDetail={<div className="mi-detail-inner"><Mission translated={false}/></div>}/>
   </div>}
   {onPhone&&<div ref={phone} className="ph-fit iq-phone-main" style={{opacity:dev.phoneOpacity,transform:`translateY(${dev.phoneFrom*60*(1-dev.phone)}px) scale(${.88+.12*dev.phone})`,filter:dev.phone<.98?`blur(${(1-dev.phone)*8}px)`:'none'}}>
    <PhoneShell title="Team Board" tabs={PHONE_TABS} overlay={<div className="iq-phone-stack">
     {dev.guided?<div className="iq-phone-screen iq-phone-panel"><div className="ph-status" aria-hidden="true"/><GuidedMission frame={frame}/></div>
      :<div className="iq-phone-screen mi-detail-inner" lang={spanish?'es':'en'}><div className="iq-phone-fade" style={{opacity:translationFade}}><Mission translated={spanish} statusBar/></div></div>}
    </div>}/>
   </div>}
   {dev.popup>0&&<div className="iq-side-popup" style={{transform:`translateX(${-110*(1-dev.popup)}px) scale(${.55+.45*dev.popup})`}}><TrainingPopup frame={frame} playing={playing} speed={speed}/></div>}
  </div>
  {opening?<DemoTypedText className="es-title" lineBeats text={scene.text} elapsed={elapsed*QUALITY_TEXT_SPEED} remaining={scene.end-time} center/>:<div className="iq-caption" style={{left:caption.left,top:caption.top,width:caption.width,transform:`translate(-50%,${caption.yp}%)`}}><DemoTypedText key={scene.id} lineBeats text={scene.text} elapsed={(elapsed-(TEXT_DELAY[scene.id]??0))*QUALITY_TEXT_SPEED} remaining={scene.id==='micro'?Infinity:scene.end-time} center/></div>}
  {highlights.map((h,i)=>{const pose=highlightPose(elapsed,h);return <span key={`${scene.id}-${h.target}`} ref={el=>{rings.current[i]=el;}} className="iq-highlight" style={{opacity:pose.opacity,transform:`scale(${pose.scale})`,'--iq-highlight-fill':pose.fill}} aria-hidden="true"/>;})}
 </div></div><div className="ad-controls es-controls"><button onClick={toggle}>{playing?'Pause':playerTime>=duration?'Replay':'Play'}</button><button onClick={replay}>Restart</button><input type="range" className="ad-scrub" aria-label="Seek demo" min="0" max={duration} step=".05" value={playerTime} onChange={seek} style={{'--fill':`${playerTime/duration*100}%`}}/><span>{label(playerTime)} / {label(duration)}</span><button onClick={cycleSpeed} aria-label={`Playback speed: ${speed}×`}>{speed}×</button><button onClick={()=>document.fullscreenElement?document.exitFullscreen():player.current.requestFullscreen()}>Fullscreen</button></div></div>
 </DemoTextContext.Provider>
 <DemoTextEditor editor={editor} seek={seek} toggle={toggle} playing={playing} baseSpeed={QUALITY_TEXT_SPEED}/>
 <nav className="es-chapters" aria-label="Demo chapters">{editor.clock.timeline.map((s,i)=><button key={s.id} aria-current={scene.id===s.id?'step':undefined} onClick={()=>seek({target:{value:s.start}})}><span>{String(i+1).padStart(2,'0')}</span>{s.text}</button>)}</nav>
 </main></div>;
}
