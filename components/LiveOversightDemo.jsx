'use client';
// Live Oversight film: the web Overview (Team Board) and the Data Board report,
// played like the Improved Quality film (same stage, camera, captions, press
// rings and pacing rules). Timing lives in lib/liveOversightStory.mjs.
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import Navbar from './Navbar';
import DemoTypedText from './DemoTypedText';
import DemoTextEditor from './DemoTextEditor';
import {DemoTextContext} from './DemoTextContext';
import useDemoTextEditor from './useDemoTextEditor';
import savedText from '@/content/demo-text/live-oversight.json';
import Starfield from './Starfield';
import useDemoPlayback from './useDemoPlayback';
import OverviewScene from './OverviewScene';
import DataReport from './DataReport';
import UsageReport,{ReportTree} from './UsageReport';
import {reportTree,REPORT_GROUPS} from '@/lib/liveOversightData.mjs';
import {OVERSIGHT_STORY,OVERSIGHT_LENGTH,OVERSIGHT_TEXT_SPEED,TEXT_AT,oversightFrame,highlightPose,cameraAt,devicesAt,captionAt} from '@/lib/liveOversightStory.mjs';
import './EfficiencyStoryDemo.css';
import './ImprovedQualityDemo.css';
import './LiveOversightDemo.css';

const label=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
export default function LiveOversightDemo(){
 const [duration,setDuration]=useState(OVERSIGHT_LENGTH);
 const {time:playerTime,playing,speed,toggle,replay,seek,cycleSpeed}=useDemoPlayback(duration);
 const player=useRef(null),stage=useRef(null),overview=useRef(null),report=useRef(null),usage=useRef(null),rings=useRef([]),captionBox=useRef(null);
 const editor=useDemoTextEditor('live-oversight',OVERSIGHT_STORY,savedText,playerTime,stage);
 const time=editor.clock.originalTime;
 useEffect(()=>setDuration(editor.clock.duration),[editor.clock.duration]);
 const frame=oversightFrame(time),{scene,elapsed,highlights}=frame;
 const cam=cameraAt(time),dev=devicesAt(time),caption=captionAt(time);
 const [revision,setRevision]=useState(0);
 useEffect(()=>{
  let windowedScale;
  const resize=()=>{const scale=stage.current.getBoundingClientRect().width/1600;if(document.fullscreenElement!==player.current||windowedScale==null)windowedScale=scale;stage.current.style.setProperty('--iq-caption-size',`${19/windowedScale}px`);setRevision(r=>r+1);};
  resize();const observer=new ResizeObserver(resize);observer.observe(stage.current.parentElement);document.addEventListener('fullscreenchange',resize);window.addEventListener('resize',resize);
  return()=>{observer.disconnect();document.removeEventListener('fullscreenchange',resize);window.removeEventListener('resize',resize);};
 },[]);
 const opening=scene.view==='title',last=scene===OVERSIGHT_STORY.at(-1);
 // Captions keep one screen size; shrink them to their box if they'd outgrow it.
 useLayoutEffect(()=>{
  const box=captionBox.current,p=box?.querySelector('p');if(!p)return;
  box.style.setProperty('--iq-caption-fit',Math.min(1,caption.width*.92/Math.max(1,p.offsetWidth)));
 },[time,caption.width,revision]);
 // Purple rounded rectangles, fitted each frame to their target on the page
 // currently shown (the Overview, the Data Board or the Usage Report).
 useLayoutEffect(()=>{
  const fit=()=>{
   if(!stage.current)return;
   const s=stage.current.getBoundingClientRect(),unit=s.width/1600;
   const {overview:o,data:d,usage:u}=frame.pages;
   const scope=(u>=Math.max(o,d)?usage.current:d>=o?report.current:overview.current)||stage.current;
   highlights.forEach(({target},i)=>{
    const el=rings.current[i];if(!el)return;
    let r=null;
    if(target.startsWith('col-')){
     // a whole column: from its header to the bottom of the visible table
     const th=scope.querySelector(`th[data-iq-col="${target.slice(4)}"]`),box=th?.closest('.ow-table-scroll');
     if(th&&box){const a=th.getBoundingClientRect(),b=box.getBoundingClientRect();r={left:a.left,top:a.top,width:a.width,height:b.bottom-a.top};}
    }else r=scope.querySelector(`[data-iq-target="${target}"]`)?.getBoundingClientRect()??null;
    if(!r){el.style.visibility='hidden';return;}
    const pad=7;
    Object.assign(el.style,{visibility:'visible',left:`${(r.left-s.left)/unit-pad}px`,top:`${(r.top-s.top)/unit-pad}px`,width:`${r.width/unit+pad*2}px`,height:`${r.height/unit+pad*2}px`});
   });
  };
  fit();const next=requestAnimationFrame(fit);
  return()=>cancelAnimationFrame(next);
 },[time,highlights,frame.pages.overview,frame.pages.data,frame.pages.usage,revision]);
 const pop=.9*(.94+.06*dev.web);
 return <div className="page"><Navbar returnHome/><main className="ad-page"><header className="ad-head"><span className="ad-kicker">Product Demo</span><h1>Live Oversight</h1><p>Remote Visibility. Live Data. Stored History.</p></header>
 <DemoTextContext.Provider value={{stageRef:stage,settings:editor.config.captions[scene.id]||{},text:scene.text,elapsed:editor.clock.elapsed,remaining:editor.clock.remaining,speed:OVERSIGHT_TEXT_SPEED,defaultDelay:TEXT_AT[scene.id]??0}}>
 <div className="es-player iq-player demo-text-scope" ref={player}><style>{editor.uiStyles}</style><div className="ad-fit"><div ref={stage} className="ad-stage iq-stage" data-scene={scene.id} data-view={scene.view} onClick={e=>{if(!e.target.closest('button,a,input'))toggle();}} role="button" tabIndex={0} aria-label={playing?'Pause demo':'Play demo'} onKeyDown={e=>{if(e.target===e.currentTarget&&['Enter',' '].includes(e.key)){e.preventDefault();toggle();}}}>
  <Starfield className="ad-stars" paused={!playing} speed={speed} fitParent/>
  <div className="iq-camera" style={{transform:`translate(800px,450px) scale(${cam.s}) translate(${-cam.cx}px,${-cam.cy}px)`}}>
   {/* The web window (page 1600x760 at 0.9, centered at 800,372): the Overview, the Data Board or the Usage Report. */}
   {dev.web>0&&dev.webOut<1&&<div className="iq-report-window" style={{opacity:Math.min(1,dev.web*1.5)*(1-dev.webOut),transform:`translate(${800-800*pop}px,${372-380*pop}px) scale(${pop})`}}>
    <div ref={overview} className="iq-ol-page" style={{opacity:frame.pages.overview,visibility:frame.pages.overview>0?'visible':'hidden'}}><OverviewScene frame={frame} playing={playing} speed={speed}/></div>
    {frame.pages.data>0&&<div ref={report} className="iq-ol-page" style={{opacity:frame.pages.data}}><DataReport/></div>}
    {frame.pages.usage>0&&<div ref={usage} className="iq-ol-page iq-lo-usage" style={{opacity:frame.pages.usage}}>
     <UsageReport web={{gallery:frame.gallery.checked,scroll:frame.reportScroll}} range="09/22/2026 – 09/28/2026" groupBy={frame.groupBy} menu={frame.menu} options={REPORT_GROUPS} dip={frame.regroupDip}><ReportTree nodes={reportTree(frame.groupBy)} rows={frame.gallery.rows}/></UsageReport>
    </div>}
   </div>}
  </div>
  {opening?<DemoTypedText className="es-title" lineBeats text={scene.text} elapsed={elapsed*OVERSIGHT_TEXT_SPEED} remaining={last?Infinity:scene.end-time} center/>:<div ref={captionBox} className="iq-caption" style={{left:caption.left,top:caption.top,width:caption.width,transform:`translate(-50%,${caption.yp}%)`}}><DemoTypedText key={scene.id} lineBeats text={scene.text} elapsed={(elapsed-(TEXT_AT[scene.id]??0))*OVERSIGHT_TEXT_SPEED} remaining={scene.end-time} center/></div>}
  {highlights.map((h,i)=>{const pose=highlightPose(elapsed,h);return <span key={`${scene.id}-${i}`} ref={el=>{rings.current[i]=el;}} className="iq-highlight" style={{opacity:pose.opacity,transform:`scale(${pose.scale})`,'--iq-highlight-fill':pose.fill}} aria-hidden="true"/>;})}
 </div></div><div className="ad-controls es-controls"><button onClick={toggle}>{playing?'Pause':playerTime>=duration?'Replay':'Play'}</button><button onClick={replay}>Restart</button><input type="range" className="ad-scrub" aria-label="Seek demo" min="0" max={duration} step=".05" value={playerTime} onChange={seek} style={{'--fill':`${playerTime/duration*100}%`}}/><span>{label(playerTime)} / {label(duration)}</span><button onClick={cycleSpeed} aria-label={`Playback speed: ${speed}×`}>{speed}×</button><button onClick={()=>document.fullscreenElement?document.exitFullscreen():player.current.requestFullscreen()}>Fullscreen</button></div></div>
 </DemoTextContext.Provider>
 <DemoTextEditor editor={editor} seek={seek} toggle={toggle} playing={playing} baseSpeed={OVERSIGHT_TEXT_SPEED}/>
 <nav className="es-chapters" aria-label="Demo chapters">{editor.clock.timeline.map((s,i)=><button key={s.id} aria-current={scene.id===s.id?'step':undefined} onClick={()=>seek({target:{value:s.start}})}><span>{String(i+1).padStart(2,'0')}</span>{s.text}</button>)}</nav>
 </main></div>;
}
