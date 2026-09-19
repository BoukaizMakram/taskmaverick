'use client';
import {useLayoutEffect,useRef} from 'react';
import gsap from 'gsap';
import Navbar from '../Navbar';
import InteractiveMissionBoard from '../InteractiveMissionBoard';
import PhoneShell from '../PhoneShell';
import Starfield from '../Starfield';
import DemoTypedText from '../DemoTypedText';
import useDemoPlayback from '../useDemoPlayback';
import QualityDemoPanels,{QUALITY_BOARD,QualityGallery} from './QualityDemoPanels';
import {QUALITY_SCENES,QUALITY_LENGTH,qualityFrame} from '@/lib/qualityDemo.mjs';

const label=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
export default function QualityDemo(){
  const root=useRef(null),tablet=useRef(null),phone=useRef(null),timeline=useRef(null);
  const {time,playing,speed,replay,toggle,seek,cycleSpeed}=useDemoPlayback(QUALITY_LENGTH);
  const frame=qualityFrame(time),{scene,elapsed,remaining,pop}=frame;
  const title=scene.view==='title',mobile=scene.view==='mobile';
  useLayoutEffect(()=>{
    const tl=gsap.timeline({paused:true});timeline.current=tl;
    gsap.set(tablet.current,{xPercent:-50,autoAlpha:0,scale:1.25,y:0,transformOrigin:'50% 300px'});
    gsap.set(phone.current,{autoAlpha:0,y:30,scale:.94,transformOrigin:'50% 50%'});
    QUALITY_SCENES.forEach(s=>{
      const visible=!['title','mobile'].includes(s.view);
      tl.to(tablet.current,{autoAlpha:visible?1:0,scale:s.view==='gallery'?1.32:1.42,x:s.view==='gallery'?0:-45,y:visible?-12:12,duration:visible?.65:.4,ease:'sine.inOut'},visible?s.start:Math.max(0,s.start-.4));
      tl.to(phone.current,{autoAlpha:s.view==='mobile'?1:0,y:s.view==='mobile'?0:30,scale:s.view==='mobile'?1: .94,duration:s.view==='mobile'?.65:.4,ease:'sine.inOut'},s.view==='mobile'?s.start:Math.max(0,s.start-.4));
    });
    tl.to({},{duration:.1},QUALITY_LENGTH-.1);
    return()=>tl.kill();
  },[]);
  useLayoutEffect(()=>{timeline.current?.seek(time,false);},[time]);
  const demoState={missions:QUALITY_BOARD,elapsed:0,selected:'quality-audit',codeOpen:false};
  return <div className="page"><Navbar returnHome/><main className="ad-page"><header className="ad-head"><span className="ad-kicker">Product Demo</span><h1>Improving Quality</h1><p>Guide The Work, Capture The Evidence, Build Accountability.</p></header>
    <div className="qd-player"><div className="ad-fit"><div ref={root} className="ad-stage qd-stage" data-scene={scene.id} style={{'--qd-pop':pop}} onClick={e=>{if(e.target===e.currentTarget)toggle();}}>
      <Starfield className="ad-stars" speed={speed} paused={!playing} fitParent/>
      <div ref={tablet} className="adx-tablet qd-tablet">
        <InteractiveMissionBoard device="tablet" referenceLayout initialScreen="board" initialMissions={QUALITY_BOARD} demoState={demoState} demoDetail={<QualityDemoPanels frame={frame}/>}/>
        {!title&&!mobile&&<DemoTypedText key={scene.id} text={scene.display} elapsed={elapsed} remaining={remaining} center className="qd-caption"/>}
      </div>
      <div className="ph-fit qd-phone" ref={phone}><PhoneShell title="Gallery"><QualityGallery frame={frame} mobile/></PhoneShell></div>
      {mobile&&<DemoTypedText text={scene.display} elapsed={elapsed} remaining={remaining} center className="qd-mobile-caption"/>}
      {title&&<DemoTypedText key={scene.id} text={scene.display} elapsed={elapsed} remaining={scene.id==='conclusion'?Infinity:remaining} center/>}
      {!playing&&time===0&&<button className="ad-start" onClick={toggle} aria-label="Play Quality Demo"><span>▶</span>Play Demo</button>}
    </div></div>
    <div className="ad-controls"><button onClick={toggle}>{playing?'Pause':time>=QUALITY_LENGTH?'Replay':'Play'}</button><button onClick={replay}>Restart</button><input className="ad-scrub" aria-label="Seek demo" type="range" min="0" max={QUALITY_LENGTH} step=".05" value={time} onChange={seek} style={{'--fill':`${time/QUALITY_LENGTH*100}%`}}/><span>{label(time)} / {label(QUALITY_LENGTH)}</span><button onClick={cycleSpeed} aria-label={`Playback speed: ${speed}×`}>{speed}×</button><button onClick={()=>document.fullscreenElement?document.exitFullscreen():root.current?.closest('.qd-player').requestFullscreen?.()}>Fullscreen</button></div>
  </div></main></div>;
}
