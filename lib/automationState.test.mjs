import test from 'node:test';
import assert from 'node:assert/strict';
import { avatarRailAt, automationState, demoColumnMissions } from './automationState.mjs';
import { STORY_ACTIONS, STORY_MISSIONS, STORY_PEOPLE, STORY_OPEN_ORDER, STORY_LENGTH, STORY, CYCLE_START, CYCLE_END, CYCLE_ACTIONS, CYCLE_MISSIONS, CYCLE_SPEED, storyBoardTime, storyMotionProgress, storyMissionTimers, storyEventTime, PRIORITY_PHASES } from './efficiencyStory.mjs';
import {lineLetterProgress,LINE_REVEAL_DURATION,LINE_PAUSE,LINE_START} from './efficiencyCaptions.mjs';

test('green claim starts from the settled rail after the preceding close', () => {
  const claim = STORY_ACTIONS.find(action => action.person === 4);
  const close = STORY_ACTIONS.find(action => action.person === 3 && action.to === 'closed');
  const settled = [...avatarRailAt(close.start, 5, STORY_ACTIONS), close.person];
  assert.deepEqual(settled, [4, 1, 0, 2, 3]);
  assert.deepEqual(avatarRailAt(claim.start, 5, STORY_ACTIONS), settled);
  assert.deepEqual(avatarRailAt(claim.start + .001, 5, STORY_ACTIONS), settled);
});

test('returned avatars stay off the rail until the close actually finishes', () => {
  for (const close of STORY_ACTIONS.filter(action => action.to === 'closed')) {
    assert.equal(avatarRailAt(close.end - .001, 5, STORY_ACTIONS).includes(close.person), false);
    assert.equal(avatarRailAt(close.end, 5, STORY_ACTIONS).includes(close.person), true);
  }
});

test('the code claims take Safety Check, then Inventory Check from the top row', () => {
  const claims=STORY_ACTIONS.filter(a=>a.to==='claimed'&&!a.direct);
  assert.deepEqual(claims.map(a=>STORY_MISSIONS[a.mission].title),['Safety Check','Inventory Check']);
  for(const claim of claims){
    const state=automationState(claim.confirm-.001,STORY_MISSIONS,STORY_PEOPLE,STORY_ACTIONS);
    const open=demoColumnMissions(state.missions.map(m=>({...m,openOrder:STORY_OPEN_ORDER.indexOf(m.id)})),'open');
    assert.equal(open[0].id,STORY_MISSIONS[claim.mission].id);
  }
});

test('the first three waiting performers claim in rail order',()=>{
  for(const action of CYCLE_ACTIONS.filter(a=>a.to==='claimed')){
    assert.equal(avatarRailAt(action.start,5,CYCLE_ACTIONS)[0],action.person);
  }
  assert.deepEqual(CYCLE_ACTIONS.filter(a=>a.to==='claimed').map(a=>a.person),[0,1,2]);
});

test('active mission timers advance together and freeze only upon completion',()=>{
  for(const time of [STORY.urgency.motionAt,STORY.priority.motionAt,STORY.priority.motionAt+PRIORITY_PHASES.red]){
    const changes=STORY_MISSIONS.slice(0,4).map((m,i)=>storyMissionTimers(time+.25,m,i,STORY_ACTIONS).ageSeconds-storyMissionTimers(time,m,i,STORY_ACTIONS).ageSeconds);
    assert.ok(changes.every(delta=>Math.abs(delta-30)<1e-6));
  }
  for(const action of CYCLE_ACTIONS.filter(a=>a.to==='closed')){
    const time=storyEventTime(action.confirm,true),i=action.mission,m=STORY_MISSIONS[i];
    const timer=t=>storyMissionTimers(t,m,i,CYCLE_ACTIONS,true);
    assert.ok(timer(time-.1).ageSeconds<timer(time).ageSeconds);
    assert.deepEqual(timer(time),timer(time+.5));
  }
});

test('every mission transfer gets 1.05 seconds and claim landings get 0.85 seconds', () => {
  const screenTime=(boardTime,cycle)=>{
    let low=cycle?STORY.initiative.motionAt:0,high=cycle?STORY_LENGTH:STORY.initiative.start;
    for(let i=0;i<60;i++){
      const mid=(low+high)/2;
      if(storyBoardTime(mid)<boardTime)low=mid;else high=mid;
    }
    return high;
  };
  for(const action of [...STORY_ACTIONS.filter(a=>a.start<CYCLE_START),...CYCLE_ACTIONS]){
    const cycle=CYCLE_ACTIONS.includes(action);
    const speed=CYCLE_SPEED;
    assert.ok(Math.abs(screenTime(action.arrive,cycle)-screenTime(action.confirm,cycle)-1.05/speed)<1e-6);
    if(action.to==='claimed')assert.ok(Math.abs(screenTime(action.end,cycle)-screenTime(action.arrive,cycle)-.85/speed)<1e-6);
  }
});

test('the initiative cycle adds a mission on first claim and stops at 2 open, 1 claimed, 2 closed',()=>{
  const templates=CYCLE_MISSIONS;
  const before=automationState(CYCLE_START-.01,templates,STORY_PEOPLE,CYCLE_ACTIONS);
  assert.deepEqual(before.missions.map(m=>m.status),Array(4).fill('open'));
  const after=automationState(CYCLE_END,templates,STORY_PEOPLE,CYCLE_ACTIONS);
  const added=automationState(CYCLE_ACTIONS[0].confirm,templates,STORY_PEOPLE,CYCLE_ACTIONS);
  assert.equal(added.missions.length,5);
  assert.equal(added.missions.find(m=>m.id==='cycle-new').status,'open');
  assert.deepEqual(['open','claimed','closed'].map(status=>after.missions.filter(m=>m.status===status).length),[2,1,2]);
  assert.equal(after.action,null);
  assert.equal(avatarRailAt(CYCLE_END,5,CYCLE_ACTIONS).length,4);
  assert.equal(storyBoardTime(STORY.reminder.start),CYCLE_END);
  assert.equal(storyBoardTime(STORY.conclusion.start-.1),CYCLE_END);
});

test('caption lines decelerate, hold, then reveal the next line',()=>{
  const length=40;
  const revealed=t=>Array.from({length},(_,i)=>lineLetterProgress(t,0,i,length)).reduce((a,b)=>a+b,0);
  assert.ok(revealed(.3)-revealed(.1)>revealed(.7)-revealed(.5));
  const hold=LINE_START+LINE_REVEAL_DURATION+LINE_PAUSE/2;
  assert.equal(lineLetterProgress(hold,0,length-1,length),1);
  assert.equal(lineLetterProgress(hold,1,0,length),0);
  assert.equal(lineLetterProgress(2,1,length-1,length),1);
});

test('gray avatar return has no speed jump when the mission arrives',()=>{
  const action=STORY_ACTIONS.find(a=>a.person===1&&a.to==='closed');
  let low=STORY.close.motionAt,high=STORY.execution.start;
  for(let i=0;i<60;i++){
    const mid=(low+high)/2;
    if(storyBoardTime(mid)<action.arrive)low=mid;else high=mid;
  }
  const progress=t=>storyMotionProgress(storyBoardTime(t),action.confirm,action.end,STORY_ACTIONS);
  const before=progress(high)-progress(high-.005);
  const after=progress(high+.005)-progress(high);
  assert.ok(Math.abs(before-after)<1e-8);
});
