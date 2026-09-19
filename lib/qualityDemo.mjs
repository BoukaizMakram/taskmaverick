// The user's 28-point story, with concise on-screen copy and one seekable clock.
const lines = [
  ['precision','Precision Guidance',1.8,'title'],
  ['instructions','Keep Performance Standards In View',3,'guidance','Within a Mission, Instructions can be added to refresh about its performance standards'],
  ['alerts','Warn About Risks And Rules',3,'guidance','Alerts can be added to warn about related risks or applicable rules and regulations'],
  ['resources','Reference Outside Resources',2.8,'guidance','A link can be included to reference outside resources'],
  ['steps','Guide Every Step',3.8,'guidance','Performers can be guided step-by-step to ensure precision executions'],
  ['coaching','Timely Coaching',1.8,'title'],
  ['context','The Right Information, At The Right Step',3,'training','Information should be provided to people in the context of their actions'],
  ['micro','Train Before Critical Steps',3.4,'training','Micro-trainings can be injected into Missions prior to critical steps'],
  ['quiz','Prove Competency Before Proceeding',3.8,'quiz','Passing a Quiz can be required to demonstrate competency before proceeding'],
  ['knowledge','Find Training On The Fly',3.4,'knowledge','A Knowledge Base is readily available to reference training materials on the fly'],
  ['translate','Translate With One Tap',3.6,'translate','All information can be instantly translated to any language at a press of a button'],
  ['evidence','Collecting Evidence',1.8,'title'],
  ['capture','Capture Photos And Videos At Checkpoints',3.6,'capture','Photos or videos can be added to checkpoints to show adherence to quality standards'],
  ['stamp','Every Capture, Date And Time Stamped',2.8,'capture','They are stamped with the date and time'],
  ['reuse','Fresh Evidence, Every Time',2.8,'capture','Photos and videos cannot be reused in the future'],
  ['touring','Visual Touring',1.8,'title'],
  ['cloud','Stored And Indexed In The Cloud',2.8,'gallery','Photos and videos are stored and indexed in the cloud for easy reference and retrieval'],
  ['history','Travel Back In Time',3.2,'gallery','In Gallery View, managers can travel back in time to inspect work conditions'],
  ['by-mission','Find Evidence By Mission',2.8,'gallery','Photos and videos can be sorted by Mission'],
  ['by-person','Or By Person',2.8,'gallery','Photos and videos can be sorted by Person'],
  ['by-checkpoint','Right Down To The Checkpoint',2.8,'gallery','Photos and videos can be narrowed down to a specific inspection or Checkpoint'],
  ['mobile','Inspect Past Audits From Anywhere',4,'mobile','From any mobile device, managers can scroll to inspect past audits and conditions'],
  ['accountability','Personal Accountability',1.8,'title'],
  ['ratings','Rate Your Work, And Each Other’s',3.2,'ratings','Completed Missions can be rated by the person who performed them, and by their coworkers'],
  ['self','Own The Quality Of Your Work',2.8,'ratings','Self-Ratings emphasize personal accountability'],
  ['peers','Make Quality A Shared Responsibility',3.4,'ratings','Peer Ratings create a sense of collective care and responsibility by crowdsourcing quality control'],
  ['low-rating','Low Ratings Alert Managers',3.6,'ratings','A low Rating can trigger an Alert for managers to inspect conditions'],
  ['conclusion','Increase Efficiency,\nWithout Compromising Quality',3.2,'title','Taskmaverick ensures that increasing efficiency does not occur at the expense of Quality'],
];
let cursor=0;
export const QUALITY_SCENES=lines.map(([id,display,duration,view,script],index)=>{
  const start=cursor; cursor=Math.round((cursor+duration)*100)/100;
  return {id,display,duration,view,script:script||display,number:index+1,start,end:cursor};
});
export const QUALITY_LENGTH=cursor;
export const qualityEase=value=>{const p=Math.max(0,Math.min(1,value));return p*p*(3-2*p);};
export function qualityFrame(time){
  const scene=QUALITY_SCENES.find(s=>time>=s.start&&time<s.end)||QUALITY_SCENES.at(-1);
  const elapsed=Math.max(0,time-scene.start);
  return {scene,elapsed,remaining:scene.end-time,pop:qualityEase(elapsed/.4)*(1-qualityEase((elapsed-scene.duration+.3)/.3)),
    steps:scene.id==='steps'?Math.min(3,Math.floor(elapsed/.8)):0,
    passed:scene.id==='quiz'&&elapsed>=1.8,
    translated:scene.id==='translate'&&elapsed>=1.1,
    captured:scene.id!=='capture'||elapsed>=1,
    rating:Math.min(scene.id==='low-rating'?2:4,Math.max(0,Math.floor(elapsed/.24))),
    scroll:scene.view==='mobile'?qualityEase((elapsed-.7)/2.4)*490:0,
  };
}
