'use client';
import { OpenedMission } from '../OpenedMission';
import MissionChip from '../MissionChip';
import { ProofPhoto, Stars } from './parts';

export const QUALITY_MISSION={id:'quality-audit',type:'Checklist',title:'Kitchen Quality Audit',status:'claimed',points:25,age:480,ageSeconds:620,executionSeconds:140,performer:'Anna F. - Staff',claimedWho:'Anna F. - Staff',claimer:'Anna F. - Staff',location:'Kitchen / Food Preparation',date:'09-17-26',time:'04:10 PM',pillTime:'00:10:20',pillClass:'chip--green',headerRight:'es-menu',
  description:'Check each surface against the opening standard. Use the designated tools for each area.',notice:'Prevent cross-contamination. Keep cleaning tools separate from food-contact equipment.',
  resourceLink:{href:'#quality-reference',label:'View The Kitchen Standards Guide'},
  entryGroup:'Opening Checks',entryFields:[['surface','Clean Preparation Surface','#'],['tools','Check Designated Tools','#'],['proof','Record Final Inspection','#']],entries:{surface:'',tools:'',proof:''}};
export const QUALITY_BOARD=[QUALITY_MISSION,
  {...QUALITY_MISSION,id:'supplies',title:'Restock Supplies',status:'open',points:15},
  {...QUALITY_MISSION,id:'temperature',title:'Temperature Log',status:'open',points:10},
  {...QUALITY_MISSION,id:'closing',title:'Closing Checklist',status:'closed',stopped:100,executionSeconds:600,ageSeconds:1200,performer:'Ben R. - Staff'}];
const peers=[['01','Anna F.','Self Rating'],['05','Ben R.','Peer Rating'],['04','Carla M.','Peer Rating']];
function Head({title,children}){return <header className="om-header"><span className="om-hbtn">←</span><span className="om-header-title">{title}</span><span className="qd-head-actions">{children||'☰'}</span></header>;}
function Panel({title,children,footer}){return <div className="qd-panel"><Head title={title}/><div className="qd-panel-body">{children}</div>{footer&&<footer className="qd-panel-footer">{footer}</footer>}</div>;}
function Action({children,disabled=false}){return <div className={`qd-action${disabled?' is-disabled':''}`}>{children}</div>;}
function MiniMission(){return <MissionChip kind="Checklist" title="Kitchen Quality Audit" who="Anna F. - Staff" date="09-17-26" time="04:10 PM" points={25} showExec execTime="00:10:00" pillTime="00:20:20" pillClass="chip--gray"/>;}

const PROOFS=[
  {id:1,mission:'Kitchen Quality Audit',person:'Anna F.',checkpoint:'Preparation Surface',date:'09-17-26',time:'04:12 PM',tone:'a'},
  {id:2,mission:'Closing Checklist',person:'Ben R.',checkpoint:'Walk-In Cooler',date:'09-16-26',time:'03:45 PM',tone:'b',video:true},
  {id:3,mission:'Kitchen Quality Audit',person:'Anna F.',checkpoint:'Walk-In Cooler',date:'09-16-26',time:'04:10 PM',tone:'b'},
  {id:4,mission:'Kitchen Quality Audit',person:'Carla M.',checkpoint:'Preparation Surface',date:'09-16-26',time:'03:30 PM',tone:'a',video:true},
  {id:5,mission:'Kitchen Quality Audit',person:'Anna F.',checkpoint:'Preparation Surface',date:'09-16-26',time:'02:10 PM',tone:'a'},
  {id:6,mission:'Closing Checklist',person:'Ben R.',checkpoint:'Walk-In Cooler',date:'09-15-26',time:'04:00 PM',tone:'b'},
];
export function QualityGallery({frame,mobile=false}){
  const {scene,elapsed}=frame;
  const activated=elapsed>.8;
  let items=PROOFS;
  const filtered=['history','by-mission','by-person','by-checkpoint'].includes(scene.id)&&activated;
  if(filtered){
    items=items.filter(p=>p.date==='09-16-26');
    if(scene.id!=='history')items=items.filter(p=>p.mission==='Kitchen Quality Audit');
    if(['by-person','by-checkpoint'].includes(scene.id))items=items.filter(p=>p.person==='Anna F.');
    if(scene.id==='by-checkpoint')items=items.filter(p=>p.checkpoint==='Preparation Surface');
  }
  return <div className={`qd-gallery${mobile?' qd-gallery--mobile':''}`}>
    {!mobile&&<Head title="Gallery"/>}
    <div className="qd-filterbar"><span data-emphasis={scene.id==='history'}>Date <b>{filtered?'Sep 16, 2026':'All Dates'}</b></span><span data-emphasis={scene.id==='by-mission'}>Mission <b>{filtered&&scene.id!=='history'?'Kitchen Quality Audit':'All Missions'}</b></span><span data-emphasis={scene.id==='by-person'}>Person <b>{filtered&&['by-person','by-checkpoint'].includes(scene.id)?'Anna F.':'Everyone'}</b></span><span data-emphasis={scene.id==='by-checkpoint'}>Checkpoint <b>{filtered&&scene.id==='by-checkpoint'?'Preparation Surface':'All Checkpoints'}</b></span></div>
    <div className="qd-gallery-window"><div className="qd-proof-list" style={mobile?{transform:`translateY(-${frame.scroll}px)`}:undefined}>
      {items.map(p=><article className="qd-proof" key={p.id}><ProofPhoto tone={p.tone} label={p.checkpoint} stamp={`${p.date}  ${p.time}`} badge="cloud" ratio={mobile?'16 / 9':'16 / 10'}/><div className="qd-proof-meta"><b>{p.mission}</b><span>{p.person} · {p.video?'Video · 00:12':'Photo'}</span><span>{p.checkpoint}</span></div></article>)}
    </div></div><div className="qd-gallery-count">{items.length} {items.length===1?'Record':'Records'} · Saved To Cloud</div>
  </div>;
}

export default function QualityDemoPanels({frame}){
  const {scene,elapsed,steps,passed,translated,captured,rating}=frame;
  if(scene.view==='guidance'){
    const entries=Object.fromEntries(QUALITY_MISSION.entryFields.map(([id],i)=>[id,i<steps?'1':'']));
    return <div className="mi-detail-inner qd-real-details"><OpenedMission mission={{...QUALITY_MISSION,entries}} state="claimed" showStatusBar={false} showExec execTime="00:02:20"/></div>;
  }
  if(scene.view==='training')return <Panel title="Mission Details" footer={<Action disabled={scene.id==='context'||elapsed<2.4}>Continue To Inspection</Action>}>
    <div className="qd-context"><img src="/mission-logo.png" alt=""/><div><small>Kitchen Quality Audit · Step 2 Of 3</small><h3>Prepare The Inspection Tools</h3></div></div>
    <div className="qd-step-card" data-emphasis={scene.id==='context'}><span className="qd-step-number">2</span><div><b>Before You Begin</b><p>Review the tool-separation guide before inspecting food-contact equipment.</p></div></div>
    <div className="qd-lesson" data-emphasis={scene.id==='micro'}><div className="qd-section-label">Required Micro-Training</div><img src="/Images/Training.png" alt="Taskmaverick training illustration"/><h3>Use The Right Tools</h3><p>Separate tools by work area. Check that each tool is clean before use.</p><div className="qd-progress"><i style={{width:`${scene.id==='micro'?Math.min(100,elapsed/2.4*100):0}%`}}/></div><span>{scene.id==='micro'&&elapsed>=2.4?'✓ Lesson Completed':'Tool Separation · 00:30'}</span></div>
  </Panel>;
  if(scene.view==='quiz')return <Panel title="Competency Check" footer={<Action disabled={!passed}>{passed?'Continue To Inspection':'Pass The Quiz To Continue'}</Action>}><div className="qd-section-label">Kitchen Quality Audit · Required Quiz</div><h2>Which Tools Should You Use?</h2><p>Choose the correct answer before continuing.</p>{['Any Available Tools','The Designated Tools For This Area','The Same Tools For Every Surface'].map((answer,i)=><div key={answer} className={`qd-answer${passed&&i===1?' is-correct':''}`}><span>{passed&&i===1?'✓':'○'}</span>{answer}</div>)}<div className="qd-result" style={{opacity:passed?1:0}}>✓ Correct · Competency Confirmed</div></Panel>;
  if(scene.view==='knowledge')return <Panel title="Knowledge Base"><div className="qd-search">⌕ &nbsp; Kitchen Standards</div>{['Kitchen Standards','Tool Separation','Opening Inspection'].map((title,i)=><div className="qd-knowledge-row" key={title} data-emphasis={i===0}><span>▤</span><div><b>{title}</b><small>Training Material · Available Anytime</small></div><span>›</span></div>)}{elapsed>1.1&&<div className="qd-article" style={{opacity:Math.min(1,(elapsed-1.1)/.3)}} id="quality-reference"><h3>Kitchen Standards</h3><p>Inspect preparation surfaces before service. Use designated equipment and document the final condition.</p><span>✓ Referenced From This Mission</span></div>}</Panel>;
  if(scene.view==='translate')return <Panel title={translated?'Detalles De La Misión':'Mission Details'}><div className="qd-language" data-emphasis><span>Language</span><b>{translated?'Español ✓':'English'}</b><span>⇄</span></div><div className="qd-article"><div className="qd-section-label">{translated?'Paso 2 De 3':'Step 2 Of 3'}</div><h2>{translated?'Preparar Las Herramientas':'Prepare The Inspection Tools'}</h2><p>{translated?'Use las herramientas designadas para cada área. Compruebe que estén limpias antes de usarlas.':'Use the designated tools for each area. Check that they are clean before use.'}</p><div className="qd-warning">{translated?'Evite La Contaminación Cruzada':'Prevent Cross-Contamination'}</div></div><Action>{translated?'Continuar':'Continue'}</Action></Panel>;
  if(scene.view==='capture')return <Panel title="Inspection Checkpoint" footer={<Action>{scene.id==='reuse'?'Capture New Evidence':'Save Checkpoint'}</Action>}><div className="qd-section-label">Kitchen Quality Audit · Step 3 Of 3</div><h2>Preparation Surface</h2><p>Show the final condition after inspection.</p><div className="qd-capture" data-emphasis={scene.id==='capture'}><ProofPhoto tone="a" label={captured?'Preparation Surface':'Camera Preview'} stamp={captured?'09-17-26  04:12:08 PM':undefined} badge={scene.id==='reuse'?'lock':undefined}/>{!captured&&<div className="qd-shutter">◎</div>}</div><div className="qd-capture-types"><span>Photo ✓</span><span>Video ▶ 00:12</span></div>{scene.id==='stamp'&&<div className="qd-stamp" data-emphasis>09-17-26 · 04:12:08 PM</div>}{scene.id==='reuse'&&<div className="qd-evidence-lock" data-emphasis><b>Locked To This Mission</b><p>Previous Evidence Cannot Be Reused</p></div>}{scene.id==='capture'&&captured&&<div className="qd-result">✓ Photo And Video Added</div>}</Panel>;
  if(scene.view==='gallery')return <QualityGallery frame={frame}/>;
  if(scene.view==='ratings')return <Panel title={scene.id==='low-rating'?'Quality Alert':'Rate Completed Mission'}><MiniMission/>{peers.slice(0,scene.id==='self'?1:scene.id==='peers'?3:2).map(([avatar,name,label],i)=><div className="qd-rating-row" key={name} data-emphasis={scene.id==='self'?i===0:scene.id==='peers'?i>0:scene.id==='low-rating'?i===1:true}><img src={`/avatars/${avatar}.png`} alt=""/><div><b>{name}</b><small>{label}</small><Stars value={scene.id==='low-rating'?(i===0?4:rating):Math.min(i===2?5:4,Math.max(0,rating-(elapsed<1.5?i:0)))} size={26}/></div></div>)}{scene.id==='low-rating'&&elapsed>1&&<div className="qd-manager-alert" style={{opacity:Math.min(1,(elapsed-1)/.3)}}><b>Quality Alert · Manager Notified</b><p>Peer Rating: 2 / 5 · Below Required 4 / 5</p><span>Inspect Preparation Surface →</span></div>}</Panel>;
  return null;
}
