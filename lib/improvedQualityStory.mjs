import {captionReady} from './efficiencyCaptions.mjs';

export const QUALITY_TEXT_SPEED=1.18;
const script=[
 ['guidance','Teams Are Constantly Guided / To Perform With Quality & Precision',3.6,'title'],
 ['knowledge','As Teams Work / Information Is Readily Available / In A Knowledge Base',10.3,'knowledge'],
 ['instructions','Within Each Mission / Instructions Can Be Included / To Remind About Standards',5.4,'mission'],
 ['alerts','Alerts Can Be Included / To Warn About Risks',3.8,'mission'],
 ['links','Add Links To Outside Resources',3.3,'mission'],
 ['translation','Instantly Translate / All Mission Content',4.1,'mission'],
 ['steps','Executions Can Be Guided / Step-By-Step',5.2,'guided'],
 ['micro','Micro-Trainings Are Delivered / In Context Of Actual Work',5.4,'guided'],
 ['quiz','Passing A Quiz Can Be Required / To Ensure Competency Before Proceeding',6.2,'guided'],
 ['capture','Photos Or Videos / Can Be Taken Within Missions / They Are Not Stored On The Device / And Cannot Be Used In Future Instances',8.2,'capture'],
 ['photo','Photos Document Proper Standards',3.8,'photo'],
 ['video','Videos Report Conditions',4.2,'video'],
 ['closed','Quality Is Systematically Emphasized',3.2,'board'],
 ['self','Self-Ratings Encourage Personal Accountability',4,'ratings'],
 ['peers','Peer Ratings Crowdsource Quality Control',5.2,'ratings'],
 ['visibility','Managers Enjoy Total Visibility',3.5,'menu'],
 ['mobile','From Any Mobile Device',3.5,'mobile'],
 ['evidence','They Tour Documented Evidence',4.8,'mobile'],
 ['gallery','From The Web In Gallery View',4,'web'],
 ['tour','They Remotely Tour Conditions',4.4,'web'],
 ['performer','Who Performed',3,'web'],
 ['timestamp','At What Exact Date & Time',3.2,'web'],
 ['conclusion','Execution Quality Is Assured / With In-Mission Guidance / And Constant Oversight',4.8,'title'],
];
let cursor=0;
export const QUALITY_STORY=script.map(([id,script,duration,view],index)=>{
 const text=script.split(' / ').join('\n'); const start=cursor; cursor=Math.round((cursor+duration)*100)/100;
 return {id,text,start,end:cursor,duration,view,number:index+1,ready:captionReady(text)/QUALITY_TEXT_SPEED};
});
export const QUALITY_STORY_LENGTH=cursor;
export const clamp=p=>Math.max(0,Math.min(1,p));
export const ease=p=>1-(1-clamp(p))**3;
export function qualityStoryFrame(time){
 const scene=QUALITY_STORY.find(s=>time<s.end)??QUALITY_STORY.at(-1);
 const elapsed=Math.max(0,time-scene.start);
 const knowledge=scene.id==='knowledge'&&elapsed>=3.9;
 const knowledgeStep=!knowledge?'closed':elapsed<5.1?'list':elapsed<6.4?'overview':elapsed<8.1?'lesson':'chart';
 const menu=scene.id==='knowledge'&&elapsed>=2.9&&elapsed<3.9||scene.id==='visibility';
 const mission=scene.view==='mission'&&(scene.id!=='instructions'||elapsed>=.65);
 const translated=scene.id==='translation'&&elapsed>=2.3;
 const steps=scene.id==='steps'?Math.min(3,Math.max(0,Math.floor((elapsed-.75)/.95))):scene.number>7?3:0;
 const answers=scene.id==='quiz'?Number(elapsed>=1.7)+Number(elapsed>=3):0;
 const passed=scene.id==='quiz'&&elapsed>=3.8;
 const photoCaptured=scene.number>10||scene.id==='capture'&&elapsed>=1.7;
 const videoCaptured=scene.number>10||scene.id==='capture'&&elapsed>=4.7;
 let target=null,actionAt=0;
 if(scene.id==='knowledge'){
  if(elapsed<2.9){target='menu';actionAt=2.9;}
  else if(elapsed<3.9){target='knowledge';actionAt=3.9;}
  else if(elapsed<5.1){target='kb-mission';actionAt=5.1;}
  else if(elapsed<6.4){target='kb-start';actionAt=6.4;}
  else if(elapsed<8.1){target='kb-next';actionAt=8.1;}
 }else if(scene.id==='instructions'){target=elapsed<.65?'mission':'instructions';actionAt=elapsed<.65?.65:scene.ready;}
 else if(scene.id==='alerts'){target='alert';actionAt=scene.ready;}
 else if(scene.id==='links'){target='link';actionAt=1.2;}
 else if(scene.id==='translation'){target='translate';actionAt=2.3;}
 else if(scene.id==='steps'&&steps<3){target=`yes-${steps}`;actionAt=1.7+steps*.95;}
 else if(scene.id==='micro'&&elapsed<2){target='training';actionAt=2;}
 else if(scene.id==='quiz'&&elapsed<4.2){
  if(elapsed<1.7){target='quiz-answer-0';actionAt=1.7;}
  else if(elapsed<3){target='quiz-answer-1';actionAt=3;}
  else {target='quiz-submit';actionAt=3.8;}
 }
 else if(scene.id==='mobile'&&elapsed<1.2){target='business-media';actionAt=1.2;}
 else if(scene.id==='gallery'&&elapsed<1.4){target='gallery';actionAt=1.4;}
 return {scene,elapsed,menu,knowledge,knowledgeStep,mission,translated,target,actionAt,steps,answers,passed,photoCaptured,videoCaptured};
}
