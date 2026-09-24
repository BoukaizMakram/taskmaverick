'use client';
import {useEffect,useRef} from 'react';
import {IconBack} from './PhoneShell';
import {BoardMenu} from './BoardNavigation';
import {ease,clamp} from '@/lib/improvedQualityStory.mjs';

export const SHELVING='/demo-quality/shelving.png';
export const DAMAGE='/demo-quality/damaged-hinge.png';
const CLIP='/demo-quality/condition-report.mp4';
export function DemoVideo({time=0,src=CLIP,playing=false,speed=1,poster=DAMAGE}){
 const ref=useRef(null);
 useEffect(()=>{const v=ref.current;if(!v)return;const sync=()=>{const t=Math.max(0,time)%(v.duration||999);if(Math.abs(v.currentTime-t)>.25)v.currentTime=t;v.playbackRate=speed;if(playing)v.play().catch(()=>{});else v.pause();};sync();v.addEventListener('loadedmetadata',sync);return()=>v.removeEventListener('loadedmetadata',sync);},[time,playing,speed]);
 return <video ref={ref} src={src} poster={poster} muted playsInline preload="auto"/>;
}
export function PanelHead({title='Mission Details',translate=false}){return <header className="iq-panel-head"><span className="om-hbtn"><IconBack/></span><b>{title}</b><div>{translate&&<span className="iq-language">ES</span>}<span className="iq-close">×</span></div></header>;}
export function MediaBadge(){return <span className="iq-media-badge"><img src="/mission-logo.png" alt=""/>Media</span>;}
const KNOWLEDGE_ITEMS=[['Cooking Food Temps','','08-28-26','09:13 PM'],['Lemon Dressing Recipe','','05-02-26','12:44 AM'],['Alley Shed Doors','Training','08-20-26','11:54 PM'],['Pastry Cream','','04-14-26','02:03 AM'],['Avoid Physical Contact','HR','03-27-26','12:15 AM'],['Chinese Chicken Salad','Recipes','07-31-26','08:47 PM'],['BBQ Chicken Pizza','Recipes','07-08-26','07:41 PM']];
function CookingSummary(){return <div className="iq-cooking-summary"><MediaBadge/><small>▱ Training</small><h3>Cooking Food Temps</h3><time>09-23-26 02:36 PM</time><p>Please read, listen or watch carefully to the following in order to pass the quiz(zes):</p></div>;}
function CookingChart(){return <table className="iq-cooking-chart"><thead><tr><th>Food Product</th><th>Minimum Internal Temperature</th><th>Minimum Time Held</th></tr></thead><tbody>{[['Poultry','165°F','15 Seconds'],['Reheating foods','165°F','15 Seconds'],['Microwave foods','165°F','15 Seconds'],['Ground beef, ground pork','155°F','15 Seconds'],['Beef roast, pork roast, ham','145°F','4 minutes'],['Pork','145°F','15 Seconds'],['Beef, pork','145°F','15 Seconds'],['Fish, seafood','145°F','15 Seconds'],['Eggs for immediate service','145°F','15 Seconds'],['Eggs for buffets','155°F','15 Seconds']].map(row=><tr key={row[0]}>{row.map((cell,i)=><td key={i}>{cell}</td>)}</tr>)}</tbody></table>;}
export function KnowledgeBase({frame}){
 const {elapsed,knowledgeStep:step,scene}=frame;
 const reveal=ease((elapsed-3.9)/.38)*(1-ease((elapsed-scene.duration+.4)/.4));
 return <div className="iq-knowledge-layer" style={{'--iq-kb-reveal':reveal}}><div className="mi-drawer-shade iq-knowledge-shade"/><aside className="iq-knowledge" aria-label="Knowledge Base" style={{transform:`translateX(${(1-reveal)*100}%)`}}>
 {step==='list'?<><PanelHead title="Knowledge Base"/><div className="iq-kb-list">{KNOWLEDGE_ITEMS.map(([title,category,date,time],i)=><article className="iq-kb-card" key={title} data-iq-target={i===0?'kb-mission':undefined}><MediaBadge/><h3>{title}</h3>{category&&<p>{category}</p>}<time>{date} {time}</time></article>)}</div></>:<div className="iq-kb-media"><PanelHead translate/>{step!=='lesson'&&<CookingSummary/>}
 {step==='overview'?<div className="iq-kb-lessons"><div className="iq-training-row"><span>1.</span><b>Cooking Temperatures</b><em>◖ 00:23</em></div><div className="iq-training-row"><span>2.</span><b>Cooking Temp Chart</b><em>N/A</em></div><small>Estimated Time ~ &nbsp; 00:23</small><div className="iq-blue-action" data-iq-target="kb-start">Start</div></div>:<div className="iq-kb-viewer"><div className="iq-lesson-head"><span><small>{step==='lesson'?'1/2':'2/2'}</small><b>{step==='lesson'?'Cooking Temperatures':'Cooking Temp Chart'}</b></span><span>↑</span><span data-iq-target="kb-next">↓</span></div>{step==='lesson'?<><div className="iq-reading">Food is cooked to enhance its flavor and appearance, but more importantly to kill dangerous microorganisms that can lead to food poisoning. View the chart below in order to pass a short quiz on cooking temperatures. The one exception to the rules on this chart is the rare beef roast—where contamination exists only on the surface of the meat it only needs to be cooked to 130°F.</div><div className="iq-audio-progress"><img src="/mission-logo.png" alt=""/><div><i style={{width:`${clamp((elapsed-6.4)/1.7)*100}%`}}/></div><span>00:{String(Math.floor(clamp((elapsed-6.4)/1.7)*23)).padStart(2,'0')}</span></div></>:<><CookingChart/><div className="iq-blue-action">Close</div></>}</div>}
 </div>}
 </aside></div>;
}
function ChecklistSummary(){return <div className="iq-checklist-summary"><span><img src="/mission-logo.png" alt=""/>Checklist <b>25</b><em>00:08:42</em></span><h3>Opening Quality Check</h3><small>Kitchen / Food Preparation</small></div>;}
const checks=['Are the shelves clean and organized?','Are all items stored in the designated area?','Is the work area ready for the next shift?'];
function DemoCheckbox({checked}){return <span className={`iq-checkbox${checked?' is-checked':''}`} aria-hidden="true">{checked?'✓':''}</span>;}
export function GuidedMission({frame}){
 const {scene,elapsed,steps,passed}=frame;
 const training=scene.id==='micro',quiz=scene.id==='quiz';
 const scroll=training?ease(elapsed/.65)*265:quiz?265:0;
 return <div className="iq-panel iq-guided"><PanelHead translate/><ChecklistSummary/><div className="iq-guide-window"><div className="iq-guide-content" style={{transform:`translateY(-${scroll}px)`}}>
 <div className="iq-group-label">Checklist <span>{passed?4:steps}/4</span></div>
 {checks.map((text,i)=><section className="iq-checkpoint" key={text}><b>{i+1}. {text}</b><div className="iq-yes-options">{['Yes','No'].map(answer=><span role="checkbox" aria-checked={steps>i&&answer==='Yes'} data-iq-target={answer==='Yes'?`yes-${i}`:undefined} key={answer}><DemoCheckbox checked={steps>i&&answer==='Yes'}/>{answer}</span>)}</div></section>)}
 <section className="iq-checkpoint"><b>4. Please complete this training before proceeding.</b><div className="iq-training-launch" data-iq-target="training"><span>Shelving Standards</span><span className="iq-training-play"><i>▶</i> Play</span></div>{passed&&<p className="iq-pass">✓ Training complete · Quiz passed</p>}</section>
 </div></div><div className={`iq-blue-action ${!passed?'is-disabled':''}`}>{quiz?passed?'Continue':'Pass Quiz To Continue':'Close'}</div></div>;
}
const QUIZ_OPTIONS=['Keep ingredients in sealed, labeled containers.','Store each item in its designated place.','Leave damaged equipment in service until the next shift.'];
export function TrainingPopup({frame,playing,speed}){
 const {scene,elapsed,answers,passed}=frame,quiz=scene.id==='quiz';
 const p=quiz?1-ease((elapsed-4.45)/.35):ease((elapsed-2)/.4);
 const expand=quiz?ease(elapsed/.4):0;
 return <div className="iq-training-popup" aria-label="Shelving Standards training viewer" style={{opacity:p,top:180-130*expand,transform:`translateY(${25*(1-p)}px) scale(${.94+.06*p})`,visibility:p===0?'hidden':'visible'}}>
 <div className="iq-training-video" style={{height:300-130*expand}}><DemoVideo src="/demo-quality/shelving-training.mp4" poster={SHELVING} time={quiz?3.4:Math.max(0,elapsed-2)} playing={playing&&!quiz&&elapsed>=2} speed={speed}/>{(quiz||!playing)&&<span className="iq-video-play" aria-label="Play training video">▶</span>}</div>
 {quiz?<div className="iq-quiz-reveal" style={{gridTemplateRows:`${expand}fr`,opacity:expand}}><section className="iq-quiz"><header className="iq-quiz-head"><mark>Quiz</mark><span>↑</span><span>↓</span></header><div className="iq-quiz-body"><b>1. Please select ALL of the correct statements.</b><small>*select the correct options</small>{QUIZ_OPTIONS.map((text,i)=><div role="checkbox" aria-checked={i<answers} className="iq-quiz-option" data-iq-target={`quiz-answer-${i}`} key={text}><DemoCheckbox checked={i<answers}/><span>{text}</span></div>)}</div><div className={`iq-blue-action ${answers<2?'is-disabled':''}`} data-iq-target="quiz-submit">{passed?'✓ Quiz Passed · Submit & Close':'Submit & Close'}</div></section></div>:<div className="iq-video-progress"><i style={{width:`${clamp((elapsed-2)/3.2)*100}%`}}/></div>}
 </div>;
}
export function CapturePanel({frame,playing,speed}){const {elapsed,photoCaptured,videoCaptured}=frame;return <div className="iq-panel"><PanelHead/><ChecklistSummary/><div className="iq-capture-body">{[['5. Document the shelving standard',SHELVING,photoCaptured,'Photo'],['6. Report damaged equipment',DAMAGE,videoCaptured,'Video']].map(([title,src,captured,kind],i)=><section className="iq-capture-check" key={title}><b>{title}</b><div className="iq-capture-preview"><>{i?<DemoVideo time={Math.min(2.1,Math.max(0,elapsed-2.6))} playing={playing&&elapsed>=2.6&&!videoCaptured} speed={speed}/>:<img src={src} alt={title}/>}</>{!captured&&<span className="iq-shutter">{i?'●':'◎'}</span>}<span className="iq-capture-flash" style={{opacity:Math.max(0,1-Math.abs(elapsed-(i?4.7:1.7))/.17)}}/></div><span className={captured?'iq-captured':'iq-record'}>{captured?`✓ ${kind} attached · 09-23-26 04:12:${i?'24':'08'} PM`:`${i&&elapsed>2.6?'● Recording…':'Take '+kind}`}</span></section>)}<p className="iq-evidence-note" style={{opacity:ease((elapsed-5.7)/.3)}}>Saved to this mission · Fresh capture required each time</p></div></div>;}
export function EvidenceZoom({frame,playing,speed}){const video=frame.scene.id==='video',p=ease((frame.elapsed-.6)/.65);return <div className="iq-evidence-zoom" style={{opacity:ease(frame.elapsed/.3),transform:`scale(${.84+.16*p})`}}><PanelHead title={video?'Video · Equipment condition':'Photo · Shelving standard'}/><div className="iq-zoom-media" style={{'--iq-photo-zoom':1+.15*ease((frame.elapsed-1)/2)}}>{video?<DemoVideo time={frame.elapsed} playing={playing} speed={speed}/>:<img src={SHELVING} alt="Organized shelving with sealed containers and evenly stacked plates"/>}</div><footer>Anna F. · Opening Quality Check <span>09-23-26 · 04:12:{video?'24':'08'} PM</span></footer></div>;}
export function RatingsPanel({frame}){const self=frame.scene.id==='self',elapsed=frame.elapsed;const people=self?[['01','Anna F.','Self-rating',.7]]:[['05','Ben R.','Peer rating',.7],['04','Carla M.','Peer rating',2.5]];return <div className="iq-panel iq-ratings"><PanelHead title="Rate Missions"/><ChecklistSummary/><div className="iq-rating-list">{people.map(([avatar,name,label,start])=><section className="iq-rating-person" key={name} style={{opacity:ease((elapsed-start+.3)/.3),transform:`translateY(${14*(1-ease((elapsed-start+.3)/.3))}px)`}}><img src={`/avatars/${avatar}.png`} alt=""/><div><b>{name}</b><small>{label}</small><div className="iq-stars">{[1,2,3,4,5].map(n=><span key={n} style={{color:elapsed>=start+n*.16?'#efb523':'#d9dfe4',transform:`scale(${elapsed>=start+n*.16&&elapsed<start+n*.16+.2?1.3:1})`}}>★</span>)}</div><small className="iq-pass" style={{opacity:elapsed>start+1?1:0}}>Rating saved</small></div></section>)}</div></div>;}
const PROOFS=[
 {title:'Crepe Station Temp',name:'Angel R',date:'07-15-26 10:01 AM',execution:'00:01:25',duration:'00:31:58',image:'/demo-quality/media-proofs-temperature.png',crop:522},
 {title:'Pest Check Crepe',name:'Angel R',date:'07-15-26 09:59 AM',execution:'00:01:17',duration:'01:30:34',image:'/demo-quality/media-proofs-pest.png',crop:842},
];
function FilterIcon(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16l-6 8v6l-4 2v-8Z"/></svg>;}
function ProofsHeader(){return <header className="iq-proofs-header"><span><IconBack/></span><b>Media Proofs</b><span><FilterIcon/></span></header>;}
function ProofMission({record,emphasis,progress=1}){return <article className="iq-proof-mission"><header><div className="iq-proof-kind"><img src="/mission-logo.png" alt=""/><b>Survey</b><span>{record.execution}</span><strong>{record.duration}</strong></div><small>▱ Operations</small><h3>{record.title}</h3><div className="iq-proof-meta"><span className={emphasis==='performer'?'iq-circled':''} style={{'--iq-circle':progress}}>{record.name}</span><time className={emphasis==='timestamp'?'iq-circled':''} style={{'--iq-circle':progress}}>{record.date}</time></div></header><div className="iq-proof-mosaic" style={{aspectRatio:`3575 / ${2720-record.crop}`}}><img src={record.image} alt={`Photo proofs for ${record.title}: ${record.title==='Crepe Station Temp'?'six refrigerator and ingredient temperature readings':'sink, cleaning supplies and work surfaces'}`} style={{transform:`translateY(-${record.crop/2720*100}%)`}}/></div></article>;}
export function EvidenceFeed({frame,tablet=false}){
 const progress=frame.scene.id==='evidence'?ease((frame.elapsed-.3)/3.8):0;
 const scroll=tablet?ease((frame.elapsed-2.15)/2.4)*345:progress*290;
 return <div className={`iq-proofs ${tablet?'iq-proofs--tablet':''}`}><ProofsHeader/><div className="iq-proofs-window"><div style={{transform:`translateY(-${scroll}px)`}}>{PROOFS.map(record=><ProofMission key={record.title} record={record}/>)}</div></div></div>;
}
export function MobileMenu(){return <div className="iq-phone-menu"><BoardMenu boardType="team" onDismiss={()=>{}} onNavigate={()=>{}} businessMediaLabel="Media Proofs"/></div>;}
export function WebGallery({frame}){
 const {scene,elapsed}=frame,gallery=scene.id!=='gallery'||elapsed>=1.4;
 const scroll=scene.id==='tour'?ease((elapsed-.3)/3.5)*556:scene.id==='performer'||scene.id==='timestamp'?556:0;
 return <div className="iq-web"><div className="iq-browser-bar"><i/><i/><i/><span>Taskmaverick · Media Proofs</span></div><header><img src="/logo.svg" alt="Taskmaverick"/><b>Media Proofs</b><span>Angel R</span></header><div className="iq-web-tools"><div className="iq-proof-search">⌕ Search</div><span className={gallery?'is-active':''} data-iq-target="gallery">▦ Gallery View</span><FilterIcon/></div><div className={`iq-web-window ${gallery?'iq-proofs-gallery':'iq-proofs-list'}`}><div style={{transform:`translateY(-${scroll}px)`}}>{PROOFS.map(record=><ProofMission key={record.title} record={record} emphasis={scene.id} progress={ease((elapsed-.55)/.45)}/>)}</div></div></div>;
}
