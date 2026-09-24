'use client';
import {useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import gsap from 'gsap';
import Navbar from './Navbar';
import PhoneShell from './PhoneShell';
import MissionChip from './MissionChip';
import InteractiveMissionBoard from './InteractiveMissionBoard';
import {PersonalCodeKeypad} from './PersonalCodeDialog';
import DemoTypedText from './DemoTypedText';
import Starfield from './Starfield';
import useDemoPlayback from './useDemoPlayback';
import useAutomationMotion from './useAutomationMotion';
import {automationState} from '@/lib/automationState.mjs';
import {TIMING} from '@/lib/demoNarration.mjs';
import {PERSONAL_REVEAL,TEAM_REVEAL} from '@/lib/automationMotion.mjs';
import {EFFICIENCY_STORY,STORY,STORY_LENGTH,STORY_MISSIONS,STORY_PEOPLE,STORY_ACTIONS,STORY_OPEN_ORDER,CYCLE_ACTIONS,CYCLE_MISSIONS,CYCLE_REVEAL,PRIORITY_PHASES,storyBoardTime,storyMotionProgress,storyMissionTimers,storyEventTime} from '@/lib/efficiencyStory.mjs';
import './EfficiencyStoryDemo.css';

const clamp=p=>Math.max(0,Math.min(1,p));
const ease=p=>{p=clamp(p);return p*p*p*(10+p*(-15+6*p));};
const mix=(a,b,p)=>a+(b-a)*p;
const label=s=>`${Math.floor(s/60)}:${String(Math.floor(s)%60).padStart(2,'0')}`;
const PHONE_MISSION_OFFSETS=[[1.8,2.3,2.8,3.3],[2,2.5],[2.2,2.7,3.2]];
const PHONE_MISSION_COUNTS=[4,2,3];
const PHONE_ENTRANCE_DELAY=.5;
const TABLET_ENTRANCE_DELAY=.5;
const MOVE_DURATION=1.05;
const FADE_DURATION=.45;
const SCHEDULE_FADE_DURATION=.65;
const EXECUTION_FADE_DURATION=.8;
const TABLET_X=51;
const TEAM_TABLET_Y=TEAM_REVEAL.tabletY;
const SHARED_AVATARS={fade:.35,hold:.55,stagger:.08,travel:1.05};
const INTRO_RAIL_POSE={x:TABLET_X,y:TEAM_TABLET_Y,scale:TEAM_REVEAL.tabletScale};
// Keep consecutive captions aligned, with extra space below the mission cards
// from claiming through performer recognition.
const CENTER_CAPTION={x:320,y:365,width:480};
const LOWER_CAPTION={...CENTER_CAPTION,y:410};
const TABLET_CAPTIONS={
  schedule:{x:320,y:455,width:480},
  points:CENTER_CAPTION,
  urgency:CENTER_CAPTION,
  priority:CENTER_CAPTION,
  shared:CENTER_CAPTION,
  code:CENTER_CAPTION,
  claim:LOWER_CAPTION,
  close:LOWER_CAPTION,
  execution:LOWER_CAPTION,
  performers:LOWER_CAPTION,
};

export default function EfficiencyStoryDemo(){
  const {time,playing,speed,toggle,replay,seek,cycleSpeed}=useDemoPlayback(STORY_LENGTH);
  const [viewportRevision,setViewportRevision]=useState(0);
  const root=useRef(null),camera=useRef(null),tablet=useRef(null),avatars=useRef({}),codePanel=useRef(null),phones=useRef(null),deviceTimeline=useRef(null),player=useRef(null),scheduleLines=useRef([]),schedulePanels=useRef([]),rings=useRef([]),tabletCaption=useRef(null);
  const scene=EFFICIENCY_STORY.find(s=>time>=s.start&&time<s.end)??EFFICIENCY_STORY.at(-1);
  const elapsed=time-scene.start;
  const scheduleVisibility=1-ease((time-STORY.schedule.end+SCHEDULE_FADE_DURATION)/SCHEDULE_FADE_DURATION);
  const closedFocus=ease((time-STORY.execution.start)/EXECUTION_FADE_DURATION)*(1-ease((time-STORY.initiative.start)/FADE_DURATION));
  const boardTime=storyBoardTime(time);
  const cycleCaption=useRef(null);
  const teamsCaption=useRef(null);
  const cycleActive=time>=STORY.initiative.start+CYCLE_REVEAL.reset;
  const cycleScene=scene.id==='initiative'||scene.id==='reminder';
  const actions=cycleActive?CYCLE_ACTIONS:STORY_ACTIONS;
  const state=useMemo(()=>{
    const templates=cycleActive?CYCLE_MISSIONS:STORY_MISSIONS;
    const next=automationState(boardTime,templates,STORY_PEOPLE,actions);
    if(next.action?.to==='closed')next.action={...next.action,returnProgress:storyMotionProgress(boardTime,next.action.confirm,next.action.end,actions)};
    next.boardTitle='Team Board';
    next.missions=next.missions.map((m,i)=>({...m,
      ...storyMissionTimers(time,templates[i],i,actions,cycleActive),
      timerColor:'#007a33',
      ...(time>=STORY.shared.start?{openOrder:m.id==='cycle-new'?5:STORY_OPEN_ORDER.indexOf(m.id)}:{}),
      ...(i===0&&time>=STORY.urgency.motionAt+1.15?{timerColor:'#bf4b00'}:{}),
      ...(i===2?{timerColor:time>=STORY.priority.motionAt+PRIORITY_PHASES.red?'#bd1f59':time>=STORY.priority.motionAt+PRIORITY_PHASES.orange?'#bf4b00':'#007a33',boosted:time>=STORY.shared.start}:{}),
      ...(m.status==='closed'?{timerColor:undefined}:{}),
      points:m.points+(time>=STORY.points.motionAt&&i<2?10:0),
    }));
    // Feature closeups hold the board still until the initiative sequence resumes.
    if(time>=STORY.execution.start&&time<STORY.initiative.start){next.action=null;next.showCode=false;}
    return next;
  },[boardTime,time,cycleActive,actions]);

  useEffect(()=>{
    const stage=root.current;
    let windowedScale;
    const size=()=>{
      const viewportScale=stage.getBoundingClientRect().width/1600;
      // Fullscreen enlarges the whole scene. Keep the windowed typography
      // rather than counter-scaling the captions against that enlargement.
      if(document.fullscreenElement!==player.current||windowedScale==null) windowedScale=viewportScale;
      stage.style.setProperty('--story-caption-size',`${19/windowedScale}px`);
      tablet.current.style.setProperty('--story-tablet-caption-size',`${18/(windowedScale*TEAM_REVEAL.tabletScale)}px`);
      setViewportRevision(revision=>revision+1);
    };
    size();const observer=new ResizeObserver(size);observer.observe(stage.parentElement);
    window.addEventListener('resize',size);
    document.addEventListener('fullscreenchange',size);
    return()=>{observer.disconnect();window.removeEventListener('resize',size);document.removeEventListener('fullscreenchange',size);};
  },[]);

  useLayoutEffect(()=>{
    const tl=gsap.timeline({paused:true});
    deviceTimeline.current=tl;
    const phoneElements=phones.current.querySelectorAll('.adx-phone');
    gsap.set(phones.current,{autoAlpha:1});
    gsap.set(phoneElements,{autoAlpha:0,y:PERSONAL_REVEAL.phoneOriginY,scale:.08,transformOrigin:'50% 0%'});
    tl.to(phoneElements,{autoAlpha:1,y:0,scale:1,duration:MOVE_DURATION,ease},STORY.individuals.motionAt+PHONE_ENTRANCE_DELAY);
    phoneElements.forEach((phone,i)=>phone.querySelectorAll('.es-phone-mission').forEach((mission,j)=>{
      tl.fromTo(mission,{autoAlpha:0,y:18,scale:.9},{autoAlpha:1,y:0,scale:1,duration:FADE_DURATION,ease},STORY.individuals.motionAt+PHONE_MISSION_OFFSETS[i][j]-.55);
    }));
    gsap.set(tablet.current,{xPercent:-50,x:TABLET_X,y:TEAM_REVEAL.originY,scale:TEAM_REVEAL.tabletScale,rotationY:0,filter:'blur(0px)',autoAlpha:0,transformOrigin:`50% ${tablet.current.querySelector('.tbl-fit').offsetHeight/2}px`});
    tl.to(phones.current,{autoAlpha:0,duration:FADE_DURATION,ease},STORY.teams.start);
    tl.to(tablet.current,{y:TEAM_TABLET_Y,autoAlpha:1,duration:MOVE_DURATION,ease},STORY.teams.motionAt+TABLET_ENTRANCE_DELAY);
    return()=>{tl.kill();deviceTimeline.current=null;};
  },[]);
  useLayoutEffect(()=>{
    deviceTimeline.current?.seek(time,false);
  },[time]);
  useLayoutEffect(()=>{
    const centeredY=450-120-tablet.current.querySelector('.tbl-fit').offsetHeight/2;
    const schedule=ease((time-STORY.schedule.motionAt)/MOVE_DURATION)*(1-ease((time-STORY.points.motionAt)/MOVE_DURATION));
    const closeup=ease((time-STORY.execution.motionAt)/MOVE_DURATION)*(1-ease((time-STORY.initiative.start)/FADE_DURATION));
    const compositionScale=1+.035*ease((time-STORY.teams.motionAt)/MOVE_DURATION);
    // Pan toward the closed column as the camera moves closer, keeping both
    // completed missions and their caption inside the stage.
    const teamFraming=38*ease((time-STORY.teams.motionAt)/MOVE_DURATION)*(1-ease((time-STORY.schedule.start)/MOVE_DURATION));
    gsap.set(camera.current,{scale:compositionScale+(.06*schedule+.25*closeup)/TEAM_REVEAL.tabletScale,x:-75*closeup,y:25*closeup+teamFraming,transformOrigin:'800px 450px'});
    if(time<STORY.schedule.start){
      gsap.set(tablet.current,{x:TABLET_X,scale:TEAM_REVEAL.tabletScale});
      return;
    }
    const out=ease((time-STORY.conclusion.start)/.45);
    const cycleVisibility=time<STORY.initiative.start?1:time<STORY.initiative.start+CYCLE_REVEAL.reset
      ?1-ease((time-STORY.initiative.start)/FADE_DURATION)
      :ease((time-STORY.initiative.start-CYCLE_REVEAL.deviceIn)/MOVE_DURATION);
    const centerTablet=ease((time-STORY.schedule.start)/MOVE_DURATION);
    const makeRoom=ease((time-STORY.shared.motionAt-SHARED_AVATARS.hold)/SHARED_AVATARS.travel);
    const tabletX=TABLET_X*(1-centerTablet)+TABLET_X*makeRoom;
    gsap.set(tablet.current,{xPercent:-50,x:tabletX,y:mix(TEAM_TABLET_Y,centeredY,centerTablet),scale:TEAM_REVEAL.tabletScale,autoAlpha:(1-out)*cycleVisibility});
  },[time]);
  const motionTime=time<STORY.individuals.motionAt
    ? TIMING.personal
    :time<STORY.teams.start
      ? mix(TIMING.personal+.55,TIMING.team-.4,clamp((time-STORY.individuals.motionAt)/(STORY.individuals.end-STORY.individuals.motionAt)))
      :time<STORY.teams.motionAt
        ? TIMING.team-.4+.3999*clamp((time-STORY.teams.start)/FADE_DURATION)
        :time<STORY.schedule.start
          ? TIMING.team+time-STORY.teams.motionAt
          :boardTime;
  useAutomationMotion({time:motionTime,state,root:camera,tablet,avatars,codePanel,people:STORY_PEOPLE,boardEnd:999,highlightMode:'outline',avatarChoreography:'highlight',actions,codePanelScale:.8,avatarRailPose:time<STORY.teams.motionAt+TABLET_ENTRANCE_DELAY+MOVE_DURATION?INTRO_RAIL_POSE:null});

  useLayoutEffect(()=>{
    const board=tablet.current;
    const stageRect=camera.current.getBoundingClientRect(), unit=stageRect.width/1600;
    if(scene.id==='teams'&&teamsCaption.current){
      const frame=root.current.getBoundingClientRect();
      const frameUnit=frame.width/1600;
      const bounds=board.getBoundingClientRect();
      const boardScale=bounds.width/board.offsetWidth/frameUnit;
      const cameraScale=stageRect.width/frame.width;
      const travel=ease((time-STORY.teams.motionAt-TABLET_ENTRANCE_DELAY)/MOVE_DURATION);
      const targetX=(bounds.left-frame.left)/frameUnit+(CENTER_CAPTION.x+CENTER_CAPTION.width/2)*boardScale;
      const targetY=(bounds.top-frame.top)/frameUnit
        +(TEAM_TABLET_Y-Number(gsap.getProperty(board,'y')))*cameraScale
        +CENTER_CAPTION.y*boardScale;
      const startFont=parseFloat(getComputedStyle(root.current).getPropertyValue('--story-caption-size'));
      const targetFont=parseFloat(getComputedStyle(board).getPropertyValue('--story-tablet-caption-size'))*boardScale;
      // One persistent caption travels from the stage center into the tablet.
      // Target its settled position, independent of the tablet's entrance path.
      gsap.set(teamsCaption.current,{
        left:mix(800,targetX,travel),top:mix(450,targetY,travel),
        xPercent:-50,yPercent:-50,width:mix(1400,CENTER_CAPTION.width*boardScale,travel),
        '--story-caption-size':`${mix(startFont,targetFont,travel)}px`,
      });
    }
    if(cycleScene&&cycleCaption.current){
      const frame=root.current.getBoundingClientRect();
      const frameUnit=frame.width/1600;
      const bounds=board.getBoundingClientRect();
      const boardScale=bounds.width/board.offsetWidth/frameUnit;
      const targetFont=parseFloat(getComputedStyle(board).getPropertyValue('--story-tablet-caption-size'))*boardScale;
      const shiftDuration=1.6;
      const shiftStart=storyEventTime(CYCLE_ACTIONS[3].confirm,true)-shiftDuration;
      const shift=ease((time-shiftStart)/shiftDuration);
      const enter=ease((time-STORY.initiative.start-CYCLE_REVEAL.deviceIn)/MOVE_DURATION);
      const startFont=parseFloat(getComputedStyle(root.current).getPropertyValue('--story-caption-size'));
      const targetX=(bounds.left-frame.left)/frameUnit+(CENTER_CAPTION.x+CENTER_CAPTION.width/2)*boardScale;
      const targetY=(bounds.top-frame.top)/frameUnit+mix(315,CENTER_CAPTION.y,shift)*boardScale;
      // Begin in the center of the clear right side, then make just enough
      // room below the second closed mission. Keep this horizontal anchor
      // through the remaining claims and the following reminder caption.
      gsap.set(cycleCaption.current,{
        left:mix(800,targetX,enter),top:mix(450,targetY,enter),
        xPercent:-50,yPercent:-50,
        width:mix(1400,CENTER_CAPTION.width*boardScale,enter),
        '--cycle-caption-size':`${mix(startFont,targetFont,enter)}px`,
        autoAlpha:1,
      });
    }
    const newMission=board.querySelector('[data-mission-id="cycle-new"]');
    if(newMission){
      const reveal=ease((time-storyEventTime(CYCLE_ACTIONS[0].confirm,true))/.7);
      gsap.set(newMission,{autoAlpha:reveal,y:32*(1-reveal)});
    }
    const captionPose=TABLET_CAPTIONS[scene.id];
    if(tabletCaption.current&&captionPose){
      gsap.set(tabletCaption.current,{left:captionPose.x,top:captionPose.y,width:captionPose.width,yPercent:-50,autoAlpha:ease(elapsed/.3)});
    }
    Object.values(avatars.current).forEach((avatar,i)=>{
      if(scene.id==='individuals'){
        gsap.set(avatar,{x:(STORY_PEOPLE[i].phoneX??800)-37,y:90,scale:1,autoAlpha:i<3?ease((elapsed-.55-i*.12)/.45):0});
      }
      if(scene.id==='teams'){
        const height=board.querySelector('.tbl-fit').offsetHeight;
        gsap.set(avatar,{x:800+TABLET_X-board.offsetWidth*TEAM_REVEAL.tabletScale/2-102,y:120+height/2+TEAM_TABLET_Y+height*TEAM_REVEAL.tabletScale/2-142-(4-i)*100,scale:1,autoAlpha:ease((elapsed-.55-i*.09)/.45)});
      }
      if(time>=STORY.schedule.start&&time<STORY.shared.motionAt){
        gsap.set(avatar,{autoAlpha:1-ease((time-STORY.schedule.start)/.65)});
      }
      if(scene.id==='shared'){
        const caption=tabletCaption.current.getBoundingClientRect();
        const rowCenter=(caption.left+caption.width/2-stageRect.left)/unit;
        const rowY=(caption.top-stageRect.top)/unit-96;
        const rowX=rowCenter-37+(i-2)*94;
        const destination={x:Number(gsap.getProperty(avatar,'x')),y:Number(gsap.getProperty(avatar,'y'))};
        const reveal=elapsed-.55-i*SHARED_AVATARS.stagger;
        const travel=1-(1-clamp((time-STORY.shared.motionAt-SHARED_AVATARS.hold-i*SHARED_AVATARS.stagger)/SHARED_AVATARS.travel))**3;
        gsap.set(avatar,{
          x:mix(rowX,destination.x,travel),
          y:mix(rowY,destination.y,travel)-Math.sin(Math.PI*travel)*55,
          scale:1,autoAlpha:ease(reveal/SHARED_AVATARS.fade),transformOrigin:'0 0',
        });
      }
      if(['execution','performers'].includes(scene.id)) gsap.set(avatar,{autoAlpha:1-closedFocus});
      if(scene.id==='initiative'&&time<STORY.initiative.motionAt) gsap.set(avatar,{autoAlpha:ease((elapsed-CYCLE_REVEAL.deviceIn)/MOVE_DURATION)});
      if(time>=STORY.conclusion.start) gsap.set(avatar,{autoAlpha:0});
    });
    const dim=Number(board.querySelector('.mi-demo-shade')?.style.opacity??0)>.35;
    board.style.setProperty('--story-caption-ink',dim?'#fff':'#202a37');
    const orange=ease((time-STORY.priority.motionAt-PRIORITY_PHASES.moveSecond)/PRIORITY_PHASES.moveDuration),red=ease((time-STORY.priority.motionAt-PRIORITY_PHASES.moveFirst)/PRIORITY_PHASES.moveDuration);
    const cards=STORY_MISSIONS.slice(0,4).map(m=>board.querySelector(`[data-mission-id="${m.id}"]`));
    if(time>=STORY.priority.motionAt&&time<STORY.shared.start){
      const distance=(cards[1].getBoundingClientRect().top-cards[0].getBoundingClientRect().top)/(cards[0].getBoundingClientRect().width/cards[0].offsetWidth);
      [red,orange,-orange-red,0].forEach((row,i)=>gsap.set(cards[i],{y:row*distance,x:i===2?Math.sin(Math.PI*orange)*15+Math.sin(Math.PI*red)*15:0,zIndex:i===2?4:1}));
    }
    cards.forEach((card,i)=>{
      if(!card)return;
      if(scene.id==='schedule'&&i<2) card.style.setProperty('--demo-active-border',`rgba(139,92,246,${ease((time-STORY.schedule.motionAt-i*.5)/.45)*scheduleVisibility})`);
      const pop=ease((time-STORY.points.motionAt-i*.25)/.4)*(1-ease((time-STORY.points.end)/.4));
      gsap.set(card.querySelector('.chip-points'),{scale:1+pop*1.25,x:pop*10,y:-pop*12,transformOrigin:'center bottom'});
      const timerPop=ease((time-STORY.urgency.motionAt-i*.25)/.4)*(1-ease((time-STORY.urgency.end)/.4));
      // Keep the right edge anchored so the enlarged timers stay clear of
      // the narration in the neighboring column.
      gsap.set(card.querySelector('.chip-pill'),{scale:1+timerPop*.65,x:timerPop*6,transformOrigin:'right center'});
    });
    if(scene.id==='schedule') [0,1].forEach(i=>{
      const r=cards[i].getBoundingClientRect();
      const y=(r.top+r.height/2-stageRect.top)/unit;
      const x=(r.right-stageRect.left)/unit;
      const panel=schedulePanels.current[i].getBoundingClientRect();
      const destinationX=(panel.left-stageRect.left)/unit;
      const destinationY=(panel.top+panel.height/2-stageRect.top)/unit;
      scheduleLines.current[i]?.setAttribute('d',`M ${x+5} ${y} L ${destinationX} ${destinationY}`);
    });
    // Lift each detail clear of the neighboring text before enlarging it.
    // Derive both the pop and reset from playback time so seeking is reversible.
    ['sig','inv'].forEach((id,i)=>{
      [['execution','.chip-exec',.75,-24,'right center'],['performers','.chip-who',.65,-14,'left bottom']].forEach(([chapter,selector,amount,lift,origin])=>{
        const target=board.querySelector(`[data-mission-id="${id}"] ${selector}`);
        if(!target)return;
        const beat=STORY[chapter];
        const pop=ease((time-beat.motionAt-.1-i*.25)/.55)*(1-ease((time-beat.end+.4)/.4));
        gsap.set(target,{scale:1+amount*pop,y:lift*pop,transformOrigin:origin,'--story-detail-pop':pop});
      });
    });
    const targetSelector=scene.id==='execution'?'.chip-exec':'.chip-who';
    ['sig','inv'].forEach((id,i)=>{
      const target=board.querySelector(`[data-mission-id="${id}"] ${targetSelector}`);
      const ring=rings.current[i];if(!ring||!target)return;
      const r=target.getBoundingClientRect();
      const paddingY=scene.id==='execution'?3:6;
      Object.entries({x:(r.left-stageRect.left)/unit-8,y:(r.top-stageRect.top)/unit-paddingY,width:r.width/unit+16,height:r.height/unit+paddingY*2}).forEach(([key,value])=>ring.setAttribute(key,value));
    });
  },[time,boardTime,scene.id,state,viewportRevision]);

  const title=scene.title;
  const leadIn=scene.id==='individuals';
  const captionY=leadIn?mix(390,790,ease((time-scene.motionAt-PHONE_ENTRANCE_DELAY)/MOVE_DURATION)):390;
  const insideCaption=TABLET_CAPTIONS[scene.id];
  const scheduleOn=scene.id==='schedule';
  const focusOn=['execution','performers'].includes(scene.id);
  const handleStageClick=event=>{
    if(event.target.closest('button, a, input, select, textarea')) return;
    toggle();
  };
  const handleStageKeyDown=event=>{
    if(event.target!==event.currentTarget||!['Enter',' '].includes(event.key)) return;
    event.preventDefault();
    toggle();
  };
  return <div className="page"><Navbar returnHome/><main className="ad-page">
    <header className="ad-head"><span className="ad-kicker">Product Demo</span><h1>Increased Efficiency</h1><p>Automatic Assignments. Clear Priorities. Motivated Teams.</p></header>
    <div ref={player} className="es-player">
      <div className="ad-fit"><div className={`ad-stage es-stage es-scene-${scene.id}`} ref={root} onClick={handleStageClick} onKeyDown={handleStageKeyDown} role="button" tabIndex={0} aria-label={playing?'Pause demo':'Play demo'}>
        <Starfield className="ad-stars" paused={!playing} speed={speed} fitParent/>
        <div className="es-camera" ref={camera}>
        <div className="adx-phones es-phones" ref={phones} aria-hidden={scene.id!=='individuals'}>
          {[0,1,2].map((person)=><div className="ph-fit adx-phone" key={person}><PhoneShell title="Personal Board" tabs={[{label:`Open - ${PHONE_MISSION_OFFSETS[person].filter(offset=>time>=STORY.individuals.motionAt+offset-.55).length}`,active:true},{label:'Claimed - 0'},{label:'Closed - 0'}]}>
            {STORY_MISSIONS.slice(person,person+PHONE_MISSION_COUNTS[person]).map(m=><div className="es-phone-mission" key={m.id}><MissionChip title={m.title} points={m.points} date={m.date} time={m.time} pillTime="00:08:00"/></div>)}
          </PhoneShell></div>)}
        </div>
        <div className={`adx-tablet adx-tablet--engaged es-tablet${cycleActive?' es-cycle-device':''}`} ref={tablet} aria-hidden={time<STORY.teams.start||title}>
          <InteractiveMissionBoard device="tablet" referenceLayout initialScreen="board" initialMissions={STORY_MISSIONS} demoState={state}/>
          {insideCaption&&<div ref={tabletCaption} className="es-tablet-caption">
            <div className="es-tablet-caption-copy"><DemoTypedText lineBeats key={scene.id} text={scene.text.replace(/\b(To|And|A|Of|On|The|Can|Be|Is) /g,'$1\u00a0')} elapsed={elapsed} remaining={scene.end-time} center/></div>
          </div>}
        </div>
        {STORY_PEOPLE.map((p,i)=><img key={p.src} ref={el=>{avatars.current[i]=el;}} className="adx-avatar" src={p.src} alt="" aria-hidden="true"/>)}
        <div className="adx-quick-code" ref={codePanel} aria-hidden={!state.showCode}>
          <header className="adx-code-header">{state.action?.to==='closed'?'Close':'Claim'} Personal Code<span>×</span></header>
          <div>{Array.from({length:6},(_,i)=><b key={i}>{i<state.code.length?'●':''}</b>)}</div><PersonalCodeKeypad tabIndex={-1}/>
        </div>
        {scheduleOn&&<>
          <svg className="es-connectors" aria-hidden="true" style={{opacity:scheduleVisibility}}>{[0,1].map(i=><path key={i} ref={el=>{scheduleLines.current[i]=el;}} pathLength="1" style={{strokeDasharray:1,strokeDashoffset:1-ease((time-STORY.schedule.motionAt-i*.5)/.6)}}/>)}</svg>
          {[0,1].map(i=><aside className="es-schedule" key={i} ref={el=>{schedulePanels.current[i]=el;}} style={{top:235+i*195,opacity:ease((time-STORY.schedule.motionAt-.4-i*.5)/.45)*scheduleVisibility,transform:`translateX(${35*(1-ease((time-STORY.schedule.motionAt-.4-i*.5)/.45))}px) scale(${.9+.1*ease((time-STORY.schedule.motionAt-.4-i*.5)/.45)})`}}>
            <h2>Schedule Automation</h2><dl><dt>Start Date</dt><dd>07/14/26</dd><dt>Repeat</dt><dd>{i?'Weekly':'Daily'}</dd><dt>{i?'On':'At'}</dt><dd>{i?'Mon, Wed, Fri':'10:00 AM'}</dd><dt>At</dt><dd>{i?'9:00 AM':'4:00 PM'}</dd><dt>End Date</dt><dd>Indefinitely</dd></dl>
          </aside>)}
        </>}
        {focusOn&&<svg className="es-connectors es-rings" aria-hidden="true">{[0,1].map(i=><rect key={i} ref={el=>{rings.current[i]=el;}} rx="9" pathLength="1" style={{strokeDasharray:1,strokeDashoffset:1-ease((time-scene.motionAt-.1-i*.25)/.65)}}/>)}</svg>}
        </div>
        {cycleScene&&<div ref={cycleCaption} className="es-caption es-cycle-caption"><DemoTypedText lineBeats key={scene.id} text={scene.text} elapsed={elapsed} remaining={scene.end-time} center/></div>}
        {scene.id==='teams'&&<div ref={teamsCaption} className="es-caption es-teams-caption"><DemoTypedText lineBeats text={scene.text} elapsed={elapsed} remaining={scene.end-time} center/></div>}
        {title?<DemoTypedText lineBeats key={scene.id} className="es-title" text={scene.text} elapsed={elapsed-(scene.id==='conclusion'?.5:0)} remaining={scene.id==="conclusion"?Infinity:scene.end-time} center/>:!insideCaption&&!cycleScene&&scene.id!=='teams'&&<div className="es-caption" style={{top:captionY}}><DemoTypedText lineBeats key={scene.id} text={scene.text} elapsed={elapsed} remaining={scene.end-time} center/></div>}
      </div></div>
      <div className="ad-controls es-controls"><button onClick={toggle}>{playing?'Pause':time>=STORY_LENGTH?'Replay':'Play'}</button><button onClick={replay}>Restart</button>
        <input className="ad-scrub" type="range" min="0" max={STORY_LENGTH} step="0.05" value={time} onChange={seek} aria-label="Seek demo" style={{'--fill':`${time/STORY_LENGTH*100}%`}}/>
        <span>{label(time)} / {label(STORY_LENGTH)}</span><button onClick={cycleSpeed} aria-label={`Playback speed: ${speed}×`}>{speed}×</button>
        <button onClick={()=>document.fullscreenElement?document.exitFullscreen():player.current.requestFullscreen()}>Fullscreen</button>
      </div>
    </div>
    <nav className="es-chapters" aria-label="Demo chapters">{EFFICIENCY_STORY.map((s,i)=><button key={s.id} aria-current={scene.id===s.id?'step':undefined} onClick={()=>seek({target:{value:s.start}})}><span>{String(i+1).padStart(2,'0')}</span>{s.text}</button>)}</nav>
  </main></div>;
}
