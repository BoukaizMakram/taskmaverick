import {captionReady} from './efficiencyCaptions.mjs';
import {TIMING,BOARD_PHASES,BOARD_ACTION_DURATION} from './demoNarration.mjs';
import {CYCLE_ACTIONS,CYCLE_MISSIONS,CYCLE_START,CYCLE_END,CYCLE_SPEED} from './efficiencyStory.mjs';
import {HAND,tap as handTap,speak as handSpeak,handPose} from './demoHand.mjs';

// Increased Efficiency — storytelling cut (/increased-efficiency-v2), rebuilt
// from the CEO review of 2026-09-28 (docs/meetings/2026-09-28-ceo-video-review.md):
//  • start at the point: the missions pop in one by one, each with its own
//    schedule — no phones or team boards first ("14 seconds of waste");
//  • the missions are shown by themselves; the words sit next to them and move
//    with them (points, timers, the critical one moving to the top);
//  • one shared device: the words and the team in the middle, the tablet drops
//    in, the people go left and the words right;
//  • claiming and closing are the original choreography (useAutomationMotion:
//    the small personal code, the circle, the avatar gripping the mission and
//    docking in its name slot), once each; later the original loop of people
//    claiming on their own;
//  • the closed missions are lifted out of the tablet to point at their
//    execution times and performers;
//  • assigning to individuals or teams moves to the end, then teams taking
//    the initiative on their own.
// Same words as /increased-efficiency-demo (the CEO rewrites them), in short
// lines.
export const TEXT_SPEED=1.7;

export const MOTION={
 out:.45,     // art fades away
 enter:.8,    // art pops / drops in
 glide:.8,    // words moving to a new place
 pop:.4,      // a card pops in
 boom:.35,    // between two cards popping in
 read:1.3,    // a highlighted subject stays at least this long
 hold:.9,     // after the last beat, before the next chapter
 move:1.05,   // the critical mission moves to the top
 lift:1,      // closed missions lift out of the tablet
};

// Each caption is a compact rectangle: its lines about the same length. The
// breaks are fixed — the words never wrap or move to another line.
const LINES={
 opening:'There Is No Need / To Micro-Manage People',
 schedule:'Each Mission Has / A Unique Schedule',
 points:'Reward Points / Can Be Added To / Increase Motivation',
 urgency:'Mission Timers Change / In Color To Create / A Sense Of Urgency',
 priority:'Critical Work Can Be / Automatically Prioritized',
 shared:'A Whole Team / Can Share One / Single Device',
 code:'Each Person Uses / A Unique Code',
 claim:'To Claim / A Mission',
 close:'And To Close / A Mission',
 execution:'Each Execution / Duration Is Measured',
 performers:'The Best Performers / Are Easily Recognized',
 reminder:'No Need For A Manager / To Constantly Remind Them',
 individuals:'Work Missions Can Be / Automatically Assigned / To Individuals',
 teams:'Or To Teams / On Team Boards',
 initiative:'Teams Are Constantly / Guided To Take / Initiatives On Their Own',
 conclusion:'Efficiency Increases / By Reducing Downtime / Between Tasks',
};
const toText=line=>line.split(' / ').join('\n');
const readyOf=id=>captionReady(toText(LINES[id]))/TEXT_SPEED;

// ---- People and missions ------------------------------------------------------
export const PEOPLE=[
 {src:'/avatars/01.png',name:'Adam F',code:'123456'},
 {src:'/avatars/05.png',name:'Ben R',code:'456456'},
 {src:'/avatars/04.png',name:'Carla M',code:'789789'},
 {src:'/avatars/02.png',name:'Maya R',code:'248135'},
 {src:'/avatars/03.png',name:'Leo T',code:'963852'},
];
// The four missions of chapters 2-5 (in their first order), then the one the
// shared tablet already has closed (Ben closed it before the film).
export const CARDS=[
 {id:'inv',title:'Inventory Check',type:'Checklist',points:10,age:480,schedule:'Daily · 8:00 AM'},
 {id:'ord',title:'Order Supplies',type:'Checklist',points:15,age:360,schedule:'Weekly · Mon, Wed, Fri'},
 {id:'sig',title:'Safety Check',type:'Checklist',points:20,age:180,schedule:'Daily · 4:00 PM'},
 {id:'prep',title:'Prepare Workspace',type:'Task',points:15,age:120,schedule:'Monthly · 1st, 9:00 AM'},
];
const REST={type:'Checklist',date:'07-14-26',time:'08:00 AM'};
export const BOARD_EXTRA=[
 {...REST,id:'front',title:'Restock Front Desk',type:'Task',points:15,status:'closed',performer:'Ben R',age:2460,exec:372},
];
// The board of chapters 6-12 (mission indices for the actions below); the
// choreography knows a mission as closed through its actions, so the closed
// one starts open and Ben's claim and close happen before the film.
export const BOARD_TEMPLATES=[...CARDS,...BOARD_EXTRA].map(c=>({...REST,...c,status:'open'}));
export const BONUS=10;// reward points added to the first two missions (chapter 3)

// ---- The original claim / close choreography -------------------------------------
// useAutomationMotion plays actions on its own board clock (lib/demoNarration
// TIMING). This cut plays one code-assisted claim and one code-assisted close
// of the critical mission by Adam, then (chapters 14-15) the original loop.
const boardAction=(person,mission,start,from,to)=>({person,mission,start,confirm:start+BOARD_PHASES.transfer,arrive:start+BOARD_PHASES.arrive,end:start+BOARD_ACTION_DURATION,from,to});
export const FIRST_ACTIONS=[boardAction(0,2,TIMING.claim,'open','claimed'),boardAction(0,2,TIMING.close,'claimed','closed')];
const BEFORE_FILM=[{person:1,mission:4,start:-30,confirm:-29,arrive:-28.6,end:-28.4,from:'open',to:'claimed',direct:true},{person:1,mission:4,start:-20,confirm:-19,arrive:-18.6,end:-18.4,from:'claimed',to:'closed',direct:true}];
export const BOARD_ACTIONS=[...BEFORE_FILM,...FIRST_ACTIONS];
export {CYCLE_ACTIONS,CYCLE_MISSIONS};
const SPEED=CYCLE_SPEED;
// As in the original: each transfer takes 1.05s on screen and each landing
// .85s; approaches and code entry keep their pace.
function segments(start,end,actions){
 const bounds=[start,end,...actions.flatMap(a=>[a.confirm,a.arrive,a.end])].filter(t=>t>=start&&t<=end).sort((a,b)=>a-b);
 return bounds.slice(1).map((to,i)=>{
  const from=bounds[i],mid=(from+to)/2;
  const landing=actions.find(a=>a.to==='claimed'&&mid>=a.arrive&&mid<a.end),transfer=actions.find(a=>mid>=a.confirm&&mid<a.arrive);
  return {from,to,duration:(to-from)*(transfer?1.05/(transfer.arrive-transfer.confirm):landing?.85/(landing.end-landing.arrive):1)};
 });
}
const span=(a,b,actions)=>segments(a,b,actions).reduce((sum,s)=>sum+s.duration,0);
const advance=(paced,a,b,actions)=>{let left=Math.max(0,paced);for(const s of segments(a,b,actions)){if(!s.duration)continue;if(left<s.duration)return s.from+(s.to-s.from)*left/s.duration;left-=s.duration;}return b;};
// How far a close has come back, in screen time (the rail return uses it).
export const motionProgress=(t,a,b,actions)=>span(a,Math.max(a,Math.min(b,t)),actions)/span(a,b,actions);

// ---- Beats (seconds from each chapter's start) -----------------------------------
// Every chapter goes the same way: the art is there, the hand flies to what
// the words are about and clicks it (the click is the action), the speech
// bubble comes out of the click, then the words type. Whatever happens next
// (points growing, a timer turning red, the original claim and close) goes on
// while they type.
const tap=(ring,lead)=>handTap(ring,.35,lead);
const speak=(press,id)=>handSpeak(press,readyOf(id));
export const OPENING=(()=>{const typed=readyOf('opening');return {text:0,typed,end:typed+MOTION.read};})();
// 2: the four missions pop in one by one, each with its schedule; the hand
// clicks the first one. At the end the schedules fade and the column glides
// back to the center (while these words fade out).
export const SCHEDULE=(()=>{
 const first=.1,pops=CARDS.map((c,i)=>first+i*MOTION.boom),landed=pops.at(-1)+MOTION.pop;
 const point=tap(landed-.4),w=speak(point.press,'schedule'),recenter=Math.max(point.press,w.typed)+MOTION.read;
 return {first,pops,landed,point,...w,recenter,end:recenter+MOTION.glide};
})();
// 3: the hand clicks the points of two missions: reward points are added.
export const POINTS=(()=>{
 const taps=[tap(0)];taps.push(tap(taps[0].press+.15,HAND.hop));
 const pops=taps.map(t=>t.press),w=speak(pops[0],'points');
 return {taps,pops,...w,end:Math.max(pops[1]+MOTION.pop,w.typed)+MOTION.read};
})();
// 4: the hand clicks the oldest mission's timer; it turns orange, then red
// (color changes snap).
export const URGENCY=(()=>{const point=tap(0),orange=point.press+.2,red=point.press+1.1,w=speak(point.press,'urgency');return {point,orange,red,...w,end:Math.max(red,w.typed)+MOTION.read};})();
// 5: the hand clicks the critical mission: it turns red and moves to the top.
export const PRIORITY=(()=>{const point=tap(0),orange=point.press+.05,red=point.press+.5,move=point.press+.8,w=speak(point.press,'priority');return {point,orange,red,move,...w,end:Math.max(move+MOTION.move,w.typed)+MOTION.read};})();
// 6: the missions leave; the team comes in the middle; the tablet drops in;
// the people go left (to the rail); the hand clicks the tablet.
export const SHARED=(()=>{
 const out=MOTION.out,people=out+.05,drop=people+.6,landed=drop+MOTION.enter;
 const point=tap(landed-.4),w=speak(point.press,'shared');
 return {out,people,drop,landed,travel:1.05,point,...w,end:Math.max(landed+MOTION.hold,w.typed+MOTION.read)};
})();
// 7: the hand clicks the critical mission, then Adam leaves the rail for it
// and types his code. 8: the hand clicks it, then the mission moves to Claimed
// and he docks in its name slot. 9: the hand clicks it, then he closes it with
// his code and returns. (The original choreography, once each.)
const [CLAIM_A,CLOSE_A]=FIRST_ACTIONS;
const GO=.25;// the choreography starts this long after the click
export const CODE=(()=>{const point=tap(0),w=speak(point.press,'code'),go=point.press+GO,from=TIMING.claim,to=TIMING.claim+1.9,run=(to-from)/SPEED;return {point,...w,go,from,to,rest:from-.1,actions:FIRST_ACTIONS,run,keypad:go+BOARD_PHASES.codeIn/SPEED,end:Math.max(go+run+.2,w.typed+MOTION.read)};})();
export const CLAIM=(()=>{const point=tap(0),w=speak(point.press,'claim'),go=point.press+GO,from=CODE.to,to=CLAIM_A.end,run=span(from,to,FIRST_ACTIONS)/SPEED;return {point,...w,go,from,to,rest:from,actions:FIRST_ACTIONS,run,end:Math.max(go+run,w.typed)+MOTION.read};})();
export const CLOSE=(()=>{
 const point=tap(0),w=speak(point.press,'close'),go=point.press+GO,from=CLOSE_A.start,to=CLOSE_A.end,run=span(from,to,FIRST_ACTIONS)/SPEED,at=b=>go+span(from,b,FIRST_ACTIONS)/SPEED;
 return {point,...w,go,from,to,rest:from-.01,actions:FIRST_ACTIONS,run,keypad:at(from+BOARD_PHASES.codeIn),confirm:at(CLOSE_A.confirm),end:Math.max(go+run,w.typed)+MOTION.read};
})();
// 10-12: the tablet goes; the two closed missions are lifted out; the hand
// clicks their execution times, then (next chapter) their performers.
export const EXECUTION=(()=>{
 const lift=0,taps=[tap(MOTION.lift)];taps.push(tap(taps[0].press+.2,HAND.hop));
 const w=speak(taps[0].press,'execution');
 return {lift,taps,subject:taps[0].press,...w,end:Math.max(taps[1].press,w.typed)+MOTION.read+.3};
})();
export const PERFORMERS=(()=>{
 const taps=[tap(0)];taps.push(tap(taps[0].press+.2,HAND.hop));
 const w=speak(taps[0].press,'performers');
 return {taps,subject:taps[0].press,...w,end:Math.max(taps[1].press,w.typed)+MOTION.read+.3};
})();
export const REMINDER=(()=>{const point=tap(0),w=speak(point.press,'reminder');return {point,...w,end:w.typed+MOTION.read};})();
// 13: the missions leave; three personal boards pop in, their missions one by
// one; the hand clicks them.
export const INDIVIDUALS=(()=>{
 const out=MOTION.out,phones=out+.05,missions=phones+MOTION.enter;
 const pops=[[0,1,2],[0,1],[0,1,2]].map((list,p)=>list.map(j=>missions+(p*.12)+j*MOTION.boom));
 const done=missions+2*MOTION.boom+.24+MOTION.pop,point=tap(missions-.1),w=speak(point.press,'individuals');
 return {out,phones,pops,point,...w,end:Math.max(done+MOTION.hold,w.typed+MOTION.read)};
})();
// 14: the phones leave; the team board enters with its team; the hand clicks it.
export const TEAMS=(()=>{const out=MOTION.out,board=out+.05,point=tap(board+MOTION.enter-.4),w=speak(point.press,'teams');return {out,board,point,...w,end:Math.max(board+MOTION.enter+MOTION.hold,w.typed+MOTION.read)};})();
// 15: the hand clicks the board; the original loop follows: people claim and
// close missions on their own.
export const INITIATIVE=(()=>{const point=tap(0),w=speak(point.press,'initiative'),go=point.press+GO,from=CYCLE_START,to=CYCLE_END,run=span(from,to,CYCLE_ACTIONS)/SPEED;return {point,...w,go,from,to,rest:from-.01,actions:CYCLE_ACTIONS,run,end:Math.max(go+run+2,w.typed+MOTION.read)};})();
export const CONCLUSION=(()=>{const text=MOTION.out+.2,typed=text+readyOf('conclusion');return {out:MOTION.out,text,typed,end:typed+2.2};})();

const BEATS={opening:OPENING,schedule:SCHEDULE,points:POINTS,urgency:URGENCY,priority:PRIORITY,shared:SHARED,code:CODE,claim:CLAIM,close:CLOSE,execution:EXECUTION,performers:PERFORMERS,reminder:REMINDER,individuals:INDIVIDUALS,teams:TEAMS,initiative:INITIATIVE,conclusion:CONCLUSION};
// When each chapter's words start typing, and when its bubble comes out.
// Seconds into a chapter when the last scene's art has gone and this one's has
// begun. A clip of the chapter on its own starts here, so it never shows a bit
// of another part (the missions fading out as the tablet comes in, say).
export const CLIP_SKIP={shared:SHARED.out,execution:MOTION.lift,individuals:INDIVIDUALS.out,teams:TEAMS.out,conclusion:CONCLUSION.out};
export const TEXT_AT=Object.fromEntries(Object.entries(BEATS).map(([id,b])=>[id,b.text]));
export const SAY=Object.fromEntries(Object.entries(BEATS).filter(([,b])=>b.say!=null).map(([id,b])=>[id,b.say]));
const TITLES=['opening','conclusion'];
let cursor=0;
export const EFFICIENCY_STORY=Object.keys(LINES).map((id,index)=>{
 const text=toText(LINES[id]),duration=Math.round(BEATS[id].end*100)/100,start=cursor;cursor=Math.round((cursor+duration)*100)/100;
 return {id,text,start,end:cursor,duration,title:TITLES.includes(id),number:index+1,ready:readyOf(id)};
});
export const STORY_LENGTH=cursor;
const at=id=>EFFICIENCY_STORY.find(s=>s.id===id);
const sceneAt=time=>EFFICIENCY_STORY.find(s=>time<s.end)??EFFICIENCY_STORY.at(-1);
const since=(id,time)=>time-at(id).start;

export const clamp=p=>Math.max(0,Math.min(1,p));
export const ease=p=>1-(1-clamp(p))**3;
export const expo=p=>{p=clamp(p);return p===1?1:1-2**(-10*p);};
export const smooth=p=>{p=clamp(p);return p*p*p*(p*(p*6-15)+10);};
export const mix=(a,b,p)=>a+(b-a)*p;

// ---- The board clock ----------------------------------------------------------
// Where the original choreography is at `time`: each chapter holds still until
// the hand has clicked, then plays its stretch at the original pace.
export function boardAt(time){
 const e=id=>since(id,time);
 const run=(id,B)=>{const x=e(id)-B.go;return x<=0?B.rest:advance(x*SPEED,B.from,B.to,B.actions);};
 if(e('code')<0)return {t:TIMING.claim-.1,cycle:false,actions:BOARD_ACTIONS};
 if(e('claim')<0)return {t:run('code',CODE),cycle:false,actions:BOARD_ACTIONS};
 if(e('close')<0)return {t:run('claim',CLAIM),cycle:false,actions:BOARD_ACTIONS};
 if(e('teams')<0)return {t:run('close',CLOSE),cycle:false,actions:BOARD_ACTIONS};
 if(e('initiative')<0)return {t:INITIATIVE.rest,cycle:true,actions:CYCLE_ACTIONS};
 return {t:run('initiative',INITIATIVE),cycle:true,actions:CYCLE_ACTIONS};
}
// The film time at which the board reaches board time `t` (for timers).
export function filmTimeOfBoard(t,cycle=false){
 if(cycle)return at('initiative').start+INITIATIVE.go+span(CYCLE_START,t,CYCLE_ACTIONS)/SPEED;
 if(t>=CLOSE.from)return at('close').start+CLOSE.go+span(CLOSE.from,t,FIRST_ACTIONS)/SPEED;
 if(t>=CLAIM.from)return at('claim').start+CLAIM.go+span(CLAIM.from,t,FIRST_ACTIONS)/SPEED;
 return at('code').start+CODE.go+(t-CODE.from)/SPEED;
}

// ---- Layout -------------------------------------------------------------------
// Stage px. The tablet takes the original's size (the 860px board at 1.3) and
// sits left, its team on a rail at its left (the original rail, 102px out),
// the words on its right.
export const LAYOUT={
 tablet:{x:-115,y:30,scale:1.3},// offset from the original's centered pose
 wordsGap:44,margin:24,
 tipIn:10,// stage px a speech bubble's tail reaches into what the words point at

 // What is shown sits in the center: each art and the typical words it carries
 // are centered as one group.
 // chapters 2-5: the missions in a column; with their schedules to their left
 // (chapter 2) the column sits at `left`, then glides to `bare`
 stack:{left:560,bare:420,top:113,width:400,gap:18},
 // chapters 10-12: the two closed missions, lifted out
 iso:{left:363,top:245,width:500,gap:26},
 // chapter 13: three personal boards (268px phones, 56px apart)
 phones:{left:141,top:170},
};
export const CARD={width:334,height:129};// a tablet column's card, native px
export const rowPose=i=>({x:800+(i-2)*94-37,y:300});
// `extra`: stage px of room the words need beyond plain words (a speech
// bubble's outline and tail, see bubbleRoom): the tablet and the phones give way.
export const TABLET_WIDTH=860,FRAME_RIGHT=1236/1285;// the tablet board's unscaled width; its frame image is transparent right of FRAME_RIGHT
export const tabletPose=(extra=0)=>{
 const {x,scale}=LAYOUT.tablet,W0=TABLET_WIDTH*scale,left=800+x-W0/2,W=Math.max(W0*.62,W0-extra/FRAME_RIGHT);
 return {x:left+W/2-800,scale:scale*W/W0};
};
export const phonesLeft=(extra=0)=>Math.max(24,LAYOUT.phones.left-extra);
export const phonePose=(i,extra=0)=>({x:phonesLeft(extra)+134+i*324-37,y:96});

// ---- Frame --------------------------------------------------------------------
// Everything the page draws itself at `time` (the board choreography comes
// from boardAt), derived from the clock so seeking is exact.
const TIMER_COLORS={green:'#007a33',orange:'#bf4b00',red:'#bd1f59'};
const OPEN_ORDER={sig:0,inv:1,ord:2,prep:3,'cycle-new':4};
export function efficiencyFrame(time){
 const scene=sceneAt(time),elapsed=Math.max(0,time-scene.start),n=scene.number;
 const e=id=>since(id,time);
 const popAt=i=>at('schedule').start+SCHEDULE.pops[i];
 const points=CARDS.map((c,i)=>c.points+(i<2&&e('points')>=POINTS.pops[i]?BONUS:0));
 const pointsPop=CARDS.map((c,i)=>i<2?Math.sin(Math.PI*clamp((e('points')-POINTS.pops[i])/.5)):0);
 const color=id=>id==='inv'?(e('urgency')>=URGENCY.red?'red':e('urgency')>=URGENCY.orange?'orange':'green'):id==='sig'?(e('priority')>=PRIORITY.red?'red':e('priority')>=PRIORITY.orange?'orange':'green'):'green';
 const move=smooth((e('priority')-PRIORITY.move)/MOTION.move);// sig to the top
 const slots={inv:move,ord:1+move,sig:2-2*move,prep:3};
 // Timers run in real time; a mission's execution timer from its claim, both
 // stopped when it closes.
 const claimedAt=filmTimeOfBoard(CLAIM_A.confirm),closedAt=filmTimeOfBoard(CLOSE_A.confirm);
 const cards=[...CARDS,...BOARD_EXTRA].map((c,i)=>{
  const sig=c.id==='sig',closed=sig&&time>=closedAt,claimed=sig&&time>=claimedAt;
  const status=c.status??(closed?'closed':claimed?'claimed':'open');
  const stop=c.status==='closed'?0:closed?closedAt:time,live=i<4?Math.max(0,stop-popAt(i)):stop;
  return {...REST,...c,status,points:i<4?points[i]:c.points,
   ageSeconds:(c.age??0)+live,
   executionSeconds:c.exec!=null?c.exec+stop:claimed?stop-claimedAt:0,
   performer:c.performer??(claimed?PEOPLE[0].name:undefined),
   timerColor:status==='closed'?undefined:TIMER_COLORS[color(c.id)],
   openOrder:OPEN_ORDER[c.id]};
 });
 const cardIn=CARDS.map((c,i)=>e('schedule')<0?0:expo((e('schedule')-SCHEDULE.pops[i])/MOTION.pop));
 const recenter=e('schedule')<0?0:smooth((e('schedule')-SCHEDULE.recenter)/MOTION.glide);
 const scheduleIn=CARDS.map((c,i)=>cardIn[i]*(1-recenter));
 const stackLeft=mix(LAYOUT.stack.left,LAYOUT.stack.bare,recenter);
 const ind=e('individuals');
 const phones=ind<0?0:expo((ind-INDIVIDUALS.phones)/MOTION.enter)*(1-ease(e('teams')/MOTION.out));
 const phoneMissions=INDIVIDUALS.pops.map(list=>list.filter(t=>ind>=t).length);
 const hand=handPose(HAND_STOPS[scene.id],elapsed);// where the hand is (null in a title)
 return {scene,elapsed,cards,points,pointsPop,slots,cardIn,scheduleIn,stackLeft,phones,phoneMissions,hand};
}
// Timers, points and colors the page lays over the choreography's missions
// (the board's own clock runs in simulated time).
export function boardTimers(time,missions,cycle){
 const f=efficiencyFrame(time),byId=Object.fromEntries(f.cards.map(m=>[m.id,m]));
 if(!cycle)return missions.map(m=>{const c=byId[m.id];return c?{...m,ageSeconds:c.ageSeconds,executionSeconds:c.executionSeconds,timerColor:m.status==='closed'?undefined:c.timerColor,points:c.points,openOrder:c.openOrder}:m;});
 // The team board of 14-15: posted when the chapter starts (the new one when
 // it appears); execution from each claim.
 const start=at('teams').start;
 return missions.map((m,i)=>{
  const t=CYCLE_MISSIONS.findIndex(x=>x.id===m.id),claim=CYCLE_ACTIONS.find(a=>a.mission===t&&a.to==='claimed'),close=CYCLE_ACTIONS.find(a=>a.mission===t&&a.to==='closed');
  const posted=m.appearsAt!=null?filmTimeOfBoard(m.appearsAt,true):start,claimed=claim?filmTimeOfBoard(claim.confirm,true):Infinity,closed=close?filmTimeOfBoard(close.confirm,true):Infinity;
  const stop=Math.min(time,closed),c=byId[m.id];
  return {...m,ageSeconds:(m.age??0)+Math.max(0,stop-posted),executionSeconds:time>=claimed?Math.max(0,stop-claimed):0,
   timerColor:m.status==='closed'?undefined:c?.timerColor??TIMER_COLORS.green,points:c?.points??m.points,openOrder:OPEN_ORDER[m.id]};
 });
}
// Where the hand goes in each chapter, in order: a target (named in
// EfficiencyV2Demo.jsx) and its click. The hand fades out a moment after each click.
// Nothing here is clicked for real: what happens (points growing, a timer
// turning, the original claim and close) happens by itself, so the hand points.
const stop=(target,t)=>({target,ring:t.ring,press:t.press,kind:'point'});
export const HAND_STOPS={
 schedule:[stop('card-inv',SCHEDULE.point)],
 points:[stop('points-inv',POINTS.taps[0]),stop('points-ord',POINTS.taps[1])],
 urgency:[stop('pill-inv',URGENCY.point)],
 priority:[stop('card-sig',PRIORITY.point)],
 shared:[stop('tablet-top',SHARED.point)],
 code:[stop('board-sig',CODE.point)],claim:[stop('board-sig',CLAIM.point)],close:[stop('board-sig',CLOSE.point)],
 execution:[stop('exec-sig',EXECUTION.taps[0]),stop('exec-front',EXECUTION.taps[1])],
 performers:[stop('who-sig',PERFORMERS.taps[0]),stop('who-front',PERFORMERS.taps[1])],
 reminder:[stop('iso',REMINDER.point)],
 individuals:[stop('phones',INDIVIDUALS.point)],
 teams:[stop('tablet-top',TEAMS.point)],
 initiative:[stop('tablet-top',INITIATIVE.point)],
};

// ---- Art on screen ------------------------------------------------------------
export function devicesAt(time){
 const e=id=>since(id,time);
 // 2-5: the missions by themselves; they leave as chapter 6 starts.
 const cards=e('schedule')<0?0:1-ease(e('shared')/SHARED.out);
 // 6-9 and 14-15: the tablet (drops in at 6, gone for 10-13, back at 14).
 const drop=e('shared')<0?0:expo((e('shared')-SHARED.drop)/MOTION.enter);
 const lift=e('execution')<0?0:smooth((e('execution')-EXECUTION.lift)/MOTION.lift);
 const back=e('teams')<0?0:expo((e('teams')-TEAMS.board)/MOTION.enter);
 const out=e('conclusion')<0?0:ease(e('conclusion')/CONCLUSION.out);
 const tablet=e('teams')>=0?back*(1-out):drop*(1-lift);
 // 10-12: the two closed missions, lifted out (1 = beside the words), gone at 13.
 const iso=lift*(1-ease(e('individuals')/INDIVIDUALS.out));
 // The tablet drops in from above at 6, rises back in at 14.
 const tabletY=e('teams')>=0?(1-back)*40:(1-drop)*-900;
 return {cards,drop,tablet,tabletY,back,lift,iso,out};
}
// The team where the page places them itself (else the choreography does):
// chapter 6 (a row in the middle, then to the rail) and 13 (over the phones).
export function teamPose(time,i,extra=0){
 const e=id=>since(id,time);
 if(e('teams')>=0)return null;
 if(e('individuals')>=0)return {...phonePose(i,extra),opacity:i<3?ease((e('individuals')-INDIVIDUALS.phones-.3-i*.12)/.4)*(1-ease(e('teams')/MOTION.out)):0};
 if(e('code')>=0)return null;
 if(e('shared')<0)return {...rowPose(i),opacity:0};
 return {row:rowPose(i),opacity:ease((e('shared')-SHARED.people-i*.08)/.35),travel:ease((e('shared')-SHARED.drop-i*.08)/SHARED.travel)};
}

// ---- Words --------------------------------------------------------------------
// center: 1 = centered, 0 = beside the art; edge: the art's right edge they sit
// beside; anchor: what they are level with. Targets the page measures; each
// moves to the next over MOTION.glide.
const glideList=(list,e)=>{
 let i=0;while(i+1<list.length&&e>=list[i+1][0])i++;
 const prev=list[Math.max(0,i-1)][1],cur=list[i][1];
 return {from:i?prev:cur,to:cur,p:i?expo((e-list[i][0])/MOTION.glide):1};
};
const TABLET_PLAN=[[0,'tablet']];
const PLAN={
 schedule:[[0,'cards']],points:[[0,'cards']],urgency:[[0,'cards']],priority:[[0,'cards']],
 shared:TABLET_PLAN,code:TABLET_PLAN,claim:TABLET_PLAN,close:TABLET_PLAN,// level with the hand, and still (they don't follow the keypad)
 execution:[[0,'iso']],performers:[[0,'iso']],reminder:[[0,'iso']],
 individuals:[[0,'phones']],teams:TABLET_PLAN,initiative:TABLET_PLAN,
};
export function captionPlan(time){
 const scene=sceneAt(time),e=Math.max(0,time-scene.start),edge=PLAN[scene.id];
 if(!edge)return {center:1};
 return {center:0,edge:glideList(edge,e)};
}
