import test from 'node:test';
import assert from 'node:assert/strict';
import {QUALITY_STORY as ORIGINAL} from './improvedQualityStory.mjs';
import {HAND,LAUNCH,handPose,launchTail,leaveOf,marksOf,markOpacity} from './demoHand.mjs';
import {POP_TIME} from './captionBubbles.mjs';
import {QUALITY_STORY,QUALITY_STORY_LENGTH,MOTION,TEXT_AT,SAY,HAND_STOPS,CLIP_SKIP,qualityStoryFrame,cameraAt,devicesAt,captionPlan,missionScrollAt,reportScale,reportWindow,WORDS_FIRST,GOES_ON,ACTING,toScreen,CUTS,FOCUS,LAYOUT,KNOWLEDGE,OPEN,BOXED,TRANSLATION,TRANSLATE_AT,UNTRANSLATE_AT,STEPS,MICRO,PHOTO,VIDEO,EMPHASIS,RATE,RATE_LABELS,PEER,SELF,ISO,ISO_AT,VIS,MOBILE,TOUR,WEB,REMOTE,PERFORMER,TIMESTAMP,CONCLUSION} from './improvedQualityV2Story.mjs';

const S=id=>QUALITY_STORY.find(s=>s.id===id);
const start=id=>S(id).start;
const at=(id,t)=>qualityStoryFrame(start(id)+t);
const typedAt=id=>TEXT_AT[id]+S(id).ready;
const stops=id=>HAND_STOPS[id]??[];
const TITLES=['guidance','conclusion'];

test('same script as the original demo: 22 chapters, same words, continuous',()=>{
 const words=text=>text.split(/\s+/).join(' ');
 assert.deepEqual(QUALITY_STORY.map(s=>[s.id,words(s.text)]),ORIGINAL.map(s=>[s.id,words(s.text)]));
 // short lines: never a long sentence on one line
 // a compact rectangle: no long line, lines about the same length
 for(const s of QUALITY_STORY){
  const lengths=s.text.split('\n').map(l=>l.length);
  assert.ok(Math.max(...lengths)<=28,`${s.id}: a line is too long`);
  assert.ok(Math.max(...lengths)<=2*Math.min(...lengths),`${s.id}: lines too uneven (${lengths})`);
 }
 QUALITY_STORY.forEach((scene,i)=>assert.equal(scene.start,i?QUALITY_STORY[i-1].end:0));
 assert.equal(QUALITY_STORY_LENGTH,QUALITY_STORY.at(-1).end);
});

// The chapters where the hand acts (it clicks, drags or swipes), and those that only show something.
const ACTS=['knowledge','translation','steps','micro','photo','video','emphasis','rate','visibility','mobile','tour','web','remote'];
const GOING_ON=['steps','micro','rate','mobile','tour','remote'];// the hand of the chapter before goes on
const FRESH=ACTS.filter(id=>!GOING_ON.includes(id));// nothing on screen before
const SHOWS=['alerts','links','capture','peer','performer','timestamp'];
test('where the hand acts the words come first: the empty box, the words, then the hand out of the bubble on its tail, the click, then the tail fades',()=>{
 assert.deepEqual([...WORDS_FIRST],FRESH);
 assert.deepEqual([...ACTING],ACTS);
 for(const id of FRESH){
  const list=stops(id),[first]=list,tail=t=>launchTail(list,t);
  assert.ok(first.launch&&(first.kind??'click')!=='point',`${id}: the hand acts`);
  assert.ok(SAY[id]<=1.2&&SAY[id]>=(CLIP_SKIP[id]??0)+.15,`${id}: the box comes right away, once the scene is in`);
  // the box is empty, at its size, before its words start
  assert.ok(Math.abs(TEXT_AT[id]-SAY[id]-LAUNCH.textLag)<1e-9&&LAUNCH.textLag>=POP_TIME,`${id}: the box has popped before its words start`);
  // no hand and no tail while the words type
  assert.ok(first.ring>=typedAt(id)+LAUNCH.pause-1e-9,`${id}: the hand comes out before the words are in`);
  for(const t of [0,SAY[id],TEXT_AT[id],typedAt(id),first.ring-.01]){assert.equal(handPose(list,t),null,`${id}: a hand at ${t.toFixed(2)}`);assert.deepEqual(tail(t),{reach:0,opacity:0},`${id}: a tail at ${t.toFixed(2)}`);}
  // then the tail reaches out with the hand on its tip, out of the bubble
  const leaving=handPose(list,first.ring+.2);
  assert.equal(leaving.from,'bubble',`${id}: the hand comes out of the bubble`);
  assert.ok(Math.abs(tail(first.ring+.2).reach-leaving.p)<1e-9&&leaving.p>0&&leaving.p<1,`${id}: the hand rides the tail's tip`);
  assert.ok(tail(first.arrive).reach===1&&tail(first.arrive).opacity===1&&handPose(list,first.arrive).p===1,`${id}: both are on the target`);
  // the hand clicks with the tail still out, then the tail fades
  assert.ok(first.ring<first.arrive&&first.arrive<first.press&&first.press<first.fade,`${id}: out, click, fade`);
  assert.ok(!handPose(list,first.press-.01).down&&handPose(list,first.press+.01).down&&tail(first.press+.01).opacity===1,`${id}: it clicks, the tail still there`);
  assert.equal(tail(first.fade+LAUNCH.fade).opacity,0,`${id}: then the tail has gone`);
  assert.equal(tail(S(id).duration).opacity,0,`${id}: and it never comes back`);
  // more clicks: the hand stays on screen and goes from one to the next (never from outside, never back out of the bubble)
  for(let t=first.arrive;t<Math.min(S(id).duration,leaveOf(list.at(-1)));t+=.05){const pose=handPose(list,t);assert.ok(pose.opacity>.99,`${id}: the hand stays at ${t.toFixed(2)}`);if(pose.index>0)assert.equal(pose.from,list[pose.index-1].target,`${id}: it goes on from the last click`);}
 }
 // going on with the hand of the chapter before: it is there from the start, goes to what it clicks, the bubble comes out of it
 for(const id of GOING_ON){
  const list=stops(id),[first]=list,tail=t=>launchTail(list,t),ids=QUALITY_STORY.map(x=>x.id),before=ids[ids.indexOf(id)-1];
  assert.ok(GOES_ON.has(id)&&first.carry&&!first.launch,`${id}: goes on`);
  assert.ok(ACTS.includes(before),`${id}: the chapter before acts too (${before})`);
  const last=stops(before).at(-1);
  assert.deepEqual([first.carry.target,first.carry.kind],[last.target,last.kind??'click'],`${id}: from where ${before} left it`);
  assert.ok(last.stay,`${before}: keeps the hand for ${id}`);
  assert.ok(handPose(stops(before),S(before).duration).opacity===1&&handPose(list,0).opacity===1,`${before} -> ${id}: the hand stays across the cut`);
  // the hand moves first, then the bubble comes out of it (tail first: not from its middle), then the words, then the click, then the tail fades
  assert.ok(first.ring<first.arrive&&first.arrive<=SAY[id]&&SAY[id]<TEXT_AT[id]&&typedAt(id)<first.press&&first.press<first.fade,`${id}: move, bubble, words, click, fade`);
  assert.ok(Math.abs(TEXT_AT[id]-SAY[id]-HAND.textLag)<1e-9,`${id}: the words start once the bubble is out`);
  assert.ok(handPose(list,first.press+.01).down&&tail(first.press+.01).opacity===1&&tail(first.fade+LAUNCH.fade).opacity===0,`${id}: the click, then the tail fades`);
  assert.ok(SAY[id]<=1.2,`${id}: the words are not long in coming`);
 }
 // what is only shown: the mark, then the box beside it (no tail anywhere), then the words
 for(const id of SHOWS){
  const list=stops(id),[first]=list;
  assert.ok(first.kind==='point'&&!first.launch&&!first.carry&&!ACTING.has(id),`${id}: nothing is clicked`);
  for(let t=0;t<S(id).duration;t+=.25)assert.deepEqual(launchTail(list,t),{reach:0,opacity:0},`${id}: no tail at ${t.toFixed(2)}`);
  assert.ok(SAY[id]>=first.press+HAND.say-1e-9,`${id}: the bubble comes after the mark`);
  assert.ok(Math.abs(TEXT_AT[id]-SAY[id]-HAND.textLag)<1e-9,`${id}: the words start ${HAND.textLag}s after the bubble`);
  assert.ok(first.ring>=0&&first.ring<=1.2,`${id}: it starts right away`);
 }
 assert.deepEqual(QUALITY_STORY.map(s=>s.id).filter(id=>!TITLES.includes(id)&&!BOXED.has(id)).sort(),[...ACTS,...SHOWS].sort(),'every chapter is one or the other');
 // the instructions (boxed, no pointer): the words come with the card, then
 // the card opens, then the instructions are marked
 assert.ok(SAY.instructions>=OPEN.chip&&Math.abs(TEXT_AT.instructions-SAY.instructions-HAND.textLag)<1e-9);
 assert.ok(OPEN.typed<OPEN.expand&&OPEN.expanded<=marksOf(stops('instructions'))[0].from,'words, then open, then the mark');
 assert.deepEqual(marksOf(stops('instructions')).map(m=>m.target),['instructions'],'the card itself is not marked');
 for(const id of TITLES)assert.equal(SAY[id],undefined,`${id} is words on a clean screen, no bubble`);
 // what moves follows the hand, never the words
 for(const [id,scroll] of [['visibility',VIS.scroll],['mobile',MOBILE.scroll],['tour',TOUR.scroll],['remote',REMOTE.scroll]])assert.ok(scroll[0]>=stops(id)[0].press,`${id} scrolls before the hand has clicked`);
 for(const p of PEER.people)assert.ok(p.at>=stops('peer')[0].press);
 // the mission scrolls on its own before the hand clicks: the hand never scrolls with it
 for(const id of ['steps','micro','capture','video']){
  assert.ok(!stops(id).some(x=>x.kind==='scroll'),`${id}: the hand does not scroll`);
  assert.ok(MOTION.swipe+0.05<=stops(id)[0].press,`${id}: the list has scrolled before the first click`);
  if(WORDS_FIRST.has(id))assert.ok(MOTION.swipe<=SAY[id],`${id}: and before the box comes (it sits level with what will be clicked)`);
 }
 // the hand scrolls only where scrolling through a lot is the point
 for(const id of ['mobile','tour','remote'])assert.deepEqual([stops(id).length,stops(id)[0].kind],[1,'scroll'],id);
 for(const s of QUALITY_STORY)if(!['mobile','tour','remote'].includes(s.id))assert.ok(!stops(s.id).some(x=>x.kind==='scroll'),`${s.id}: no scrolling hand`);
});

test('the hand: stops in order, each a flight then a click; what a click opens follows MOTION.open later',()=>{
 for(const s of QUALITY_STORY.filter(x=>!TITLES.includes(x.id)&&!BOXED.has(x.id))){
  const list=stops(s.id);
  list.forEach((stop,i)=>{
   if(stop.launch)return assert.ok(Math.abs(stop.press-stop.ring-(LAUNCH.out+LAUNCH.hold))<1e-9,`${s.id}: the first one comes out of the bubble on the tail, then clicks`);
   if(stop.carry)return assert.ok(stop.press>stop.arrive&&stop.arrive>stop.ring,`${s.id}: goes on: it moves, the words come out of it, then it clicks`);
   if(stop.hold!=null)return;// a drag is held, not a flight
   const flight=stop.press-stop.ring;
   assert.ok(flight>=HAND.hop-1e-9&&flight<=HAND.travel+.1+1e-9,`${s.id}: ${stop.target} flight ${flight.toFixed(2)}`);
   if(i)assert.ok(stop.ring>=list[i-1].press-1e-9,`${s.id}: ${stop.target} leaves before the last click`);
  });
 }
 const opens=[[KNOWLEDGE.menu.press,KNOWLEDGE.menu.open],[KNOWLEDGE.kb.press,KNOWLEDGE.kb.open],[KNOWLEDGE.onboarding.press,KNOWLEDGE.onboarding.open],[OPEN.press.press,OPEN.expand],[MICRO.press,MICRO.open],[MICRO.submit,MICRO.close],[VIDEO.press,VIDEO.open],[RATE.press,RATE.open],[RATE.submit,RATE.close],[VIS.press,VIS.open],[VIS.media,VIS.proofs],[WEB.press,WEB.gallery],[PHOTO.press,PHOTO.shot]];
 for(const [press,open] of opens)assert.ok(Math.abs(open-press-MOTION.open)<1e-9,`${press} -> ${open}`);
 for(const list of [STEPS.presses,MICRO.answers]){const gap=list[1]-list[0];list.slice(1).forEach((t,i)=>assert.ok(Math.abs(t-list[i]-gap)<1e-9));}
 assert.deepEqual(stops('steps').map(x=>x.target),['step-spot','step-spot','step-spot'],'one spot: the list scrolls up under the hand');
 // the hand does what happens: it clicks what is clicked, swipes what scrolls, and only points at the rest
 const kinds=id=>stops(id).map(x=>x.kind??'click');
 assert.deepEqual(kinds('translation'),['click','click']);assert.deepEqual(kinds('alerts'),['point']);assert.deepEqual(kinds('links'),['point']);
 assert.deepEqual(kinds('steps'),['click','click','click']);assert.deepEqual(kinds('capture'),['point']);
 assert.deepEqual(kinds('instructions'),['point','point'],'boxed: nothing is clicked, the stops only set the words level');assert.deepEqual(kinds('photo'),['click']);
 assert.deepEqual(stops('translation').map(x=>x.target),['translate','translate']);
});

test('no idle tails: every chapter ends soon after its last beat, with time to read',()=>{
 const extra={knowledge:KNOWLEDGE.play+KNOWLEDGE.clip,video:VIDEO.playback+MOTION.rec,emphasis:EMPHASIS.iso+MOTION.iso,visibility:VIS.scroll[1],mobile:MOBILE.scroll[1],tour:TOUR.scroll[1],remote:REMOTE.scroll[1],peer:PEER.people[1].rated,performer:PERFORMER.landed,timestamp:TIMESTAMP.landed,micro:MICRO.done,rate:RATE.badge,web:WEB.gallery+MOTION.slide};
 for(const s of QUALITY_STORY){
  const beats=[typedAt(s.id),...stops(s.id).map(h=>h.press),extra[s.id]??0];
  const tail=s.duration-Math.max(...beats);
  assert.ok(tail<=2.5,`${s.id} idles ${tail.toFixed(2)}s`);
  assert.ok(s.duration-typedAt(s.id)>=.9,`${s.id}: too little time to read`);
 }
});

test('the camera never jumps; it cuts only while nothing is visible',()=>{
 assert.equal(CUTS.length,3);
 for(const cut of CUTS){
  const d=devicesAt(cut);
  assert.ok(!d.tabletShown||d.tabletOpacity*d.tabletIn===0,`board visible at ${cut}`);
  assert.equal(d.missionOpacity,0);assert.equal(d.boardOpacity,0);assert.equal(d.iso,0);assert.equal(d.web,0);
 }
 for(let t=0;t<QUALITY_STORY_LENGTH;t+=.02){if(CUTS.some(c=>Math.abs(t-c)<.1))continue;const a=cameraAt(t),b=cameraAt(t+.02);assert.ok(Math.abs(a.s-b.s)<.06&&Math.abs(a.cy-b.cy)<25&&Math.abs(a.cx-b.cx)<25,`jump at ${t.toFixed(2)}`);}
});

test('transitions: the old art leaves, the new art pops in, and only then the hand clicks; the words are never centered',()=>{
 for(const [id,arrive] of [['instructions',OPEN.chip],['emphasis',EMPHASIS.board],['web',WEB.enter]]){
  assert.ok(arrive<stops(id)[0].press,`${id}: the art is there before the hand clicks`);
  assert.equal(captionPlan(start(id)+arrive+MOTION.glide+.01).center,0,`${id}: beside the art`);
 }
 for(const s of QUALITY_STORY.filter(x=>!TITLES.includes(x.id)))for(const t of [0,1,s.duration-.1])assert.equal(captionPlan(start(s.id)+t).center,0,`${s.id}: centered at ${t}`);
 const d3=devicesAt(start('instructions')+OPEN.cut);assert.ok(d3.tabletOpacity===0&&d3.missionOpacity===0,'chapter 3: nothing on screen at the cut');
 const d12=devicesAt(start('emphasis')+EMPHASIS.cut);assert.ok(d12.missionOpacity===0&&d12.boardOpacity===0);
 const d18=devicesAt(start('web')+WEB.cut);assert.ok(d18.boardOpacity===0&&d18.web===0);
});

test('chapter 2: the hand opens Menu -> Knowledge Base -> Onboarding, whose video plays in real time',()=>{
 assert.deepEqual(stops('knowledge').map(h=>h.target),['menu','knowledge','kb-type-2']);
 const kb=t=>at('knowledge',t).kb;
 assert.equal(kb(KNOWLEDGE.onboarding.open-.01).viewer,0);assert.ok(kb(KNOWLEDGE.onboarding.open+.6).viewer>.99);
 assert.ok(Math.abs(kb(KNOWLEDGE.play+2).video-2)<1e-9,'real time');
 const cam=cameraAt(start('knowledge')+KNOWLEDGE.menu.press);
 assert.ok(toScreen(cam,LAYOUT.tablet.left,0).x>0&&toScreen(cam,LAYOUT.tablet.right,0).x<1600-LAYOUT.sideWords.width,'room for the words on the right');
});

test('chapters 3-11: one mission, no device; it expands from its card and scrolls through its checkpoints',()=>{
 for(let t=start('instructions')+OPEN.out;t<start('emphasis');t+=.1){const d=devicesAt(t);assert.ok((!d.tabletShown||d.tabletOpacity===0)&&d.boardOpacity===0&&d.web===0,`a device at ${t.toFixed(2)}`);}
 const m=t=>at('instructions',t).mission;
 assert.equal(m(OPEN.expand-.01).expand,0);assert.ok(m(OPEN.expanded+.01).expand>.99);assert.ok(m(OPEN.chip+MOTION.enter).chip>.99);
 assert.deepEqual([TRANSLATE_AT-.01,TRANSLATE_AT+.01,UNTRANSLATE_AT+.01].map(t=>at('translation',t).mission.translated),[false,true,false]);
 assert.equal(at('steps',0).mission.translated,false);
 assert.deepEqual(['steps','micro','capture','video'].map(id=>missionScrollAt(start(id)+MOTION.swipe+.01).to),['yes-0','cp4','cp5','cp6']);
 assert.ok(MOTION.swipe<=.5&&MOTION.scroll<=2.5,'scrolling is quick');
 for(const id of ['steps','micro','capture','video'])assert.equal(missionScrollAt(start(id)+MOTION.swipe+.01).p,1,`${id}: the scroll is done in a quick flick`);
 assert.equal(missionScrollAt(start('photo')+1).to,'cp5','the photo stays where chapter 9 scrolled');
});

test('chapter 7-8: the hand answers step by step; the training opens inline, then the quiz, then Done',()=>{
 assert.deepEqual([STEPS.presses[0]-.01,...STEPS.presses.map(p=>p+.01)].map(x=>at('steps',x).steps),[0,1,2,3]);
 const tr=t=>at('micro',t).training;
 assert.equal(tr(MICRO.open-.01).video,0);assert.ok(tr(MICRO.open+.6).video>.99);assert.ok(Math.abs(tr(MICRO.start+2).seconds-2)<1e-9,'real time');
 assert.equal(tr(MICRO.quiz-.01).quiz,0);assert.ok(tr(MICRO.quiz+.6).quiz>.99);
 assert.deepEqual([MICRO.answers[0]-.1,MICRO.answers[2]+.01].map(t=>tr(t).answers),[0,3]);
 assert.equal(tr(MICRO.done+.01).video,0);assert.equal(tr(MICRO.done+.01).quiz,0);assert.equal(tr(MICRO.done+.01).done,true);
});

test('chapters 10-11: the photo and the video appear under their checkpoints; the video records in real time',()=>{
 const p=t=>at('photo',t).photo;
 assert.equal(p(PHOTO.shot-.01).taken,false);assert.ok(p(PHOTO.shot+.6).in>.99);
 const v=t=>at('video',t).video;
 assert.deepEqual([VIDEO.no-.01,VIDEO.no+.01].map(t=>v(t).answered),[false,true]);
 assert.equal(v(VIDEO.open-.01).in,0);assert.ok(v(VIDEO.open+.6).in>.99);
 assert.deepEqual([VIDEO.record-.1,VIDEO.record+1.5,VIDEO.stop+1].map(t=>v(t).rec),[0,1,MOTION.rec]);
 assert.equal(v(VIDEO.stop-.01).attached,false);assert.equal(v(VIDEO.stop+.01).attached,true);
});

test('chapters 12-15: one mission is lifted out of the board, rated, and put back',()=>{
 const d=(id,t)=>devicesAt(start(id)+t);
 assert.equal(d('emphasis',EMPHASIS.iso-.01).iso,0);assert.ok(Math.abs(d('emphasis',EMPHASIS.iso+MOTION.iso).iso-1)<1e-9);
 for(const id of ['rate','peer'])assert.ok(d(id,1).iso===1&&d(id,1).boardOpacity===0,id);
 assert.equal(d('visibility',VIS.back).iso,0);assert.ok(d('visibility',VIS.back).boardOpacity>.99);
 const r=t=>at('rate',t).rating;
 // the self rating card pops in when Rate is pressed and stays once sent
 assert.equal(r(RATE.open-.01).self.in,0);assert.ok(r(RATE.open+.6).self.in>.99);assert.ok(r(RATE.badge+1).self.in>.99&&r(RATE.badge+1).self.sent);
 // what is on the slide stays centered: the card moves as the ratings come
 const near=(a,b,why)=>['left','top','width'].every(k=>Math.abs(a[k]-b[k])<1e-6)||assert.fail(why??JSON.stringify(a));
 assert.ok(near(d('emphasis',EMPHASIS.iso+MOTION.iso).isoBox,{left:ISO.left,top:ISO.top,width:ISO.width}));
 assert.ok(near(d('rate',RATE.press-.01).isoBox,ISO_AT.rate,'13: centered with its words'));
 assert.ok(near(d('rate',RATE.press+MOTION.glide).isoBox,ISO_AT.self,'then with the self rating under it'));
 assert.ok(near(d('peer',PEER.shift+MOTION.glide).isoBox,ISO_AT.peer,'14: with the peers too'));
 assert.ok(PEER.shift+MOTION.glide<=PEER.people[0].at+.05,'it has made room before the first peer comes');
 assert.deepEqual([RATE.drag[0]-.1,RATE.drag[1]].map(t=>RATE_LABELS[Math.round(r(t).self.value)]),['Poor','Excellent']);
 assert.deepEqual(r(RATE.badge+1).ratings.map(x=>[x.initials,x.score]),[['AF',5]]);
 const [ben,carla]=PEER.people,pe=t=>at('peer',t).rating;
 // the peers' cards come one after the other, each slider goes to its rating, then the badge pops
 assert.ok(pe(ben.at+.5).peers[0].in>.99&&pe(ben.at+.5).peers[1].in===0,'one after the other');
 assert.deepEqual(pe(carla.rated+.3).peers.map(p=>RATE_LABELS[Math.round(p.value)]),['Great','Good']);
 assert.ok(pe(ben.slide-.01).peers[0].value===0&&!pe(ben.set-.01).peers[0].sent&&pe(ben.set).peers[0].sent);
 assert.deepEqual([pe(ben.rated-.01),pe(carla.rated+.5)].map(x=>x.ratings.map(y=>y.initials)),[['AF'],['AF','LT','BR']],'the first peer\'s badge at the right end, by the top card');
 assert.ok([SELF,...PEER.people].every(p=>/^\/avatars\/\d+\.png$/.test(p.avatar)),'everyone who rates has an avatar');
 assert.ok(pe(carla.rated+.5).self.in>.99,'the self rating is still there');
 assert.ok(at('tour',1).rating.shown===0,'the cards go with the mission, back into the tablet');
});

test('chapters 15-17 stay on the tablet; Business Proofs scroll once, across the three chapters',()=>{
 let last=-1;
 for(let t=start('visibility');t<start('web');t+=.05){const s=qualityStoryFrame(t).visibility.scroll;assert.ok(s>=last-1e-9,`scroll goes back at ${t.toFixed(2)}`);last=s;}
 assert.equal(qualityStoryFrame(start('web')-.01).visibility.scroll,1);
 for(const id of ['mobile','tour'])assert.ok(devicesAt(start(id)+1).boardOpacity>.99,id);
});

test('chapters 18-22: Gallery View, the tour, then performers and dates popped big; the conclusion',()=>{
 const w=t=>at('web',t).web;
 assert.deepEqual([WEB.press-.05,WEB.press+.01].map(t=>w(t).gallery),[false,true]);assert.ok(w(WEB.gallery+.8).rows>.99);
 assert.equal(at('remote',REMOTE.scroll[1]+.05).web.scroll,REMOTE.stop);
 const d=(id,t)=>devicesAt(start(id)+t);
 // each: the report is never darkened; the two items are marked (yellow rectangles);
 // the words come on their right, level with the middle between them, and never
 // move; then the items themselves scale up
 for(const [id,C,grow,key] of [['performer',PERFORMER,'names','performers'],['timestamp',TIMESTAMP,'dates','dates']]){
  const lit=d(id,C.text);
  assert.ok(lit.dim===0&&lit.spot.key===key&&lit[grow]===0,`${id}: the words come, the report as bright as ever, nothing scaled yet`);
  assert.ok(C.pop>=typedAt(id),`${id}: scale up after the words`);
  const out=d(id,C.landed);
  assert.ok(Math.abs(out[grow]-1)<1e-9&&out.dim===0,`${id}: scaled up, still no dark`);
  for(let t=0;t<S(id).duration-.02;t+=.1){const plan=captionPlan(start(id)+t);assert.ok(plan.center===0&&plan.edge.to==='report'&&plan.edge.from==='report',`${id}: the words stay right of the report (${t.toFixed(1)})`);}
 }
 for(let t=start('web');t<start('conclusion')+CONCLUSION.out;t+=.1)assert.equal(devicesAt(t).dim,0,`the report is never darkened (${t.toFixed(1)})`);
 // chapter 21: the names fade while the report shows its Date & Time column
 assert.equal(d('timestamp',0).uncrop,0);assert.equal(d('timestamp',TIMESTAMP.uncrop).uncrop,1);
 assert.ok(d('timestamp',TIMESTAMP.out).namesOpacity===0&&TIMESTAMP.spot>=TIMESTAMP.uncrop,'the date cells are in view before their spotlight');
 assert.equal(d('conclusion',CONCLUSION.out).uncrop,1);assert.equal(d('conclusion',CONCLUSION.out).datesOpacity,0);
 assert.equal(d('conclusion',CONCLUSION.out).webOpacity,0);
 assert.ok(CONCLUSION.text>=CONCLUSION.out);
});

test('a clip of one chapter starts clean: the previous art has gone when it begins, and the hand is not late',()=>{
 const d=id=>devicesAt(start(id)+CLIP_SKIP[id]);
 assert.ok(d('instructions').tabletOpacity*d('instructions').tabletIn===0,'the tablet is gone when the mission begins');
 assert.equal(d('emphasis').missionOpacity,0,'the mission is gone when the board begins');
 assert.equal(d('web').boardOpacity,0,'the board is gone when the report begins');
 assert.equal(d('visibility').iso,0,'the lone mission is back in the tablet when the proofs begin');
 assert.equal(d('timestamp').namesOpacity,0,'the names are gone when the dates begin');
 assert.equal(d('conclusion').webOpacity,0,'the report is gone when the closing words begin');
 for(const [id,skip] of Object.entries(CLIP_SKIP)){
  assert.ok(skip>0&&skip<S(id).duration/2,id);
  if(stops(id)[0])assert.ok(stops(id)[0].ring>=skip-1e-9,`${id}: the hand would already be on its way before the clip starts`);
 }
 // chapters that carry on with the same art need no skip
 for(const id of ['alerts','links','translation','steps','micro','photo','video','rate','peer'])assert.equal(CLIP_SKIP[id],undefined,id);
});

test('chapter 7: one answer after another in one spot; after each the list scrolls up one question, before the next click',()=>{
 assert.deepEqual(STEPS.scrollAts.map((_,i)=>missionScrollAt(start('steps')+STEPS.scrollAts[i]+MOTION.swipe+.01).to),['yes-0','yes-1','yes-2']);
 STEPS.presses.forEach((press,i)=>{
  assert.ok(STEPS.scrollAts[i]+MOTION.swipe<=press-HAND.arrive+1e-9,`answer ${i+1}: the list is in place before the hand lands`);
  if(i)assert.ok(STEPS.scrollAts[i]>=STEPS.presses[i-1],`answer ${i+1}: it scrolls after the answer before`);
 });
 // the hand does not fly between answers: same target
 const list=stops('steps');
 list.slice(1).forEach((s,i)=>assert.equal(s.target,list[i].target));
 // and the hand stays on screen between them
 for(let i=1;i<3;i++)assert.ok(at('steps',STEPS.presses[i-1]+.5).hand.opacity>.99,`between answers ${i} and ${i+1}`);
 assert.deepEqual([STEPS.presses[0]-.01,...STEPS.presses.map(p=>p+.01)].map(x=>at('steps',x).steps),[0,1,2,3]);
});

test('the hand is for actions; what is only shown gets a thick yellow rectangle, never a hand',()=>{
 const pose=(id,t)=>handPose(stops(id),t);
 // clicks and scrolls keep the hand
 for(const id of ['knowledge','translation','steps','micro','photo','video','rate','visibility','mobile','tour','web','remote'])assert.ok(pose(id,stops(id)[0].press).opacity>.99,`${id}: the hand does it`);
 for(const id of ['knowledge','translation','steps','photo','web','mobile'])assert.deepEqual(marksOf(stops(id)),[],`${id}: nothing is marked where the hand acts`);
 // an alert, a link, the proof block, the ratings, who performed, when: no hand at any moment, a mark instead
 for(const id of ['instructions','alerts','links','capture','peer','performer','timestamp']){
  const list=stops(id),marks=marksOf(list);
  for(const s of list)for(const t of [s.ring,s.ring+.2,s.press,s.press+.3,s.press+2])assert.equal(pose(id,t).opacity,0,`${id}: no hand at ${t.toFixed(2)}`);
  if(id==='peer'){assert.equal(marks.length,0,'the peers ratings: the drawn bracket points at them, no rectangle');continue;}
  assert.ok(marks.length>=1,`${id} is marked`);
  for(const m of marks)assert.ok(markOpacity(m,m.from+.31)>.99&&markOpacity(m,m.from-.01)===0,`${id}: ${m.target}`);
 }
 assert.deepEqual(marksOf(stops('alerts')).map(m=>m.target),['alert']);assert.deepEqual(marksOf(stops('links')).map(m=>m.target),['link']);
 // who performed / when: each of the two cells, until they scale up out of the report
 assert.deepEqual(marksOf(stops('performer')).map(m=>[m.target,m.until]),[['performers-0',PERFORMER.pop],['performers-1',PERFORMER.pop]]);
 assert.deepEqual(marksOf(stops('timestamp')).map(m=>m.target),['dates-0','dates-1']);
 const gone=marksOf(stops('performer'))[0];
 assert.ok(markOpacity(gone,PERFORMER.pop)===1&&markOpacity(gone,PERFORMER.pop+.31)===0,'the mark leaves as the cells scale up');
 // the mark is there before the bubble comes out of it
 for(const id of ['alerts','links','capture'])assert.ok(marksOf(stops(id))[0].from+.3<=SAY[id]+1e-9,`${id}: marked, then the bubble`);
});

test('the report scenes use the frame: the report is big, the words keep the right',()=>{
 const R=LAYOUT.report,s=reportScale(),room=138;// (138: what a speech bubble needs beyond plain words, see bubbleRoom)
 const W=reportWindow(room),right=R.left+W*s;
 assert.ok(s>=1,'the report is shown at least at its own size');
 assert.ok(R.top>=LAYOUT.margin&&R.top+R.height*s<=900-LAYOUT.margin,'it fits between the top and the bottom');
 assert.ok(R.height*s>=.84*900&&right-R.left>=.66*1600,'and fills most of the frame');
 assert.ok(1600-right>=LAYOUT.wordsGap+R.words+room+LAYOUT.margin-1e-6,'the words keep their room on the right');
 // what each scene is about is inside the window (measured in the report's own px)
 assert.ok(1058<=W,'Gallery View (x 957-1058) shows in chapters 18-20');
 assert.ok(450<=W,'the performers (x 395-450) too');
 assert.ok(1381>=R.page-W&&1521<=R.page,'the dates (x 1381-1521) show once it has slid over (chapter 21)');
 assert.ok(reportWindow(0)>W&&reportWindow(9999)>0);
 // who performed / when: the words are a plain bubble right of the report, the cells are marked in it
 assert.ok(!ACTING.has('performer')&&!ACTING.has('timestamp'),'only shown: no tail');
 for(const id of ['web','remote','performer','timestamp'])assert.equal(captionPlan(start(id)+1).edge.to,'report',id);
});
