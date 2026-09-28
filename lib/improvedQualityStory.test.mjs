import test from 'node:test';
import assert from 'node:assert/strict';
import {QUALITY_STORY,QUALITY_STORY_LENGTH,MOTION,TEXT_AT,qualityStoryFrame,highlightPose,cameraAt,devicesAt,captionAt,layoutAt,toScreen,belowPose,CAPTION,LAYOUT,CUTS,FOCUS,KNOWLEDGE,HANDOFF,ALERTS,LINKS,TRANSLATION,TRANSLATE_AT,STEPS,MICRO,CAPTURE,REOPEN,EMPHASIS,RATE,RATE_LABELS,PEER,VIS,MOBILE,TOUR,WEB,REMOTE,CIRCLE,CONCLUSION} from './improvedQualityStory.mjs';

const S=id=>QUALITY_STORY.find(s=>s.id===id);
const start=id=>S(id).start;
const at=(id,t)=>qualityStoryFrame(start(id)+t);
const typedAt=id=>TEXT_AT[id]+S(id).ready;
const rings=id=>at(id,0).highlights;

test('the script: 22 chapters, continuous, with explicit line breaks',()=>{
 assert.deepEqual(QUALITY_STORY.map(s=>s.id),['guidance','knowledge','instructions','alerts','links','translation','steps','micro','capture','photo','video','emphasis','rate','peer','visibility','mobile','tour','web','remote','performer','timestamp','conclusion']);
 QUALITY_STORY.forEach((scene,i)=>{assert.equal(scene.start,i?QUALITY_STORY[i-1].end:0);assert.ok(!scene.text.includes(' / '));});
 assert.equal(S('capture').text,'Photos Or Videos\nCan Be Taken Within Missions\nThey Are Not Stored On The Device\nAnd Cannot Be Used In Future Instances');
 assert.equal(QUALITY_STORY.at(-1).text,'Execution Quality Is Assured\nWith In-Mission Guidance\nAnd Constant Oversight');
 assert.equal(QUALITY_STORY_LENGTH,QUALITY_STORY.at(-1).end);
});

test('words first, then action: no ring or scroll starts before the words are typed',()=>{
 for(const s of QUALITY_STORY){
  // Chapter 15 opens the menu first on purpose: its words pop in as the menu is open.
  const hs=rings(s.id).filter(h=>!(s.id==='visibility'&&h.target==='tablet-menu'));
  for(const h of hs)assert.ok(h.from>=typedAt(s.id)-1e-9,`${s.id}: ${h.target} ring at ${h.from.toFixed(2)} before the words (${typedAt(s.id).toFixed(2)})`);
 }
 assert.ok(VIS.text>VIS.open,'chapter 15: the words pop in once the menu is open');
 for(const [id,scroll] of [['tour',TOUR.scroll],['remote',REMOTE.scroll],['visibility',VIS.scroll]])assert.ok(scroll[0]>=typedAt(id),`${id} scrolls before its words`);
 for(const p of PEER.people)assert.ok(p.at>=typedAt('peer'));
 assert.ok(CAPTURE.photo.press-MOTION.lead>=typedAt('capture'),'the photo is taken only after all four lines');
});

test('one motion vocabulary: rings lead by MOTION.lead, screens open MOTION.open after the press',()=>{
 for(const s of QUALITY_STORY)for(const h of rings(s.id).filter(h=>h.press!=null))assert.ok(Math.abs(h.press-h.from-MOTION.lead)<1e-9,`${s.id}: ${h.target}`);
 const opens=[[KNOWLEDGE.menu.press,KNOWLEDGE.menu.open],[KNOWLEDGE.kb.press,KNOWLEDGE.kb.open],[HANDOFF.card.press,HANDOFF.open],[MICRO.press,MICRO.open],[MICRO.next,MICRO.page],[MICRO.submit,MICRO.close],
  [CAPTURE.photo.press,CAPTURE.photo.open],[CAPTURE.photo.next,CAPTURE.photo.close],[CAPTURE.video.press,CAPTURE.video.open],[CAPTURE.video.next,CAPTURE.video.close],
  [REOPEN.photo.press,REOPEN.photo.open],[REOPEN.video.press,REOPEN.video.open],[RATE.press,RATE.open],[RATE.submit,RATE.close],
  [VIS.press,VIS.open],[VIS.media,VIS.proofs],[MOBILE.press,MOBILE.open],[MOBILE.media,MOBILE.proofs],[WEB.press,WEB.gallery]];
 for(const [press,open] of opens)assert.ok(Math.abs(open-press-MOTION.open)<1e-9,`${press} -> ${open}`);
 // consecutive presses on one screen are evenly spaced
 for(const list of [STEPS.presses,MICRO.answers])list.slice(1).forEach((t,i)=>assert.ok(Math.abs(t-list[i]-MOTION.gap)<1e-9));
 assert.equal(TOUR.scroll[1]-TOUR.scroll[0],MOTION.scroll);assert.equal(REMOTE.scroll[1]-REMOTE.scroll[0],MOTION.scroll);assert.ok(Math.abs(VIS.scroll[1]-VIS.scroll[0]-MOTION.scroll)<1e-9);
});

test('no idle tails: every chapter ends soon after its last beat, with time to read',()=>{
 const extra={tour:TOUR.scroll[1],remote:REMOTE.scroll[1],visibility:VIS.scroll[1],peer:PEER.people[1].at,video:REOPEN.video.play+MOTION.rec};
 for(const s of QUALITY_STORY){
  const beats=[typedAt(s.id),...rings(s.id).map(h=>h.press??h.from),extra[s.id]??0];
  const tail=s.duration-Math.max(...beats);
  assert.ok(tail<=2.5,`${s.id} idles ${tail.toFixed(2)}s`);
  assert.ok(s.duration-typedAt(s.id)>=.9,`${s.id}: too little time to read`);
 }
});

test('a device that fades out keeps its last screen until it is gone',()=>{
 // chapter 11 -> 12: the phone fades with the video still open
 assert.deepEqual([at('emphasis',.2).proof.kind,at('emphasis',.2).proof.in],['video',1]);
 const d12=devicesAt(start('emphasis')+.2);assert.ok(d12.phoneOpacity>0&&d12.phoneOpacity<1);
 // chapter 15 -> 16: the tablet fades with Business Proofs still open, scrolled to the end
 const v=at('mobile',.2).visibility;assert.deepEqual([v.menu,v.proofsIn,v.scroll],[false,1,1]);
 const d16=devicesAt(start('mobile')+.2);assert.ok(d16.boardOut>0&&d16.boardOut<1);
 // chapter 17 -> 18: the phone fades on Business Proofs
 assert.deepEqual([at('web',.2).proofs.in,at('web',.2).proofs.scroll],[1,1]);
 // chapter 21 -> 22: the report fades with its photos open, where the tour stopped
 assert.deepEqual([at('conclusion',.2).web.rows,at('conclusion',.2).web.scroll],[1,REMOTE.stop]);
 // chapter 6 -> 7: the mission panel fades as it was (drawer open, tablet gone)
 const d7=devicesAt(start('steps')+.2);assert.deepEqual([d7.drawer,d7.handoff],[1,1]);assert.ok(d7.tabletOpacity>0&&d7.tabletOpacity<1);
 // chapter 2 -> 3: the Knowledge Base has closed before the chapter ends
 assert.equal(at('knowledge',S('knowledge').duration-.05).kb.reveal,0);assert.equal(at('knowledge',S('knowledge').duration-.05).menu,false);
});

test('the camera never jumps; it cuts only while nothing is visible',()=>{
 assert.equal(CUTS.length,4);
 for(const cut of CUTS){
  const d=devicesAt(cut);
  assert.equal(d.phoneOpacity,0,`phone visible at the cut ${cut}`);
  assert.ok(!d.tabletShown||d.tabletOpacity===0);assert.ok(d.board===0||d.boardOut===1);assert.equal(d.web,0);
 }
 for(let t=0;t<QUALITY_STORY_LENGTH;t+=.02){if(CUTS.some(c=>Math.abs(t-c)<.1))continue;const a=cameraAt(t),b=cameraAt(t+.02);assert.ok(Math.abs(a.s-b.s)<.06&&Math.abs(a.cy-b.cy)<25&&Math.abs(a.cx-b.cx)<25,`jump at ${t.toFixed(2)}`);}
});

test('framing: phone tops stay visible; devices stay above words that sit below them',()=>{
 for(let t=start('steps');t<start('emphasis');t+=.05){if(devicesAt(t).phoneOpacity<1)continue;assert.ok(toScreen(cameraAt(t),0,LAYOUT.phone.top).y>=LAYOUT.topMargin-.01,`top hidden at ${t.toFixed(2)}`);}
 for(let t=0;t<QUALITY_STORY_LENGTH;t+=.05){
  const l=layoutAt(t);if(l.mode!=='below')continue;
  assert.ok(toScreen(cameraAt(t),0,l.bottom).y<=l.captionTop+.01,`overlap at ${t.toFixed(2)}`);
 }
 // below the report (and the tablet in chapter 15) the words are centered in the space left
 for(const t of [start('web')+WEB.typed,start('remote')+3,start('performer')+2,start('timestamp')+2]){
  const cam=cameraAt(t),c=captionAt(t),bottom=toScreen(cam,0,LAYOUT.webBottom).y;
  assert.ok(Math.abs(c.top-(bottom+900)/2)<.01&&c.yp===-50&&bottom<c.top-40);
 }
 const t15=start('visibility')+VIS.scroll[0]+1;assert.deepEqual(captionAt(t15),belowPose(cameraAt(t15),LAYOUT.tablet.bottom));
});

test('chapter 2: words first, then the tablet; Menu -> Knowledge Base; three kinds in turn',()=>{
 const ch=start('knowledge');
 assert.deepEqual(captionAt(ch+KNOWLEDGE.typed-.1),CAPTION.center);assert.equal(devicesAt(ch+KNOWLEDGE.typed).tabletIn,0);
 assert.equal(devicesAt(ch+KNOWLEDGE.settled).tabletIn,1);
 const cam=cameraAt(ch+KNOWLEDGE.menu.press),c=captionAt(ch+KNOWLEDGE.menu.press),p=toScreen(cam,LAYOUT.tabletWords.x,LAYOUT.tabletWords.y);
 assert.ok(Math.abs(c.left-p.x)<.01&&Math.abs(c.top-p.y)<.01,'the words sit inside the tablet');
 assert.deepEqual([KNOWLEDGE.menu.open-.01,KNOWLEDGE.menu.open+.01,KNOWLEDGE.kb.open+.01].map(t=>at('knowledge',t).menu),[false,true,false]);
 assert.ok(at('knowledge',KNOWLEDGE.kb.open+MOTION.slide+.3).kb.reveal>.99);
 const lit=t=>at('knowledge',t).highlights.filter(h=>highlightPose(t,h).opacity>.5).map(h=>h.target);
 assert.deepEqual(KNOWLEDGE.tour.map(([,from,to])=>lit((from+to)/2)),[['kb-type-0'],['kb-type-1'],['kb-type-4']]);
});

test('chapters 3-6: the mission opens in the tablet drawer, the tablet fades; subjects after the words',()=>{
 const ch=start('instructions'),d=t=>devicesAt(ch+t);
 assert.equal(d(HANDOFF.open-.01).drawer,0);assert.ok(d(HANDOFF.open+.6).drawer>.99);
 assert.equal(d(HANDOFF.lose).handoff,0);assert.equal(d(HANDOFF.lose+HANDOFF.loseFor).handoff,1);
 for(let t=ch;t<start('steps');t+=.1){assert.equal(devicesAt(t).phoneOpacity,0);assert.ok(devicesAt(t).tabletShown&&devicesAt(t).tabletOpacity===1);}
 for(const id of ['alerts','links','translation'])for(const t of [0,1]){
  const cam=cameraAt(start(id)+t),c=captionAt(start(id)+t),p=toScreen(cam,LAYOUT.missionWords.x,LAYOUT.missionWords.y);
  assert.ok(Math.abs(c.top-p.y)<.01&&Math.abs(c.left-p.x)<.01&&cam.s>1.46,id);
  assert.ok(toScreen(cam,922,0).x-c.left>200,`${id}: words reach the panel`);
 }
 assert.deepEqual([ALERTS.subject,LINKS.subject].map((s,i)=>s>=[typedAt('alerts'),typedAt('links')][i]),[true,true]);
 assert.equal(at('translation',TRANSLATE_AT-.02).translated,false);assert.equal(at('translation',TRANSLATE_AT+.01).translated,true);
 assert.ok(TRANSLATION.press>=typedAt('translation'));
});

test('chapter 7: the panel leaves, words centered then down, the phone drops in, three answers',()=>{
 const d=t=>devicesAt(start('steps')+t);
 assert.equal(d(STEPS.out+.01).phoneOpacity,0);assert.equal(d(STEPS.out+.01).guided,true);assert.equal(d(STEPS.settled).phoneOpacity,1);
 assert.deepEqual(captionAt(start('steps')+STEPS.typed-.1),CAPTION.center);
 const t=start('steps')+STEPS.settled;assert.deepEqual(captionAt(t),belowPose(cameraAt(t),LAYOUT.phone.bottom));
 assert.deepEqual([STEPS.presses[0]-.01,...STEPS.presses.map(p=>p+.01)].map(x=>at('steps',x).steps),[0,1,2,3]);
});

test('chapter 8: Play opens the training, the clip plays in real time, quiz, Submit -> Done',()=>{
 assert.deepEqual(rings('micro').filter(h=>h.press!=null).map(h=>h.target),['training','viewer-next','quiz-0-1','quiz-1-0','quiz-2-0','viewer-submit']);
 const tr=t=>at('micro',t).training;
 assert.equal(tr(MICRO.open-.01).in,0);assert.ok(tr(MICRO.open+.8).in>.99);assert.equal(tr(MICRO.close+MOTION.slideOut+.01).in,0);
 assert.ok(Math.abs(tr(MICRO.play+2).video-2)<1e-9,'real time');assert.equal(tr(MICRO.next).video,MICRO.clip);
 assert.equal(tr(MICRO.page-.01).page,0);assert.equal(tr(MICRO.page+MOTION.slide+.01).page,1);
 assert.deepEqual([MICRO.answers[0]-.1,MICRO.answers[2]+.01].map(t=>tr(t).answers),[0,3]);
 assert.equal(tr(MICRO.done-.01).done,false);assert.equal(tr(MICRO.done+.01).done,true);
 const ms=start('micro'),c=captionAt(ms+MICRO.done+1),p=toScreen(cameraAt(ms+MICRO.done+1),800,LAYOUT.training.y);
 assert.ok(Math.abs(c.top-p.y)<.01&&c.opacity>=1);assert.equal(captionAt(ms+MICRO.open+1).opacity,0);
 assert.ok(toScreen(cameraAt(ms+MICRO.open+1),0,LAYOUT.phone.bottom).y<=900);
});

test('chapter 9: words, then the photo, then No asks for a video, recorded in real time',()=>{
 const {photo:P,video:V}=CAPTURE,c=t=>at('capture',t).capture;
 assert.deepEqual(rings('capture').filter(h=>h.press!=null).map(h=>[h.target,h.press]),[['add-photo',P.press],['shutter',P.shoot],['review-next',P.next],['no-5',V.no],['add-video',V.press],['record',V.record],['record',V.stop],['review-next',V.next]]);
 assert.equal(c(P.open-.01).camera.in,0);assert.ok(c(P.open+.6).camera.in>.99);assert.equal(c(P.close+MOTION.slideOut+.01).camera.in,0);
 assert.equal(c(P.shoot+.3).review,true);assert.deepEqual([P.next-.1,P.next+.01].map(t=>c(t).photo),[false,true]);
 assert.equal(c(V.no+.6).camera.kind,'video');assert.deepEqual([V.no-.1,V.no+.01].map(t=>c(t).answered),[false,true]);
 assert.deepEqual([V.record-.1,V.record+1.5,V.stop+1].map(t=>c(t).rec),[0,1,MOTION.rec]);
 assert.equal(c(V.record+1).recording,true);assert.equal(c(V.stop+.01).recording,false);assert.deepEqual([V.next-.1,V.next+.01].map(t=>c(t).video),[false,true]);
 assert.equal(at('capture',1).training.done,true);
 const t=start('capture')+3,cam=cameraAt(t),cap=captionAt(t);
 assert.deepEqual(cap,CAPTION.side);assert.ok(toScreen(cam,965,0).x<cap.left-cap.width/2,'phone overlaps the words');
});

test('chapters 10-11: each file row reopens its proof; the video plays once',()=>{
 const {photo:RP,video:RV}=REOPEN;
 assert.deepEqual(['photo','video'].map(id=>rings(id).map(h=>[h.target,h.press])),[[['photo-file',RP.press]],[['video-file',RV.press]]]);
 for(const id of ['photo','video']){const c=at(id,0).capture;assert.ok(c.photo&&c.video&&c.answered&&c.reveal===1&&c.scroll===1&&c.camera.in===0);}
 const p=(id,t)=>at(id,t).proof;
 assert.equal(p('photo',RP.open-.01).in,0);assert.ok(p('photo',RP.open+.6).in>.99&&p('photo',RP.open+.6).kind==='photo');
 assert.equal(p('video',MOTION.slideOut+.01).in,0);assert.ok(p('video',RV.open+.6).in>.99&&p('video',RV.open+.6).kind==='video');
 assert.equal(p('video',RV.play+MOTION.rec+.3).live>MOTION.rec,true,'played through');
 for(const id of ['photo','video'])assert.deepEqual(cameraAt(start(id)+1),cameraAt(start('capture')+5));
});

test('chapter 12: phone out, cut while empty, tablet pops, zoom right, words left of the closed missions',()=>{
 const d=t=>devicesAt(start('emphasis')+t);
 assert.equal(d(EMPHASIS.cut).phoneOpacity,0);assert.equal(d(EMPHASIS.cut).board,0);assert.ok(d(EMPHASIS.zoom).board>.99);
 const t=start('emphasis')+EMPHASIS.typed,cam=cameraAt(t),c=captionAt(t),p=toScreen(cam,LAYOUT.emphasis.x,LAYOUT.emphasis.y);
 assert.ok(cam.s>1.2&&cam.s<1.3,'gentle push');assert.ok(toScreen(cam,327,30).x>=0&&toScreen(cam,327,30).y>=0&&toScreen(cam,1273,690).x<=1600&&toScreen(cam,1273,690).y<=900,'whole tablet in frame');assert.ok(Math.abs(c.left-p.x)<.01&&Math.abs(c.top-p.y)<.01);
 assert.ok(c.left+c.width/2<toScreen(cam,938,0).x&&c.left-c.width/2>Math.max(0,toScreen(cam,395,0).x));
 assert.ok(toScreen(cam,0,142).y>=0&&toScreen(cam,0,639).y<=900&&toScreen(cam,1188,0).x<=1600);
});

test('chapters 13-14: self-rating in the Rate Mission sidebar, then two peers in turn',()=>{
 const r=t=>at('rate',t).rating;
 assert.equal(r(RATE.open-.01).panel,0);assert.ok(r(RATE.open+.6).panel>.99);assert.equal(r(RATE.close+MOTION.slideOut+.01).panel,0);
 assert.deepEqual([RATE.drag[0]-.1,RATE.drag[1]].map(t=>RATE_LABELS[Math.round(r(t).value)]),['Poor','Excellent']);
 assert.equal(r(RATE.drag[0]-.1).moved,false);assert.equal(r(RATE.drag[0]+.01).moved,true);
 assert.deepEqual(r(RATE.badge-.1).ratings,[]);assert.deepEqual(r(RATE.badge+1).ratings.map(x=>[x.initials,x.score,x.pop]),[['AF',5,1]]);
 const cam=cameraAt(start('rate')+RATE.open+1),c=captionAt(start('rate')+RATE.open+1);
 assert.ok(toScreen(cam,0,77).y>=0&&toScreen(cam,0,641).y<=900&&toScreen(cam,1204,0).x<=1600&&c.left-c.width/2>=0,'the whole sidebar and the words in frame');
 const p=t=>at('peer',t).rating,[ben,carla]=PEER.people;
 assert.deepEqual(p(0).ratings.map(x=>x.initials),['AF']);
 assert.ok(p(ben.at+.5).bubbles[0].opacity>.99&&p(ben.at+.5).bubbles[1].opacity===0);
 assert.equal(p(carla.at).bubbles[0].opacity,0,'one bubble at a time');
 assert.deepEqual(p(carla.at+1.5).ratings.map(x=>[x.initials,x.score]),[['AF',5],['BR',4],['CM',5]]);
 assert.deepEqual(at('tour',1).rating.ratings.map(x=>x.initials),['AF','BR','CM']);
});

test('chapters 15-17: tablet menu -> Business Proofs; phone menu -> Business Proofs; the tour',()=>{
 const v=t=>at('visibility',t).visibility;
 assert.deepEqual(rings('visibility').map(h=>h.target),['tablet-menu','business-media']);
 assert.equal(v(VIS.open-.01).menu,false);assert.equal(v(VIS.open+.01).menu,true);assert.equal(v(VIS.proofs+.01).menu,false);
 assert.ok(v(VIS.proofs+.6).proofsIn>.99);assert.deepEqual([VIS.scroll[0]-.05,VIS.scroll[1]+.05].map(t=>v(t).scroll),[0,1]);
 const d=t=>devicesAt(start('mobile')+t),m=t=>at('mobile',t).proofs;
 assert.equal(d(MOBILE.cut).boardOut,1);assert.equal(d(MOBILE.cut).phoneOpacity,0);assert.equal(d(MOBILE.text).phoneOpacity,1);
 assert.deepEqual(rings('mobile').map(h=>h.target),['phone-menu','business-media']);
 assert.deepEqual([MOBILE.open-.01,MOBILE.open+.01,MOBILE.proofs+.01].map(t=>m(t).menu),[false,true,false]);
 assert.ok(m(MOBILE.proofs+.8).in>.99);assert.deepEqual(captionAt(start('mobile')+MOBILE.text),CAPTION.side);
 const t=x=>at('tour',x).proofs;
 assert.equal(t(0).in,1);assert.equal(t(TOUR.scroll[0]-.05).scroll,0);assert.equal(t(TOUR.scroll[1]+.05).scroll,1);
});

test('chapters 18-22: web Gallery View, the remote tour, names then dates, the conclusion',()=>{
 const d=t=>devicesAt(start('web')+t),w=t=>at('web',t).web;
 assert.equal(d(WEB.cut).phoneOpacity,0);assert.equal(d(WEB.cut).web,0);assert.ok(d(WEB.text).web>.99);
 assert.deepEqual([WEB.press-.05,WEB.press+.01].map(t=>w(t).gallery),[false,true]);
 assert.equal(w(WEB.gallery-.05).rows,0);assert.ok(w(WEB.gallery+.8).rows>.99);
 const cam=cameraAt(start('web')+WEB.press);assert.ok(cam.s>1.15&&toScreen(cam,1006,146).y>0,'pushed in, Gallery View in frame');
 assert.equal(at('remote',REMOTE.scroll[0]-.05).web.scroll,0);assert.equal(at('remote',REMOTE.scroll[1]+.05).web.scroll,REMOTE.stop);
 assert.equal(at('performer',0).web.rows,1);assert.equal(at('timestamp',0).web.scroll,REMOTE.stop);
 const lit=(id,t)=>at(id,t).highlights.filter(h=>highlightPose(t,h).opacity>.5).map(h=>h.target);
 assert.deepEqual(lit('performer',CIRCLE.draw+1),['web-name-2','web-name-3']);assert.deepEqual(lit('timestamp',CIRCLE.draw+1),['web-date-2','web-date-3']);
 assert.equal(devicesAt(start('conclusion')+CONCLUSION.out).webOut,1);assert.equal(QUALITY_STORY.at(-1).view,'title');
 assert.ok(CONCLUSION.text>=CONCLUSION.out,'the closing lines wait for the page to fade');
});
