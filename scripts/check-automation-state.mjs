import assert from 'node:assert/strict';
import { BOARD_ACTION_DURATION, BOARD_PHASES, SCENE } from '../lib/demoNarration.mjs';
import { automationState, BOARD_ACTIONS, DEMO_LENGTH, TIME_SKIP, PRIORITY_BOOST, demoColumnMissions, missionTimers, simulatedTime, ENGAGED_CLOCK_RATE } from '../lib/automationState.mjs';
const missions = [0,1,2].map(i=>({id:String(i),entryFields:[['a'],['b']]}));
const people = ['123456','456456','789789','248135','963852'].map((code,i)=>({code,name:`Person ${i}`,src:`/avatars/${i}.png`}));
const at = time=>automationState(time,missions,people);
const [first, second, close] = BOARD_ACTIONS;
assert.deepEqual(missionTimers(0,0),{ageSeconds:0,executionSeconds:0});
assert.deepEqual(missionTimers(620,0,620),{ageSeconds:620,executionSeconds:0});
assert.deepEqual(missionTimers(1220,0,620),{ageSeconds:1220,executionSeconds:600});
assert.deepEqual(missionTimers(5000,0,620,1220),{ageSeconds:1220,executionSeconds:600});
assert.ok(BOARD_PHASES.codeIn > BOARD_PHASES.approach, 'Let the avatar settle before showing the code');
assert.ok(BOARD_PHASES.typing > BOARD_PHASES.codeIn + .12, 'Start typing after the code panel appears');
assert.ok(BOARD_PHASES.codeHidden < BOARD_PHASES.transfer, 'Hide the code completely before moving the mission or avatar');
assert.deepEqual(at(first.arrive).missions.map(m=>m.status),['claimed','open','open']);
assert.deepEqual(at(second.arrive).missions.map(m=>m.status),['claimed','claimed','open']);
assert.deepEqual(at(close.arrive).missions.map(m=>m.status),['claimed','closed','open']);
assert.equal(at(first.arrive).missions[0].performerAvatar,people[0].src);
assert.equal(at(second.arrive).missions[1].performerAvatar,people[1].src);
assert.deepEqual(demoColumnMissions(at(second.arrive).missions,'claimed').map(m=>m.id),['1','0']);
assert.deepEqual(demoColumnMissions(at(second.start+.5).missions,'open').map(m=>m.id),['1','2']);
for (const mission of [0,1,2]) {
  assert.equal(at(TIME_SKIP.start).missions[mission].demoTimeOffset,0);
  assert.ok(Math.abs(at((TIME_SKIP.start+TIME_SKIP.end)/2).missions[mission].demoTimeOffset-1800)<1e-7);
  assert.equal(at(TIME_SKIP.end).missions[mission].demoTimeOffset,3600);
  const closingAction = BOARD_ACTIONS.find(a=>a.mission===mission&&a.to==='closed');
  assert.equal(at(DEMO_LENGTH).missions[mission].demoTimeOffset, at(closingAction.end).missions[mission].demoTimeOffset, 'Closed timers stay frozen through later time skips');
}
assert.equal(at(TIME_SKIP.start).missions[1].timerColor,'rgb(0 122 51)');
assert.equal(at(TIME_SKIP.end).missions[1].timerColor,'rgb(191 75 0)');
assert.equal(at(TIME_SKIP.end).missions[0].timerColor,undefined);
assert.equal(at(TIME_SKIP.end).missions[2].timerColor,undefined);
const closing = BOARD_ACTIONS.find(a=>a.to==='closed');
assert.equal(demoColumnMissions(at(closing.start).missions,'claimed')[0].id,missions[closing.mission].id);
const completed = at(DEMO_LENGTH).missions[closing.mission];
assert.ok(Math.abs(completed.stopped + completed.demoTimeOffset - completed.started - (3600 + close.confirm - second.confirm)) < 1e-7);
for (const action of BOARD_ACTIONS.filter(action=>!action.direct)) {
  assert.ok(Math.abs(action.end-action.start-BOARD_ACTION_DURATION)<1e-7);
  assert.ok(action.arrive > action.confirm && action.end > action.arrive);
  assert.equal(at(action.arrive).action, action);
  assert.equal(at(action.start+BOARD_PHASES.codeIn-.001).showCode,false);
  assert.equal(at(action.start+BOARD_PHASES.codeIn+.001).showCode,true);
  for(let digit=1;digit<=6;digit++) {
    const frame=at(action.start+BOARD_PHASES.typing+(digit-1)*.21+.001);
    assert.equal(frame.code,people[action.person].code.slice(0,digit));
    assert.equal(frame.activeDigit,digit-1);
    assert.equal(frame.activeKey,people[action.person].code[digit-1]);
  }
  assert.equal(at(action.confirm).showCode,false);
  assert.equal(at(action.start+BOARD_PHASES.approach).showCode,false);
  assert.equal(at(action.start+BOARD_PHASES.codeHidden+.001).showCode,false);
  assert.notEqual(at(action.end).action,action);
}
assert.ok(Math.abs(first.end-second.start)<1e-7);
assert.ok(Math.abs(second.end-TIME_SKIP.start)<1e-7);
assert.equal(TIME_SKIP.end,close.start);
for (const time of [TIME_SKIP.start, (TIME_SKIP.start+TIME_SKIP.end)/2, TIME_SKIP.end]) {
  assert.equal(at(time).showCode,false,'Keep the closing code hidden during the one-hour animation');
  assert.equal(at(time).missions[closing.mission].status,'claimed');
}
assert.equal(at(close.start+BOARD_PHASES.codeIn+.001).showCode,true);
const snapshot=at(first.start+1.1);
at(close.arrive);
assert.deepEqual(at(first.start+1.1),snapshot);
for(const time of [0,...BOARD_ACTIONS.flatMap(a=>[a.start,a.start+.8,a.confirm,a.arrive,a.end]),DEMO_LENGTH]) {
  assert.equal(at(time).selected,null);
  assert.equal(at(time).codeOpen,false);
}
assert.deepEqual(at(0).missions.map(m=>m.status),['open','open','open']);
assert.equal(at(close.arrive).missions[closing.mission].stopped,completed.stopped);
console.log('Demo state checks passed: shared one-hour fast-forward, top claim closes, only closing timer turns orange, seeking and frozen completion.');
const extended = Array.from({length:7}, (_, i) => ({id:String(i), ...(i>=5 ? {appearsAt:BOARD_ACTIONS[i===5?4:6].end} : {})}));
const finalBoard = automationState(DEMO_LENGTH,extended,people);
const priorityTemplates = extended.map((m,i)=>({...m,id:i===6?'new-restock':m.id}));
const priorityAt = time => automationState(time,priorityTemplates,people);
assert.deepEqual(demoColumnMissions(priorityAt(PRIORITY_BOOST.highlight).missions,'open').map(m=>m.id),['5','new-restock']);
assert.equal(priorityAt(PRIORITY_BOOST.highlight).missions.at(-1).highlighted,true);
assert.deepEqual(demoColumnMissions(priorityAt(PRIORITY_BOOST.move).missions,'open').map(m=>m.id),['new-restock','5']);
assert.equal(priorityAt(PRIORITY_BOOST.move-.01).missions.at(-1).boosted,false,'Backward seeking restores the original order');
const timerColors = new Set(['rgb(0 122 51)','rgb(191 75 0)','rgb(189 31 89)']);
for (let time=TIME_SKIP.start;time<SCENE['urgency-priority'].end;time+=.017) {
  for (const mission of priorityAt(time).missions) {
    if (mission.timerColor) assert.ok(timerColors.has(mission.timerColor),'Timer colors must snap, never interpolate');
  }
}
for(const claim of BOARD_ACTIONS.filter(a=>a.to==='claimed')) {
  assert.equal(automationState(claim.confirm,extended,people).missions[claim.mission].executionSeconds,0,'Execution starts at zero on every claim');
}
for(const closure of BOARD_ACTIONS.filter(a=>a.to==='closed')) {
  const frozen=automationState(closure.confirm,extended,people).missions[closure.mission];
  const final=finalBoard.missions[closure.mission];
  assert.equal(final.executionSeconds,frozen.executionSeconds);
  assert.equal(final.ageSeconds,frozen.ageSeconds);
}
for(const action of BOARD_ACTIONS.filter(a=>a.direct)) {
  assert.ok(Math.abs(simulatedTime(action.start+.2)-simulatedTime(action.start+.1)-ENGAGED_CLOCK_RATE*.1)<1e-6,'Time accelerates during both claiming and closing');
}
assert.ok(Math.abs(simulatedTime(BOARD_ACTIONS.at(-1).confirm+1)-simulatedTime(BOARD_ACTIONS.at(-1).confirm)-1)<1e-6,'Return to normal speed after the last claim');
assert.equal(finalBoard.missions[0].status,'closed','The orange teammate closes Inventory Audit');
assert.equal(finalBoard.missions[4].status,'claimed');
assert.equal(finalBoard.missions.filter(m=>m.status==='closed').length,4);
assert.equal(finalBoard.missions.filter(m=>m.status==='claimed').length,1);
assert.equal(finalBoard.missions.filter(m=>m.status==='open').length,2);
assert.equal(automationState(0,extended,people).missions.length,5);
for(const action of BOARD_ACTIONS.slice(3)) {
  if(action.to==='closed') {
    const start=automationState(action.start,extended,people);
    const middle=automationState(action.start+.325,extended,people);
    const ready=automationState(action.start+.65,extended,people);
    assert.equal(ready.missions[action.mission].status,'claimed');
    assert.equal(ready.missions[action.mission].timerColor,'rgb(191 75 0)');
    assert.ok(middle.missions[action.mission].demoTimeOffset > start.missions[action.mission].demoTimeOffset);
    assert.ok(ready.missions[action.mission].demoTimeOffset > middle.missions[action.mission].demoTimeOffset);
  }
  for(const offset of [0,.3,.6,.9]) {
    const frame=automationState(action.start+offset,extended,people);
    assert.equal(frame.showCode,false);
    assert.equal(frame.code,'');
  }
  const before=automationState(action.start,extended,people);
  assert.equal(before.missions[action.mission].status,action.from);
  const after=automationState(action.end,extended,people);
  assert.equal(after.missions[action.mission].status,action.to);
}
