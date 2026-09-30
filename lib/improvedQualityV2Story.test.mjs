import test from 'node:test';
import assert from 'node:assert/strict';
import {QUALITY_STORY as ORIGINAL} from './improvedQualityStory.mjs';
import {HAND} from './demoHand.mjs';
import {QUALITY_STORY,QUALITY_STORY_LENGTH,MOTION,TEXT_AT,SAY,HAND_STOPS,CLIP_SKIP,qualityStoryFrame,cameraAt,devicesAt,captionPlan,missionScrollAt,toScreen,CUTS,FOCUS,LAYOUT,KNOWLEDGE,OPEN,TRANSLATION,TRANSLATE_AT,UNTRANSLATE_AT,STEPS,MICRO,PHOTO,VIDEO,EMPHASIS,RATE,RATE_LABELS,PEER,VIS,MOBILE,TOUR,WEB,REMOTE,PERFORMER,TIMESTAMP,CONCLUSION} from './improvedQualityV2Story.mjs';

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

test('click first, then the bubble, then the words: no chapter types before the hand has clicked',()=>{
 for(const s of QUALITY_STORY.filter(x=>!TITLES.includes(x.id))){
  const [first]=stops(s.id);
  assert.ok(first,`${s.id} has no hand`);
  assert.ok(SAY[s.id]>=first.press+HAND.say-1e-9,`${s.id}: the bubble comes out before the click`);
  assert.ok(Math.abs(TEXT_AT[s.id]-SAY[s.id]-HAND.textLag)<1e-9,`${s.id}: the words start ${HAND.textLag}s after the bubble`);
  assert.ok(first.ring>=0&&first.ring<=1.2,`${s.id}: the hand is on its way from the start`);
 }
 // the instructions: the hand first opens the mission, then clicks the instructions, and the bubble comes out of that
 assert.equal(SAY.instructions,stops('instructions')[1].press+HAND.say);
 for(const id of TITLES)assert.equal(SAY[id],undefined,`${id} is words on a clean screen, no bubble`);
 // what moves follows the hand, never the words
 for(const [id,scroll] of [['visibility',VIS.scroll],['mobile',MOBILE.scroll],['tour',TOUR.scroll],['remote',REMOTE.scroll]])assert.ok(scroll[0]>=stops(id)[0].press,`${id} scrolls before the hand has clicked`);
 for(const p of PEER.people)assert.ok(p.at>=stops('peer')[0].press);
 // the mission scrolls on its own before the hand clicks: the hand never scrolls with it
 for(const id of ['steps','micro','capture','video']){
  assert.ok(!stops(id).some(x=>x.kind==='scroll'),`${id}: the hand does not scroll`);
  assert.ok(MOTION.swipe+0.05<=stops(id)[0].press,`${id}: the list has scrolled before the first click`);
 }
 // the hand scrolls only where scrolling through a lot is the point
 for(const id of ['mobile','tour','remote'])assert.deepEqual([stops(id).length,stops(id)[0].kind],[1,'scroll'],id);
 for(const s of QUALITY_STORY)if(!['mobile','tour','remote'].includes(s.id))assert.ok(!stops(s.id).some(x=>x.kind==='scroll'),`${s.id}: no scrolling hand`);
});

test('the hand: stops in order, each a flight then a click; what a click opens follows MOTION.open later',()=>{
 for(const s of QUALITY_STORY.filter(x=>!TITLES.includes(x.id))){
  const list=stops(s.id);
  list.forEach((stop,i)=>{
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
 assert.deepEqual(kinds('instructions'),['click','point']);assert.deepEqual(kinds('photo'),['click']);
 assert.deepEqual(stops('translation').map(x=>x.target),['translate','translate']);
});

test('no idle tails: every chapter ends soon after its last beat, with time to read',()=>{
 const extra={knowledge:KNOWLEDGE.play+KNOWLEDGE.clip,video:VIDEO.playback+MOTION.rec,emphasis:EMPHASIS.iso+MOTION.iso,visibility:VIS.scroll[1],mobile:MOBILE.scroll[1],tour:TOUR.scroll[1],remote:REMOTE.scroll[1],peer:PEER.people[1].at,performer:PERFORMER.landed,timestamp:TIMESTAMP.landed,micro:MICRO.done,rate:RATE.badge,web:WEB.gallery+MOTION.slide};
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
 assert.equal(d('emphasis',EMPHASIS.iso-.01).iso,0);assert.equal(d('emphasis',EMPHASIS.iso+MOTION.iso).iso,1);
 for(const id of ['rate','peer'])assert.ok(d(id,1).iso===1&&d(id,1).boardOpacity===0,id);
 assert.equal(d('visibility',VIS.back).iso,0);assert.ok(d('visibility',VIS.back).boardOpacity>.99);
 const r=t=>at('rate',t).rating;
 assert.equal(r(RATE.open-.01).box,0);assert.ok(r(RATE.open+.6).box>.99);assert.equal(r(RATE.close+MOTION.slideOut+.01).box,0);
 assert.deepEqual([RATE.drag[0]-.1,RATE.drag[1]].map(t=>RATE_LABELS[Math.round(r(t).value)]),['Poor','Excellent']);
 assert.deepEqual(r(RATE.badge+1).ratings.map(x=>[x.initials,x.score]),[['AF',5]]);
 const [ben,carla]=PEER.people,pe=t=>at('peer',t).rating;
 assert.ok(pe(ben.at+.5).bubbles[0].opacity>.99&&pe(ben.at+.5).bubbles[1].opacity===0);
 assert.deepEqual(pe(carla.at+1.5).ratings.map(x=>x.initials),['AF','BR','CM']);
 assert.deepEqual(at('tour',1).rating.bubbles.map(b=>b.opacity),[0,0]);
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
 // each: everything darkens except the two items (spotlight); the words come
 // on their right, level with the middle between them, and never move; then
 // the items themselves scale up
 for(const [id,C,grow,key] of [['performer',PERFORMER,'names','performers'],['timestamp',TIMESTAMP,'dates','dates']]){
  const lit=d(id,C.text);
  assert.ok(lit.dim>.99&&lit.spot.key===key&&lit.spot.open>.99&&lit[grow]===0,`${id}: the words come on the spotlight, nothing scaled yet`);
  assert.ok(C.pop>=typedAt(id),`${id}: scale up after the words`);
  const out=d(id,C.landed);
  assert.ok(Math.abs(out[grow]-1)<1e-9&&out.spot.open<1e-9&&out.dim>.99,`${id}: scaled up, the cells behind dark again`);
  for(let t=0;t<S(id).duration-.02;t+=.1){const plan=captionPlan(start(id)+t);assert.ok(plan.center===0&&plan.edge.to===key&&plan.edge.from===key,`${id}: the words move at ${t.toFixed(1)}`);}
 }
 assert.ok(d('performer',0).dim===0&&d('performer',PERFORMER.point.press).dim>.99,'the dark comes first, then the hand clicks');
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
