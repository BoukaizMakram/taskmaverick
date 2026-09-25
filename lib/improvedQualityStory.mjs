import {captionReady} from './efficiencyCaptions.mjs';

export const QUALITY_TEXT_SPEED=1.18;
const script=[
 ['guidance','Teams Are Constantly Guided / To Perform With Quality & Precision',3.6,'title'],
 ['knowledge','As Teams Work / Information Is Readily Available / In A Knowledge Base',12,'knowledge'],
 ['instructions','Within Each Mission / Instructions Can Be Included / To Remind About Standards',7,'mission'],
 ['alerts','Alerts Can Be Included / To Warn About Risks',3.8,'mission'],
 ['links','Add Links To Outside Resources',3.4,'mission'],
 ['translation','Instantly Translate / All Mission Content',4.4,'mission'],
 ['steps','Executions Can Be Guided / Step-By-Step',6.8,'guided'],
 ['micro','Micro-Trainings Are Delivered / In Context Of Actual Work',6.6,'guided'],
];
let cursor=0;
export const QUALITY_STORY=script.map(([id,script,duration,view],index)=>{
 const text=script.split(' / ').join('\n'); const start=cursor; cursor=Math.round((cursor+duration)*100)/100;
 return {id,text,start,end:cursor,duration,view,number:index+1,ready:captionReady(text)/QUALITY_TEXT_SPEED};
});
export const QUALITY_STORY_LENGTH=cursor;
const at=id=>QUALITY_STORY.find(s=>s.id===id);
const sceneAt=time=>QUALITY_STORY.find(s=>time<s.end)??QUALITY_STORY.at(-1);

export const clamp=p=>Math.max(0,Math.min(1,p));
export const ease=p=>1-(1-clamp(p))**3;
// Motion curves. expo: snaps in fast, then settles for a long time (UI pops).
// smooth: slow-in/slow-out (camera moves).
export const expo=p=>{p=clamp(p);return p===1?1:1-2**(-10*p);};
export const smooth=p=>{p=clamp(p);return p*p*p*(p*(p*6-15)+10);};
export const mix=(a,b,p)=>a+(b-a)*p;

// ---- Layout ---------------------------------------------------------------
// Two caption treatments, one caption size:
//  • INSIDE: the words live in the empty area of the phone screen, under the
//    mission card, and travel with the camera (chapters 3–6).
//  • BELOW: when the screen has no free space, the words appear centered first,
//    then glide down, and the device enters above them (chapters 2, 7).
//  Chapter 8 goes back INSIDE, under the scrolled checklist.
// Devices sit in one 1600x900 camera layer: tablet centered at (800,360),
// phone centered at (800,450). The camera keeps them above the caption line
// whenever captions are below, so words never touch UI. Phone zooms are
// top-anchored: the top of the phone always stays on screen (`topMargin`).
export const LAYOUT={
 tablet:{top:30,bottom:690,scale:1.1},
 phone:{left:635,top:105,width:330,bottom:795},
 captionTop:735,// BELOW captions under the tablet start here (screen)
 phoneCaptionTop:800,// BELOW captions under the phone sit lower, leaving room on top
 topMargin:24,// screen px kept above the phone's top edge
 inside:{x:800,y:480,width:285},// empty area under the mission card (phone coords)
 training:{y:595},// empty area under the scrolled checklist in chapter 8
};
// Camera pose that zooms in on the phone while keeping its top edge visible.
export const topAnchored=(s,cx=800)=>({s,cx,cy:LAYOUT.phone.top+(450-LAYOUT.topMargin)/s,anchored:true});

// ---- Beats ----------------------------------------------------------------
// Chapter 2: words first, then down, then the tablet; product beats follow.
export const KNOWLEDGE={down:3,tablet:3.2,shift:1.7};// shift = delay of the KB sequence
// Knowledge Base: no mission is opened. The list of knowledge missions shows,
// and three are highlighted in turn. Times are KB-sequence seconds (elapsed - shift).
export const KB_TOUR={open:3.9,cards:[['kb-type-0',4.9,6.3],['kb-type-1',6.3,7.7],['kb-type-4',7.7,9.3]]};
// Chapter 3: straight to the phone. The tablet steps back as the phone arrives
// with the mission already open; the camera zooms in, then the words type
// inside the phone (`text` = typing delay).
export const HANDOFF={at:0,tablet:.6,phone:1.05,zoom:.45,text:1.35};
// Chapter 7: phone leaves, words centered, words down, phone returns above.
export const STEPS={out:.45,down:2,phoneIn:2.2,presses:[3.9,4.75,5.6]};
// Chapter 8: the phone grows down into the space the words left, then the
// words type inside it; Play is pressed and the video pops out beside it.
export const MICRO={text:.9,pair:2.6,press:3.1};
export const POPUP={at:MICRO.press,duration:.85};
const TAPS={
 knowledge:[['menu',2.9],['knowledge',3.9]].map(([t,s])=>[t,s+KNOWLEDGE.shift]),
 translation:[['translate',1.6]],
 steps:STEPS.presses.map((s,i)=>[`yes-${i}`,s]),
 micro:[['training',MICRO.press]],
};
// Subjects the narration talks about: highlighted once the camera arrives.
// Each is [target, from, to?]; `to` defaults to just before the chapter ends.
const SUBJECTS={
 knowledge:KB_TOUR.cards.map(([t,from,to])=>[t,from+KNOWLEDGE.shift,to+KNOWLEDGE.shift]),
 instructions:[['instructions',4.4]],alerts:[['alert',.8]],links:[['link',.8]],
};
export const TRANSLATE_AT=TAPS.translation[0][1]+.08;

export function qualityStoryFrame(time){
 const scene=sceneAt(time);
 const elapsed=Math.max(0,time-scene.start);
 const k=elapsed-KNOWLEDGE.shift;
 const knowledge=scene.id==='knowledge'&&k>=3.9;
 const menu=scene.id==='knowledge'&&k>=2.9&&k<3.9;
 const mission=scene.view==='mission'&&scene.id!=='instructions';// the tablet never opens it
 const translated=scene.id==='translation'&&elapsed>=TRANSLATE_AT;
 const steps=scene.id==='steps'?STEPS.presses.filter(s=>elapsed>=s).length:scene.number>7?3:0;
 const highlights=[
  ...(TAPS[scene.id]||[]).map(([target,at])=>({target,from:at-.7,press:at,to:at+.1})),
  ...(SUBJECTS[scene.id]||[]).map(([target,from,to])=>({target,from,press:null,to:to??scene.duration-.3})),
 ];
 return {scene,elapsed,menu,knowledge,mission,translated,steps,answers:0,passed:false,highlights};
}
export function highlightPose(elapsed,h){
 const v=expo((elapsed-h.from)/.35)*(1-ease((elapsed-h.to)/.25));
 const pressed=h.press!=null&&elapsed>=h.press&&elapsed<h.press+.18;
 return {opacity:v,scale:(1.08-.08*v)*(pressed?.94:1),fill:pressed?.14:0};
}

// Which caption treatment is active, and which device must stay above it.
export function layoutAt(time){
 const handoff=at('instructions').start+HANDOFF.at,steps=at('steps').start+STEPS.out;
 if(time>=handoff&&time<steps||time>=at('micro').start)return {mode:'inside'};
 if(time<handoff)return {mode:'below',bottom:LAYOUT.tablet.bottom,captionTop:LAYOUT.captionTop};
 return {mode:'below',bottom:LAYOUT.phone.bottom,captionTop:LAYOUT.phoneCaptionTop};
}

// ---- Camera ---------------------------------------------------------------
// Point (cx,cy) of the camera layer is shown at the stage center (800,450),
// magnified s times. Keys blend in sequence and seeking is exact. With words
// below, the camera is clamped so the device bottom stays above captionTop.
// Focus points are camera-layer coordinates measured from the live UI.
export const FOCUS={
 tabletMenu:{s:1.12,cx:1030,cy:440},
 tabletKnowledge:{s:1.12,cx:1040,cy:440},
 phoneMission:topAnchored(1.85),// chapters 3-6: one steady zoom, top visible
 phoneBelow:{s:1,cx:800,cy:515},
 // chapter 7: the whole phone between the top margin and the lowered words
 phoneChecklist:topAnchored((LAYOUT.phoneCaptionTop-5-LAYOUT.topMargin)/(LAYOUT.phone.bottom-LAYOUT.phone.top)),
 phoneTraining:topAnchored(1.55),// wide enough for the words inside the screen
 pair:topAnchored(1.55,1052),// phone and the video beside it
};
const WIDE={s:1,cx:800,cy:450};
const CAMERA=[
 ['knowledge',3.9,.8,FOCUS.tabletMenu],
 ['knowledge',5.45,.9,FOCUS.tabletKnowledge],
 ['knowledge',11,.9,WIDE],
 ['instructions',HANDOFF.zoom,.95,FOCUS.phoneMission],
 ['steps',STEPS.out+.05,.01,FOCUS.phoneBelow],// cut while the phone is away
 ['steps',3.05,.9,FOCUS.phoneChecklist],
 ['micro',.05,.8,FOCUS.phoneTraining],
 ['micro',MICRO.pair,.9,FOCUS.pair],
].map(([id,offset,duration,to])=>({at:at(id).start+offset,duration,to}));
export function cameraAt(time){
 let cam={...WIDE};
 for(const key of CAMERA){
  if(time<key.at)break;
  const p=smooth((time-key.at)/key.duration),s=mix(cam.s,key.to.s,p);
  // Into a top-anchored pose, blend the phone top's screen offset so the top
  // edge never dips off screen mid-zoom.
  const top=LAYOUT.phone.top,cy=key.to.anchored?top+mix((cam.cy-top)*cam.s,(key.to.cy-top)*key.to.s,p)/s:mix(cam.cy,key.to.cy,p);
  cam={s,cx:mix(cam.cx,key.to.cx,p),cy};
 }
 const layout=layoutAt(time);
 if(layout.mode==='below')cam.cy=Math.max(cam.cy,layout.bottom-(layout.captionTop-5-450)/cam.s);
 return cam;
}
export const toScreen=(cam,x,y)=>({x:800+(x-cam.cx)*cam.s,y:450+(y-cam.cy)*cam.s});

// ---- Devices --------------------------------------------------------------
export function devicesAt(time){
 const intro=at('instructions'),e=time-intro.start,st=at('steps'),se=time-st.start;
 const scene=sceneAt(time),ke=time-at('knowledge').start;
 const before=time<intro.start,after=time>=intro.end;
 const tabletIn=time<at('knowledge').start?0:ease((ke-KNOWLEDGE.tablet)/.8);
 const tabletLift=time<at('knowledge').start?1:1-expo((ke-KNOWLEDGE.tablet)/1);
 const drawer=1;
 const handoff=before?0:after?1:ease((e-HANDOFF.at)/HANDOFF.tablet);
 let phone=before?0:after?1:expo((e-HANDOFF.at-.15)/HANDOFF.phone);
 let phoneOpacity=before?0:after?1:ease((e-HANDOFF.at-.15)/.45);
 let phoneFrom=1;// +1 rises from below, -1 drops in from above
 if(time>=st.start){
  if(se<STEPS.phoneIn){phone=1;phoneOpacity=1-ease(se/STEPS.out);}
  else{phone=expo((se-STEPS.phoneIn)/1);phoneOpacity=ease((se-STEPS.phoneIn)/.45);phoneFrom=-1;}
 }
 const guided=time>=st.start+STEPS.out;
 const popup=scene.id==='micro'?expo((time-scene.start-POPUP.at)/POPUP.duration):0;
 return {tabletIn,tabletLift,drawer,handoff,phone,phoneOpacity,phoneFrom,guided,popup};
}

// ---- Captions -------------------------------------------------------------
// Screen pose: left/top of the anchor, width, and vertical anchor (yp: -50 =
// centered on top, 0 = hangs below top). Font size never changes.
export const CAPTION={
 center:{left:800,top:450,width:1400,yp:-50},
 below:{left:800,top:LAYOUT.captionTop,width:1100,yp:0},
 belowPhone:{left:800,top:LAYOUT.phoneCaptionTop,width:1100,yp:0},
};
export function insidePose(cam,y=LAYOUT.inside.y){
 const p=toScreen(cam,LAYOUT.inside.x,y);
 return {left:p.x,top:p.y,width:LAYOUT.inside.width*cam.s,yp:-50};
}
const blend=(a,b,p)=>({left:mix(a.left,b.left,p),top:mix(a.top,b.top,p),width:mix(a.width,b.width,p),yp:mix(a.yp,b.yp,p)});
export function captionAt(time){
 const cam=cameraAt(time),inside=insidePose(cam);
 const ke=time-at('knowledge').start,se=time-at('steps').start;
 if(time<at('instructions').start)return blend(CAPTION.center,CAPTION.below,expo((ke-KNOWLEDGE.down)/.8));
 // Chapters 3-6: inside the phone. In chapter 3 the words only start typing
 // once the zoom has settled (HANDOFF.text), so they never cross the phone.
 if(time<at('steps').start)return inside;
 if(time<at('micro').start){
  const lifted=blend(insidePose(cameraAt(at('steps').start)),CAPTION.center,expo(se/.6));
  return blend(lifted,CAPTION.belowPhone,expo((se-STEPS.down)/.8));
 }
 return insidePose(cam,LAYOUT.training.y);
}
