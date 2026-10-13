import {captionReady} from './efficiencyCaptions.mjs';
import {HAND,tap as handTap,speak as handSpeak,launch as handLaunch,relaunch as handRelaunch,launchStop,carryStop,launches,carries,handPose} from './demoHand.mjs';

// Improved Quality — storytelling cut (/improved-quality-v2), rebuilt from the
// CEO review of 2026-09-28 (docs/meetings/2026-09-28-ceo-video-review.md).
// Same words as /improved-quality-demo; the design points to things:
//  • the words sit right next to what they describe and move with it;
//  • on a transition the words come first (centered), then the art arrives and
//    the words move next to it;
//  • the mission is shown by itself (no tablet, no phone), expanded, and
//    scrolled through; its media opens inline under each checkpoint;
//  • crowded subjects are isolated and popped big.
// The words come in short lines (see LINES), so each line types faster than
// in the original's long ones (1.18).
export const QUALITY_TEXT_SPEED=1.7;

// ---- Motion ----------------------------------------------------------------
export const MOTION={
 out:.45,      // art fades away
 cut:.47,      // the camera cuts right after, while nothing is visible
 enter:.8,     // art pops / rises in (expo)
 fadeIn:.45,   // its opacity while entering
 cam:.9,       // every camera move (smooth)
 swipe:.45,    // a mission scrolls to its next checkpoint: a quick flick, with the hand's swipe
 glide:.8,     // words moving to a new place (expo)
 slide:.5,     // a screen / inline media opens (expo)
 slideOut:.4,  // it closes (ease)
 pop:.4,       // a menu pops from its button (expo)
 grow:.7,      // the mission expands from its card
 iso:1,        // a mission lifts out of the board (and goes back)
 lead:.6,      // a press ring appears this long before the press
 open:.35,     // press -> what it opens (the ring has faded by then)
 gap:.7,       // between consecutive presses on one screen
 hold:.9,      // after the last beat, before the next chapter
 read:1.3,     // a highlighted subject stays at least this long
 scroll:2.4,   // the report tour (the hand flicks, the report runs on)
 rec:2,        // recorded video length (whole seconds, real time)
};

// ---- Script ---------------------------------------------------------------------
// The words of /improved-quality-demo (the CEO rewrites them). Each caption is
// a compact rectangle: its lines about the same length, never one long line.
// The breaks are fixed — the words never wrap or move to another line.
const LINES={
 guidance:'Teams Are Constantly / Guided To Perform / With Quality & Precision',
 knowledge:'As Teams Work / Information Is / Readily Available',
 instructions:'Within Each Mission / Instructions Can Be / Included To Remind / About Standards',
 alerts:'Alerts Can Be Included / To Warn About Risks',
 links:'Add Links To / Outside Resources',
 translation:'Instantly Translate / All Mission Content',
 steps:'Executions Can Be / Guided Step-By-Step',
 micro:'Micro-Trainings Are / Delivered In Context / Of Actual Work',
 capture:'Photos Or Videos Can / Be Taken Within Missions / They Are Not Stored / On The Device And / Cannot Be Used In / Future Instances',
 photo:'Photos Document / Proper Standards',
 video:'Videos Report / Conditions',
 emphasis:'Quality Is / Systematically / Emphasized',
 rate:'Self-Ratings Encourage / Personal Accountability',
 peer:'Peer Ratings / Crowdsource / Quality Control',
 visibility:'Managers Enjoy / Total Visibility',
 mobile:'From Any / Mobile Device',
 tour:'They Tour / Documented / Evidence',
 web:'From The Web / In Gallery View',
 remote:'They Remotely / Tour Conditions',
 performer:'Who Performed',
 timestamp:'At What Exact / Date & Time',
 conclusion:'Execution Quality Is Assured / With In-Mission Guidance / And Constant Oversight',
};
const toText=line=>line.split(' / ').join('\n');
const readyOf=id=>captionReady(toText(LINES[id]))/QUALITY_TEXT_SPEED;
// ---- Beats (seconds from each chapter's start) ------------------------------
// Where the hand acts (it clicks, drags or swipes), the words come FIRST (the
// user, 2026-10-05): with nothing on screen yet, the chat box pops empty at the size
// of its words, the words type, then the tail reaches out of the bubble to what will
// be clicked with the hand on its tip, the hand clicks, and then the tail fades
// (`first` below). More clicks with the same words: the hand stays and goes on to the
// next, the box going with it. A chapter that goes on with the hand of the one before
// (`next`, GOES_ON): those words fade where they are, the hand goes to what it will
// click, a new bubble comes out of it (the tail, the box, the words), it clicks and the
// tail fades. Whatever a click does starts at the click (LAUNCH in lib/demoHand.mjs).
// Where something is only shown (no hand: a yellow rectangle marks it), there is no
// tail at all: the box comes beside it, then the words type (`speak`).
const tap=(ring,lead)=>handTap(ring,MOTION.open,lead);
const speak=(press,id)=>handSpeak(press,readyOf(id));
// A chapter's first click, words first: the box starts at `say`.
// { say, text, typed, ring, arrive, press, fade, open }
const first=(say,id)=>handLaunch(say,readyOf(id),MOTION.open);
// A chapter that goes on with the hand of the one before: the hand sets off at `ring`,
// the bubble comes out of it once it is there. Same shape as `first`.
const next=(ring,id)=>handRelaunch(ring,readyOf(id),MOTION.open);
const words=t=>({say:t.say,text:t.text,typed:t.typed});
const SOON=.2;// a chapter that carries on with the same art: its box starts this soon
// The same for a swipe: the hand lands on a scrolling area and swipes up, fast, as it scrolls (MOTION.swipe).
const firstScroll=(say,id)=>{const t=first(say,id);return {...t,end:t.press+MOTION.swipe};};
const nextScroll=(ring,id)=>{const t=next(ring,id);return {...t,end:t.press+MOTION.swipe};};
export const GUIDANCE=(()=>{const typed=readyOf('guidance');return {text:0,typed,end:typed+MOTION.read};})();
// 2: the tablet pops in; the hand opens Menu -> Knowledge Base -> Onboarding,
// which opens its video.
export const KNOWLEDGE=(()=>{
 const tablet=0,settled=tablet+MOTION.enter;
 const menu=first(settled-.3,'knowledge'),kb=tap(menu.open+MOTION.pop,HAND.hop+.1),cards=kb.open+MOTION.slide;
 const onboarding=tap(cards+.1,HAND.hop+.1),play=onboarding.open+MOTION.slide,clip=3;
 return {tablet,settled,menu,kb,cards,onboarding,play,clip,...words(menu),end:play+clip+MOTION.hold};
})();
// 3: the tablet leaves; one mission card pops in on its own. No pointer here
// (BOXED): the words come in their box with the card, then the card opens by
// itself, then the instructions are marked (MARKS) and the words glide level
// with them.
export const OPEN=(()=>{
 const out=MOTION.out,cut=MOTION.cut,chip=cut+.05,settled=chip+MOTION.enter;
 const w=speak(settled-.35,'instructions');
 const press=tap(w.typed+.3-HAND.travel),expand=press.open,expanded=expand+MOTION.grow;
 const point={ring:expanded-.5,press:expanded+.1},mark=point.press;
 return {out,cut,chip,settled,press,expand,expanded,point,mark,subject:mark,...w,end:mark+MOTION.read+.3};
})();
// 4-5: the hand clicks the subject, the bubble comes out of it.
const subjectChapter=id=>{const point=tap(0),w=speak(point.press,id);return {point,subject:point.press,...w,end:w.typed+MOTION.read+.3};};
export const ALERTS=subjectChapter('alerts');
export const LINKS=subjectChapter('links');
// 6: the hand presses Translate -> Spanish; the Spanish stays a moment, then it
// presses again -> English.
export const TRANSLATION=(()=>{
 const to=first(SOON,'translation'),back=tap(to.press+1.5,HAND.hop);
 return {to,backTap:back,press:to.press,back:back.press,...words(to),end:back.press+MOTION.hold};
})();
export const TRANSLATE_AT=TRANSLATION.press+.08,UNTRANSLATE_AT=TRANSLATION.back+.08;
// 7: the mission scrolls to its checklist on its own and the hand (still there from
// chapter 6) goes to the first Yes, the words come out of it, then it answers three
// questions one by one, always in the same spot: after each answer the list scrolls up
// by one question, so the next Yes lands under the hand. (The hand never scrolls here:
// the scrolling is not the point.)
export const STEPS=(()=>{
 const one=next(MOTION.swipe,'steps'),taps=[one,...[1,2].map(i=>tap(one.press+.35+(i-1)*(HAND.hop+.35),HAND.hop))],presses=taps.map(t=>t.press);
 const scrollAts=[0,presses[0]+.3,presses[1]+.3];// each scroll is done before the next answer (the first one before the words)
 return {taps,presses,scrollAts,scrollAt:0,...words(one),end:presses[2]+MOTION.hold};
})();
// 8: the training checkpoint: the hand plays its video tile inline, then the
// quiz opens under it; three answers, Submit, and both fold into a Done tile.
export const QUIZ_ANSWERS=[1,0,0];// 0 = True, 1 = False
export const MICRO=(()=>{
 const playTap=next(MOTION.swipe,'micro'),open=playTap.open,start=open+MOTION.slide,clip=3;// (the mission scrolls to the tile on its own, before the words)
 const quiz=start+clip+.1,from=quiz+MOTION.slide-.15;
 const answerTaps=[0,1,2].map(i=>tap(from+i*(HAND.hop+.25),HAND.hop));
 const answers=answerTaps.map(t=>t.press),submitTap=tap(answers[2]+.25,HAND.hop);
 const submit=submitTap.press,close=submitTap.open,done=close+MOTION.slideOut;
 return {scrollAt:0,playTap,answerTaps,submitTap,press:playTap.press,open,start,clip,quiz,answers,submit,close,done,...words(playTap),end:done+MOTION.read+.3};
})();
// 9: the mission scrolls on its own; the hand points at the two proof checkpoints.
export const CAPTURE=(()=>{const point=tap(0),w=speak(point.press,'capture');return {scrollAt:0,point,subject:point.press,...w,end:w.typed+MOTION.read+.3};})();
// 10: the hand presses Add photo: the photo appears under its checkpoint.
export const PHOTO=(()=>{
 const addTap=first(SOON,'photo'),shot=addTap.open;
 return {addTap,press:addTap.press,shot,...words(addTap),end:shot+MOTION.slide+MOTION.read+.3};
})();
// 11: the hand answers No -> a video is required; Add video records it under
// the checkpoint (MOTION.rec real-time seconds), then plays it back.
export const VIDEO=(()=>{
 const noTap=first(MOTION.swipe+.05,'video'),addTap=tap(noTap.press+.3,HAND.hop);// (the mission scrolls to the question on its own; then the words, then the hand out of their bubble: the user, 2026-10-05)
 const open=addTap.open,record=open+MOTION.slide,stop=record+MOTION.rec,playback=stop+.3;
 return {scrollAt:0,noTap,addTap,no:noTap.press,press:addTap.press,open,record,stop,playback,...words(noTap),end:playback+MOTION.rec+MOTION.hold};
})();
// The attached files, named by the exact moment each was captured.
export const PROOF_FILES={photo:'Photo 9/23/2026 at 4:12:08 PM.jpg',video:'Video 9/23/2026 at 4:12:24 PM.mp4'};
// 12: the mission leaves; Team A's board pops in; the hand clicks one closed
// mission and it lifts out and is isolated.
export const EMPHASIS=(()=>{
 const out=MOTION.out,cut=MOTION.cut,board=cut+.05,settled=board+MOTION.enter;
 const lift=first(settled-.3,'emphasis'),iso=lift.press+.1;
 return {out,cut,board,settled,lift,iso,...words(lift),end:iso+MOTION.iso+MOTION.read};
})();
// 13: the hand presses Rate on the isolated mission; the rating opens under
// it; the hand drags Poor -> Excellent; Submit; the badge pops onto the card.
export const RATE_LABELS=['Poor','OK','Good','Great','Excellent'];
export const RATE=(()=>{
 const rateTap=next(SOON,'rate'),open=rateTap.open,grab=open+MOTION.slide+.2,drag=[grab+.2,grab+2];
 const submitTap=tap(drag[1]+.1,HAND.hop),close=submitTap.open,badge=close+MOTION.slideOut;
 return {rateTap,press:rateTap.press,open,grab,drag,submitTap,submit:submitTap.press,close,badge,...words(rateTap),end:badge+.2+MOTION.read+.3};
})();
// 14: the peers rate it on their own (no hand), one after the other: each one's rating
// card (our Rate box, who rates on its corner) pops in on the right of the mission, its
// slider goes to their rating, it is sent, and their badge pops onto the card. First
// (`shift`) everything glides left, so that with them it is all still centered.
// { at: the card pops in, slide: its slider starts, set: it is sent, rated: the badge pops }
export const PEER=(()=>{
 const point=tap(0),w=speak(point.press,'peer'),first=point.press+.3,shift=.2;
 const people=[{initials:'BR',name:'Ben R.',score:4,avatar:'/avatars/03.png'},{initials:'LT',name:'Leo T.',score:3,avatar:'/avatars/01.png'}].map((p,i)=>{const at=first+2*i;return {...p,at,slide:at+.45,set:at+1.35,rated:at+1.6};});
 return {point,...w,people,shift,end:Math.max(people[1].rated+MOTION.read,w.typed+MOTION.read)};
})();
export const SELF={initials:'AF',name:'Anna F.',score:5,avatar:'/avatars/02.png'};
// 15: the mission goes back into the tablet; the hand presses Menu -> Business
// Media -> Business Proofs, which scroll (15-17 stay on the tablet: "a tablet
// is a mobile device too").
export const VIS=(()=>{
 const back=MOTION.iso,menu=first(back+SOON,'visibility'),media=tap(menu.open+MOTION.pop+.1,HAND.hop+.1);// (the words come once the mission is back in the tablet)
 const proofs=media.open,scroll=[proofs+MOTION.slide,proofs+MOTION.slide+1.5];
 return {back,menu,mediaTap:media,press:menu.press,open:menu.open,media:media.press,proofs,scroll,...words(menu),end:scroll[1]+.6};
})();
// 16-17 (and 19): scrolling through a lot is the point here, so the hand lands on
// the list and swipes up as it scrolls. Nowhere else does the hand scroll.
const tourChapter=id=>{const scrollTo=nextScroll(SOON,id),scroll=[scrollTo.press,scrollTo.press+1.3];return {scrollTo,...words(scrollTo),scroll,end:scroll[1]+.8};};
export const MOBILE=tourChapter('mobile');
export const TOUR=tourChapter('tour');
// Business Proofs scroll share of each chapter (0 = top, 1 = end).
export const PROOF_SCROLL={visibility:[0,.45],mobile:[.45,.72],tour:[.72,1]};
// 18: the tablet leaves; the web report (cut on the right) pops in; the hand
// presses Gallery View.
export const WEB=(()=>{
 const out=MOTION.out,cut=MOTION.cut,enter=cut+.05,settled=enter+MOTION.enter,gallery=first(settled-.3,'web');
 return {out,cut,enter,settled,tap:gallery,press:gallery.press,gallery:gallery.open,...words(gallery),end:gallery.open+MOTION.slide+MOTION.hold};
})();
// 19: the hand swipes up on the report, which tours the photos, stopping with
// two performers in view.
export const REMOTE=(()=>{const scrollTo=nextScroll(SOON,'remote'),scroll=[scrollTo.press,scrollTo.press+MOTION.scroll];return {scrollTo,...words(scrollTo),scroll,end:scroll[1]+.8,stop:.93};})();
// 20-21: everything darkens except the two cells talked about (a spotlight in
// the report); the hand clicks them and the bubble comes out; then those very
// cells scale up, coming together one above the other, left of the words.
const SPOT=.4;// the dark fades in
export const PERFORMER=(()=>{
 const spot=0,point=tap(.1),w=speak(point.press,'performer'),pop=w.typed+.5,landed=pop+MOTION.glide;
 return {spot,point,...w,pop,landed,end:landed+MOTION.read+.3};
})();
// 21: the performers fade while the report slides over to its Date & Time
// column (out of view until now); then the two dates are marked and scale up.
export const TIMESTAMP=(()=>{
 const out=.35,uncrop=MOTION.cam,spot=uncrop,point=tap(spot+.1),w=speak(point.press,'timestamp'),pop=w.typed+.5,landed=pop+MOTION.glide;
 return {out,uncrop,spot,point,...w,pop,landed,end:landed+MOTION.read+.3};
})();
// 22: everything fades; the closing lines type centered and stay.
export const CONCLUSION=(()=>{const text=MOTION.out+.2,typed=text+readyOf('conclusion');return {out:MOTION.out,text,typed,end:typed+2.2};})();

const BEATS={guidance:GUIDANCE,knowledge:KNOWLEDGE,instructions:OPEN,alerts:ALERTS,links:LINKS,translation:TRANSLATION,steps:STEPS,micro:MICRO,capture:CAPTURE,photo:PHOTO,video:VIDEO,emphasis:EMPHASIS,rate:RATE,peer:PEER,visibility:VIS,mobile:MOBILE,tour:TOUR,web:WEB,remote:REMOTE,performer:PERFORMER,timestamp:TIMESTAMP,conclusion:CONCLUSION};
// When each chapter's words start typing, and when its bubble comes out.
// Seconds into a chapter when the last scene's art has gone and this one's has
// begun. A clip of the chapter on its own starts here, so it never shows a bit
// of another part (the tablet fading out at the start of the mission, say).
export const CLIP_SKIP={instructions:OPEN.cut,emphasis:EMPHASIS.cut,visibility:VIS.back,web:WEB.cut,timestamp:TIMESTAMP.out,conclusion:CONCLUSION.out};
export const TEXT_AT=Object.fromEntries(Object.entries(BEATS).map(([id,b])=>[id,b.text]));
export const SAY=Object.fromEntries(Object.entries(BEATS).filter(([,b])=>b.say!=null).map(([id,b])=>[id,b.say]));
const ENDS=Object.fromEntries(Object.entries(BEATS).map(([id,b])=>[id,b.end]));
const VIEWS={guidance:'title',knowledge:'knowledge',instructions:'mission',alerts:'mission',links:'mission',translation:'mission',steps:'mission',micro:'mission',capture:'mission',photo:'mission',video:'mission',emphasis:'board',rate:'board',peer:'board',visibility:'board',mobile:'board',tour:'board',web:'web',remote:'web',performer:'web',timestamp:'web',conclusion:'title'};

let cursor=0;
export const QUALITY_STORY=Object.keys(LINES).map((id,index)=>{
 const text=toText(LINES[id]),duration=Math.round(ENDS[id]*100)/100,start=cursor;cursor=Math.round((cursor+duration)*100)/100;
 return {id,text,start,end:cursor,duration,view:VIEWS[id],number:index+1,ready:readyOf(id)};
});
export const QUALITY_STORY_LENGTH=cursor;
const at=id=>QUALITY_STORY.find(s=>s.id===id);
const sceneAt=time=>QUALITY_STORY.find(s=>time<s.end)??QUALITY_STORY.at(-1);
const since=(id,time)=>time-at(id).start;// seconds into chapter `id` (negative before it)

export const clamp=p=>Math.max(0,Math.min(1,p));
export const ease=p=>1-(1-clamp(p))**3;
// expo: snaps in fast, then settles (UI pops). smooth: slow-in/slow-out (camera).
export const expo=p=>{p=clamp(p);return p===1?1:1-2**(-10*p);};
export const smooth=p=>{p=clamp(p);return p*p*p*(p*(p*6-15)+10);};
export const mix=(a,b,p)=>a+(b-a)*p;

// ---- Layout (camera px) -----------------------------------------------------
// One 1600x900 camera layer holds the art. Tablet boards are centered at
// (800,360) at 1.1 scale; its frame image is visible from x 361 to 1237.
// The mission (chapters 3-11) is a 360x573 panel. The report (chapters 18-21)
// is the 1600x760 web page, big: it fills the frame from the left margin to the
// words' room on the right and nearly top to bottom, so only a window of it
// shows (its left part; chapter 21 slides to its right part, the dates).
export const LAYOUT={
 tablet:{left:361,right:1237,top:30,bottom:690,scale:1.1},
 sideWords:{gap:24,width:260,y:312,margin:24},// chapter 2: right of the tablet, level with Knowledge Base
 // What is shown sits in the center: each art and the typical words it carries
 // are centered as one group.
 mission:{left:505,top:163,width:360,height:573},// on screen: x 358-898, y 20-880
 report:{left:24,top:62,page:1600,height:760,scale:1.02,words:260},// on screen: from x 24 to the words' room, y 62-837
 wordsGap:44,// stage px between the art and the words beside it
 tipIn:10,// stage px a speech bubble's tail reaches into what the words point at
 margin:24,// stage px kept at the frame's edges
};
// Screen box of the popped-out mission (chapters 12-15), in stage px: the card
// centered on the frame's middle, and with the words beside it (about 300px)
// centered as a group.
export const ISO={left:378,top:342,width:500};
// Chapters 13-14 (the ratings, as the user drew them): what is on the slide is always
// centered (the user, 2026-10-05), so the card moves as the ratings come: 13 with its words
// (rate), then with the self rating under it (self: it glides up as that comes), 14 with the
// peers' ratings on its right too (peer: it glides left before they come). Stage px.
export const ISO_AT={rate:{left:299,top:342,width:500},self:{left:299,top:137,width:500},peer:{left:143,top:65,width:500}};
// Chapters whose words come in a plain box with no pointer (no hand, no
// tail): the user is trying it on this one first (2026-10-01).
export const BOXED=new Set(['instructions']);
// (What a chapter only shows has no tail at all: the box beside it, then its words. What
// it shows is marked with a thick yellow rounded rectangle: every `point` stop of
// HAND_STOPS below, see marksOf in lib/demoHand.mjs. Where the hand acts, the tail is there
// only while it brings the hand out (or comes out of the hand) and fades after the click.)
// Chapters 20-21: how many times bigger each report item gets than it is in
// the report (a gentle scale-up, not a big zoom), and the gap between the two,
// in stage px.
export const POP_CELL={grow:1.6,gap:10};

// ---- Frame -------------------------------------------------------------------
// Where the hand goes in each chapter, in order: [target, its click]. A target
// is a named subject or any [data-iq-target] the page can find.
// kind 'point' = it is only shown: no hand, a yellow rectangle around it (`extra`: mark, markAt, markUntil).
const stop=(target,t,kind,extra)=>({target,ring:t.ring,press:t.press,...(kind?{kind}:{}),...extra});
// A chapter's first action, words first: the hand comes out of the bubble on its tail (launchStop).
const out=(target,t)=>launchStop(target,t);
const scrolls=(target,t)=>launchStop(target,t,{hold:t.end,kind:'scroll'});
// The first action of a chapter that goes on with the hand of the one before (GOES_ON): it
// sets off from where that one's last stop left it (filled in below).
const on=(target,t,extra)=>({target,ring:t.ring,arrive:t.arrive,fade:t.fade,press:t.press,...extra});
const STOPS={
 knowledge:[out('menu',KNOWLEDGE.menu),stop('knowledge',KNOWLEDGE.kb),stop('kb-type-2',KNOWLEDGE.onboarding)],
 instructions:[stop('mission-chip',{ring:OPEN.chip,press:OPEN.settled-.2},'point',{mark:false}),stop('instructions',OPEN.point,'point',{markAt:OPEN.mark})],// the card only sets the words' level; the instructions are marked once it has opened
 alerts:[stop('alert',ALERTS.point,'point')],
 links:[stop('link',LINKS.point,'point')],
 translation:[out('translate',TRANSLATION.to),stop('translate',TRANSLATION.backTap)],
 steps:STEPS.taps.map((t,i)=>(i?stop:on)('step-spot',t)),// one spot: the list scrolls up under the hand
 micro:[on('training-play',MICRO.playTap),...MICRO.answerTaps.map((t,i)=>stop(`quiz-${i}-${QUIZ_ANSWERS[i]}`,t)),stop('quiz-submit',MICRO.submitTap,null,{settle:MICRO.done+.1})],// (Submit folds the quiz and the video into a Done tile: its "after" frame waits for that)
 capture:[stop('proof-block',CAPTURE.point,'point')],
 photo:[out('add-photo',PHOTO.addTap)],
 video:[out('no-5',VIDEO.noTap),stop('add-video',VIDEO.addTap)],
 emphasis:[out('rated-card',EMPHASIS.lift)],
 rate:[on('rate-0',RATE.rateTap),{target:'rate-knob',ring:RATE.open+.05,press:RATE.grab,hold:RATE.drag[1]},stop('rate-submit',RATE.submitTap)],
 peer:[stop('iso-ratings',PEER.point,'point',{mark:false})],// (the bracket and "Peer Ratings" point at them: no rectangle)
 visibility:[out('tablet-menu',VIS.menu),stop('business-media',VIS.mediaTap)],
 mobile:[on('proofs',MOBILE.scrollTo,{hold:MOBILE.scrollTo.end,kind:'scroll'})],tour:[on('proofs',TOUR.scrollTo,{hold:TOUR.scrollTo.end,kind:'scroll'})],
 web:[out('gallery-view',WEB.tap)],remote:[on('report',REMOTE.scrollTo,{hold:REMOTE.scrollTo.end,kind:'scroll'})],
 // the two cells are marked while they are in the report (until they scale up out of it)
 performer:[stop('performers',PERFORMER.point,'point',{mark:['performers-0','performers-1'],markUntil:PERFORMER.pop})],
 timestamp:[stop('dates',TIMESTAMP.point,'point',{mark:['dates-0','dates-1'],markUntil:TIMESTAMP.pop})],
};
// The chapters that go on with the hand of the one before them (both act, on the same
// screen): the hand stays on screen across the cut between them.
export const GOES_ON=new Set(['steps','micro','rate','mobile','tour','remote']);// (not 11, video: its words come first, the user 2026-10-05)
export const HAND_STOPS=(()=>{
 const ids=QUALITY_STORY.map(s=>s.id),all={...STOPS};
 for(const id of ids.filter(x=>GOES_ON.has(x))){
  const before=ids[ids.indexOf(id)-1],last=all[before].at(-1),{target,ring,arrive,fade,press,...extra}=all[id][0];
  all[before]=[...all[before].slice(0,-1),{...last,stay:true}];// it does not fade: the next chapter goes on with it
  all[id]=[carryStop(target,{ring,arrive,fade,press},last,extra),...all[id].slice(1)];
 }
 return all;
})();
// The chapters where the hand acts with nothing on screen yet: the words come first, the
// hand out of their bubble. (GOES_ON: the hand acts too, the bubble comes out of it.)
export const WORDS_FIRST=new Set(Object.keys(HAND_STOPS).filter(id=>launches(HAND_STOPS[id])));
export const ACTING=new Set(Object.keys(HAND_STOPS).filter(id=>launches(HAND_STOPS[id])||carries(HAND_STOPS[id])));

export function qualityStoryFrame(time){
 const scene=sceneAt(time),elapsed=Math.max(0,time-scene.start),n=scene.number;
 // 2: the menu, the Knowledge Base, then Onboarding's video.
 const k=scene.id==='knowledge'?elapsed:n>2?Infinity:-1,K=KNOWLEDGE;
 const menu=k>=K.menu.open&&k<K.kb.open;
 const kb={reveal:k<0?0:expo((k-K.kb.open)/MOTION.slide),since:k-K.kb.open,menuPop:k<0?0:expo((k-K.menu.open)/MOTION.pop),
  viewer:k<0?0:expo((k-K.onboarding.open)/MOTION.slide),video:k<0?0:Math.min(K.clip,Math.max(0,k-K.play))};
 const knowledge=k>=K.kb.open;
 // 3-11: the mission.
 const o=scene.id==='instructions'?elapsed:n>3?Infinity:-1;
 const mission={
  chip:o<0?0:expo((o-OPEN.chip)/MOTION.enter),
  expand:o<0?0:expo((o-OPEN.expand)/MOTION.grow),
  translated:scene.id==='translation'&&elapsed>=TRANSLATE_AT&&elapsed<UNTRANSLATE_AT,
  clock:o<0?0:Math.floor(Math.max(0,time-at('instructions').start-OPEN.expand)),// seconds the timer has run on screen
 };
 const steps=scene.id==='steps'?STEPS.presses.filter(s=>elapsed>=s).length:n>7?3:0;
 const m=scene.id==='micro'?elapsed:n>8?Infinity:-1,M=MICRO;
 const training={
  video:m<0?0:expo((m-M.open)/MOTION.slide)*(1-ease((m-M.close)/MOTION.slideOut)),// the tile opens into the video
  seconds:m<0?0:Math.min(M.clip,Math.max(0,m-M.start)),// played, real time
  quiz:m<0?0:expo((m-M.quiz)/MOTION.slide)*(1-ease((m-M.close)/MOTION.slideOut)),
  answers:M.answers.filter(s=>m>=s).length,
  done:m>=M.done,
 };
 const p=scene.id==='photo'?elapsed:n>10?Infinity:-1;
 const photo={taken:p>=PHOTO.shot,in:p<0?0:expo((p-PHOTO.shot)/MOTION.slide),flash:p<0?0:Math.max(0,1-Math.abs(p-PHOTO.shot-.05)/.15)};
 const v=scene.id==='video'?elapsed:n>11?Infinity:-1,V=VIDEO;
 const video={
  answered:v>=V.no,box:v<0?0:ease((v-V.no-.1)/.4),
  in:v<0?0:expo((v-V.open)/MOTION.slide),
  recording:v>=V.record&&v<V.stop,
  rec:v<0?0:Math.floor(Math.min(V.stop,Math.max(V.record,v))-V.record),// whole seconds, real time
  attached:v>=V.stop,
  live:v<0?0:v-V.open,// seconds of camera feed while recording
  playback:v<0?0:Math.min(MOTION.rec,Math.max(0,v-V.playback)),
 };
 // 13-14: the self rating (it stays once sent), then the peers' (each card pops in,
 // its slider goes to their rating, it is sent, their badge pops onto the card); the
 // cards go as the mission goes back into the tablet (15).
 const r=scene.id==='rate'?elapsed:n>13?Infinity:-1,pe=scene.id==='peer'?elapsed:n>14?Infinity:-1,back=scene.id==='visibility'?elapsed:n>15?Infinity:-1;
 const pop=t=>ease(t/.3);
 const rating={
  self:{in:r<0?0:expo((r-RATE.open)/MOTION.slide),value:r<0?0:4*smooth((r-RATE.drag[0])/(RATE.drag[1]-RATE.drag[0])),moved:r>=RATE.drag[0],sent:r>=RATE.submit},
  peers:PEER.people.map(x=>({...x,in:pe<0?0:expo((pe-x.at)/MOTION.slide),value:pe<0?0:(x.score-1)*smooth((pe-x.slide)/(x.set-x.slide)),moved:pe>=x.slide,sent:pe>=x.set})),
  shown:back<0?1:1-ease(back/(VIS.back*.4)),
  ratings:[
   ...(r>=RATE.badge?[{...SELF,pop:pop(r-RATE.badge)}]:[]),
   ...PEER.people.filter(x=>pe>=x.rated).map(x=>({...x,pop:pop(pe-x.rated)})).reverse(),// (the first peer's badge is the last: it is the one by the top card)
  ],
 };
 // 15-17: the tablet's menu, then Business Proofs scrolling across chapters.
 const vi=scene.id==='visibility'?elapsed:n>15?Infinity:-1;
 const scrollOf=(id,[a,b])=>{const e=since(id,time),ch=id==='visibility'?VIS:id==='mobile'?MOBILE:TOUR;return mix(a,b,smooth((e-ch.scroll[0])/(ch.scroll[1]-ch.scroll[0])));};
 const proofScroll=n<15?0:n>17?1:scrollOf(scene.id,PROOF_SCROLL[scene.id]);
 const visibility={menu:vi>=VIS.open&&vi<VIS.proofs,pop:vi<0?0:expo((vi-VIS.open)/MOTION.pop),proofsIn:vi<0?0:expo((vi-VIS.proofs)/MOTION.slide),scroll:proofScroll};
 // 18-21: the web report.
 const w=scene.id==='web'?elapsed:n>18?Infinity:-1;
 const web={
  gallery:w>=WEB.press,rows:w<0?0:expo((w-WEB.gallery)/MOTION.slide),
  scroll:REMOTE.stop*(scene.id==='remote'?smooth((elapsed-REMOTE.scroll[0])/(REMOTE.scroll[1]-REMOTE.scroll[0])):n>19?1:0),
 };
 const hand=handPose(HAND_STOPS[scene.id],elapsed);// where the hand is (null in a title)
 return {scene,elapsed,menu,knowledge,kb,mission,steps,training,photo,video,rating,visibility,web,hand};
}
// ---- Camera ------------------------------------------------------------------
export const toScreen=(cam,x,y)=>({x:800+(x-cam.cx)*cam.s,y:450+(y-cam.cy)*cam.s});
// `extra`: stage px of room the words need beyond plain words (a speech
// bubble's outline and tail, see bubbleRoom): the tablet gives way to it.
const tabletLeftFor=(extra=0)=>{
 const {left,right,top,bottom}=LAYOUT.tablet,{gap,width,margin}=LAYOUT.sideWords,room=width+extra;
 const s=Math.min((1600-2*margin-gap-room)/(right-left),(900-2*margin)/(bottom-top));
 const x=(1600-(right-left)*s-gap-room)/2;
 return {s,cx:left+(800-x)/s,cy:(top+bottom)/2};
};
const focusFor=(extra=0)=>{
 const tabletLeft=tabletLeftFor(extra);
 return {
  // chapters 1-2 and 12-17: the tablet as big as the frame allows, on the left,
  // with the words on its right; together they fill the frame
  tabletLeft,
  // chapters 3-11: the mission panel at 1.5x, from the frame's top to bottom
  mission:{s:1.5,cx:800,cy:450},
  // chapters 18-21: the report at its own scale
  web:{s:1,cx:800,cy:450},
  // chapter 12: a gentle push toward the Closed column while the mission lifts out
  closedPush:{s:tabletLeft.s*1.12,cx:mix(tabletLeft.cx,1063,.3),cy:330},
 };
};
export const FOCUS=focusFor();
// [chapter, time, pose, duration]; a duration of .01 is a cut, made only while
// nothing is visible.
const trackFor=extra=>{
 const focus=focusFor(extra);
 return [
  ['instructions',OPEN.cut,focus.mission,.01],
  ['emphasis',EMPHASIS.cut,focus.tabletLeft,.01],
  ['emphasis',EMPHASIS.iso,focus.closedPush,MOTION.iso],
  ['visibility',0,focus.tabletLeft,VIS.back],
  ['web',WEB.cut,focus.web,.01],
 ].map(([id,offset,to,duration])=>({at:at(id).start+offset,duration,to}));
};
const CAMERA=trackFor(0),TRACKS=new Map([[0,{track:CAMERA,start:FOCUS.tabletLeft}]]);
export const CUTS=CAMERA.filter(key=>key.duration<.1).map(key=>key.at);
export function cameraAt(time,extra=0){
 if(!TRACKS.has(extra))TRACKS.set(extra,{track:trackFor(extra),start:tabletLeftFor(extra)});
 const {track,start}=TRACKS.get(extra);
 let cam={...start};
 for(const key of track){
  if(time<key.at)break;
  const p=smooth((time-key.at)/key.duration);
  cam={s:mix(cam.s,key.to.s,p),cx:mix(cam.cx,key.to.cx,p),cy:mix(cam.cy,key.to.cy,p)};
 }
 return cam;
}
// The report (chapters 18-21) keeps its scale; what gives way to the words is how
// much of its width shows: `reportWindow` is that width, in the report's own px
// (`extra`: the room a speech bubble needs beyond plain words). Measured in the
// page: sidebar x 0-312, Gallery View x 957-1058, names x 395-450, dates x 1381-1521.
export const reportScale=()=>LAYOUT.report.scale;
export const reportWindow=(extra=0)=>{const {left,scale,page,words}=LAYOUT.report;return Math.max(400,Math.min(page,(1600-LAYOUT.margin-left-LAYOUT.wordsGap-words-extra)/scale));};

// ---- Art on screen --------------------------------------------------------------
export function devicesAt(time){
 const ke=since('knowledge',time),oe=since('instructions',time),ee=since('emphasis',time),ve=since('visibility',time),we=since('web',time),pe=since('performer',time),te=since('timestamp',time),ce=since('conclusion',time);
 // 2-3: the Team Board tablet enters, then leaves at chapter 3.
 const tabletIn=ke<0?0:ease((ke-KNOWLEDGE.tablet)/MOTION.enter);
 const tabletLift=ke<0?1:1-expo((ke-KNOWLEDGE.tablet)/MOTION.enter);
 const tabletOpacity=oe<0?1:1-ease(oe/OPEN.out);
 const tabletShown=oe<OPEN.out;
 // 3-11: the mission pops in as a card, expands, and leaves at chapter 12.
 const missionIn=oe<0?0:expo((oe-OPEN.chip)/MOTION.enter);
 const missionOpacity=(oe<0?0:ease((oe-OPEN.chip)/MOTION.fadeIn))*(ee<0?1:1-ease(ee/EMPHASIS.out));
 // 12-17: Team A's board; the mission lifts out of it (iso) and goes back.
 const board=ee<0?0:expo((ee-EMPHASIS.board)/MOTION.enter);
 const iso=ee<0?0:ve<0?smooth((ee-EMPHASIS.iso)/MOTION.iso):1-smooth(ve/VIS.back);
 // 13-14: where the lifted-out card is, so that what is on the slide stays centered as the
 // ratings come (and it goes back into the tablet from there)
 const re=since('rate',time),pre=since('peer',time);
 const toRate=re<0?0:smooth(re/MOTION.glide),toSelf=re<0?0:smooth((re-RATE.press)/MOTION.glide),toPeer=pre<0?0:smooth((pre-PEER.shift)/MOTION.glide);
 const boxOf=k=>mix(mix(mix(ISO[k],ISO_AT.rate[k],toRate),ISO_AT.self[k],toSelf),ISO_AT.peer[k],toPeer);
 const isoBox={left:boxOf('left'),top:boxOf('top'),width:boxOf('width')};
 const boardOpacity=Math.min(1,board*1.6)*(1-iso)*(we<0?1:1-ease(we/WEB.out));
 // 18-22: the web report; 20-21 mark the performers, then the dates, and scale them up.
 const web=we<0?0:expo((we-WEB.enter)/MOTION.enter);
 const out=ce<0?0:ease(ce/CONCLUSION.out);
 const webOpacity=Math.min(1,web*1.5)*(1-out);
 // 20-21: the report is NOT darkened (the user, 2026-10-02): it stays as it is, the
 // two cells talked about are marked with yellow rectangles (HAND_STOPS). `dim` is
 // kept at 0 (the page draws no dark); `spot` only says which cells are talked about.
 const dim=0;
 const P=PERFORMER,T=TIMESTAMP;
 const spot=te<0?{key:'performers',open:1-smooth((pe-P.pop)/MOTION.glide)}:{key:'dates',open:ease((te-T.spot)/SPOT)*(1-smooth((te-T.pop)/MOTION.glide))};
 // names / dates: how far the highlighted cells have scaled up (0 = in the
 // report, 1 = big, together); the names fade as chapter 21 starts.
 const names=pe<0?0:smooth((pe-P.pop)/MOTION.glide);
 const namesOpacity=(te<0?1:1-ease(te/T.out))*(1-out);
 const dates=te<0?0:smooth((te-T.pop)/MOTION.glide);
 const datesOpacity=1-out;
 const uncrop=te<0?0:smooth(te/T.uncrop);// the report has slid over to its Date & Time column
 return {tabletIn,tabletLift,tabletOpacity,tabletShown,missionIn,missionOpacity,board,boardOpacity,iso,isoBox,web,webOpacity,dim,spot,names,namesOpacity,dates,datesOpacity,uncrop};
}

// ---- Mission scroll -----------------------------------------------------------
// Each key scrolls the mission so that `to` sits at the top of its window
// (MOTION.swipe, smooth). Resolved against the live layout by the page. While
// the quiz is open (chapter 8) it tops the window, Submit included.
const SCROLL=[['steps',STEPS.scrollAts[0],'yes-0'],['steps',STEPS.scrollAts[1],'yes-1'],['steps',STEPS.scrollAts[2],'yes-2'],['micro',MICRO.scrollAt,'cp4'],['micro',MICRO.quiz,'training-quiz'],['micro',MICRO.close,'cp4'],['capture',CAPTURE.scrollAt,'cp5'],['video',VIDEO.scrollAt,'cp6']].map(([id,offset,to])=>({at:at(id).start+offset,to}));
export function missionScrollAt(time){
 let from='top',to='top',p=1;
 for(const key of SCROLL){if(time<key.at)break;from=to;to=key.to;p=smooth((time-key.at)/MOTION.swipe);}
 return {from,to,p};
}

// ---- Words --------------------------------------------------------------------
// The words sit beside the art's right edge (`edge`), level with the hand,
// and the bubble's tail reaches where the hand points. Edges are camera
// numbers ({x}) or targets the page measures; each moves to the next over
// MOTION.glide.
const glideList=(list,e)=>{
 let i=0;while(i+1<list.length&&e>=list[i+1][0])i++;
 const prev=list[Math.max(0,i-1)][1],cur=list[i][1];
 return {from:i?prev:cur,to:cur,p:i?expo((e-list[i][0])/MOTION.glide):1};
};
const TABLET_EDGE={x:LAYOUT.tablet.right};
const PLAN={
 knowledge:[[0,TABLET_EDGE]],
 instructions:[[0,'mission']],alerts:[[0,'mission']],links:[[0,'mission']],translation:[[0,'mission']],steps:[[0,'mission']],micro:[[0,'mission']],capture:[[0,'mission']],photo:[[0,'mission']],video:[[0,'mission']],
 emphasis:[[0,TABLET_EDGE],[EMPHASIS.iso,'iso']],rate:[[0,'iso']],peer:[[0,'peer-cards']],// (14: beyond the peers' cards)
 visibility:[[0,TABLET_EDGE]],mobile:[[0,TABLET_EDGE]],tour:[[0,TABLET_EDGE]],
 web:[[0,'report']],remote:[[0,'report']],
 performer:[[0,'report']],timestamp:[[0,'report']],// the words stay on the right of the report (level with the cells they are about)
};
// Once a chapter's action is done, the words (and the bubble's tail) can go
// to what it made: [from, target]. 13: when the rating is in, they go up,
// level with the card's new rating.
const SETTLE={rate:[RATE.badge,'iso-ratings']};
export function captionPlan(time){
 const scene=sceneAt(time),e=Math.max(0,time-scene.start),edge=PLAN[scene.id],settle=SETTLE[scene.id];
 if(!edge)return {center:1};
 return {center:0,edge:glideList(edge,e),settle:settle&&e>=settle[0]?{to:settle[1],p:expo((e-settle[0])/MOTION.glide)}:null};
}
