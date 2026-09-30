'use client';
// Increased Efficiency — storytelling cut (/increased-efficiency-v2). Same
// words as /increased-efficiency-demo, redesigned from the CEO review of
// 2026-09-28. Timing and layout live in lib/efficiencyV2Story.mjs. Claiming and
// closing are the original choreography (useAutomationMotion, unchanged); this
// page renders the rest and measures where the hand and the words go.
import {Fragment,useEffect,useLayoutEffect,useRef,useState} from 'react';
import gsap from 'gsap';
import Navbar from './Navbar';
import PhoneShell from './PhoneShell';
import MissionChip from './MissionChip';
import InteractiveMissionBoard from './InteractiveMissionBoard';
import {PersonalCodeKeypad} from './PersonalCodeDialog';
import DemoTypedText from './DemoTypedText';
import DemoTextEditor from './DemoTextEditor';
import {DemoTextContext} from './DemoTextContext';
import useDemoTextEditor from './useDemoTextEditor';
import savedText from '@/content/demo-text/increased-efficiency-v2.json';
import Starfield from './Starfield';
import useDemoPlayback from './useDemoPlayback';
import useClipSlice from './useClipSlice';
import DemoHand from './DemoHand';
import {drawHand} from './demoHandDom';
import {BubbleLayer} from './CaptionBubbles';
import {drawBubble,clearBubble} from './captionBubbleDom';
import {MESSAGE as B,bubbleMetrics,bubbleRoom} from '@/lib/captionBubbles.mjs';

const BUBBLE_ROOM=bubbleRoom(B);// the tablet and the phones give way to the bubble's room
import useAutomationMotion from './useAutomationMotion';
import {automationState,avatarRailAt} from '@/lib/automationState.mjs';
import {TABLET_WIDTH,FRAME_RIGHT,tabletPose,phonesLeft,EFFICIENCY_STORY,STORY_LENGTH,TEXT_SPEED,TEXT_AT,CLIP_SKIP,SAY,HAND_STOPS,LAYOUT,CARD,CARDS,PEOPLE,INDIVIDUALS,BOARD_TEMPLATES,CYCLE_MISSIONS,CYCLE_ACTIONS,efficiencyFrame,boardAt,boardTimers,filmTimeOfBoard,motionProgress,devicesAt,teamPose,captionPlan,ease,mix} from '@/lib/efficiencyV2Story.mjs';
import './EfficiencyStoryDemo.css';
import './EfficiencyV2Demo.css';

const label=s=>`${Math.floor(s/60)}:${String(Math.floor(s)%60).padStart(2,'0')}`;
const clock=s=>{s=Math.max(0,Math.floor(s));return [s/3600,s/60%60,s%60].map(n=>String(Math.floor(n)).padStart(2,'0')).join(':');};
const FIT_HALF=TABLET_WIDTH*896/1285/2;// the tablet's unscaled center height
// A mission card in the tablet's own card styles (a 1080px board: 1 unit = 1px).
function Card({m,pointsPop=0}){
 return <div className="mi-interactive mi-interactive--tablet mi-reference ev2-card-frame"><div className="mi-tablet-board ev2-board">
  <MissionChip style={{width:CARD.width,'--demo-timer-color':m.timerColor,'--ev2-points-pop':pointsPop}} kind={m.type} points={m.points} title={m.title} who={m.status==='open'?undefined:m.performer} date={m.date} time={m.time} showExec={m.status!=='open'} execTime={clock(m.executionSeconds)} pillTime={clock(m.ageSeconds)} pillClass={m.status==='closed'?'chip--gray':'chip--green'}/>
 </div></div>;
}
const CalendarIcon=()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>;
// Chapter 13: each personal board's missions.
const PHONE_MISSIONS=[['Inventory Check','Order Supplies','Safety Check'],['Prepare Workspace','Clean Break Room'],['Restock Front Desk','Review Team Updates','Confirm Tomorrow’s Schedule']];
// Ring targets.
const TARGETS={
 'tablet-top':'.ev2-tablet .tbl-header',
 'points-inv':'.ev2-cards [data-card="inv"] .chip-points','points-ord':'.ev2-cards [data-card="ord"] .chip-points',
 'pill-inv':'.ev2-cards [data-card="inv"] .chip-pill','card-sig':'.ev2-cards [data-card="sig"] .chip',
 'exec-sig':'.ev2-iso [data-card="sig"] .chip-exec','exec-front':'.ev2-iso [data-card="front"] .chip-exec',
 'who-sig':'.ev2-iso [data-card="sig"] .chip-who','who-front':'.ev2-iso [data-card="front"] .chip-who',
};

// `embed` (the Assets Library, /increased-efficiency-v2/embed): only the player,
// on the chapters named by `clip` (see useClipSlice), in the given `mode`.
export default function EfficiencyV2Demo({embed=false,clip=null,mode='player',still=.7,autoplay=false}){
 const [duration,setDuration]=useState(STORY_LENGTH);
 const playback=useDemoPlayback(duration);
 const {time:playerTime,playing,speed,toggle,replay,seek,cycleSpeed}=playback;
 const player=useRef(null),stage=useRef(null),boardRoot=useRef(null),tablet=useRef(null),codePanel=useRef(null),avatars=useRef({}),captionBox=useRef(null),bubbleLayer=useRef(null),handEl=useRef(null),rippleEl=useRef(null),isoCards=useRef([]);
 const editor=useDemoTextEditor('increased-efficiency-v2',EFFICIENCY_STORY,savedText,playerTime,stage);
 const time=editor.clock.originalTime;
 useEffect(()=>setDuration(editor.clock.duration),[editor.clock.duration]);
 const {from,to:end,play,restart}=useClipSlice({playback,timeline:editor.clock.timeline,clip,mode:embed?mode:'page',still,autoplay,skips:CLIP_SKIP});
 const extra=BUBBLE_ROOM,tabletAt=tabletPose(extra);
 const bare=embed&&mode!=='player';// a preview or a still: the stage alone
 const frame=efficiencyFrame(time),dev=devicesAt(time),{scene,elapsed}=frame;
 // The original choreography's board, on its own clock.
 const board=boardAt(time);
 const state=automationState(board.t,board.cycle?CYCLE_MISSIONS:BOARD_TEMPLATES,PEOPLE,board.actions);
 if(state.action?.to==='closed')state.action={...state.action,returnProgress:motionProgress(board.t,state.action.confirm,state.action.end,board.actions)};
 state.missions=boardTimers(time,state.missions,board.cycle);
 state.boardTitle='Team Board';
 const [revision,setRevision]=useState(0);
 useEffect(()=>{
  let windowedScale;
  const resize=()=>{const scale=stage.current.getBoundingClientRect().width/1600;if(document.fullscreenElement!==player.current||windowedScale==null)windowedScale=scale;stage.current.style.setProperty('--ev2-caption-size',embed?'27px':`${19/windowedScale}px`);setRevision(r=>r+1);};
  resize();const observer=new ResizeObserver(resize);observer.observe(stage.current.parentElement);document.addEventListener('fullscreenchange',resize);window.addEventListener('resize',resize);
  return()=>{observer.disconnect();document.removeEventListener('fullscreenchange',resize);window.removeEventListener('resize',resize);};
 },[embed]);
 // Claim / close / the loop: the original, unchanged (the rail left of the
 // tablet, the small personal code, the circle, docking in the name slot).
 useAutomationMotion({time:board.t,state,root:boardRoot,tablet,avatars,codePanel,people:PEOPLE,boardEnd:999,highlightMode:'outline',avatarChoreography:'highlight',actions:board.actions,codePanelScale:.8});
 const mission=id=>frame.cards.find(m=>m.id===id);
 const showTablet=dev.tablet>0||(dev.iso>0&&dev.lift<1);
 useLayoutEffect(()=>{
  const st=stage.current;if(!st)return;
  const s=st.getBoundingClientRect(),unit=s.width/1600;
  const rect=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {x:(r.left-s.left)/unit,y:(r.top-s.top)/unit,w:r.width/unit,h:r.height/unit};};
  const fit=rect(st.querySelector('.ev2-tablet .tbl-fit')),railList=avatarRailAt(board.t,PEOPLE.length,board.actions);
  // The team, where the page places them (after the choreography has run):
  // 6 = a row in the middle, then to the original rail; 13 = over the phones;
  // elsewhere the choreography's pose, fading with the tablet.
  PEOPLE.forEach((p,i)=>{
   const el=avatars.current[i];if(!el)return;
   const pose=teamPose(time,i,extra);
   if(!pose){gsap.set(el,{autoAlpha:Number(gsap.getProperty(el,'opacity'))*dev.tablet});return;}
   if(pose.row){
    // the original rail: 102px left of the tablet, stacked up from its bottom
    const rail=fit?{x:fit.x-102,y:fit.y+fit.h-142-(railList.length-1-railList.indexOf(i))*100}:pose.row,t=pose.travel;
    gsap.set(el,{x:mix(pose.row.x,rail.x,t),y:mix(pose.row.y,rail.y,t)-Math.sin(Math.PI*t)*55,scale:1,autoAlpha:pose.opacity,transformOrigin:'0 0',zIndex:9});
    return;
   }
   gsap.set(el,{x:pose.x,y:pose.y,scale:1,autoAlpha:pose.opacity,transformOrigin:'0 0',zIndex:9});
  });
  // The loop's new mission fades in as it is posted.
  const fresh=st.querySelector('.ev2-tablet [data-mission-id="cycle-new"]');
  if(fresh){const reveal=ease((time-filmTimeOfBoard(CYCLE_ACTIONS[0].confirm,true))/.7);gsap.set(fresh,{autoAlpha:reveal,y:32*(1-reveal)});}
  const place=()=>{
   const q=sel=>st.querySelector(sel);
   const union=(...rs)=>rs.filter(Boolean).reduce((a,b)=>a?{x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.max(a.x+a.w,b.x+b.w)-Math.min(a.x,b.x),h:Math.max(a.y+a.h,b.y+b.h)-Math.min(a.y,b.y)}:b,null);
   const boardCard=id=>rect(q(`.ev2-tablet [data-mission-id="${id}"] .chip`));
   const layerCard=(layer,id)=>rect(q(`.ev2-${layer} [data-card="${id}"] .chip`));
   // Lifted out (10-12): the two closed missions, from the tablet to a
   // column beside the words.
   ['sig','front'].forEach((id,i)=>{
    const el=isoCards.current[i];if(!el)return;
    const {left,top,width,gap}=LAYOUT.iso,k1=width/CARD.width,y1=top+i*(CARD.height*k1+gap);
    const from=dev.lift<1?boardCard(id):null,p=from?dev.lift:1;
    el.style.transform=`translate(${mix(from?.x??left,left,p)}px,${mix(from?.y??y1,y1,p)}px) scale(${mix((from?.w??width)/CARD.width,k1,p)})`;
   });
   // Words: beside the art's right edge, level with what they talk about.
   const tabletRect=rect(q('.ev2-tablet .tbl-fit'));
   const resolve=key=>{
    switch(key){
     case 'tablet':return tabletRect&&{...tabletRect,w:tabletRect.w*FRAME_RIGHT};
     case 'cards':return union(...CARDS.map(c=>layerCard('cards',c.id)));
     case 'cards-inv-ord':return union(layerCard('cards','inv'),layerCard('cards','ord'));
     case 'card-inv':return layerCard('cards','inv');
     case 'card-sig':return layerCard('cards','sig');
     case 'board-sig':return boardCard('sig');
     case 'keypad':return rect(codePanel.current);
     case 'iso':return union(layerCard('iso','sig'),layerCard('iso','front'));
     case 'phones':return union(...[...st.querySelectorAll('.ev2-phones .ph-phone')].map(rect));// the visible phones
     default:return null;
    }
   };
   // Targets the hand clicks: a named element, or what the words are beside.
   const rectOf=key=>TARGETS[key]?rect(q(TARGETS[key])):resolve(key);
   const pointOf=(key,kind)=>{const r=rectOf(key);return r&&(kind==='scroll'?{x:r.x+r.w*.5,y:r.y+r.h*.7}:{x:r.x+r.w-3,y:r.y+r.h*.55});};
   // The hand flies to its target, clicks it at its right edge (the bubble's tail
   // starts there, so it never covers the text), and the bubble comes out of the click.
   const fingertip=drawHand({hand:handEl.current,ripple:rippleEl.current,pose:frame.hand,pointOf});
   // Words: beside the art's right edge, level with the hand (and the bubble's
   // tail reaching its fingertip).
   const cap=captionBox.current;
   if(cap){
    const plan=captionPlan(time),side=1-plan.center;
    const edgeOf=k=>{const r=resolve(k);return r?r.x+r.w:null;};
    const both=(g,of,fallback)=>{const a=of(g.from)??of(g.to)??fallback,b=of(g.to)??a;return mix(a,b,g.p);};
    const p=cap.querySelector('p'),h=cap.offsetHeight||0,w=p?.offsetWidth||0;
    // The words also need the bubble's outline around them, a tail's length from
    // the art, and the bubble sits a little above the level they point at.
    const m=bubbleMetrics(B,w,h);
    let left=800,top=450,tip=null;
    if(side>0){
     const edgeX=both(plan.edge,edgeOf,800),level=fingertip?.y??pointOf(HAND_STOPS[scene.id]?.[0]?.target)?.y??450;
     // the tail's length gives way first when the art is far to the right
     const tail=Math.max(0,Math.min(B.gap,1600-LAYOUT.margin-edgeX-LAYOUT.wordsGap-m.left-m.right-w));
     left=mix(800,edgeX+LAYOUT.wordsGap+tail+m.left,side);top=mix(450,level-B.lift,side);
     tip=fingertip;
    }
    const room=(side>0?1600-LAYOUT.margin-left:1600-2*LAYOUT.margin)-(m.right+(side>0?0:m.left));
    Object.assign(cap.style,{left:`${left}px`,transform:`translate(${mix(-50,0,side)}%,-50%)`});
    const fit=Math.min(1,room/Math.max(1,w)),pad=Math.max(m.top,m.bottom),topPx=Math.min(900-LAYOUT.margin-h/2-pad,Math.max(LAYOUT.margin+h/2+pad,top));
    cap.style.top=`${topPx}px`;
    cap.style.setProperty('--ev2-origin',`${mix(50,0,side)}% 50%`);
    if(p)cap.style.setProperty('--ev2-fit',fit);
    // the bubble comes out of the click: nothing before it
    const t=elapsed-(SAY[scene.id]??0);
    if(bubbleLayer.current&&tip&&t>=0)drawBubble({g:bubbleLayer.current,cap,style:B,stage:s,unit,fit,originX:mix(.5,0,side),layout:{left,top:topPx},tip,tailP:side,t,remaining:embed?Infinity:scene.end-time});
    else clearBubble(bubbleLayer.current,cap);
   }else clearBubble(bubbleLayer.current,null);
  };
  place();const raf=requestAnimationFrame(place);
  return()=>cancelAnimationFrame(raf);
 });
 const stackK=LAYOUT.stack.width/CARD.width,stackH=CARD.height*stackK;
 const ind=time-EFFICIENCY_STORY.find(s=>s.id==='individuals').start;
 const title=scene.title;
 const playerBlock=<>
  <DemoTextContext.Provider value={{stageRef:stage,settings:editor.config.captions[scene.id]||{},text:scene.text,elapsed:editor.clock.elapsed,remaining:editor.clock.remaining,speed:TEXT_SPEED,defaultDelay:TEXT_AT[scene.id]??0}}>
  <div ref={player} className="es-player demo-text-scope"><style>{editor.uiStyles}</style>
   <div className={`ad-fit${bare?' ad-fit--embed':''}`}><div ref={stage} className={`ad-stage ev2-stage ev2-scene-${scene.id}`} onClick={e=>{if(!bare&&!e.target.closest('button,a,input'))play();}} role="button" tabIndex={0} aria-label={playing?'Pause demo':'Play demo'} onKeyDown={e=>{if(e.target===e.currentTarget&&['Enter',' '].includes(e.key)){e.preventDefault();toggle();}}}>
    <Starfield className="ad-stars" paused={!playing} speed={speed} fitParent/>
    {/* The original choreography's world: tablet, team and personal code. */}
    <div ref={boardRoot} className="ev2-board-root">
     {showTablet&&<div ref={tablet} className={`adx-tablet adx-tablet--engaged ev2-tablet${dev.lift>0&&dev.iso>0?' ev2-lifting':''}`} style={{opacity:Math.min(1,dev.tablet*1.4),transform:`translateX(-50%) translate(${tabletAt.x}px,${LAYOUT.tablet.y+dev.tabletY}px) scale(${tabletAt.scale})`,transformOrigin:`50% ${FIT_HALF}px`}}>
      <InteractiveMissionBoard device="tablet" referenceLayout initialScreen="board" initialMissions={BOARD_TEMPLATES} demoState={state}/>
     </div>}
     {PEOPLE.map((p,i)=><img key={p.src} ref={el=>{avatars.current[i]=el;}} className="adx-avatar" src={p.src} alt="" aria-hidden="true"/>)}
     <div className="adx-quick-code" ref={codePanel} aria-hidden={!state.showCode}>
      <header className="adx-code-header">{state.action?.to==='closed'?'Close':'Claim'} Personal Code<span>×</span></header>
      <div>{Array.from({length:6},(_,i)=><b key={i}>{i<state.code.length?'●':''}</b>)}</div><PersonalCodeKeypad tabIndex={-1}/>
     </div>
    </div>
    {/* 2-5: the missions by themselves, each with its schedule. */}
    {dev.cards>0&&<div className="ev2-cards" style={{opacity:dev.cards}}>{CARDS.map((c,i)=>{
     const pop=frame.cardIn[i],y=LAYOUT.stack.top+frame.slots[c.id]*(stackH+LAYOUT.stack.gap),k=stackK*(.85+.15*pop);
     return <Fragment key={c.id}>
      <div className="ev2-card" data-card={c.id} style={{opacity:Math.min(1,pop*1.5),zIndex:c.id==='sig'?2:1,transform:`translate(${frame.stackLeft+(stackK-k)*CARD.width/2}px,${y+(stackK-k)*CARD.height/2}px) scale(${k})`}}><Card m={frame.cards[i]} pointsPop={frame.pointsPop[i]}/></div>
      {frame.scheduleIn[i]>0&&<span className="ev2-schedule" style={{left:frame.stackLeft-22,top:y+stackH/2,opacity:frame.scheduleIn[i],transform:`translate(-100%,-50%) scale(${.9+.1*frame.scheduleIn[i]})`}}><CalendarIcon/>{c.schedule}</span>}
     </Fragment>;})}</div>}
    {/* 10-12: the two closed missions, lifted out. */}
    {dev.iso>0&&<div className="ev2-iso" style={{opacity:Math.min(1,dev.iso*4)*(dev.iso<1&&dev.lift>=1?dev.iso:1)}}>{['sig','front'].map((id,i)=><div key={id} ref={el=>{isoCards.current[i]=el;}} className="ev2-card" data-card={id}><Card m={mission(id)}/></div>)}</div>}
    {/* 13: three personal boards, their missions popping in. */}
    {frame.phones>0&&<div className="ev2-phones" style={{left:phonesLeft(extra),top:LAYOUT.phones.top,opacity:Math.min(1,frame.phones*1.5),transform:`translateY(${(1-frame.phones)*40}px) scale(${.94+.06*frame.phones})`}}>
     {PHONE_MISSIONS.map((list,p)=><div className="ph-fit adx-phone" key={p}><PhoneShell title="Personal Board" tabs={[{label:`Open - ${frame.phoneMissions[p]}`,active:true},{label:'Claimed - 0'},{label:'Closed - 0'}]}>
      {list.map((title,j)=>{const t=INDIVIDUALS.pops[p][j],pop=ease((ind-t)/.35);return pop>0&&<div className="es-phone-mission" key={title} style={{opacity:pop,transform:`translateY(${14*(1-pop)}px) scale(${.92+.08*pop})`}}><MissionChip title={title} points={[10,15,20][j]} date="07-14-26" time="08:00 AM" pillTime={clock(ind-t)}/></div>;})}
     </PhoneShell></div>)}
    </div>}
    {!title&&<BubbleLayer gRef={bubbleLayer}/>}
    {title?<DemoTypedText lineBeats key={scene.id} className="es-title" text={scene.text} elapsed={(elapsed-(TEXT_AT[scene.id]??0))*TEXT_SPEED} remaining={embed||scene===EFFICIENCY_STORY.at(-1)?Infinity:scene.end-time} center/>
     :<div ref={captionBox} className="ev2-caption cb-caption"><DemoTypedText key={scene.id} lineBeats text={scene.text} elapsed={(elapsed-(TEXT_AT[scene.id]??0))*TEXT_SPEED} remaining={embed?Infinity:scene.end-time} center/></div>}
    {!title&&<DemoHand handRef={handEl} rippleRef={rippleEl}/>}
   </div></div>
   {!bare&&<div className="ad-controls es-controls"><button onClick={play}>{playing?'Pause':playerTime>=end-.05?'Replay':'Play'}</button><button onClick={restart}>Restart</button>
    <input className="ad-scrub" type="range" min={from} max={end} step="0.05" value={Math.min(end,Math.max(from,playerTime))} onChange={seek} aria-label="Seek demo" style={{'--fill':`${(playerTime-from)/(end-from)*100}%`}}/>
    <span>{label(Math.max(0,playerTime-from))} / {label(end-from)}</span><button onClick={cycleSpeed} aria-label={`Playback speed: ${speed}×`}>{speed}×</button>
    <button onClick={()=>document.fullscreenElement?document.exitFullscreen():player.current.requestFullscreen()}>Fullscreen</button>
   </div>}
  </div>
  </DemoTextContext.Provider>
 </>;
 if(embed)return <div className={`ev2-embed${bare?' ev2-embed--bare':''}`}>{playerBlock}</div>;
 return <div className="page"><Navbar returnHome/><main className="ad-page">
  <header className="ad-head"><span className="ad-kicker">Product Demo</span><h1>Increased Efficiency</h1><p>Automatic Assignments. Clear Priorities. Motivated Teams.</p></header>
  {playerBlock}
  <DemoTextEditor editor={editor} seek={seek} toggle={toggle} playing={playing} baseSpeed={TEXT_SPEED}/>
  <nav className="es-chapters" aria-label="Demo chapters">{editor.clock.timeline.map((s,i)=><button key={s.id} aria-current={scene.id===s.id?'step':undefined} onClick={()=>seek({target:{value:s.start}})}><span>{String(i+1).padStart(2,'0')}</span>{s.text}</button>)}</nav>
 </main></div>;
}
