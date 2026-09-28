// Live Oversight demo film: script, beats, camera, devices and captions.
// Same engine and rules as the Improved Quality film (see MOTION and the
// "Pacing (RULE)" section of docs/mission-animation.md): the scene settles,
// the words type out, then the actions run one at a time, then a short hold.
import {captionReady} from './efficiencyCaptions.mjs';
import {MOTION,QUALITY_TEXT_SPEED,clamp,ease,expo,smooth,mix} from './improvedQualityStory.mjs';

export {MOTION};
export const OVERSIGHT_TEXT_SPEED=QUALITY_TEXT_SPEED;

const LINES={
 intro:'Remotely Monitor Operations / From Anywhere',
 rhythm:'Feel The Business Rhythm',
 aging:'What Missions Are Aging',
 claimed:'What Missions Are Claimed',
 performing:'Who Is Performing',
 completed:'What Missions Are Completed',
 performed:'Who Performed Each Mission',
 duration:'The Execution Duration Per Mission',
 details:'Review Details Per Mission',
 photos:'Retrieve Photos',
 videos:'Play Videos',
 data:'See What Data Was Collected',
 dashboards:'Collected The Data In Live Dashboards',
 anomalies:'Anomalies Are Instantly Flagged / For Instant Correction',
 history:'Performance History Is Stored',
 byMission:'Search / By Mission',
 byPerson:'By Person',
 byCheckpoint:'By Checkpoint',
 gallery:'In Gallery View',
 evolution:'Managers Can Inspect / An Area’s Evolution Over Time',
 conclusion:'Remotely Monitor Trends / Audit Conditions / Maintain Visibility / Into Every Aspect Of Business',
};
const toText=line=>line.split(' / ').join('\n');
const readyOf=id=>captionReady(toText(LINES[id]))/QUALITY_TEXT_SPEED;
const tap=at=>({ring:at,press:at+MOTION.lead,open:at+MOTION.lead+MOTION.open});

// ---- Beats (seconds from each chapter's start) -------------------------------
export const INTRO=(()=>{const typed=readyOf('intro');return {text:0,typed,end:typed+MOTION.read};})();
// Chapter 2: the Overview pops in; the words type under it; the board scrolls down.
export const RHYTHM=(()=>{
 const pop=.1,text=pop+MOTION.enter,typed=text+readyOf('rhythm'),scroll=[typed+.1,typed+.1+MOTION.scroll];
 return {pop,text,typed,scroll,end:scroll[1]+.8};
})();
// Chapters 3-8: the camera moves in on the board; the whole column the words
// talk about is highlighted (header to the last visible row).
export const CIRCLE_COLUMNS={aging:'open',claimed:'claimed',performing:'by',completed:'closed',performed:'by',duration:'duration'};
const circleChapter=id=>{const typed=readyOf(id),draw=Math.max(typed,MOTION.cam)+.05;return {text:0,typed,draw,end:draw+MOTION.read+.3};};
export const CIRCLES=Object.fromEntries(Object.keys(CIRCLE_COLUMNS).map(id=>[id,circleChapter(id)]));
// Chapter 9: the mission's name is pressed; its details open in the sidebar.
export const DETAILS=(()=>{const typed=readyOf('details'),t=tap(typed);return {text:0,typed,press:t.press,open:t.open,end:t.open+MOTION.cam+MOTION.hold};})();
// Chapters 10-11: a response's photo (or video) icon is pressed and the
// full-page viewer opens; in chapter 10 the right arrow shows the next photo.
export const PHOTOS=(()=>{const typed=readyOf('photos'),t=tap(typed),next=tap(t.open+MOTION.slide+.4);return {text:0,typed,press:t.press,open:t.open,next:next.press,swap:next.open,end:next.open+1.2};})();
export const VIDEOS=(()=>{const typed=readyOf('videos'),t=tap(Math.max(typed,MOTION.slideOut)),play=t.open+MOTION.slide;return {text:0,back:0,typed,press:t.press,open:t.open,play,end:play+MOTION.rec+MOTION.hold};})();
// Chapter 12: the three measurements are highlighted in sequence, SEQ apart.
const SEQ=.8;
export const DATA=(()=>{const typed=readyOf('data'),draws=[0,1,2].map(i=>typed+.05+i*SEQ);return {text:0,back:0,typed,draws,end:draws[2]+MOTION.read+.3};})();
// Chapter 13: Reports is pressed; the Data Board replaces the Overview; once
// the camera frames its table, the same three measurements are highlighted.
export const DASHBOARDS=(()=>{const typed=readyOf('dashboards'),t=tap(typed),draws=[0,1,2].map(i=>t.open+MOTION.cam+.05+i*SEQ);return {text:0,typed,press:t.press,switch:t.open,draws,end:draws[2]+MOTION.read+.3};})();
// Chapter 14: the out-of-range responses (red) are highlighted.
export const ANOMALIES=(()=>{const typed=readyOf('anomalies'),draws=[typed+.05,typed+.65];return {text:0,typed,draws,end:draws[1]+MOTION.read+.3};})();
// Chapter 15: back to the Overview, then History.
export const HISTORY=(()=>{const typed=readyOf('history'),nav=tap(typed),tab=tap(nav.open+MOTION.cam);return {text:0,typed,navPress:nav.press,switch:nav.open,press:tab.press,view:tab.open,end:tab.open+MOTION.out+MOTION.hold};})();
// Chapters 16-18: the history is searched in the Usage Report. Chapter 16
// first opens it (Reports), then in each chapter Group by opens its menu and
// an option regroups the report.
const groupChapter=(id,from=readyOf(id))=>{const menu=tap(from),option=tap(menu.open+MOTION.pop);return {text:0,typed:readyOf(id),press:menu.press,menu:menu.open,option:option.press,regroup:option.open,end:option.open+MOTION.out+MOTION.hold};};
const REPORTS=tap(readyOf('byMission'));// ring on Reports once the words are typed
export const GROUPS={
 byMission:{...groupChapter('byMission',REPORTS.open+MOTION.cam),to:'Mission',navPress:REPORTS.press,switch:REPORTS.open},
 byPerson:{...groupChapter('byPerson'),to:'Person'},
 byCheckpoint:{...groupChapter('byCheckpoint'),to:'Checkpoint'},
};
// Chapter 19: Gallery View opens each response's photo or video; the report's
// date range is highlighted.
export const GALLERY=(()=>{const typed=readyOf('gallery'),t=tap(typed),draw=t.open+MOTION.slide+.05;return {text:0,typed,press:t.press,open:t.open,draw,end:draw+MOTION.read+.3};})();
// Chapter 20: the report scrolls through the storage room's photos, day after day.
export const EVOLUTION=(()=>{const typed=readyOf('evolution'),scroll=[typed+.1,typed+.1+MOTION.scroll];return {text:0,typed,scroll,end:scroll[1]+.8};})();
export const CONCLUSION=(()=>{const text=MOTION.out+.2,typed=text+readyOf('conclusion');return {out:MOTION.out,text,typed,end:typed+2.2};})();

const ENDS={intro:INTRO.end,rhythm:RHYTHM.end,...Object.fromEntries(Object.entries(CIRCLES).map(([id,c])=>[id,c.end])),details:DETAILS.end,photos:PHOTOS.end,videos:VIDEOS.end,data:DATA.end,dashboards:DASHBOARDS.end,anomalies:ANOMALIES.end,history:HISTORY.end,byMission:GROUPS.byMission.end,byPerson:GROUPS.byPerson.end,byCheckpoint:GROUPS.byCheckpoint.end,gallery:GALLERY.end,evolution:EVOLUTION.end,conclusion:CONCLUSION.end};
export const TEXT_AT={...Object.fromEntries(Object.keys(LINES).map(id=>[id,0])),rhythm:RHYTHM.text,conclusion:CONCLUSION.text};
let cursor=0;
export const OVERSIGHT_STORY=Object.keys(LINES).map((id,index)=>{
 const text=toText(LINES[id]),duration=Math.round(ENDS[id]*100)/100,start=cursor;cursor=Math.round((cursor+duration)*100)/100;
 return {id,text,start,end:cursor,duration,view:['intro','conclusion'].includes(id)?'title':'web',number:index+1,ready:readyOf(id)};
});
export const OVERSIGHT_LENGTH=cursor;
const at=id=>OVERSIGHT_STORY.find(s=>s.id===id);
const sceneAt=time=>OVERSIGHT_STORY.find(s=>time<s.end)??OVERSIGHT_STORY.at(-1);
const since=(id,time)=>time-at(id).start;// seconds into chapter `id` (negative before it)

// ---- Highlights ----------------------------------------------------------------
const TAPS={
 details:[['name-storage',DETAILS.press]],
 photos:[['file-photo',PHOTOS.press],['viewer-next',PHOTOS.next]],
 videos:[['file-video',VIDEOS.press]],
 dashboards:[['nav-Reports',DASHBOARDS.press]],
 history:[['nav-Overview',HISTORY.navPress],['view-History',HISTORY.press]],
 ...Object.fromEntries(Object.entries(GROUPS).map(([id,g])=>[id,[...(g.navPress?[['nav-Reports',g.navPress]]:[]),['group-by',g.press],[`group-${g.to}`,g.option]]])),
 gallery:[['gallery-view',GALLERY.press]],
};
const SUBJECTS={
 ...Object.fromEntries(Object.entries(CIRCLE_COLUMNS).map(([id,col])=>[id,[[`col-${col}`,CIRCLES[id].draw]]])),
 // in sequence: each measurement is highlighted until the next one is
 data:DATA.draws.map((t,i,all)=>[`data-${['height','width','length'][i]}`,t,all[i+1]]),
 dashboards:DASHBOARDS.draws.map((t,i,all)=>[`stmt-${['height','width','length'][i]}`,t,all[i+1]]),
 anomalies:[['anomaly-height',ANOMALIES.draws[0]],['anomaly-length',ANOMALIES.draws[1]]],
 gallery:[['date-range',GALLERY.draw]],
};

// ---- Frame state ---------------------------------------------------------------
export function oversightFrame(time){
 const scene=sceneAt(time),elapsed=Math.max(0,time-scene.start);
 const highlights=[
  ...(TAPS[scene.id]||[]).map(([target,at])=>({target,from:at-MOTION.lead,press:at,to:at+.1})),
  ...(SUBJECTS[scene.id]||[]).map(([target,from,to])=>({target,from,press:null,to:to??scene.duration-.3})),
 ];
 const n=scene.number,after=id=>n>at(id).number;
 // The pages of the web window, cross-faded: the Overview, the Data Board
 // (chapters 13-14), then the Usage Report (from chapter 16).
 const d=since('dashboards',time),h=since('history',time),u=since('byMission',time);
 const data=h>=0?1-ease((h-HISTORY.switch)/MOTION.out):d>=0?ease((d-DASHBOARDS.switch)/MOTION.out):0;
 const usage=u<0?0:ease((u-GROUPS.byMission.switch)/MOTION.out);
 const pages={overview:Math.max(0,1-data-usage),data,usage};
 // Overview: Running until chapter 15 switches to History (grouped by Unit).
 const view=h>=HISTORY.view?'History':'Running';
 // Usage Report: grouped by Unit until chapters 16-18 regroup it.
 let groupBy='Unit',menu=0,regroupDip=0;
 for(const [id,g] of Object.entries(GROUPS)){
  const e=since(id,time);if(e<0)continue;
  if(e>=g.regroup)groupBy=g.to;
  if(scene.id===id){menu=e>=g.menu&&e<g.regroup?expo((e-g.menu)/MOTION.pop):0;regroupDip=Math.sin(Math.PI*clamp((e-g.regroup+.15)/.3));}
 }
 const historyDip=scene.id==='history'?Math.sin(Math.PI*clamp((elapsed-HISTORY.view+.15)/.3)):0;
 // Scrolls, 0..1: the Overview's Running board (chapter 2), and the Usage
 // Report down to the last photo of the storage room (chapter 20).
 const scroll=view==='Running'?(scene.id==='rhythm'?smooth((elapsed-RHYTHM.scroll[0])/(RHYTHM.scroll[1]-RHYTHM.scroll[0])):n>2?1:0):0;
 const reportScroll=scene.id==='evolution'?smooth((elapsed-EVOLUTION.scroll[0])/(EVOLUTION.scroll[1]-EVOLUTION.scroll[0])):n>at('evolution').number?1:0;
 // The mission sidebar (open from chapter 9 until the Overview is left).
 const det=since('details',time);
 const drawer=det<0||h>=0?0:expo((det-DETAILS.open)/MOTION.slide);
 // The proof viewer: the photo (chapter 10), then the video (chapter 11).
 let viewer={kind:'photo',in:0,live:0};
 if(scene.id==='photos')viewer={kind:'photo',in:expo((elapsed-PHOTOS.open)/MOTION.slide),live:0,index:elapsed>=PHOTOS.swap?1:0};
 if(scene.id==='videos')viewer=elapsed<VIDEOS.open?{kind:'photo',in:1-ease((elapsed-VIDEOS.back)/MOTION.slideOut),live:0,index:1}:{kind:'video',in:expo((elapsed-VIDEOS.open)/MOTION.slide),live:elapsed-VIDEOS.play};
 if(scene.id==='data')viewer={kind:'video',in:1-ease((elapsed-DATA.back)/MOTION.slideOut),live:MOTION.rec};
 // Gallery View in the Usage Report.
 const g=since('gallery',time);
 const gallery={checked:g>=GALLERY.press,rows:g<0?0:expo((g-GALLERY.open)/MOTION.slide)};
 return {scene,elapsed,highlights,pages,view,historyDip,groupBy,menu,regroupDip,scroll,reportScroll,drawer,viewer,gallery,time,after};
}
export function highlightPose(elapsed,h){
 const v=expo((elapsed-h.from)/.35)*(1-ease((elapsed-h.to)/.25));
 const pressed=h.press!=null&&elapsed>=h.press&&elapsed<h.press+.18;
 return {opacity:v,scale:(1.08-.08*v)*(pressed?.94:1),fill:pressed?.14:0};
}

// ---- Layout, camera, devices, captions -------------------------------------------
// The web window sits in the 1600x900 camera layer at x 80-1520, y 30-714
// (page px x 0.9). The words sit below it, centered between its bottom edge
// and the frame's bottom; the camera keeps the window's bottom above them.
export const LAYOUT={webBottom:714,webCaptionTop:748};
// Zooms stay at 1.14x: the most that keeps the page's top (tabs, sidebar
// header) in frame while its bottom stays above the words.
export const FOCUS={
 wide:{s:1,cx:800,cy:450},
 board:{s:1.14,cx:782,cy:458},// page x 0-1560, left-aligned: every column through Closed At
 side:{s:1.14,cx:818,cy:458},// right-aligned: the sidebar and the report's table
 page:{s:1.04,cx:800,cy:433},// the whole page, top nav included (Reports / Overview presses)
};
const CAMERA=[
 ['aging',0,FOCUS.board],
 ['details',DETAILS.open,FOCUS.side],// the detail panel
 ['photos',PHOTOS.press,FOCUS.page],// the full-page viewer, its title bar included
 ['data',0,FOCUS.side],// back to the panel's data
 ['dashboards',0,FOCUS.page],// Reports in the top nav
 ['dashboards',DASHBOARDS.switch,FOCUS.side],// the report's checkpoint table
 ['history',0,FOCUS.page],// Overview in the top nav, then the History tab
 ['history',HISTORY.view,FOCUS.board],
 ['byMission',0,FOCUS.page],// Reports in the top nav
 ['byMission',GROUPS.byMission.switch,FOCUS.side],// the report: Group by through the date range
].map(([id,offset,to,duration=MOTION.cam])=>({at:at(id).start+offset,duration,to}));
export function cameraAt(time){
 let cam={...FOCUS.wide};
 for(const key of CAMERA){
  if(time<key.at)break;
  const p=smooth((time-key.at)/key.duration);
  cam={s:mix(cam.s,key.to.s,p),cx:mix(cam.cx,key.to.cx,p),cy:mix(cam.cy,key.to.cy,p)};
 }
 const onPage=time>=at('rhythm').start&&time<at('conclusion').start;
 if(onPage)cam.cy=Math.max(cam.cy,LAYOUT.webBottom-(LAYOUT.webCaptionTop-5-450)/cam.s);
 return cam;
}
export const toScreen=(cam,x,y)=>({x:800+(x-cam.cx)*cam.s,y:450+(y-cam.cy)*cam.s});
export function devicesAt(time){
 const r=since('rhythm',time),c=since('conclusion',time);
 return {web:r<0?0:expo((r-RHYTHM.pop)/MOTION.enter),webOut:c<0?0:ease(c/CONCLUSION.out)};
}
export const CAPTION={center:{left:800,top:450,width:1400,yp:-50}};
export function belowPose(cam,bottom){return {left:800,top:(toScreen(cam,0,bottom).y+900)/2,width:1100,yp:-50};}
export function captionAt(time){
 const scene=sceneAt(time);
 if(scene.view==='title')return CAPTION.center;
 return belowPose(cameraAt(time),LAYOUT.webBottom);
}
