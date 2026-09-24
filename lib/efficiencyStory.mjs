import { TIMING } from './demoNarration.mjs';
import { BOARD_ACTIONS } from './automationState.mjs';
import {captionReady} from './efficiencyCaptions.mjs';

// A direct claim waits for the approach and a short grip before transferring.
export const STORY_ACTIONS=BOARD_ACTIONS.map(action=>({
  ...action,
  mission:[2,0,1,3,4][action.mission]??action.mission,
  ...(action.direct&&action.to==='claimed'?{confirm:action.start+1,arrive:action.start+1.4}:{}),
}));
export const STORY_OPEN_ORDER=['sig','inv','ord','prep','temp','follow-up'];
export const PRIORITY_PHASES={orange:0,moveSecond:.65,red:2.1,moveFirst:2.75,moveDuration:1.05};
export const CYCLE_START=TIMING.shared+1.6;
export const CYCLE_ACTIONS=[2,0,1].flatMap((mission,index)=>{
  const person=[0,1,2,3][index];
  const start=CYCLE_START+index*3.2;
  const pair=[
    {person,mission,start,confirm:start+1,arrive:start+1.4,end:start+1.6,from:'open',to:'claimed',direct:true},
    {person,mission,start:start+1.6,confirm:start+2.45,arrive:start+3,end:start+3.2,from:'claimed',to:'closed',direct:true},
  ];
  return index===2?pair.slice(0,1):pair;
});
export const CYCLE_END=CYCLE_ACTIONS.at(-1).end;
export const CYCLE_SPEED=1.2;
export const CYCLE_REVEAL={reset:.5,deviceIn:2.5,ready:4};

// Allow 1.05 seconds for each mission transfer, then 0.85 seconds for the
// performer to settle. The approach and code entry retain their original pace.
function playbackSegments(start,end,actions=STORY_ACTIONS) {
  const boundaries=[start,end,...actions.flatMap(a=>[a.confirm,a.arrive,a.end])]
    .filter(t=>t>=start&&t<=end).sort((a,b)=>a-b);
  return boundaries.slice(1).map((to,i)=>{
    const from=boundaries[i];
    const landing=actions.find(a=>a.to==='claimed'&&(from+to)/2>=a.arrive&&(from+to)/2<a.end);
    const transfer=actions.find(a=>(from+to)/2>=a.confirm&&(from+to)/2<a.arrive);
    return {from,to,duration:(to-from)*(transfer ? 1.05/(transfer.arrive-transfer.confirm) : landing ? .85/(landing.end-landing.arrive) : 1)};
  });
}
const playbackDuration=(start,end,actions)=>playbackSegments(start,end,actions).reduce((sum,s)=>sum+s.duration,0);
// A return crosses transfer and landing clock segments. Measure its progress
// in screen time so it cannot suddenly accelerate at the segment boundary.
export const storyMotionProgress=(time,start,end,actions)=>playbackDuration(start,Math.max(start,Math.min(end,time)),actions)/playbackDuration(start,end,actions);

const script = [
  ['opening', 'There Is No Need\nTo Micro-Manage People', 3.6, true],
  ['individuals', 'Work Missions Can Be Automatically Assigned\nTo Individuals', 7],
  ['teams', 'Or To Teams\nOn Team Boards', 5.5],
  ['schedule', 'Each Mission\nHas A Unique Schedule', 5.3],
  ['points', 'Reward Points Can Be Added\nTo Increase Motivation', 4],
  ['urgency', 'Mission Timers Change In Color\nTo Create A Sense Of Urgency', 3.8],
  ['priority', 'Critical Work Can Be\nAutomatically Prioritized', 6.8],
  ['shared', 'A Whole Team Can Share\nOne Single Device', 5.2],
  ['code', 'Each Person Uses\nA Unique Code', 3.6],
  ['claim', 'To Claim A Mission', 5.2],
  ['close', 'And To Close A Mission', 5.4],
  ['execution', 'Each Execution Duration\nIs Measured', 3.7],
  ['performers', 'The Best Performers\nAre Easily Recognized', 4.2],
  ['initiative', 'Teams Are Constantly Guided\nTo Take Initiatives On Their Own', 10.5],
  ['reminder', 'No Need For A Manager\nTo Constantly Remind Them', 4.5],
  ['conclusion', 'Efficiency Increases\nBy Reducing Downtime\nBetween Tasks', 4.8],
];
let cursor=0;
const actionDurations={code:1.9/CYCLE_SPEED,claim:playbackDuration(TIMING.claim+1.9,TIMING.close-.01)/CYCLE_SPEED,close:playbackDuration(TIMING.close,TIMING.shared+1.6)/CYCLE_SPEED,initiative:playbackDuration(CYCLE_START,CYCLE_END,CYCLE_ACTIONS)/CYCLE_SPEED+2};
export const EFFICIENCY_STORY=script.map(([id,text,duration,title])=>{
  const start=cursor;
  // Each line decelerates to a stop, then pauses before the next line.
  const cue=id==='initiative'?CYCLE_REVEAL.ready:captionReady(text);
  duration=actionDurations[id]!=null?cue+actionDurations[id]+.2:duration;
  cursor=Math.round((cursor+duration)*1000)/1000;
  return {id,text,duration,title:Boolean(title||id==='conclusion'),cue,motionAt:start+cue,start,end:cursor};
});
export const STORY=Object.fromEntries(EFFICIENCY_STORY.map(s=>[s.id,s]));
export const STORY_LENGTH=cursor;
const advance=(time,start,a,b,actions)=>{
  let remaining=Math.max(0,time-start);
  for(const segment of playbackSegments(a,b,actions)){
    if(segment.duration===0)continue;
    if(remaining<segment.duration)return segment.from+(segment.to-segment.from)*remaining/segment.duration;
    remaining-=segment.duration;
  }
  return b;
};
// Remap the existing claim/close choreography without changing either original demo.
export function storyBoardTime(time) {
  const paced=start=>start+(time-start)*CYCLE_SPEED;
  if(time<STORY.code.motionAt) return TIMING.claim-.1;
  if(time<STORY.claim.start) return advance(paced(STORY.code.motionAt),STORY.code.motionAt,TIMING.claim,TIMING.claim+1.9);
  if(time<STORY.claim.motionAt) return TIMING.claim+1.9;
  if(time<STORY.close.start) return advance(paced(STORY.claim.motionAt),STORY.claim.motionAt,TIMING.claim+1.9,TIMING.close-.01);
  if(time<STORY.close.motionAt) return TIMING.close-.01;
  if(time<STORY.execution.start) return advance(paced(STORY.close.motionAt),STORY.close.motionAt,TIMING.close,TIMING.shared+1.6);
  if(time<STORY.initiative.start+CYCLE_REVEAL.reset) return TIMING.shared+1.6;
  if(time<STORY.initiative.motionAt) return CYCLE_START-.01;
  return advance(STORY.initiative.motionAt+(time-STORY.initiative.motionAt)*CYCLE_SPEED,STORY.initiative.motionAt,CYCLE_START,CYCLE_END,CYCLE_ACTIONS);
}

export function storyEventTime(boardTime,cycle=false){
  if(cycle)return STORY.initiative.motionAt+playbackDuration(CYCLE_START,boardTime,CYCLE_ACTIONS)/CYCLE_SPEED;
  if(boardTime>=TIMING.close)return STORY.close.motionAt+playbackDuration(TIMING.close,boardTime)/CYCLE_SPEED;
  return STORY.claim.motionAt+playbackDuration(TIMING.claim+1.9,boardTime)/CYCLE_SPEED;
}
// Every active mission shares the same continuously advancing screen clock.
export function storyTimerClock(time,cycle=false){
  if(cycle)return Math.max(0,Math.min(time,storyEventTime(CYCLE_END,true))-STORY.initiative.start-CYCLE_REVEAL.reset)*30;
  return Math.max(0,time-STORY.teams.motionAt)
    +Math.max(0,Math.min(time,STORY.shared.start)-STORY.urgency.motionAt)*119
    +Math.max(0,time-STORY.shared.start)*4;
}
export function storyMissionTimers(time,mission,index,actions,cycle=false){
  const claim=actions.find(a=>a.mission===index&&a.to==='claimed');
  const close=actions.find(a=>a.mission===index&&a.to==='closed');
  const closedAt=close?storyEventTime(close.confirm,cycle):Infinity;
  const claimedAt=claim?storyEventTime(claim.confirm,cycle):Infinity;
  const now=storyTimerClock(Math.min(time,closedAt),cycle);
  const birth=cycle&&mission.appearsAt!=null?storyTimerClock(storyEventTime(mission.appearsAt,true),cycle):0;
  return {ageSeconds:(mission.age??0)+Math.max(0,now-birth),executionSeconds:time>=claimedAt?Math.max(0,now-storyTimerClock(claimedAt,cycle)):0};
}
export const STORY_PEOPLE=[
  {src:'/avatars/01.png',name:'Adam F. - Staff',phoneX:476,code:'123456'},
  {src:'/avatars/05.png',name:'Ben R. - Staff',phoneX:800,code:'456456'},
  {src:'/avatars/04.png',name:'Carla M. - Staff',phoneX:1124,code:'789789'},
  {src:'/avatars/02.png',name:'Maya R. - Staff',code:'248135'},
  {src:'/avatars/03.png',name:'Leo T. - Staff',code:'963852'},
];
const base={type:'Checklist',status:'open',location:'Main Office',postedBy:'System',date:'07-14-26',time:'08:00 AM',points:10};
export const STORY_MISSIONS=[
  {...base,id:'inv',title:'Inventory Check',age:480,points:10},
  {...base,id:'ord',title:'Order Supplies',age:360,points:15},
  {...base,id:'sig',title:'Safety Check',age:180,points:20},
  {...base,id:'prep',title:'Prepare Workspace',age:120,points:15},
  {...base,id:'temp',title:'Review Team Updates',age:0,appearsAt:TIMING.shared+3.2},
  {...base,id:'follow-up',title:'Confirm Tomorrow’s Schedule',age:0,appearsAt:TIMING.shared+6.4},
];
export const CYCLE_MISSIONS=[...STORY_MISSIONS.slice(0,4),{
  ...base,id:'cycle-new',title:'Review Team Updates',age:0,
  appearsAt:CYCLE_ACTIONS[0].confirm,
}];
