import test from 'node:test';
import assert from 'node:assert/strict';
import {EFFICIENCY_STORY as ORIGINAL,CYCLE_ACTIONS as ORIGINAL_LOOP} from './efficiencyStory.mjs';
import {automationState} from './automationState.mjs';
import {TIMING} from './demoNarration.mjs';
import {HAND} from './demoHand.mjs';
import {EFFICIENCY_STORY,STORY_LENGTH,MOTION,TEXT_AT,SAY,HAND_STOPS,CLIP_SKIP,PEOPLE,BOARD_TEMPLATES,CYCLE_MISSIONS,CYCLE_ACTIONS,FIRST_ACTIONS,efficiencyFrame,boardAt,boardTimers,devicesAt,teamPose,captionPlan,SCHEDULE,POINTS,URGENCY,PRIORITY,SHARED,CODE,CLAIM,CLOSE,EXECUTION,INDIVIDUALS,TEAMS,INITIATIVE,CONCLUSION} from './efficiencyV2Story.mjs';

const S=id=>EFFICIENCY_STORY.find(s=>s.id===id);
const start=id=>S(id).start;
const typedAt=id=>TEXT_AT[id]+S(id).ready;
const frameAt=(id,t)=>efficiencyFrame(start(id)+t);
const words=text=>text.split(/\s+/).join(' ');
const stops=id=>HAND_STOPS[id]??[];
const TITLES=['opening','conclusion'];
// The board the original choreography shows at film time `time`.
const boardState=time=>{const b=boardAt(time);const s=automationState(b.t,b.cycle?CYCLE_MISSIONS:BOARD_TEMPLATES,PEOPLE,b.actions);s.missions=boardTimers(time,s.missions,b.cycle);return s;};
const status=(time,id)=>boardState(time).missions.find(m=>m.id===id)?.status;

test('the CEO order, with the original words in short lines',()=>{
 assert.deepEqual(EFFICIENCY_STORY.map(s=>s.id),['opening','schedule','points','urgency','priority','shared','code','claim','close','execution','performers','reminder','individuals','teams','initiative','conclusion']);
 const original=Object.fromEntries(ORIGINAL.map(s=>[s.id,words(s.text)]));
 assert.deepEqual(Object.keys(original).sort(),EFFICIENCY_STORY.map(s=>s.id).sort(),'the same chapters');
 for(const s of EFFICIENCY_STORY){
  assert.equal(words(s.text),original[s.id],`${s.id}: the words changed`);
  // a compact rectangle: no long line, lines about the same length
  const lengths=s.text.split('\n').map(l=>l.length);
  assert.ok(Math.max(...lengths)<=28,`${s.id}: a line is too long`);
  assert.ok(Math.max(...lengths)<=2*Math.min(...lengths),`${s.id}: lines too uneven (${lengths})`);
 }
 EFFICIENCY_STORY.forEach((s,i)=>assert.equal(s.start,i?EFFICIENCY_STORY[i-1].end:0));
 assert.equal(STORY_LENGTH,EFFICIENCY_STORY.at(-1).end);
});

test('click first, then the bubble, then the words: nothing waits for the words',()=>{
 for(const s of EFFICIENCY_STORY.filter(x=>!TITLES.includes(x.id))){
  const [first]=stops(s.id);
  assert.ok(first,`${s.id} has no hand`);
  assert.ok(Math.abs(SAY[s.id]-first.press-HAND.say)<1e-9,`${s.id}: the bubble comes out of the first click`);
  assert.ok(Math.abs(TEXT_AT[s.id]-SAY[s.id]-HAND.textLag)<1e-9,`${s.id}: the words start ${HAND.textLag}s after the bubble`);
  assert.ok(first.ring>=0&&first.ring<=2.2,`${s.id}: the hand is on its way once the art is there`);
  assert.ok(s.duration-typedAt(s.id)>=.9,`${s.id}: too little time to read`);
 }
 for(const id of TITLES)assert.equal(SAY[id],undefined,`${id} is words on a clean screen, no bubble`);
 // what the click does follows it, not the words
 assert.ok(POINTS.pops[0]===POINTS.taps[0].press&&POINTS.pops[1]===POINTS.taps[1].press,'points grow as the hand clicks them');
 assert.ok(URGENCY.orange>=URGENCY.point.press&&URGENCY.orange<typedAt('urgency'),'the timer turns while the words type');
 assert.ok(PRIORITY.move>=PRIORITY.point.press&&PRIORITY.move<typedAt('priority')+1);
 assert.ok(SCHEDULE.pops[0]<=.2,'the missions pop in from the start');
 assert.ok(SHARED.point.press>=SHARED.landed-.4,'the hand clicks the tablet as it lands');
 // the choreography holds still until the hand has clicked
 assert.equal(boardAt(start('code')+CODE.go-.01).t,TIMING.claim-.1);
 assert.equal(boardAt(start('claim')+CLAIM.go-.01).t,CLAIM.from);
 assert.equal(boardAt(start('close')+CLOSE.go-.01).t,CLOSE.from-.01);
 assert.equal(boardAt(start('initiative')+INITIATIVE.go-.01).t,INITIATIVE.rest);
 for(const C of [CODE,CLAIM,CLOSE,INITIATIVE])assert.ok(C.go>C.point.press,'the choreography starts after the click');
 assert.ok(INDIVIDUALS.phones<1&&TEAMS.board<1&&EXECUTION.lift===0,'the art comes first');
});

test('the hand: a flight, then a click, stop after stop; it steps aside while the original choreography plays',()=>{
 for(const s of EFFICIENCY_STORY.filter(x=>!TITLES.includes(x.id))){
  const list=stops(s.id);
  list.forEach((stop,i)=>{
   const flight=stop.press-stop.ring;
   assert.ok(flight>=HAND.hop-1e-9&&flight<=HAND.travel+1e-9,`${s.id}: ${stop.target} flight ${flight.toFixed(2)}`);
   if(i)assert.ok(stop.ring>=list[i-1].press-1e-9,`${s.id}: ${stop.target} leaves before the last click`);
  });
 }
 // nothing is clicked for real here, so the hand only points
 for(const s of EFFICIENCY_STORY.filter(x=>!TITLES.includes(x.id)))for(const stop of stops(s.id))assert.equal(stop.kind,'point',`${s.id}: ${stop.target}`);
 assert.deepEqual(stops('points').map(x=>x.target),['points-inv','points-ord']);
 assert.deepEqual(stops('execution').map(x=>x.target),['exec-sig','exec-front']);
 assert.deepEqual(stops('performers').map(x=>x.target),['who-sig','who-front']);
 // the words stay level with the mission and still: same target all chapter
 for(const id of ['code','claim','close'])assert.deepEqual(stops(id).map(x=>x.target),['board-sig'],id);
 for(const [id,C] of [['code',CODE],['claim',CLAIM],['close',CLOSE],['initiative',INITIATIVE]]){
  assert.ok(frameAt(id,C.point.press+.2).hand.opacity>.99,`${id}: the hand is on the mission`);
  assert.equal(frameAt(id,C.point.press+1.1).hand.opacity,0,`${id}: the hand has stepped aside`);
 }
 assert.equal(frameAt('opening',1).hand,null);assert.equal(frameAt('conclusion',1).hand,null);
});

test('chapters 2-5: the missions by themselves, each with its schedule; points, colors, the critical one to the top',()=>{
 const f=t=>frameAt('schedule',t);
 assert.deepEqual(SCHEDULE.pops.map(t=>f(t-.01).cardIn.filter(v=>v>0).length),[0,1,2,3],'one by one');
 assert.ok(f(SCHEDULE.landed).scheduleIn.every(v=>v>.99));
 assert.ok(SCHEDULE.recenter>=typedAt('schedule'),'the column stays until the words are read');
 assert.deepEqual(frameAt('points',POINTS.pops[0]-.01).points,[10,15,20,15]);
 assert.deepEqual(frameAt('points',POINTS.pops[1]+.1).points,[20,25,20,15]);
 const color=(id,t)=>frameAt(id,t).cards.find(m=>m.id===(id==='urgency'?'inv':'sig')).timerColor;
 assert.deepEqual([URGENCY.orange-.01,URGENCY.orange+.01,URGENCY.red+.01].map(t=>color('urgency',t)),['#007a33','#bf4b00','#bd1f59'],'colors snap');
 assert.deepEqual(frameAt('priority',PRIORITY.move+MOTION.move).slots,{inv:1,ord:2,sig:0,prep:3},'the critical mission on top');
 assert.deepEqual(stops('priority').map(x=>x.target),['card-sig'],'the hand clicks it');
 for(const s of EFFICIENCY_STORY.filter(x=>!TITLES.includes(x.id)))for(const t of [0,1,s.duration-.1])assert.equal(captionPlan(start(s.id)+t).center,0,`${s.id}: the words are never centered`);
 for(let t=start('schedule');t<start('shared');t+=.1)assert.equal(devicesAt(t).tablet,0,`a device at ${t.toFixed(1)}`);
});

test('chapter 6: the team in the middle; the tablet drops; people to the rail; the hand clicks the tablet',()=>{
 const p=(t,i)=>teamPose(start('shared')+t,i);
 assert.ok(p(SHARED.drop-.01,2).opacity>.99&&p(SHARED.drop-.01,2).travel===0,'in a row in the middle');
 assert.equal(p(SHARED.drop+SHARED.travel+.4,4).travel,1,'on the rail');
 assert.equal(teamPose(start('code'),0),null,'then the choreography has them');
 assert.equal(devicesAt(start('shared')+SHARED.drop-.01).tablet,0);assert.ok(devicesAt(start('shared')+SHARED.landed).tablet>.99);
 assert.deepEqual(stops('shared').map(x=>x.target),['tablet-top']);
});

test('chapters 7-9: the original choreography, one code-assisted claim and one close; timers in real time',()=>{
 assert.equal(FIRST_ACTIONS.length,2);
 assert.ok(FIRST_ACTIONS.every(a=>a.person===0&&a.mission===2&&!a.direct),'Adam, the critical mission, with his code');
 assert.equal(BOARD_TEMPLATES[2].id,'sig');
 // the board clock only moves forward through claim and close
 let last=-Infinity;
 for(let t=start('code');t<start('execution');t+=.05){const b=boardAt(t).t;assert.ok(b>=last-1e-9,`back at ${t.toFixed(2)}`);last=b;}
 assert.ok(boardState(start('code')+CODE.keypad+.6).showCode,'the small personal code while he types');
 assert.equal(status(start('claim')-.01,'sig'),'open');
 assert.equal(status(start('close')-.01,'sig'),'claimed');
 assert.equal(status(start('execution')-.01,'sig'),'closed');
 assert.ok(boardState(start('close')+CLOSE.keypad+.6).showCode&&boardState(start('close')+CLOSE.keypad+.6).action.to==='closed','closing uses the code too');
 const sig=t=>boardState(t).missions.find(m=>m.id==='sig');
 const t1=start('close')+CLOSE.go+.2;assert.ok(Math.abs(sig(t1+1).executionSeconds-sig(t1).executionSeconds-1)<1e-9,'real time');
 const t2=start('execution')+.5;assert.equal(sig(t2).executionSeconds,sig(t2+1).executionSeconds,'frozen once closed');
 // the words stay level with the mission and beside the tablet; they never follow the keypad
 for(const id of ['code','claim','close'])for(let t=0;t<S(id).duration-.02;t+=.1){const plan=captionPlan(start(id)+t);assert.ok(plan.edge.from==='tablet'&&plan.edge.to==='tablet',`${id}: the words move at ${t.toFixed(1)}`);}
 // no other action in 7-9
 for(let t=start('code');t<start('execution');t+=.1){const a=boardState(t).action;if(a)assert.ok(a.person===0&&a.mission===2);}
});

test('chapters 10-12: the tablet goes, the two closed missions are lifted out; the hand clicks their times, then their names',()=>{
 const d=(id,t)=>devicesAt(start(id)+t);
 assert.equal(d('execution',0).lift,0);assert.equal(d('execution',MOTION.lift).lift,1);assert.equal(d('execution',MOTION.lift).tablet,0);
 assert.ok(EXECUTION.taps[0].press>=MOTION.lift-.4+HAND.hop,'the hand clicks once they are lifted out');
 for(const id of ['performers','reminder'])assert.ok(d(id,1).iso===1&&d(id,1).tablet===0,id);
 assert.equal(d('teams',0).iso,0);
 for(const id of ['execution','performers','reminder'])assert.equal(captionPlan(start(id)+.5).edge.to,'iso');
});

test('chapters 13-16: personal boards, then the team board and the original loop of people claiming',()=>{
 assert.ok(efficiencyFrame(start('individuals')+INDIVIDUALS.phones+MOTION.enter).phones>.99);
 assert.deepEqual(frameAt('individuals',S('individuals').duration-.1).phoneMissions,[3,2,3]);
 assert.ok(devicesAt(start('teams')+TEAMS.board+MOTION.enter).tablet>.99);
 assert.equal(CYCLE_ACTIONS,ORIGINAL_LOOP,'the loop is the original');
 assert.equal(boardAt(start('teams')+1).t,INITIATIVE.rest,'everyone on the rail until the hand has clicked');
 assert.equal(boardAt(start('initiative')+INITIATIVE.go+INITIATIVE.run+.01).t,INITIATIVE.to,'the whole loop plays');
 const final=boardState(start('conclusion')-.01).missions;
 assert.deepEqual(CYCLE_ACTIONS.filter(a=>a.to==='claimed').map(a=>final[a.mission].status!=='open'),[true,true,true]);
 for(const id of ['teams','initiative'])assert.equal(captionPlan(start(id)+S(id).duration-.1).edge.to,'tablet','words right of the tablet');
 assert.equal(devicesAt(start('conclusion')+CONCLUSION.out).tablet,0);
});

test('a clip of one chapter starts clean: the previous art has gone when it begins, and the hand is not late',()=>{
 const d=id=>devicesAt(start(id)+CLIP_SKIP[id]);
 assert.equal(d('shared').cards,0,'the missions are gone when the tablet comes in');
 assert.equal(d('execution').tablet,0,'the tablet is gone when the two missions are lifted out');
 assert.equal(d('individuals').iso,0,'the lifted missions are gone when the phones come in');
 assert.equal(frameAt('teams',CLIP_SKIP.teams).phones,0,'the phones are gone when the team board comes in');
 assert.equal(d('conclusion').tablet,0,'the tablet is gone when the closing words begin');
 for(const [id,skip] of Object.entries(CLIP_SKIP)){
  assert.ok(skip>0&&skip<S(id).duration/2,id);
  if(stops(id)[0])assert.ok(stops(id)[0].ring>=skip-1e-9,`${id}: the hand would already be on its way before the clip starts`);
 }
});
