import {captionReady} from './efficiencyCaptions.mjs';

export const QUALITY_TEXT_SPEED=1.18;

// ---- Motion ----------------------------------------------------------------
// One timing vocabulary for the whole film (seconds). Every chapter runs the
// same way: (1) the scene settles — a device enters or the camera moves;
// (2) the words type out; only then (3) the actions run, one at a time: a
// purple ring appears (`lead`), the press lands, and whatever it opens follows
// once the ring has faded (`open`); (4) a short hold, then the next chapter.
// A device that fades out keeps its last state until it is gone.
export const MOTION={
 out:.45,      // a device fades away
 cut:.47,      // the camera cuts right after, while nothing is visible
 enter:.8,     // a device pops / rises / drops in (expo)
 fadeIn:.45,   // its opacity while entering
 cam:.9,       // every camera move (smooth)
 glide:.8,     // words moving to a new place (expo)
 slide:.5,     // a screen slides in (expo)
 slideOut:.4,  // a screen slides away (ease)
 pop:.4,       // a menu pops from its button (expo)
 lead:.6,      // a press ring appears this long before the press
 open:.35,     // press -> the screen it opens (the ring has faded by then)
 gap:.7,       // between consecutive presses on one screen
 hold:.9,      // after the last beat, before the next chapter
 read:1.3,     // a highlighted subject stays at least this long
 scroll:4.5,   // every tour scroll
 rec:2,        // recorded video length (whole seconds, real time)
};

// ---- Script ----------------------------------------------------------------
const LINES={
 guidance:'Teams Are Constantly Guided / To Perform With Quality & Precision',
 knowledge:'As Teams Work / Information Is Readily Available / In A Knowledge Base',
 instructions:'Within Each Mission / Instructions Can Be Included / To Remind About Standards',
 alerts:'Alerts Can Be Included / To Warn About Risks',
 links:'Add Links To Outside Resources',
 translation:'Instantly Translate / All Mission Content',
 steps:'Executions Can Be Guided / Step-By-Step',
 micro:'Micro-Trainings Are Delivered / In Context Of Actual Work',
 capture:'Photos Or Videos / Can Be Taken Within Missions / They Are Not Stored On The Device / And Cannot Be Used In Future Instances',
 photo:'Photos Document Proper Standards',
 video:'Videos Report Conditions',
 emphasis:'Quality Is Systematically Emphasized',
 rate:'Self-Ratings Encourage Personal Accountability',
 peer:'Peer Ratings Crowdsource Quality Control',
 visibility:'Managers Enjoy Total Visibility',
 mobile:'From Any Mobile Device',
 tour:'They Tour Documented Evidence',
 web:'From The Web In Gallery View',
 remote:'They Remotely Tour Conditions',
 performer:'Who Performed',
 timestamp:'At What Exact Date & Time',
 conclusion:'Execution Quality Is Assured / With In-Mission Guidance / And Constant Oversight',
};
const toText=line=>line.split(' / ').join('\n');
// Seconds the words need to type out fully, plus a short beat to read.
const readyOf=id=>captionReady(toText(LINES[id]))/QUALITY_TEXT_SPEED;
// A press whose ring appears at `at`: it lands MOTION.lead later, and the
// screen it opens follows MOTION.open after that.
const tap=at=>({ring:at,press:at+MOTION.lead,open:at+MOTION.lead+MOTION.open});

// ---- Beats -----------------------------------------------------------------
// Chapter times are seconds from the chapter's start. `text` = the words start
// typing, `typed` = fully shown, `end` = the chapter's length.
export const GUIDANCE=(()=>{const typed=readyOf('guidance');return {text:0,typed,end:typed+MOTION.read};})();
// Chapter 2: words first, centered; they glide into the tablet as it enters.
// Menu -> Knowledge Base; the list of knowledge missions shows and three kinds
// are highlighted in turn; the drawer closes and the camera eases back.
export const KNOWLEDGE=(()=>{
 const typed=readyOf('knowledge'),down=typed+.1,tablet=down+.1,settled=tablet+MOTION.enter;
 const menu=tap(settled),kb=tap(menu.open+MOTION.pop);
 const cards=kb.open+MOTION.slide+.3,read=1.2;
 const tour=[0,1,4].map((k,i)=>[`kb-type-${k}`,cards+i*read,cards+(i+1)*read]);
 const close=cards+3*read+.1;
 return {text:0,typed,down,tablet,settled,menu,kb,tour,close,end:close+MOTION.cam+.2};
})();
// Chapter 3: the words type inside the tablet, then the mission card is
// pressed and opens in the drawer; the tablet fades away (`lose`), leaving the
// mission panel and the words, which rise level with it as the camera moves
// in; then the instructions are highlighted.
export const HANDOFF=(()=>{
 const text=.3,typed=text+readyOf('instructions'),card=tap(typed);
 const lose=card.open+MOTION.slide,subject=lose+MOTION.cam;
 return {text,typed,card,open:card.open,lose,loseFor:MOTION.cam,subject,end:subject+MOTION.read+.3};
})();
// Chapters 4-5: the words, then the subject is highlighted.
const subjectChapter=id=>{const typed=readyOf(id),subject=typed+.05;return {text:0,typed,subject,end:subject+MOTION.read+.3};};
export const ALERTS=subjectChapter('alerts');
export const LINKS=subjectChapter('links');
// Chapter 6: the words, then Translate is pressed and the content swaps.
export const TRANSLATION=(()=>{const typed=readyOf('translation'),{press}=tap(typed);return {text:0,typed,press,end:press+MOTION.read};})();
export const TRANSLATE_AT=TRANSLATION.press+.08;
// Chapter 7: the panel fades; the words type centered, glide down, and the
// phone drops in above them with the checklist; three answers are pressed.
export const STEPS=(()=>{
 const out=MOTION.out,text=out,typed=text+readyOf('steps');
 const down=typed+.1,phoneIn=down+.1,settled=phoneIn+MOTION.cam;
 const presses=[0,1,2].map(i=>settled+MOTION.lead+i*MOTION.gap);
 return {out,text,typed,down,phoneIn,settled,presses,end:presses[2]+MOTION.hold};
})();
// Chapter 8: the phone grows down and the words type under the checklist. Play
// opens the training inside the phone (1/2 Video); the clip plays; the down
// arrow goes to the quiz (2/2); three answers are ticked; Submit & Done returns
// to the checklist, where the training turns green (Done), and the words come
// back.
export const MICRO=(()=>{
 const text=MOTION.cam,typed=text+readyOf('micro'),training=tap(typed);
 const play=training.open+MOTION.slide,clip=3,next=tap(play+clip);
 const quiz=next.open+MOTION.slide,answers=[0,1,2].map(i=>quiz+MOTION.lead+i*MOTION.gap);
 const submit=answers[2]+MOTION.gap,close=submit+MOTION.open,done=close+MOTION.slideOut;
 return {text,typed,press:training.press,open:training.open,play,clip,next:next.press,page:next.open,answers,submit,close,done,textBack:done,end:done+MOTION.read+.3};
})();
// Chapter 9: the phone steps left and the checklist scrolls to two proof
// checkpoints; the words type on the right. Then 5 takes a photo in the in-app
// camera, and 6 is answered No, which asks for a video; the camera records
// MOTION.rec real-time seconds. After each capture the camera shows it for
// review (Next / Retake); Next attaches it as a file named by its capture time.
export const CAPTURE=(()=>{
 const text=MOTION.cam,typed=text+readyOf('capture'),add=tap(typed);
 const photo={press:add.press,open:add.open};
 photo.shoot=photo.open+MOTION.slide+MOTION.lead;// the camera screen has settled
 photo.review=photo.shoot+.2;photo.next=photo.review+.4+MOTION.lead;photo.close=photo.next+MOTION.open;
 const no=photo.close+MOTION.slideOut+MOTION.lead,addVideo=tap(no+.5);// after the request opens
 const video={no,press:addVideo.press,open:addVideo.open};
 video.record=video.open+MOTION.slide+MOTION.lead;video.stop=video.record+MOTION.rec;
 video.review=video.stop+.1;video.next=video.review+.4+MOTION.lead;video.close=video.next+MOTION.open;
 return {text,typed,photo,video,end:video.close+MOTION.slideOut+MOTION.hold};
})();
// The attached files, named by the exact moment each was captured.
export const PROOF_FILES={photo:'Photo 9/23/2026 at 4:12:08 PM.jpg',video:'Video 9/23/2026 at 4:12:24 PM.mp4'};
// Chapters 10-11: the file row is pressed and the proof reopens in the phone.
// Chapter 11 first closes the photo; its video plays once, then holds.
export const REOPEN=(()=>{
 const pt=readyOf('photo'),p=tap(pt),vt=readyOf('video'),v=tap(Math.max(vt,MOTION.slideOut));
 const play=v.open+MOTION.slide;
 return {text:0,photo:{typed:pt,press:p.press,open:p.open,end:p.open+MOTION.slide+1.4},video:{back:0,typed:vt,press:v.press,open:v.open,play,end:play+MOTION.rec+MOTION.hold}};
})();
// Chapter 12: the phone fades, the camera cuts while nothing is visible, the
// Team Board tablet pops on screen with four closed (rateable) missions, the
// camera zooms into its right side, and the words type inside the tablet, in
// the empty Open/Claimed area left of the closed missions.
export const EMPHASIS=(()=>{
 const pop=MOTION.cut+.03,zoom=pop+MOTION.enter,text=zoom+MOTION.cam,typed=text+readyOf('emphasis');
 return {out:MOTION.out,cut:MOTION.cut,pop,zoom,text,typed,end:typed+MOTION.read};
})();
// Chapter 13: Rate on Opening Quality Check opens the Rate Mission sidebar;
// the performer slides from Poor to Excellent and submits; their badge pops.
export const RATE=(()=>{
 const typed=readyOf('rate'),t=tap(typed),grab=t.open+MOTION.slide+.2,drag=[grab+.2,grab+2];
 const submit=tap(drag[1]+.1),close=submit.open,badge=close+MOTION.slideOut;
 return {text:0,typed,press:t.press,open:t.open,grab,drag,submit:submit.press,close,badge,end:badge+.2+MOTION.read+.3};
})();
export const RATE_LABELS=['Poor','OK','Good','Great','Excellent'];
// Chapter 14: two peers rate the same mission in turn, each announced by a
// quick bubble beside the card, then their badge pops onto it.
export const PEER=(()=>{
 const typed=readyOf('peer'),first=typed+.1;
 const people=[{initials:'BR',name:'Ben R.',score:4,at:first},{initials:'CM',name:'Carla M.',score:5,at:first+2}];
 return {text:0,typed,people,end:people[1].at+2.3};
})();
export const SELF={initials:'AF',name:'Anna F.',score:5};
// Chapter 15: the camera shows the tablet's full screen, Menu is pressed and
// the menu pops open, then the words pop in inside the tablet. Business Media
// is pressed: Business Proofs fills the tablet, so the camera eases out, the
// words glide under the tablet, and the proofs scroll.
export const VIS=(()=>{
 const menu=tap(.3),text=menu.open+.25,typed=text+readyOf('visibility'),media=tap(typed);
 const proofs=media.open,scroll=[proofs+MOTION.cam,proofs+MOTION.cam+MOTION.scroll];
 return {press:menu.press,open:menu.open,text,typed,media:media.press,proofs,out:proofs,scroll,end:scroll[1]+.8};
})();
// Chapter 16: the tablet fades, the camera cuts, the phone rises on the same
// Team Board (Closed tab); the words type on its right; Menu, then Business
// Media, which opens Business Proofs.
export const MOBILE=(()=>{
 const phoneIn=MOTION.cut+.03,text=phoneIn+MOTION.enter,typed=text+readyOf('mobile');
 const menu=tap(typed),media=tap(menu.open+MOTION.pop);
 return {out:MOTION.out,cut:MOTION.cut,phoneIn,text,typed,press:menu.press,open:menu.open,media:media.press,proofs:media.open,end:media.open+MOTION.slide+MOTION.hold};
})();
// Chapter 17: Business Proofs scrolls through the documented missions.
export const TOUR=(()=>{const typed=readyOf('tour'),scroll=[typed+.1,typed+.1+MOTION.scroll];return {text:0,typed,scroll,end:scroll[1]+.8};})();
// Chapter 18: the phone fades, the camera cuts, the web Usage Report pops in;
// the words type under it; the camera pushes toward Gallery View, which is
// pressed: each mission opens an Images row with its photos.
export const WEB=(()=>{
 const pop=MOTION.cut+.03,text=pop+MOTION.enter,typed=text+readyOf('web'),push=typed,gallery=tap(push+MOTION.cam);
 return {out:MOTION.out,cut:MOTION.cut,in:pop,text,typed,push,press:gallery.press,gallery:gallery.open,end:gallery.open+MOTION.slide+MOTION.hold};
})();
// Chapter 19: the report scrolls through the missions, stopping where two
// performers are in view. Chapters 20-21: the camera moves to the names, then
// to the dates & times; each pair is highlighted in turn.
export const REMOTE=(()=>{const typed=readyOf('remote'),scroll=[typed+.1,typed+.1+MOTION.scroll];return {text:0,typed,scroll,end:scroll[1]+.8,stop:.93};})();
export const CIRCLE=(()=>{const typed=Math.max(readyOf('performer'),readyOf('timestamp')),draw=Math.max(typed,MOTION.cam)+.05;return {text:0,typed,draw,end:draw+.25+MOTION.read+.3};})();
// Chapter 22 (conclusion): the web page fades out, then the closing lines type
// centered, like the opening title, and stay to the end.
export const CONCLUSION=(()=>{const text=MOTION.out+.2,typed=text+readyOf('conclusion');return {out:MOTION.out,text,typed,end:typed+2.2};})();

// Words start typing at these chapter times (after the scene has settled).
export const TEXT_AT={guidance:0,knowledge:0,instructions:HANDOFF.text,alerts:0,links:0,translation:0,steps:STEPS.text,micro:MICRO.text,capture:CAPTURE.text,photo:0,video:0,emphasis:EMPHASIS.text,rate:0,peer:0,visibility:VIS.text,mobile:MOBILE.text,tour:0,web:WEB.text,remote:0,performer:0,timestamp:0,conclusion:CONCLUSION.text};
const ENDS={guidance:GUIDANCE.end,knowledge:KNOWLEDGE.end,instructions:HANDOFF.end,alerts:ALERTS.end,links:LINKS.end,translation:TRANSLATION.end,steps:STEPS.end,micro:MICRO.end,capture:CAPTURE.end,photo:REOPEN.photo.end,video:REOPEN.video.end,emphasis:EMPHASIS.end,rate:RATE.end,peer:PEER.end,visibility:VIS.end,mobile:MOBILE.end,tour:TOUR.end,web:WEB.end,remote:REMOTE.end,performer:CIRCLE.end,timestamp:CIRCLE.end,conclusion:CONCLUSION.end};
const VIEWS={guidance:'title',knowledge:'knowledge',instructions:'mission',alerts:'mission',links:'mission',translation:'mission',steps:'guided',micro:'guided',capture:'guided',photo:'guided',video:'guided',emphasis:'board',rate:'board',peer:'board',visibility:'board',mobile:'proofs',tour:'proofs',web:'web',remote:'web',performer:'web',timestamp:'web',conclusion:'title'};

let cursor=0;
export const QUALITY_STORY=Object.keys(LINES).map((id,index)=>{
 const text=toText(LINES[id]),duration=Math.round(ENDS[id]*100)/100,start=cursor;cursor=Math.round((cursor+duration)*100)/100;
 return {id,text,start,end:cursor,duration,view:VIEWS[id],number:index+1,ready:readyOf(id)};
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
// Caption treatments, one caption size:
//  • INSIDE: the words live in an empty area of the device and travel with the
//    camera. Chapter 2: inside the tablet, under the Open missions. Chapters
//    3-6: the mission opens in the tablet drawer, the tablet fades away, and
//    the words stay left of the floating mission panel. Chapter 8: under the
//    scrolled checklist. Chapters 12-15: in the tablet's empty columns.
//  • SIDE: right of the phone (chapters 9-11, 16-17).
//  • BELOW: centered between the device's bottom edge and the frame's bottom
//    (chapters 7, 15, 18-21); the camera keeps the device above them.
// Devices sit in one 1600x900 camera layer: tablet centered at (800,360),
// phone centered at (800,450), web report at (800,372). Phone zooms are
// top-anchored: the top of the phone always stays on screen (`topMargin`).
export const LAYOUT={
 tablet:{top:30,bottom:690,scale:1.1},
 phone:{left:635,top:105,width:330,bottom:795},
 phoneCaptionTop:800,// with words below, the phone's bottom stays above this line
 webBottom:714,webCaptionTop:748,// chapters 18-21: the report's bottom edge stays above this line
 topMargin:24,// screen px kept above the phone's top edge
 inside:{x:800,y:480,width:285},// phone coords: words inside the phone screen (chapter 8 uses training.y)
 tabletWords:{x:668,y:565,width:480},// chapter 2-3: under the Open missions, left of the drawer
 missionWords:{x:668,y:359},// chapters 3-6: once the tablet is gone, level with the mission panel
 training:{y:595},// empty area under the scrolled checklist in chapter 8
 emphasis:{x:668,y:415,width:470},// empty Open/Claimed area, left of the closed missions (chapters 12-15)
};
// Camera pose that zooms in on the phone while keeping its top edge visible.
export const topAnchored=(s,cx=800)=>({s,cx,cy:LAYOUT.phone.top+(450-LAYOUT.topMargin)/s,anchored:true});

// Correct answer per question: 0 = True, 1 = False.
export const QUIZ_ANSWERS=[1,0,0];
const TAPS={
 knowledge:[['menu',KNOWLEDGE.menu.press],['knowledge',KNOWLEDGE.kb.press]],
 instructions:[['mission-card',HANDOFF.card.press]],
 translation:[['translate',TRANSLATION.press]],
 steps:STEPS.presses.map((s,i)=>[`yes-${i}`,s]),
 micro:[['training',MICRO.press],['viewer-next',MICRO.next],...MICRO.answers.map((s,i)=>[`quiz-${i}-${QUIZ_ANSWERS[i]}`,s]),['viewer-submit',MICRO.submit]],
 capture:[['add-photo',CAPTURE.photo.press],['shutter',CAPTURE.photo.shoot],['review-next',CAPTURE.photo.next],['no-5',CAPTURE.video.no],['add-video',CAPTURE.video.press],['record',CAPTURE.video.record],['record',CAPTURE.video.stop],['review-next',CAPTURE.video.next]],
 photo:[['photo-file',REOPEN.photo.press]],
 video:[['video-file',REOPEN.video.press]],
 rate:[['rate-0',RATE.press],['rate-submit',RATE.submit]],
 visibility:[['tablet-menu',VIS.press],['business-media',VIS.media]],
 mobile:[['phone-menu',MOBILE.press],['business-media',MOBILE.media]],
 web:[['gallery-view',WEB.press]],
};
// Subjects the narration talks about, highlighted once they are in view.
// Each is [target, from, to?]; `to` defaults to just before the chapter ends.
const SUBJECTS={
 knowledge:KNOWLEDGE.tour,
 instructions:[['instructions',HANDOFF.subject]],alerts:[['alert',ALERTS.subject]],links:[['link',LINKS.subject]],
 micro:[['training',MICRO.done+.1]],// the green Done chip
 rate:[['rate-slider',RATE.grab,RATE.drag[1]+.4],['ratings-0',RATE.badge+.2]],
 // the two performers / dates in view after the remote tour (missions 3 and 4)
 performer:[['web-name-2',CIRCLE.draw],['web-name-3',CIRCLE.draw+.25]],
 timestamp:[['web-date-2',CIRCLE.draw],['web-date-3',CIRCLE.draw+.25]],
};

export function qualityStoryFrame(time){
 const scene=sceneAt(time);
 const elapsed=Math.max(0,time-scene.start);
 // Chapter 2: the menu, then the Knowledge Base drawer.
 const k=scene.id==='knowledge'?elapsed:-1;
 const menu=k>=KNOWLEDGE.menu.open&&k<KNOWLEDGE.kb.open;
 const kb={reveal:k<0?0:expo((k-KNOWLEDGE.kb.open)/MOTION.slide)*(1-ease((k-KNOWLEDGE.close)/MOTION.slideOut)),since:k-KNOWLEDGE.kb.open,menuPop:k<0?0:expo((k-KNOWLEDGE.menu.open)/MOTION.pop)};
 const knowledge=k>=KNOWLEDGE.kb.open&&kb.reveal>0;
 const mission=scene.view==='mission'&&scene.id!=='instructions';// the tablet never opens it
 const translated=scene.id==='translation'&&elapsed>=TRANSLATE_AT;
 const steps=scene.id==='steps'?STEPS.presses.filter(s=>elapsed>=s).length:scene.number>7?3:0;
 const highlights=[
  ...(TAPS[scene.id]||[]).map(([target,at])=>({target,from:at-MOTION.lead,press:at,to:at+.1})),
  ...(SUBJECTS[scene.id]||[]).map(([target,from,to])=>({target,from,press:null,to:to??scene.duration-.3})),
 ];
 const m=scene.id==='micro'?elapsed:-1;
 const training={
  in:m<0?0:expo((m-MICRO.open)/MOTION.slide)*(1-ease((m-MICRO.close)/MOTION.slideOut)),// viewer slides in, then out
  page:m<0?0:smooth((m-MICRO.page)/MOTION.slide),// 0 = 1/2 Video, 1 = 2/2 Quiz
  video:m<0?0:Math.min(MICRO.clip,Math.max(0,m-MICRO.play)),// seconds played, real time
  answers:MICRO.answers.filter(s=>m>=s).length,
  done:scene.number>8||m>=MICRO.done,
 };
 // Chapter 9; later chapters keep its finished state.
 const after=scene.number>9,c=scene.id==='capture'?elapsed:after?Infinity:-1,{photo:P,video:V}=CAPTURE;
 const slide=(open,close)=>c<0?0:expo((c-open)/MOTION.slide)*(1-ease((c-close)/MOTION.slideOut));
 const photoSide=c<V.no;
 const capture={
  reveal:c<0?0:ease(c/.4),// checkpoints 5-6 fade in as the list scrolls to them
  scroll:c<0?0:smooth(c/MOTION.cam),
  camera:photoSide?{kind:'photo',in:slide(P.open,P.close)}:{kind:'video',in:slide(V.open,V.close)},
  live:c<0?0:c-(photoSide?P.open:V.open),// seconds of live viewfinder
  flash:c<0?0:Math.max(0,1-Math.abs(c-P.shoot-.05)/.15),
  review:photoSide?c>=P.review:c>=V.review,// Next / Retake shown
  photo:c>=P.next,// attached once Next is pressed
  answered:c>=V.no,
  box:c<0?0:ease((c-V.no-.1)/.4),// the "Add at least one video" request opens
  recording:c>=V.record&&c<V.stop,
  rec:c<0?0:Math.floor(Math.min(V.stop,Math.max(V.record,c))-V.record),// whole seconds, real time
  video:c>=V.next,
 };
 // Chapters 10-11: a reopened proof. `live` = seconds since it can be seen.
 // Chapter 12 keeps the video on screen while the phone fades away.
 const {photo:RP,video:RV}=REOPEN;
 let proof={kind:'photo',in:0,live:0};
 if(scene.id==='photo')proof={kind:'photo',in:expo((elapsed-RP.open)/MOTION.slide),live:elapsed-RP.open};
 if(scene.id==='video')proof=elapsed<RV.open?{kind:'photo',in:1-ease((elapsed-RV.back)/MOTION.slideOut),live:0}:{kind:'video',in:expo((elapsed-RV.open)/MOTION.slide),live:elapsed-RV.play};
 if(scene.id==='emphasis')proof={kind:'video',in:1,live:MOTION.rec};
 // Chapters 13-14: the Rate Mission sidebar, then the ratings on the card.
 const r=scene.id==='rate'?elapsed:scene.number>13?Infinity:-1,pe=scene.id==='peer'?elapsed:scene.number>14?Infinity:-1;
 const pop=t=>ease(t/.3);
 const rating={
  panel:r<0?0:expo((r-RATE.open)/MOTION.slide)*(1-ease((r-RATE.close)/MOTION.slideOut)),
  value:r<0?0:4*smooth((r-RATE.drag[0])/(RATE.drag[1]-RATE.drag[0])),// 0 Poor … 4 Excellent
  moved:r>=RATE.drag[0],
  ratings:[
   ...(r>=RATE.badge?[{...SELF,pop:pop(r-RATE.badge)}]:[]),
   ...PEER.people.filter(p=>pe>=p.at+.5).map(p=>({...p,pop:pop(pe-p.at-.5)})),
  ],
  bubbles:PEER.people.map(p=>({...p,opacity:pe<0?0:ease((pe-p.at)/.25)*(1-ease((pe-p.at-1.7)/.3))})),
 };
 // Chapters 15-17: the tablet menu and Business Proofs, then the phone menu and
 // Business Proofs. Chapter 16 keeps the tablet's proofs while it fades away.
 const v=scene.id==='visibility'?elapsed:scene.number>15?Infinity:-1;
 const visibility={menu:v>=VIS.open&&v<VIS.proofs,pop:v<0?0:expo((v-VIS.open)/MOTION.pop),
  proofsIn:v<0?0:expo((v-VIS.proofs)/MOTION.slide),scroll:v<0?0:smooth((v-VIS.scroll[0])/(VIS.scroll[1]-VIS.scroll[0]))};
 const mb=scene.id==='mobile'?elapsed:scene.number>16?Infinity:-1,te=scene.id==='tour'?elapsed:scene.number>17?Infinity:-1;
 const proofs={
  menu:mb>=MOBILE.open&&mb<MOBILE.proofs,menuPop:mb<0?0:expo((mb-MOBILE.open)/MOTION.pop),
  in:mb<0?0:expo((mb-MOBILE.proofs)/MOTION.slide),
  scroll:te<0?0:smooth((te-TOUR.scroll[0])/(TOUR.scroll[1]-TOUR.scroll[0])),
 };
 // Chapters 18-21: the web Usage Report (chapter 22 keeps it while it fades).
 const w=scene.id==='web'?elapsed:scene.number>18?Infinity:-1;
 const web={
  gallery:w>=WEB.press,// the Gallery View checkbox
  rows:w<0?0:expo((w-WEB.gallery)/MOTION.slide),// the Images rows open
  // stops where two performers (Storage Room Audit, Equipment Check) are in view
  scroll:REMOTE.stop*(scene.id==='remote'?smooth((elapsed-REMOTE.scroll[0])/(REMOTE.scroll[1]-REMOTE.scroll[0])):scene.number>19?1:0),
 };
 return {scene,elapsed,menu,knowledge,kb,mission,translated,steps,training,capture,proof,rating,visibility,proofs,web,highlights};
}
export function highlightPose(elapsed,h){
 const v=expo((elapsed-h.from)/.35)*(1-ease((elapsed-h.to)/.25));
 const pressed=h.press!=null&&elapsed>=h.press&&elapsed<h.press+.18;
 return {opacity:v,scale:(1.08-.08*v)*(pressed?.94:1),fill:pressed?.14:0};
}

// Which caption treatment is active, and which device must stay above it.
export function layoutAt(time){
 const steps=at('steps').start+STEPS.out;
 if(time>=steps&&time<at('micro').start)return {mode:'below',bottom:LAYOUT.phone.bottom,captionTop:LAYOUT.phoneCaptionTop};
 if(time>=at('web').start+WEB.cut&&time<at('conclusion').start)return {mode:'below',bottom:LAYOUT.webBottom,captionTop:LAYOUT.webCaptionTop};
 return {mode:'inside'};
}

// ---- Camera ---------------------------------------------------------------
// Point (cx,cy) of the camera layer is shown at the stage center (800,450),
// magnified s times. Keys blend in sequence and seeking is exact. With words
// below, the camera is clamped so the device bottom stays above captionTop.
// Focus points are camera-layer coordinates measured from the live UI.
export const FOCUS={
 // chapter 2: a gentle push, the tablet (centered at 800,360) stays centered
 tabletMenu:{s:1.12,cx:800,cy:360},
 // chapters 3-6: the words and the floating mission panel (x 922-1204, y 77-641)
 missionWords:{s:1.47,cx:860,cy:359},
 phoneBelow:{s:1,cx:800,cy:515},
 // chapter 7: the whole phone between the top margin and the lowered words
 phoneChecklist:topAnchored((LAYOUT.phoneCaptionTop-5-LAYOUT.topMargin)/(LAYOUT.phone.bottom-LAYOUT.phone.top)),
 phoneTraining:topAnchored(1.55),// wide enough for the words inside the screen
 phoneWhole:topAnchored((900-2*LAYOUT.topMargin)/(LAYOUT.phone.bottom-LAYOUT.phone.top)),// whole phone on screen
};
// chapter 9: the whole phone, moved left so the words fit on its right
FOCUS.phoneLeft=topAnchored(FOCUS.phoneWhole.s,800+300/FOCUS.phoneWhole.s);
// chapters 12-15: a gentle push that keeps the whole tablet frame in view
// (tablet x 327-1273, y 30-690 -> screen x 185-1415, y 28-872)
FOCUS.tabletWhole={s:1.28,cx:800,cy:360};
// chapter 15: the whole tablet (y 30-690) above the words, only slightly
// pulled back: its bottom sits at screen y 802 (top at 36), like the phone's
FOCUS.tabletAbove={s:1.16,cx:800,cy:690-(802-450)/1.16};
// chapters 18-21: the web Usage Report window (camera x 80-1520, y 30-714).
// Measured: Gallery View at (1006,146); table x 381-1500, y 242-714;
// performer names x 455-505; dates & times x 1383-1510. The words sit under
// the report, so zooms stay gentle: the report's bottom (y 714) always stays
// above the words (layoutAt clamps it).
FOCUS.webWide={s:1,cx:800,cy:450};
FOCUS.galleryView={s:1.2,cx:930,cy:477};
FOCUS.webNames={s:1.2,cx:760,cy:477};
FOCUS.webDates={s:1.2,cx:950,cy:477};
const WIDE={s:1,cx:800,cy:360};// the tablet (centered at y 360) fills the frame
// [chapter, time, pose, duration]; a duration of .01 is a cut, made only while
// nothing is visible.
const CAMERA=[
 ['knowledge',KNOWLEDGE.settled,FOCUS.tabletMenu],
 ['knowledge',KNOWLEDGE.close,WIDE],
 ['instructions',HANDOFF.lose,FOCUS.missionWords],
 ['steps',STEPS.out+.05,FOCUS.phoneBelow,.01],
 ['steps',STEPS.phoneIn,FOCUS.phoneChecklist],
 ['micro',0,FOCUS.phoneTraining],
 ['micro',MICRO.open-.1,FOCUS.phoneWhole],// the viewer needs the whole screen
 ['micro',MICRO.close,FOCUS.phoneTraining],
 ['capture',0,FOCUS.phoneLeft],
 ['emphasis',EMPHASIS.cut,WIDE,.01],
 ['emphasis',EMPHASIS.zoom,FOCUS.tabletWhole],// held through the ratings (chapters 13-14)
 ['visibility',VIS.proofs,FOCUS.tabletAbove],// the proofs fill the tablet: words go under it
 ['mobile',MOBILE.cut,FOCUS.phoneLeft,.01],
 ['web',WEB.cut,FOCUS.webWide,.01],
 ['web',WEB.push,FOCUS.galleryView],
 ['performer',0,FOCUS.webNames],
 ['timestamp',0,FOCUS.webDates],
].map(([id,offset,to,duration=MOTION.cam])=>({at:at(id).start+offset,duration,to}));
export const CUTS=CAMERA.filter(key=>key.duration<.1).map(key=>key.at);
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
 const ke=time-at('knowledge').start;
 const tabletIn=time<at('knowledge').start?0:ease((ke-KNOWLEDGE.tablet)/MOTION.enter);
 const tabletLift=time<at('knowledge').start?1:1-expo((ke-KNOWLEDGE.tablet)/MOTION.enter);
 // Chapter 3: the mission drawer slides in, then the tablet itself fades away.
 const drawer=time<intro.start?0:expo((e-HANDOFF.open)/MOTION.slide);
 const handoff=time<intro.start?0:ease((e-HANDOFF.lose)/HANDOFF.loseFor);
 // Chapter 7: the mission panel leaves; the phone drops in with the checklist.
 const tabletOpacity=time<st.start?1:1-ease(se/STEPS.out);
 const tabletShown=time<st.start+STEPS.out;
 let phone=0,phoneOpacity=0,phoneFrom=-1;// -1 drops in from above, +1 rises from below
 if(time>=st.start+STEPS.phoneIn){phone=expo((se-STEPS.phoneIn)/MOTION.enter);phoneOpacity=ease((se-STEPS.phoneIn)/MOTION.fadeIn);}
 const guided=time>=st.start+STEPS.out;
 // Chapter 12: the phone fades out, then the Team Board tablet pops in.
 const em=at('emphasis'),ee=time-em.start;
 let board=0,boardOut=0;
 if(time>=em.start){phoneOpacity=1-ease(ee/EMPHASIS.out);board=expo((ee-EMPHASIS.pop)/MOTION.enter);}
 // Chapter 16: the tablet fades, then the phone rises from below.
 const mo=at('mobile'),me=time-mo.start;
 if(time>=mo.start){boardOut=ease(me/MOBILE.out);phone=expo((me-MOBILE.phoneIn)/MOTION.enter);phoneOpacity=ease((me-MOBILE.phoneIn)/MOTION.fadeIn);phoneFrom=1;}
 // Chapter 18: the phone fades, then the web page pops in.
 const wb=at('web'),we=time-wb.start;
 let web=0;
 if(time>=wb.start){phoneOpacity=1-ease(we/WEB.out);web=expo((we-WEB.in)/MOTION.enter);}
 // Chapter 22: the web page fades out for the closing title.
 const webOut=time<at('conclusion').start?0:ease((time-at('conclusion').start)/CONCLUSION.out);
 return {tabletIn,tabletLift,drawer,handoff,tabletOpacity,tabletShown,phone,phoneOpacity,phoneFrom,guided,board,boardOut,web,webOut};
}

// ---- Captions -------------------------------------------------------------
// Screen pose: left/top of the anchor, width, and vertical anchor (yp: -50 =
// centered on top, 0 = hangs below top). Font size never changes.
export const CAPTION={
 center:{left:800,top:450,width:1400,yp:-50},
 side:{left:1150,top:450,width:760,yp:-50},// right of the phone in chapters 9-11, 16-17
};
// Words centered between a device's bottom edge (camera y) and the frame's bottom.
export function belowPose(cam,bottom){return {left:800,top:(toScreen(cam,0,bottom).y+900)/2,width:1100,yp:-50};}
export function insidePose(cam,y=LAYOUT.inside.y){
 const p=toScreen(cam,LAYOUT.inside.x,y);
 return {left:p.x,top:p.y,width:LAYOUT.inside.width*cam.s,yp:-50};
}
// Chapters 2-6: words inside the tablet; they rise level with the mission
// panel while the tablet fades away in chapter 3.
export function tabletWordsPose(time,cam=cameraAt(time)){
 const {tabletWords:a,missionWords:b}=LAYOUT,e=time-at('instructions').start;
 const p=time<at('instructions').start?0:smooth((e-HANDOFF.lose)/HANDOFF.loseFor);
 const q=toScreen(cam,a.x,mix(a.y,b.y,p));
 return {left:q.x,top:q.y,width:a.width*cam.s,yp:-50};
}
const blend=(a,b,p)=>({left:mix(a.left,b.left,p),top:mix(a.top,b.top,p),width:mix(a.width,b.width,p),yp:mix(a.yp,b.yp,p)});
export function captionAt(time){
 const cam=cameraAt(time);
 const ke=time-at('knowledge').start,se=time-at('steps').start;
 // Chapter 2: centered first, then into the tablet as it arrives.
 if(time<at('instructions').start)return blend(CAPTION.center,tabletWordsPose(time,cam),expo((ke-KNOWLEDGE.down)/MOTION.glide));
 if(time<at('steps').start)return tabletWordsPose(time,cam);
 // Chapter 7: centered while the phone is away, then down under it.
 if(time<at('micro').start)return blend(CAPTION.center,belowPose(cam,LAYOUT.phone.bottom),expo((se-STEPS.down)/MOTION.glide));
 if(time>=at('web').start)return belowPose(cam,LAYOUT.webBottom);// chapters 18-21
 if(time>=at('mobile').start)return CAPTION.side;// chapters 16-17
 if(time>=at('emphasis').start){
  const p=toScreen(cam,LAYOUT.emphasis.x,LAYOUT.emphasis.y),inTablet={left:p.x,top:p.y,width:LAYOUT.emphasis.width*cam.s,yp:-50};
  if(time<at('visibility').start+VIS.proofs)return inTablet;
  // chapter 15: the proofs fill the tablet, so the words go under it with the camera
  return blend(inTablet,belowPose(cam,LAYOUT.tablet.bottom),smooth((time-at('visibility').start-VIS.proofs)/MOTION.cam));
 }
 if(time>=at('capture').start)return CAPTION.side;
 // Chapter 8: hidden while the training viewer fills the phone.
 const me=time-at('micro').start;
 return {...insidePose(cam,LAYOUT.training.y),opacity:(1-ease((me-MICRO.open+.1)/.3))+ease((me-MICRO.textBack)/.4)};
}
