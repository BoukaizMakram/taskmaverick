'use client';
// Improved Quality — storytelling cut (/improved-quality-v2). Same words as
// /improved-quality-demo, redesigned from the CEO review of 2026-09-28: the
// words sit next to what they describe and move with it. Timing and layout
// live in lib/improvedQualityV2Story.mjs; this page renders the frame and
// measures where the hand and the words go.
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import Navbar from './Navbar';
import DemoTypedText from './DemoTypedText';
import DemoTextEditor from './DemoTextEditor';
import {DemoTextContext} from './DemoTextContext';
import useDemoTextEditor from './useDemoTextEditor';
import savedText from '@/content/demo-text/improved-quality-v2.json';
import Starfield from './Starfield';
import useDemoPlayback from './useDemoPlayback';
import useClipSlice from './useClipSlice';
import DemoHand from './DemoHand';
import {drawHand} from './demoHandDom';
import {BubbleLayer} from './CaptionBubbles';
import {drawBubble,clearBubble} from './captionBubbleDom';
import {MESSAGE as B,bubbleMetrics,bubbleRoom} from '@/lib/captionBubbles.mjs';

const BUBBLE_ROOM=bubbleRoom(B);// the art gives way to the bubble's room
import InteractiveMissionBoard from './InteractiveMissionBoard';
import UsageReport from './UsageReport';
import {KnowledgeBase,StoryMission,IsoMission,PopCell,BusinessProofs} from './ImprovedQualityV2Panels';
import {QUALITY_STORY,QUALITY_TEXT_SPEED,TEXT_AT,CLIP_SKIP,LAYOUT,ISO,POP_CELL,qualityStoryFrame,SAY,HAND_STOPS,cameraAt,reportScale,devicesAt,captionPlan,missionScrollAt,toScreen,mix} from '@/lib/improvedQualityV2Story.mjs';
import './EfficiencyStoryDemo.css';
import './ImprovedQualityDemo.css';
import './ImprovedQualityV2Demo.css';

const label=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
// Chapter 2's Team Board: three open, two claimed.
const BOARD_MISSIONS=[
 ...['Ice Maker Filter Check','Opening Quality Check','Equipment Inspection'].map((title,i)=>({id:`quality-${i}`,type:i===1?'Checklist':'Task',title,status:'open',points:null,date:'08-02-26',time:'11:19 AM',ageSeconds:10563-i*180})),
 ...[['Walk-In Cooler Temp Log','Checklist','Anna F',734,11412,'10:48 AM'],['Restroom Cleaning','Task','Gabriel F',1512,12105,'10:37 AM']]
  .map(([title,type,performer,executionSeconds,ageSeconds,time],i)=>({id:`quality-claimed-${i}`,type,title,status:'claimed',points:null,performer,executionSeconds,ageSeconds,date:'08-02-26',time})),
];
// Chapters 12-17: Team A's full board (three open, two claimed, four closed
// that can be rated); Opening Quality Check is the one lifted out.
const mission=(title,type,points,rest)=>({id:`emphasis-${title}`,title,type,points,date:'09-23-26',...rest});
const TEAM_A=[
 ...[['Walk-In Freezer Check','Checklist',25,4720],['Hand Sink Restock','Task',10,4540],['Grease Trap Inspection','Task',20,4360]].map(([title,type,points,ageSeconds])=>mission(title,type,points,{status:'open',time:'03:05 PM',ageSeconds})),
 ...[['Dining Room Reset','Checklist',25,'Carla M',412,5020],['Dish Machine Temp Log','Task',10,'Ben R',268,5240]].map(([title,type,points,performer,executionSeconds,ageSeconds])=>mission(title,type,points,{status:'claimed',performer,executionSeconds,ageSeconds,time:'02:58 PM'})),
 ...[['Opening Quality Check','Checklist',25,'Anna F',522,4935,'04:12 PM'],['Ice Maker Filter Check','Task',20,'Anna F',190,5102,'04:03 PM'],['Fry Dispenser Cleaning','Checklist',25,'Gabriel F',77,4925,'11:51 AM'],['Brew Coffee','Task',10,'Gabriel F',23,5111,'11:49 AM']]
  .map(([title,type,points,performer,executionSeconds,ageSeconds,time],i)=>mission(title,type,points,{status:'closed',stopped:4-i,performer,executionSeconds,ageSeconds,time,rateable:true})),
];
const RATED='emphasis-Opening Quality Check';
// Named targets; any other key is looked up as [data-iq-target="key"].
const TARGETS={
 menu:'.iq2-kb-tablet .tbl-header [aria-label="Menu"]',
 knowledge:'.iq2-kb-tablet .bn-menu-item:has(img[src="/board-icons/team-book.svg"])',
 'tablet-menu':'.iq-emphasis-tablet .tbl-header [aria-label="Menu"]',
 'business-media':'.iq-emphasis-tablet [data-iq-target="business-media"]',
 mission:'.iq2-mission',report:'.iq2-report',
 iso:'.iq2-iso-stack .chip','iso-card':'.iq2-iso-stack .chip','iso-ratings':'.iq2-iso-stack .chip-ratings','rate-0':'.iq2-iso-stack .chip-rate',
 'rated-card':`.iq-emphasis-tablet [data-mission-id="${RATED}"] .chip`,
 'rate-knob':'.iq2-iso-stack .iq-rate-knob',proofs:'.iq-emphasis-tablet .iq-bp-window','mission-window':'.iq2-mission .iq2-m-window',
};
// Where a target goes once its click has changed the screen.
const GONE_TO={'add-photo':'photo-proof','add-video':'video-proof','rate-0':'iso-card','rate-submit':'iso-card','rate-knob':'iso-card','business-media':'proofs','training-play':'training-tile'};
const STEP_SPOT=150;// stage px between the pinned chip and the Yes the hand clicks, in every step
const W0=334;// a tablet column's card width, in its 1080px board

// `embed` (the Assets Library, /improved-quality-v2/embed): only the player, on
// the chapters named by `clip` (see useClipSlice), in the given `mode`.
export default function ImprovedQualityV2Demo({embed=false,clip=null,mode='player',still=.7,autoplay=false}){
 const [duration,setDuration]=useState(QUALITY_STORY.at(-1).end);
 const playback=useDemoPlayback(duration);
 const {time:playerTime,playing,speed,toggle,replay,seek,cycleSpeed}=playback;
 const player=useRef(null),bubbleLayer=useRef(null),stage=useRef(null),handEl=useRef(null),rippleEl=useRef(null),captionBox=useRef(null),iso=useRef(null),panel=useRef(null),holes=useRef([]);
 const editor=useDemoTextEditor('improved-quality-v2',QUALITY_STORY,savedText,playerTime,stage);
 const time=editor.clock.originalTime;
 useEffect(()=>setDuration(editor.clock.duration),[editor.clock.duration]);
 const {from,to:end,play,restart}=useClipSlice({playback,timeline:editor.clock.timeline,clip,mode:embed?mode:'page',still,autoplay,skips:CLIP_SKIP});
 const frame=qualityStoryFrame(time),{scene,elapsed,menu,knowledge}=frame;
 const cam=cameraAt(time,BUBBLE_ROOM),dev=devicesAt(time);
 const [revision,setRevision]=useState(0);
 useEffect(()=>{
  let windowedScale;
  const resize=()=>{const scale=stage.current.getBoundingClientRect().width/1600;if(document.fullscreenElement!==player.current||windowedScale==null)windowedScale=scale;stage.current.style.setProperty('--iq-caption-size',embed?'27px':`${19/windowedScale}px`);setRevision(r=>r+1);};
  resize();const observer=new ResizeObserver(resize);observer.observe(stage.current.parentElement);document.addEventListener('fullscreenchange',resize);window.addEventListener('resize',resize);
  return()=>{observer.disconnect();document.removeEventListener('fullscreenchange',resize);window.removeEventListener('resize',resize);};
 },[embed]);
 const opening=scene.view==='title';
 const ratedMission={...TEAM_A.find(m=>m.id===RATED),ratings:frame.rating.ratings};
 const teamA=TEAM_A.map(m=>m.id===RATED?ratedMission:m);
 // Everything measured lands here each frame, in this order: the mission's
 // expand and scroll, the lifted-out card, the hand, then the words.
 useLayoutEffect(()=>{
  const place=()=>{
   const st=stage.current;if(!st)return;
   const s=st.getBoundingClientRect(),unit=s.width/1600;
   const find=key=>st.querySelector(TARGETS[key]||`[data-iq-target="${key}"]`);
   const rect=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {x:(r.left-s.left)/unit,y:(r.top-s.top)/unit,w:r.width/unit,h:r.height/unit};};
   // 20-21: the two report items talked about (missions 3 and 4 are in view):
   // 'performers' = "1. Nelson P" / "1. Ben R", 'dates' = their date & time.
   const union=(a,b)=>a&&b?{x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.max(a.x+a.w,b.x+b.w)-Math.min(a.x,b.x),h:Math.max(a.y+a.h,b.y+b.h)-Math.min(a.y,b.y)}:a||b;
   const pad=(r,x,y)=>r&&{x:r.x-x,y:r.y-y,w:r.w+2*x,h:r.h+2*y};
   const text=(key,i)=>find(`${key==='dates'?'web-date':'web-name'}-${i}`);
   const cells=key=>[2,3].map(i=>{const t=text(key,i);return pad((key==='dates'?[t]:t?[...t.parentElement.children]:[]).map(rect).reduce(union,null),6,4);});
   const rectOf=key=>{
    if(key==='step-spot'){// where each step's Yes is scrolled to: the same place every time
     const yes=rect(find('yes-0')),win=st.querySelector('.iq2-m-window'),chip=st.querySelector('.iq2-m-summary');
     if(!yes||!win||!chip)return null;
     const w=rect(win),kk=w.h/win.offsetHeight;
     return {x:yes.x,y:w.y+(chip.offsetHeight+STEP_SPOT)*kk,w:yes.w,h:yes.h};
    }
    return key==='performers'||key==='dates'?union(...cells(key)):rect(find(key));
   };
   // Spotlight: the dark has a hole over each item, open until it scales up.
   cells(dev.spot.key).forEach((r,i)=>{
    const hole=holes.current[i];if(!hole)return;
    if(!r){hole.setAttribute('fill-opacity',0);return;}
    Object.entries({x:r.x,y:r.y,width:r.w,height:r.h,'fill-opacity':dev.spot.open}).forEach(([k,v])=>hole.setAttribute(k,v));
   });
   // Scale-up: each item starts exactly on top of itself in the report (text
   // on text, same size), then grows and comes together with the other one,
   // stacked, centered on the middle between them, ending left of the words.
   [['performers','name',dev.names],['dates','date',dev.dates]].forEach(([key,kind,p])=>{
    const pops=[...st.querySelectorAll(`.iq2-pop--${kind}`)];if(!pops.length)return;
    const all=rectOf(key);if(!all)return;
    const k1=POP_CELL.height/pops[0].offsetHeight,mid=all.y+all.h/2,right=all.x+all.w+LAYOUT.wordsGap-POP_CELL.gap*1.5;
    const top=mid-(pops.length*POP_CELL.height+(pops.length-1)*POP_CELL.gap)/2;
    const left=right-Math.max(...pops.map(el=>el.offsetWidth))*k1;// one left edge; the widest ends at `right`
    pops.forEach((el,i)=>{
     const src=rect(text(key,i+2)),value=el.querySelector('b,time');if(!src||!value)return;
     const k0=src.h/value.offsetHeight,x0=src.x-k0*value.offsetLeft,y0=src.y-k0*value.offsetTop;
     const x1=left,y1=top+i*(POP_CELL.height+POP_CELL.gap);
     el.style.transform=`translate(${mix(x0,x1,p)}px,${mix(y0,y1,p)}px) scale(${mix(k0,k1,p)})`;
    });
   });
   // Mission (3-11): pops in as its summary card, centered, then expands.
   const box=panel.current;
   if(box){
    const content=box.querySelector('.iq2-m-content'),win=box.querySelector('.iq2-m-window'),card=box.querySelector('.iq2-m-summary');
    const e=frame.mission.expand,H=box.offsetHeight,top=card.offsetTop+win.offsetTop,bottom=top+card.offsetHeight;
    const shift=(LAYOUT.mission.height/2-(top+bottom)/2)*(1-e);
    box.style.transform=`translateY(${shift}px) scale(${.9+.1*dev.missionIn})`;
    box.firstElementChild.style.clipPath=`inset(${top*(1-e)}px 0 ${(H-bottom)*(1-e)}px 0 round ${14+4*e}px)`;
    // Scroll: the checkpoint named by the story sits at the top of the window,
    // under the mission chip (type, points, timer, name, Anna F, date), which stays
    // pinned on top with the back and ES bar while everything else scrolls beneath it.
    const at=key=>{if(key==='top')return 0;const el=content.querySelector(`[data-iq-target="${key}"]`);return el?el.getBoundingClientRect().top-content.getBoundingClientRect().top:0;};
    const k=content.getBoundingClientRect().height/content.offsetHeight||1,max=Math.max(0,content.offsetHeight-win.clientHeight);
    const chip=content.querySelector('.iq2-m-summary'),pinned=chip.offsetHeight;
    // a step's Yes lands in the same place every time (STEP_SPOT below the chip); any other checkpoint sits just under the chip
    const place=key=>at(key)/k-pinned-(key.startsWith('yes-')?STEP_SPOT:8);
    const {from,to,p}=missionScrollAt(time),y=Math.min(max,Math.max(0,mix(place(from),place(to),p)));
    content.style.transform=`translateY(${-y}px)`;
    chip.style.transform=`translateY(${y}px)`;
    chip.style.boxShadow=y>2?'0 10px 14px -10px rgb(21 39 54 / 30%)':'none';
   }
   // Lifted-out mission (12-15): from its place in the board to the ISO box.
   if(iso.current){
    const from=rect(find('rated-card')),p=dev.iso;
    const x0=from?.x??ISO.left,y0=from?.y??ISO.top,k0=(from?.w??ISO.width)/W0,k1=ISO.width/W0;
    iso.current.style.transform=`translate(${mix(x0,ISO.left,p)}px,${mix(y0,ISO.top,p)}px) scale(${mix(k0,k1,p)})`;
    iso.current.style.opacity=p>0?1:0;
   }
   // Words: beside the art's right edge, level with what they talk about.
   // The hand flies to its target, clicks it at its right edge (the bubble's tail
   // starts there, so it never covers the text), and the bubble comes out of the click.
   // (the closed mission the hand clicked is the one that lifts out: it follows it)
   // What a scroll presses is the middle of the area; everything else is pointed at
   // on its right edge. A button that has turned into what it opened (Add photo,
   // Submit…) is found where that is.
   const pointOf=(key,kind)=>{const r=rectOf(key==='rated-card'&&dev.iso>0?'iso-card':key)??rectOf(GONE_TO[key]??(key.startsWith('quiz-')?'training-tile':null));return r&&(kind==='scroll'?{x:r.x+r.w*.5,y:r.y+r.h*.7}:{x:r.x+r.w-3,y:r.y+r.h*.55});};
   const fingertip=drawHand({hand:handEl.current,ripple:rippleEl.current,pose:frame.hand,pointOf});
   // Words: beside the art's right edge, level with the hand (and the bubble's
   // tail reaching its fingertip).
   const cap=captionBox.current;
   if(cap){
    const plan=captionPlan(time);
    const edgeOf=e=>typeof e==='object'?toScreen(cam,e.x,0).x:((r=>r&&r.x+r.w)(rectOf(e)));
    const both=(g,of,fallback)=>{const a=of(g.from)??of(g.to)??fallback,b=of(g.to)??a;return mix(a,b,g.p);};
    const side=1-plan.center;
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
    // Beside the art; a caption too wide for the room left shrinks as a whole
    // (its lines never wrap).
    const room=(side>0?1600-LAYOUT.margin-left:1600-2*LAYOUT.margin)-(m.right+(side>0?0:m.left));
    Object.assign(cap.style,{left:`${left}px`,transform:`translate(${mix(-50,0,side)}%,-50%)`});
    const fit=Math.min(1,room/Math.max(1,w)),pad=Math.max(m.top,m.bottom),topPx=Math.min(900-LAYOUT.margin-h/2-pad,Math.max(LAYOUT.margin+h/2+pad,top));
    cap.style.top=`${topPx}px`;
    cap.style.setProperty('--iq2-origin',`${mix(50,0,side)}% 50%`);
    if(p)cap.style.setProperty('--iq-caption-fit',fit);
    // the bubble comes out of the click: nothing before it
    const t=elapsed-(SAY[scene.id]??0);
    if(bubbleLayer.current&&tip&&t>=0)drawBubble({g:bubbleLayer.current,cap,style:B,stage:s,unit,fit,originX:mix(.5,0,side),layout:{left,top:topPx},tip,tailP:side,t,remaining:embed?Infinity:scene.end-time});
    else clearBubble(bubbleLayer.current,cap);
   }else clearBubble(bubbleLayer.current,null);
  };
  place();const raf=requestAnimationFrame(place);
  return()=>cancelAnimationFrame(raf);
 },[time,revision,frame,dev,cam]);
 const bare=embed&&mode!=='player';// a preview or a still: the stage alone
 const kbTablet=dev.tabletShown&&!opening;
 const teamShown=dev.board>0&&dev.boardOpacity+dev.iso>0;
 const playerBlock=<>
 <DemoTextContext.Provider value={{stageRef:stage,settings:editor.config.captions[scene.id]||{},text:scene.text,elapsed:editor.clock.elapsed,remaining:editor.clock.remaining,speed:QUALITY_TEXT_SPEED,defaultDelay:TEXT_AT[scene.id]??0}}>
 <div className="es-player iq-player demo-text-scope" ref={player}><style>{editor.uiStyles}</style><div className={`ad-fit${bare?' ad-fit--embed':''}`}><div ref={stage} className="ad-stage iq-stage iq2-stage" data-scene={scene.id} data-view={scene.view} onClick={e=>{if(!bare&&!e.target.closest('button,a,input'))play();}} role="button" tabIndex={0} aria-label={playing?'Pause demo':'Play demo'} onKeyDown={e=>{if(e.target===e.currentTarget&&['Enter',' '].includes(e.key)){e.preventDefault();play();}}}>
  <Starfield className="ad-stars" paused={!playing} speed={speed} fitParent/>
  <div className="iq-camera" style={{transform:`translate(800px,450px) scale(${cam.s}) translate(${-cam.cx}px,${-cam.cy}px)`}}>
   {/* 2: the Team Board; Menu -> Knowledge Base -> Onboarding. */}
   {kbTablet&&<div className="adx-tablet adx-tablet--engaged iq-tablet iq2-kb-tablet" style={{opacity:dev.tabletIn*dev.tabletOpacity,transform:`translate(-50%,-50%) translateY(${dev.tabletLift*-70}px) scale(${LAYOUT.tablet.scale*(.94+.06*dev.tabletIn)})`,filter:dev.tabletIn<.98?`blur(${(1-dev.tabletIn)*6}px)`:'none','--iq-menu-pop':frame.kb.menuPop}} aria-hidden={!dev.tabletIn}>
    <InteractiveMissionBoard device="tablet" referenceLayout initialScreen="board" initialMissions={BOARD_MISSIONS}
     demoState={{missions:BOARD_MISSIONS,elapsed:0,selected:null,menuOpen:menu,boardTitle:'Team Board',businessMediaLabel:'Business Media'}} demoOverlay={knowledge?<KnowledgeBase frame={frame} playing={playing} speed={speed}/>:null}/>
   </div>}
   {/* 3-11: the mission by itself. */}
   {dev.missionOpacity>0&&<div ref={panel} className="iq2-mission" style={{left:LAYOUT.mission.left,top:LAYOUT.mission.top,width:LAYOUT.mission.width,height:LAYOUT.mission.height,opacity:dev.missionOpacity}}><StoryMission frame={frame} playing={playing} speed={speed}/></div>}
   {/* 12-17: Team A's board, its menu and Business Proofs. */}
   {teamShown&&<div className={`adx-tablet adx-tablet--engaged iq-tablet iq-emphasis-tablet${dev.iso>0?' iq2-isolating':''}`} style={{'--iq-menu-pop':frame.visibility.pop,opacity:dev.boardOpacity,transform:`translate(-50%,-50%) scale(${LAYOUT.tablet.scale*(.86+.14*dev.board)})`,filter:dev.board<.98?`blur(${(1-dev.board)*6}px)`:'none'}}>
    <InteractiveMissionBoard device="tablet" referenceLayout initialScreen="board" initialMissions={TEAM_A} demoState={{missions:teamA,elapsed:0,selected:null,menuOpen:frame.visibility.menu,boardTitle:'Team A',businessMediaLabel:'Business Media'}} demoOverlay={frame.visibility.proofsIn>0?<div className="iq-bp-layer" style={{opacity:Math.min(1,frame.visibility.proofsIn*1.5),transform:`translateX(${4*(1-frame.visibility.proofsIn)}%)`}}><BusinessProofs tablet scroll={frame.visibility.scroll}/></div>:null}/>
   </div>}
   {/* 18-21: the web report, cut at the Date & Time column. */}
   {dev.web>0&&dev.webOpacity>0&&<div className="iq2-report" style={{left:LAYOUT.report.left,top:LAYOUT.report.top,width:mix(LAYOUT.report.width,1600,dev.uncrop),height:LAYOUT.report.height,opacity:dev.webOpacity,transform:`scale(${reportScale(BUBBLE_ROOM)*(.94+.06*dev.web)})`}}><div className="iq2-report-page"><UsageReport web={frame.web}/></div></div>}
  </div>
  {/* 20-21: everything darkens except the cells being talked about (their
      holes are placed each frame above). */}
  {dev.dim>0&&<svg className="iq2-dim" viewBox="0 0 1600 900" style={{opacity:dev.dim}} aria-hidden="true"><defs><mask id="iq2-spotlight" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="900"><rect width="1600" height="900" fill="#fff"/>{[0,1].map(i=><rect key={i} ref={el=>{holes.current[i]=el;}} rx="6" fill="#000"/>)}</mask></defs><rect width="1600" height="900" mask="url(#iq2-spotlight)"/></svg>}
  {/* 12-15: the lifted-out mission (stage px). */}
  {dev.iso>0&&<div ref={iso} className="iq2-iso-layer"><IsoMission mission={ratedMission} frame={frame} width={W0}/></div>}
  {/* 20-21: the two names, then the two dates, scale up out of the report
      (placed each frame above). */}
  {dev.names>0&&dev.namesOpacity>0&&[0,1].map(i=><PopCell key={`name-${i}`} kind="name" i={i} style={{opacity:Math.min(1,dev.names*8)*dev.namesOpacity}}/>)}
  {dev.dates>0&&dev.datesOpacity>0&&[0,1].map(i=><PopCell key={`date-${i}`} kind="date" i={i} style={{opacity:Math.min(1,dev.dates*8)*dev.datesOpacity}}/>)}
  {!opening&&<BubbleLayer gRef={bubbleLayer}/>}
  {opening?<DemoTypedText className="es-title" lineBeats text={scene.text} elapsed={elapsed*QUALITY_TEXT_SPEED} remaining={embed||scene===QUALITY_STORY.at(-1)?Infinity:scene.end-time} center/>:<div ref={captionBox} className="iq-caption iq2-caption cb-caption"><DemoTypedText key={scene.id} lineBeats text={scene.text} elapsed={(elapsed-(TEXT_AT[scene.id]??0))*QUALITY_TEXT_SPEED} remaining={embed||scene===QUALITY_STORY.at(-1)?Infinity:scene.end-time} center/></div>}
  {!opening&&<DemoHand handRef={handEl} rippleRef={rippleEl}/>}
 </div></div>{!bare&&<div className="ad-controls es-controls"><button onClick={play}>{playing?'Pause':playerTime>=end-.05?'Replay':'Play'}</button><button onClick={restart}>Restart</button><input type="range" className="ad-scrub" aria-label="Seek demo" min={from} max={end} step=".05" value={Math.min(end,Math.max(from,playerTime))} onChange={seek} style={{'--fill':`${(playerTime-from)/(end-from)*100}%`}}/><span>{label(Math.max(0,playerTime-from))} / {label(end-from)}</span><button onClick={cycleSpeed} aria-label={`Playback speed: ${speed}×`}>{speed}×</button><button onClick={()=>document.fullscreenElement?document.exitFullscreen():player.current.requestFullscreen()}>Fullscreen</button></div>}</div>
 </DemoTextContext.Provider>
 </>;
 if(embed)return <div className={`iq2-embed${bare?' iq2-embed--bare':''}`}>{playerBlock}</div>;
 return <div className="page"><Navbar returnHome/><main className="ad-page"><header className="ad-head"><span className="ad-kicker">Product Demo</span><h1>Improved Quality</h1><p>Clear Standards. Accessible Knowledge. Precise Work.</p></header>
 {playerBlock}
 <DemoTextEditor editor={editor} seek={seek} toggle={toggle} playing={playing} baseSpeed={QUALITY_TEXT_SPEED}/>
 <nav className="es-chapters" aria-label="Demo chapters">{editor.clock.timeline.map((s,i)=><button key={s.id} aria-current={scene.id===s.id?'step':undefined} onClick={()=>seek({target:{value:s.start}})}><span>{String(i+1).padStart(2,'0')}</span>{s.text}</button>)}</nav>
 </main></div>;
}
