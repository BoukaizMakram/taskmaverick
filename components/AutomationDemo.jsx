'use client';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import Navbar from '@/components/Navbar';
import InteractiveMissionBoard from './InteractiveMissionBoard';
import PhoneShell from '@/components/PhoneShell';
import MissionChip from '@/components/MissionChip';
import { PersonalCodeKeypad } from './PersonalCodeDialog';
import { automationState, BOARD_END, simulatedTime } from '@/lib/automationState.mjs';
import { SCENE, SCENES, TIMING, TABLET_NOTES, BOARD_ACTION_DURATION, BOARD_PHASES, ENGAGED_ACTION_DURATION } from '@/lib/demoNarration.mjs';
import { AUTOMATION_SCENES, AUTOMATION_LENGTH, EFFICIENCY_START, EFFICIENCY_LENGTH, EFFICIENCY_SCENES } from '@/lib/demoNarration.mjs';
import useDemoPlayback from './useDemoPlayback';
import DemoTypedText from './DemoTypedText';
import useAutomationMotion from './useAutomationMotion';
import Starfield from './Starfield';
import GabrielMessage from './GabrielMessage';
import EfficiencyMissionSequence, { SETTLED_AT } from './EfficiencyMissionSequence';
import './AutomationFeatures.css';
import { PERSONAL_REVEAL, TEAM_REVEAL, easeOutArrival } from '@/lib/automationMotion.mjs';

const timeLabel = value => `${Math.floor(value/60)}:${String(Math.floor(value%60)).padStart(2,'0')}`;
const BIRTHDAY_ENABLED_KEY = 'taskmaverick:gabriel-birthday-enabled';
const URGENCY_START = SCENES.find(scene => scene.id === 'urgency-title').start;
const RECOGNITION_START = SCENES.find(scene => scene.id === 'recognition-stamped').start;

// Three people's Personal Boards. Missions POP IN on a stagger (see `pop`, in
// timeline seconds) over empty boards.
const PHONES = [
  { name: 'Adam F.', missions: [
    { kind: 'Checklist', title: 'Prep Stations',   points: 15, date: '09-15-26', time: '08:02 AM', pill: '00:12:00', pop: TIMING.personal + 2.9 },
    { kind: 'Task',      title: 'Temperature Log',  points: 10, date: '09-15-26', time: '08:02 AM', pill: '00:07:30', pop: TIMING.personal + 3.6 },
  ] },
  { name: 'Ben R.', missions: [
    { kind: 'Media',     title: 'Safety Briefing',  points: 20, date: '09-15-26', time: '08:02 AM', pill: '00:15:00', pop: TIMING.personal + 3.2 },
    { kind: 'Checklist', title: 'Open Registers',   points: 10, date: '09-15-26', time: '08:02 AM', pill: '00:05:00', pop: TIMING.personal + 3.9 },
  ] },
  { name: 'Carla M.', missions: [
    { kind: 'Task',      title: 'Restock Fridge',   points: 15, date: '09-15-26', time: '08:02 AM', pill: '00:10:00', pop: TIMING.personal + 3.5 },
    { kind: 'Survey',    title: 'Shift Feedback',   points: 5,  date: '09-15-26', time: '08:02 AM', pill: '00:20:00', pop: TIMING.personal + 4.2 },
  ] },
];

// The shared board demonstrates two claims and one completion directly on cards.
const dm = { type: 'Checklist', points: 20, location: 'Store / Aisle 3', postedBy: 'System', claimer: 'Adam F. - Staff', date: '09-15-26', time: '08:02 AM', pillClass: 'chip--green', headerRight: 'es-menu', status: 'open' };
const DEMO_MISSIONS = [
  { ...dm, id: 'inv', performerAvatar: '/avatars/01.png', title: 'Inventory Audit', age: 540, points: 20,
    description: 'Count each item and record the quantity on hand.',
    notice: 'Flag any expired or damaged stock for removal.',
    entryGroup: 'Dry Goods', entryFields: [['rice', 'Rice (kg)', 'kg'], ['flour', 'Flour (kg)', 'kg']], entries: { rice: '', flour: '' } },
  { ...dm, id: 'ord', performerAvatar: '/avatars/05.png', title: 'Order Supplies', age: 430, points: 15,
    description: 'Review par levels and order anything below the threshold.',
    notice: 'Confirm quantities with the shift lead before submitting.',
    entryGroup: 'Cleaning', entryFields: [['gloves', 'Gloves (boxes)', '#'], ['detergent', 'Detergent (L)', 'L']], entries: { gloves: '', detergent: '' } },
  { ...dm, id: 'sig', performerAvatar: '/avatars/04.png', title: 'Signage Installation', age: 360, points: 25,
    description: 'Follow the steps below to ensure the signage is properly installed.',
    notice: 'Ensure the signage height is measured according to provided specs.',
    entryGroup: 'Safety Sign', entryFields: [['height', 'Height from floor', 'in.'], ['count', 'Signs on wall', '#']], entries: { height: '', count: '' } },
  { ...dm, id: 'prep', title: 'Prep Stations', reference: 'Temperature', age: 300, points: 15 },
  { ...dm, id: 'temp', title: 'Temperature Log', reference: 'Temperature', age: 240, points: 10 },
  { ...dm, id: 'new-sink', title: 'Kitchen Sink Check', reference: 'Temperature', age: 0, points: 10, appearsAt: TIMING.shared + 2 * ENGAGED_ACTION_DURATION },
  { ...dm, id: 'new-restock', title: 'Restock Supplies', age: 0, points: 15, appearsAt: TIMING.shared + 4 * ENGAGED_ACTION_DURATION },
];

// Five teammates share the device; the first two demonstrate personal codes.
const AVATARS = [
  { src: '/avatars/01.png', name: 'Adam F. - Staff', phoneX: 476, code: '123456' },
  { src: '/avatars/05.png', name: 'Ben R. - Staff', phoneX: 800, code: '456456' },
  { src: '/avatars/04.png', name: 'Carla M. - Staff', phoneX: 1124, code: '789789' },
  { src: '/avatars/02.png', name: 'Maya R. - Staff', code: '248135' },
  { src: '/avatars/03.png', name: 'Leo T. - Staff', code: '963852' },
];

// Start the efficiency chapter with three Open and two Claimed missions while
// retaining the four completions from the automation walkthrough.
const EFFICIENCY_MISSIONS = [
  ...DEMO_MISSIONS,
  { ...dm, id: 'team-updates', title: 'Review Team Updates', points: 10, appearsAt: EFFICIENCY_START - 1 },
  { ...dm, id: 'schedule', title: 'Confirm Work Schedule', points: 15, status: 'claimed',
    performer: AVATARS[3].name, performerAvatar: AVATARS[3].src,
    appearsAt: EFFICIENCY_START - 1, claimedAt: simulatedTime(EFFICIENCY_START - .5) },
];

export default function AutomationDemo({ scene=false, efficiency=false, personalMessage=false }) {
  const length = efficiency ? EFFICIENCY_LENGTH : AUTOMATION_LENGTH;
  const offset = efficiency ? EFFICIENCY_START : 0;
  const scenes = efficiency ? EFFICIENCY_SCENES : AUTOMATION_SCENES;
  const boardEnd = efficiency ? BOARD_END : EFFICIENCY_START - .6;
  const root=useRef(null), phones=useRef(null), tablet=useRef(null), timeline=useRef(null);
  const chips=useRef({}), avatars=useRef({}), codePanel=useRef(null);
  const {time:playbackTime,playing,speed,replay,toggle,seek,cycleSpeed}=useDemoPlayback(length);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageRead, setMessageRead] = useState(false);
  const [birthdayEnabled, setBirthdayEnabled] = useState(false);
  const [birthdayNotice, setBirthdayNotice] = useState('');
  useEffect(() => {
    if (!personalMessage) return;
    let enabled = true;
    let noticeTimer;
    try { enabled = localStorage.getItem(BIRTHDAY_ENABLED_KEY) !== 'false'; } catch { /* Storage may be unavailable in private contexts. */ }
    setBirthdayEnabled(enabled);
    const applySetting = next => {
      enabled = next;
      setBirthdayEnabled(next);
      setMessageOpen(false);
      setMessageRead(false);
    };
    const keydown = event => {
      if (!event.ctrlKey || !event.altKey || event.metaKey || event.shiftKey || event.repeat ||
        !['Digit0', 'Numpad0'].includes(event.code)) return;
      event.preventDefault();
      applySetting(!enabled);
      let saved = true;
      try { localStorage.setItem(BIRTHDAY_ENABLED_KEY, String(enabled)); } catch { saved = false; }
      setBirthdayNotice(`Birthday surprise ${enabled ? 'enabled' : 'disabled'}.${saved ? '' : ' Browser storage is unavailable, so this setting lasts only for this visit.'}`);
      clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => setBirthdayNotice(''), 4000);
    };
    const storage = event => {
      if (event.key === BIRTHDAY_ENABLED_KEY) applySetting(event.newValue !== 'false');
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('storage', storage);
    return () => {
      clearTimeout(noticeTimer);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('storage', storage);
    };
  }, [personalMessage]);
  const pendingPlayback = useRef('play');
  const requestPlayback = (restart = false) => {
    if (personalMessage && birthdayEnabled && !messageRead && (!playing || restart)) {
      if (playing) toggle();
      pendingPlayback.current = restart ? 'restart' : 'play';
      setMessageOpen(true);
      return;
    }
    if (restart) replay();
    else toggle();
  };
  const continueDemo = () => {
    setMessageOpen(false);
    setMessageRead(true);
    if (pendingPlayback.current === 'restart') replay();
    else toggle();
  };
  const time = playbackTime + offset;
  const missionTemplates = efficiency ? EFFICIENCY_MISSIONS : DEMO_MISSIONS;
  const demoState = useMemo(()=>{
    const state=automationState(time, missionTemplates, AVATARS);
    if(efficiency&&time>=URGENCY_START) state.missions=state.missions.map(m=>['prep','sig'].includes(m.id)?{...m,ageSeconds:(m.id==='prep'?3300:1500)+Math.max(0,Math.min(time,RECOGNITION_START)-URGENCY_START)}:m);
    if(efficiency&&time>=SCENE['gamification-extra'].start) state.missions=state.missions.map(m=>m.id==='prep'?{...m,points:30}:m);
    return state;
  },[time,missionTemplates,efficiency]);
  const teamBoard=<InteractiveMissionBoard device="tablet" referenceLayout initialScreen="board" initialMissions={missionTemplates} demoState={demoState}/>;

  useLayoutEffect(()=>{
    const tl=gsap.timeline({paused:true});
    timeline.current=tl;
    const phoneElements=phones.current.querySelectorAll('.adx-phone');
    gsap.set(phones.current,{autoAlpha:1});
    gsap.set(phoneElements,{autoAlpha:0,y:PERSONAL_REVEAL.phoneOriginY,scale:.08,transformOrigin:'50% 0%'});
    tl.to(phoneElements,{autoAlpha:1,y:0,scale:1,duration:PERSONAL_REVEAL.moveDuration,ease:easeOutArrival},PERSONAL_REVEAL.phoneMoveAt);
    PHONES.forEach((p,i)=>p.missions.forEach((m,j)=>{
      const el=chips.current[`${i}-${j}`];
      if(el) tl.fromTo(el,{autoAlpha:0,y:18,scale:.9},{autoAlpha:1,y:0,scale:1,duration:.5,ease:'back.out(1.6)'},m.pop);
    }));
    gsap.set(tablet.current,{xPercent:-50,x:TEAM_REVEAL.tabletX,y:TEAM_REVEAL.originY,scale:TEAM_REVEAL.tabletScale,rotationY:0,filter:'blur(0px)',autoAlpha:0,transformOrigin:`50% ${tablet.current.querySelector('.tbl-fit').offsetHeight/2}px`});
    tl.to(phones.current,{autoAlpha:0,duration:.4,ease:'sine.inOut'},TIMING.team-.4);
    tl.to(tablet.current,{y:TEAM_REVEAL.tabletY,autoAlpha:1,duration:TEAM_REVEAL.duration,ease:easeOutArrival},TEAM_REVEAL.tabletAt);
    tl.to(tablet.current,{scale:1.32,duration:BOARD_PHASES.approach,ease:'sine.inOut'},TIMING.claim);
    tl.to(tablet.current,{scale:TEAM_REVEAL.tabletScale,duration:.6,ease:'sine.inOut'},TIMING.close+BOARD_ACTION_DURATION+.1);
    // Move the entire device as one object; its screen retains its native layout.
    (efficiency ? SCENES.filter(s=>s.feature && s.start < URGENCY_START) : []).forEach(s=>{
      const right=['closed','names','execution','efficient'].includes(s.feature);
      const left=['open','timers','timer-colors','priority','points','extra-points'].includes(s.feature);
      const overview=s.feature==='overview';
      const detail=['timers','timer-colors','priority','points','extra-points'].includes(s.feature);
      const zoom=overview?TEAM_REVEAL.tabletScale:detail?1.75:right?1.6:1.65;
      tl.to(tablet.current,{scale:zoom,x:overview?0:right?-210:left?230:0,y:overview?TEAM_REVEAL.tabletY:right?-45:15,duration:.85,ease:'sine.inOut'},s.start);
    });
    if (efficiency) {
      tl.to(tablet.current,{scale:.62,x:0,y:20,rotationY:9,filter:'blur(8px)',autoAlpha:0,duration:1.15,ease:'power2.inOut'},URGENCY_START);
      tl.to(tablet.current,{scale:1.35,x:-110,y:0,rotationY:0,filter:'blur(0px)',autoAlpha:1,duration:.85,ease:'power2.inOut'},RECOGNITION_START);
    }
    tl.to(tablet.current,{autoAlpha:0,duration:.6,ease:'power2.in'},boardEnd);
    tl.to({},{duration:.4},offset+length-.4);
    return ()=>{tl.kill();};
  },[efficiency,boardEnd,offset,length]);
  // Apply the visual pose before measuring cards for avatar/card motion.
  useLayoutEffect(()=>{timeline.current?.seek(time,false);},[time]);
  useAutomationMotion({time,state:demoState,root,tablet,avatars,codePanel,people:AVATARS,boardEnd});

  const fullscreen=()=>root.current?.parentElement.requestFullscreen?.();
  const openCount=i=>PHONES[i].missions.filter(m=>time>=m.pop).length;
  const activeScene=scenes.find(s=>time>=s.start&&time<s.end)??scenes.at(-1);
  const phoneFeature=efficiency && time>=URGENCY_START && time<RECOGNITION_START && Boolean(activeScene.feature);
  const opening=time<TIMING.personal;
  const personalIntro=activeScene.id==='cue-personal';
  const teamIntro=activeScene.id==='cue-team';
  const sharedDeviceIntro=activeScene.id==='msg-mid';
  const titleDrop=personalIntro?PERSONAL_REVEAL.titleDrop*easeOutArrival((time-PERSONAL_REVEAL.phoneMoveAt)/PERSONAL_REVEAL.moveDuration):sharedDeviceIntro?TEAM_REVEAL.titleDrop*easeOutArrival((time-TEAM_REVEAL.tabletAt)/TEAM_REVEAL.duration):0;
  const textRemaining=activeScene.id==='msg-end'?Infinity:(sharedDeviceIntro?TIMING.claim:activeScene.end)-time;
  const tabletNote=TABLET_NOTES.find(note=>time>=note.start&&time<note.end);

  // Only the stage background toggles playback; controls handle their own clicks.
  const stageClick=e=>{if(e.target===e.currentTarget)requestPlayback();};
  const stageEl=<div className={`ad-fit${scene?' ad-fit--embed':''}`}><div className={`ad-stage${efficiency?' ad-stage--efficiency':''}`} ref={root} onClick={stageClick} role="button" tabIndex={-1} aria-label={playing?'Pause':'Play'}>
    <Starfield className="ad-stars" speed={speed} paused={!playing} fitParent />
    {(!activeScene.feature&&activeScene.id!=='cue-shared'&&(!sharedDeviceIntro||time<TIMING.claim))&&<DemoTypedText key={activeScene.id} text={activeScene.display} elapsed={time-activeScene.start} remaining={textRemaining} center={opening||personalIntro||teamIntro||sharedDeviceIntro||activeScene.center} offsetY={titleDrop} className={!['title-main','msg-end'].includes(activeScene.id)?'adx-script-intro-copy':''}/>}

    <div className="adx-phones" ref={phones}>
      {PHONES.map((p,i)=>(
        <div className="ph-fit adx-phone" key={p.name}>
          <PhoneShell title="Personal Board" tabs={[{label:`Open - ${openCount(i)}`,active:true},{label:'Claimed - 0'},{label:'Closed - 0'}]}>
            {p.missions.map((m,j)=>(
              <MissionChip key={m.title} ref={el=>{chips.current[`${i}-${j}`]=el;}} kind={m.kind} title={m.title} points={m.points} date={m.date} time={m.time} pillTime={m.pill} pillClass="chip--green"/>
            ))}
          </PhoneShell>
        </div>
      ))}
    </div>

    <div className={`adx-tablet${time>=TIMING.shared ? ' adx-tablet--engaged' : ''}${efficiency&&time>=RECOGNITION_START&&time<SETTLED_AT?' ef-awaiting-performers':''}`} ref={tablet} data-feature={activeScene.feature || undefined} style={efficiency&&time>=RECOGNITION_START?{'--performer-reveal':Math.max(0,Math.min(1,(time-SETTLED_AT)/.45))}:undefined}>
      {teamBoard}
      {['closed','claimed','open'].includes(activeScene.feature) && <svg className="adx-feature-callout" aria-hidden="true"><path data-callout-arrow pathLength="1"/><path data-callout-head/><rect data-callout-ring rx="10" pathLength="1"/></svg>}
      {activeScene.feature && !phoneFeature && !(efficiency&&time>=RECOGNITION_START&&time<SETTLED_AT) && <div className="adx-feature-caption"><DemoTypedText key={activeScene.id} text={activeScene.display} elapsed={time-Math.max(activeScene.start,activeScene.feature==='names'?SETTLED_AT:0)} remaining={activeScene.end-time} center className="adx-feature-copy"/></div>}
      {tabletNote&&<DemoTypedText key={tabletNote.id} text={tabletNote.text} elapsed={time-tabletNote.start} remaining={tabletNote.end-time} center className={`adx-tablet-note${tabletNote.lower ? ' adx-tablet-note--lower' : ''}`}/>}
    </div>

    {efficiency && <EfficiencyMissionSequence time={time} state={demoState} tablet={tablet} stage={root}/>}

    {AVATARS.map((a,i)=>(
      <img key={a.src} className="adx-avatar" ref={el=>{avatars.current[i]=el;}} src={a.src} alt="" aria-hidden="true"/>
    ))}
    <div className="adx-quick-code" ref={codePanel} aria-hidden={!demoState.showCode}>
      <header className="adx-code-header">{demoState.action?.to==='closed'?'Close':'Claim'} Personal Code<span aria-hidden="true">×</span></header>
      <div>{Array.from({length:6},(_,i)=><b key={i}>{i < demoState.code.length ? '●' : ''}</b>)}</div>
      <PersonalCodeKeypad tabIndex={-1}/>
    </div>

    {!playing&&playbackTime===0&&<button className="ad-start" onClick={e=>{e.stopPropagation();requestPlayback();}} aria-label={efficiency?'Play Increased Efficiency Demo':'Play Automation Demo'}><span>▶</span>Play Demo</button>}
  </div></div>;

  const controlsEl=<div className={`ad-controls${scene?' ad-controls--overlay':''}`}>
    <button onClick={()=>requestPlayback()}>{playing?'Pause':playbackTime>=length?'Replay':'Play'}</button>
    <button onClick={()=>requestPlayback(true)}>Restart</button>
    <input className="ad-scrub" type="range" min="0" max={length} step="0.05" value={Math.min(playbackTime,length)} onChange={seek} aria-label="Seek demo" style={{'--fill':`${(Math.min(playbackTime,length)/length)*100}%`}}/>
    <span>{timeLabel(playbackTime)} / {timeLabel(length)}</span>
    <button onClick={cycleSpeed} aria-label={`Playback speed: ${speed}×`} title="Cycle playback speed: 1×, 2×, 3×">{speed}×</button>
    <button onClick={fullscreen}>Fullscreen</button>
  </div>;

  if(scene) return <div className="ad-scene">{stageEl}{controlsEl}</div>;
  return <div className="page">
    <Navbar returnHome/>
    {personalMessage && birthdayEnabled && <GabrielMessage open={messageOpen} onDismiss={()=>setMessageOpen(false)} onContinue={continueDemo}/>}
    {birthdayNotice && <p className="ad-birthday-notice" role="status">{birthdayNotice}</p>}
    <main className="ad-page">
      <header className="ad-head">
        <span className="ad-kicker">Product Demo</span>
        <h1>{efficiency?'Increased Efficiency':'Automated Business Manager'}</h1>
        <p>{efficiency?'Engage, Motivate, And Reward Your Team.':'A Scripted Walkthrough Of The Real Taskmaverick Interface.'}</p>
      </header>
      {stageEl}
      {controlsEl}
    </main>
  </div>;
}




