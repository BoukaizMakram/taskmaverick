'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import Navbar from './Navbar';
import DemoTypedText from './DemoTypedText';
import Starfield from './Starfield';
import useDemoPlayback from './useDemoPlayback';
import InteractiveMissionBoard from './InteractiveMissionBoard';
import {OpenedMission} from './OpenedMission';
import PhoneShell from './PhoneShell';
import {KnowledgeBase,GuidedMission,TrainingPopup,CapturePanel,EvidenceZoom,RatingsPanel,EvidenceFeed,MobileMenu,WebGallery} from './ImprovedQualityPanels';
import {QUALITY_STORY,QUALITY_STORY_LENGTH,QUALITY_TEXT_SPEED,qualityStoryFrame,ease,clamp} from '@/lib/improvedQualityStory.mjs';
import './EfficiencyStoryDemo.css';
import './ImprovedQualityDemo.css';

const label=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
const mix=(a,b,p)=>a+(b-a)*p;
const copy={
 en:{title:'Ice Maker Filter Check',instructions:'Please verify the ice maker IOMQ filter has been replaced.',alert:'Ensure the label is updated with the new replacement date.',link:'View filter replacement guide',claim:'Claim',category:'Operations',type:'Task'},
 es:{title:'Revisar Filtro Máquina de Hielo',instructions:'Por favor, verifica que el filtro IOMQ de la máquina de hielo haya sido reemplazado.',alert:'Asegúrate de que la etiqueta se actualice con la nueva fecha de reemplazo.',link:'Ver guía de reemplazo del filtro',claim:'Reclamar',category:'Operaciones',type:'Tarea'},
};
const BOARD_MISSIONS=['Ice Maker Filter Check','Opening Quality Check','Equipment Inspection'].map((title,i)=>({id:`quality-${i}`,type:i===1?'Checklist':'Task',title,status:'open',points:null,date:'08-02-26',time:'11:19 AM',ageSeconds:10563-i*180}));
const TARGETS={menu:'.tbl-header [aria-label="Menu"]',knowledge:'.bn-menu-item:has(img[src="/board-icons/team-book.svg"])',mission:'[data-mission-id="quality-0"]',instructions:'.om-sum-desc',alert:'.om-notice',link:'.om-resource-link',translate:'.om-translate'};
function Mission({translated}){
 const c=copy[translated?'es':'en'];
 return <OpenedMission showStatusBar={false} mission={{...BOARD_MISSIONS[0],title:c.title,typeLabel:c.type,location:c.category,description:<>{c.instructions}<a className="om-resource-link" href="#filter-guide">{c.link} ↗</a></>,notice:c.alert,pillTime:'02:56:03',pillClass:'chip--red',claimLabel:c.claim}} translation={{language:translated?'EN':'ES',label:translated?'Translate to English':'Translate to Spanish'}}/>;
}
export default function ImprovedQualityDemo(){
 const {time,playing,speed,toggle,replay,seek,cycleSpeed}=useDemoPlayback(QUALITY_STORY_LENGTH);
 const frame=qualityStoryFrame(time),{scene,elapsed,menu,knowledge,mission,translated,target,actionAt}=frame;
 const player=useRef(null),stage=useRef(null),ring=useRef(null);
 const [revision,setRevision]=useState(0);
 useEffect(()=>{
  let windowedScale;
  const resize=()=>{const scale=stage.current.getBoundingClientRect().width/1600;if(document.fullscreenElement!==player.current||windowedScale==null)windowedScale=scale;stage.current.style.setProperty('--iq-caption-size',`${19/windowedScale}px`);setRevision(r=>r+1);};
  resize();const observer=new ResizeObserver(resize);observer.observe(stage.current.parentElement);document.addEventListener('fullscreenchange',resize);window.addEventListener('resize',resize);
  return()=>{observer.disconnect();document.removeEventListener('fullscreenchange',resize);window.removeEventListener('resize',resize);};
 },[]);
 const opening=scene.view==='title',mobile=scene.view==='mobile',web=scene.view==='web';
 const mobileElapsed=time-QUALITY_STORY.find(s=>s.id==='mobile').start;
 const webElapsed=time-QUALITY_STORY.find(s=>s.id==='gallery').start;
 const tabletProofs=scene.id==='evidence'&&elapsed>=1.8;
 const enter=tabletProofs?ease((elapsed-1.8)/.4):ease((time-QUALITY_STORY[1].start-2.1)/.6)*(opening||mobile||web?0:1);
 const missionFade=ease((time-QUALITY_STORY[2].start-.65)/.4);
 const translationFade=scene.id==='translation'?1-.8*Math.sin(Math.PI*clamp((elapsed-2.15)/.3)):1;
 useLayoutEffect(()=>{
  const element=target&&stage.current.querySelector(TARGETS[target]||`[data-iq-target="${target}"]`);
  if(!element||opening){ring.current.style.opacity=0;return;}
  const s=stage.current.getBoundingClientRect(),r=element.getBoundingClientRect(),unit=s.width/1600;
  const focus=ease((elapsed-actionAt+.55)/.3);
  ring.current.style.cssText=`left:${(r.left-s.left)/unit-7}px;top:${(r.top-s.top)/unit-7}px;width:${r.width/unit+14}px;height:${r.height/unit+14}px;opacity:${focus*(scene.id==='translation'?1-ease((elapsed-3.1)/.4):1)};`;
 },[time,target,actionAt,elapsed,opening,revision]);
 const captionPose=scene.id==='knowledge'?{left:mix(800,620,enter),top:mix(450,695,enter),width:mix(1400,610,enter)}
  :tabletProofs?{left:800,top:835,width:1200}:mobile?{left:470,top:430,width:590}:web?{left:800,top:806,width:1350}:scene.view==='capture'?{left:1045,top:465,width:430}:['photo','video'].includes(scene.view)?{left:800,top:758,width:1050}:{left:590,top:700,width:550};
 const closed=scene.number>=13;
 const boardMissions=closed?BOARD_MISSIONS.map((m,i)=>i<2?{...m,status:'closed',performer:i?'Anna F. - Staff':'Ben R. - Staff',showPerformerName:true,stopped:0,executionSeconds:68+i*22}:m):scene.number>=7?BOARD_MISSIONS.map((m,i)=>i===1?{...m,status:'claimed',performer:'Anna F. - Staff',performerAvatar:'/avatars/01.png',executionSeconds:42}:m):BOARD_MISSIONS;
 const customDetail=scene.view==='guided'?<GuidedMission frame={frame} playing={playing} speed={speed}/>:scene.view==='capture'?<CapturePanel frame={frame} playing={playing} speed={speed}/>:scene.view==='ratings'?<RatingsPanel frame={frame}/>:null;
 const overlay=tabletProofs?<div className="iq-tablet-proofs"><EvidenceFeed frame={frame} tablet/></div>:knowledge?<KnowledgeBase frame={frame}/>:['photo','video'].includes(scene.view)?<div className="iq-evidence-overlay"><div className="mi-drawer-shade"/><EvidenceZoom frame={frame} playing={playing} speed={speed}/></div>:['micro','quiz'].includes(scene.id)?<TrainingPopup frame={frame} playing={playing} speed={speed}/>:null;
 return <div className="page"><Navbar returnHome/><main className="ad-page"><header className="ad-head"><span className="ad-kicker">Product Demo</span><h1>Improved Quality</h1><p>Clear Standards. Accessible Knowledge. Precise Work.</p></header>
 <div className="es-player iq-player" ref={player}><div className="ad-fit"><div ref={stage} className="ad-stage iq-stage" data-scene={scene.id} data-view={scene.view} onClick={e=>{if(!e.target.closest('button,a,input'))toggle();}} role="button" tabIndex={0} aria-label={playing?'Pause demo':'Play demo'} onKeyDown={e=>{if(e.target===e.currentTarget&&['Enter',' '].includes(e.key)){e.preventDefault();toggle();}}}>
  <Starfield className="ad-stars" paused={!playing} speed={speed} fitParent/>
  <div className="adx-tablet adx-tablet--engaged iq-tablet" style={{opacity:enter,transform:`translate(-50%,-50%) translateY(${(1-enter)*-45}px) scale(${1.3*(.96+.04*enter)})`,'--iq-menu-opacity':scene.id==='visibility'?ease(elapsed/.3):ease((elapsed-2.9)/.2)*(1-ease((elapsed-3.7)/.2)),'--iq-detail-opacity':customDetail?1:missionFade,'--iq-detail-offset':`${customDetail?0:(1-missionFade)*100}%`}} aria-hidden={!enter}>
   <InteractiveMissionBoard device="tablet" referenceLayout initialScreen="board" initialMissions={BOARD_MISSIONS}
    demoState={{missions:boardMissions,elapsed:0,selected:mission||customDetail?(customDetail?'quality-1':'quality-0'):null,menuOpen:menu,boardTitle:'Team Board',businessMediaLabel:'Media Proofs'}} demoOverlay={overlay}
    demoDetail={customDetail||<div className="mi-detail-inner" lang={translated?'es':'en'} style={{opacity:translationFade}}><Mission translated={translated}/></div>}/>
  </div>
  {mobile&&!tabletProofs&&<div className="ph-fit iq-phone" style={{opacity:ease(mobileElapsed/.35)*(scene.id==='evidence'?1-ease((elapsed-1.45)/.35):1),transform:`translateY(${22*(1-ease(mobileElapsed/.35))}px)`}}><PhoneShell title="Team Board" overlay={scene.id==='evidence'||elapsed>=1.2?<div className="iq-mobile-content"><EvidenceFeed frame={frame}/></div>:null} viewer={scene.id==='mobile'&&elapsed<1.2?<MobileMenu/>:null}/></div>}
  {web&&<div className="iq-web-device" style={{opacity:ease(webElapsed/.3),transform:`scale(${1+.025*ease((webElapsed-.4)/.5)})`}}><WebGallery frame={frame}/></div>}
  {opening?<DemoTypedText className="es-title" lineBeats text={scene.text} elapsed={elapsed*QUALITY_TEXT_SPEED} remaining={scene.id==='conclusion'?Infinity:scene.end-time} center/>:<div className="iq-caption" style={captionPose}><DemoTypedText key={scene.id} lineBeats text={scene.text} elapsed={elapsed*QUALITY_TEXT_SPEED} remaining={scene.end-time} center/></div>}
  <div ref={ring} className="iq-focus-ring" aria-hidden="true"/>
 </div></div><div className="ad-controls es-controls"><button onClick={toggle}>{playing?'Pause':time>=QUALITY_STORY_LENGTH?'Replay':'Play'}</button><button onClick={replay}>Restart</button><input type="range" className="ad-scrub" aria-label="Seek demo" min="0" max={QUALITY_STORY_LENGTH} step=".05" value={time} onChange={seek} style={{'--fill':`${time/QUALITY_STORY_LENGTH*100}%`}}/><span>{label(time)} / {label(QUALITY_STORY_LENGTH)}</span><button onClick={cycleSpeed} aria-label={`Playback speed: ${speed}×`}>{speed}×</button><button onClick={()=>document.fullscreenElement?document.exitFullscreen():player.current.requestFullscreen()}>Fullscreen</button></div></div>
 <nav className="es-chapters" aria-label="Demo chapters">{QUALITY_STORY.map((s,i)=><button key={s.id} aria-current={scene.id===s.id?'step':undefined} onClick={()=>seek({target:{value:s.start}})}><span>{String(i+1).padStart(2,'0')}</span>{s.text}</button>)}</nav>
 </main></div>;
}
