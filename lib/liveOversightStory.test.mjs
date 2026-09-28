import test from 'node:test';
import assert from 'node:assert/strict';
import {OVERSIGHT_STORY,OVERSIGHT_LENGTH,MOTION,TEXT_AT,CIRCLE_COLUMNS,oversightFrame,highlightPose,cameraAt,devicesAt,captionAt,toScreen,LAYOUT,CAPTION,RHYTHM,CIRCLES,DETAILS,PHOTOS,VIDEOS,DATA,DASHBOARDS,ANOMALIES,HISTORY,GROUPS,GALLERY,EVOLUTION,CONCLUSION} from './liveOversightStory.mjs';
import {HISTORY as RUNS,historyByUnit,reportTree,RESPONSES,STORAGE_PHOTOS,RUNNING} from './liveOversightData.mjs';

const S=id=>OVERSIGHT_STORY.find(s=>s.id===id);
const start=id=>S(id).start;
const at=(id,t)=>oversightFrame(start(id)+t);
const typedAt=id=>TEXT_AT[id]+S(id).ready;
const rings=id=>at(id,0).highlights;

test('the script: 21 chapters, continuous, words as written',()=>{
 assert.deepEqual(OVERSIGHT_STORY.map(s=>s.id),['intro','rhythm','aging','claimed','performing','completed','performed','duration','details','photos','videos','data','dashboards','anomalies','history','byMission','byPerson','byCheckpoint','gallery','evolution','conclusion']);
 OVERSIGHT_STORY.forEach((s,i)=>assert.equal(s.start,i?OVERSIGHT_STORY[i-1].end:0));
 assert.equal(S('intro').text,'Remotely Monitor Operations\nFrom Anywhere');
 assert.equal(S('conclusion').text,'Remotely Monitor Trends\nAudit Conditions\nMaintain Visibility\nInto Every Aspect Of Business');
 assert.equal(OVERSIGHT_LENGTH,OVERSIGHT_STORY.at(-1).end);
});

test('words first, then action; one motion vocabulary; no idle tails',()=>{
 for(const s of OVERSIGHT_STORY){
  const hs=rings(s.id);
  for(const h of hs){
   assert.ok(h.from>=typedAt(s.id)-1e-9,`${s.id}: ${h.target} before the words`);
   if(h.press!=null)assert.ok(Math.abs(h.press-h.from-MOTION.lead)<1e-9);
  }
  const beats=[typedAt(s.id),...hs.map(h=>h.press??h.from),s.id==='rhythm'?RHYTHM.scroll[1]:0,s.id==='evolution'?EVOLUTION.scroll[1]:0,s.id==='videos'?VIDEOS.play+MOTION.rec:0];
  assert.ok(s.duration-Math.max(...beats)<=2.5,`${s.id} idles`);
  assert.ok(s.duration-typedAt(s.id)>=.9,`${s.id}: too little time to read`);
 }
 for(const [p,o] of [[DETAILS.press,DETAILS.open],[PHOTOS.press,PHOTOS.open],[VIDEOS.press,VIDEOS.open],[DASHBOARDS.press,DASHBOARDS.switch],[HISTORY.press,HISTORY.view],...Object.values(GROUPS).flatMap(g=>[[g.press,g.menu],[g.option,g.regroup]]),[GALLERY.press,GALLERY.open]])assert.ok(Math.abs(o-p-MOTION.open)<1e-9);
 assert.ok(RHYTHM.scroll[0]>=typedAt('rhythm')&&EVOLUTION.scroll[0]>=typedAt('evolution'));
});

test('the camera never jumps, keeps the window above the words; words centered below it',()=>{
 for(let t=0;t<OVERSIGHT_LENGTH;t+=.02){const a=cameraAt(t),b=cameraAt(t+.02);assert.ok(Math.abs(a.s-b.s)<.06&&Math.abs(a.cy-b.cy)<25&&Math.abs(a.cx-b.cx)<25,`jump at ${t.toFixed(2)}`);}
 for(let t=start('rhythm');t<start('conclusion');t+=.05){
  const cam=cameraAt(t),bottom=toScreen(cam,0,LAYOUT.webBottom).y,c=captionAt(t);
  assert.ok(bottom<=LAYOUT.webCaptionTop+.01,`overlap at ${t.toFixed(2)}`);
  assert.ok(Math.abs(c.top-(bottom+900)/2)<.01&&c.yp===-50);
 }
 assert.deepEqual(captionAt(start('intro')+1),CAPTION.center);assert.deepEqual(captionAt(start('conclusion')+3),CAPTION.center);
});

test('chapters 2-8: the board pops in and scrolls; one whole column highlighted per chapter',()=>{
 assert.equal(devicesAt(start('rhythm')+RHYTHM.pop-.01).web,0);assert.ok(devicesAt(start('rhythm')+RHYTHM.text).web>.99);
 assert.deepEqual([RHYTHM.scroll[0]-.05,RHYTHM.scroll[1]+.05].map(t=>at('rhythm',t).scroll),[0,1]);
 for(const id of Object.keys(CIRCLES)){
  const lit=at(id,CIRCLES[id].draw+.6).highlights.filter(h=>highlightPose(CIRCLES[id].draw+.6,h).opacity>.5).map(h=>h.target);
  assert.deepEqual(lit,[`col-${CIRCLE_COLUMNS[id]}`],id);assert.equal(at(id,0).scroll,1,`${id}: the board stays scrolled`);
 }
});

test('chapters 9-12: sidebar, photo, video, then the three measurements in sequence',()=>{
 assert.equal(at('details',DETAILS.open-.01).drawer,0);assert.ok(at('details',DETAILS.open+.6).drawer>.99);
 assert.ok(at('photos',PHOTOS.open+.6).viewer.in>.99&&at('photos',PHOTOS.open+.6).viewer.kind==='photo');
 assert.deepEqual(rings('photos').map(h=>h.target),['file-photo','viewer-next']);assert.deepEqual([PHOTOS.swap-.01,PHOTOS.swap+.01].map(t=>at('photos',t).viewer.index),[0,1]);
 assert.ok(Math.abs(PHOTOS.swap-PHOTOS.next-MOTION.open)<1e-9);
 assert.equal(at('videos',MOTION.slideOut+.01).viewer.in,0);
 const v=at('videos',VIDEOS.play+1).viewer;assert.ok(v.kind==='video'&&v.in>.99&&Math.abs(v.live-1)<1e-9);
 assert.equal(at('data',MOTION.slideOut+.01).viewer.in,0);assert.equal(at('data',0).drawer,1);
 const lit=t=>at('data',t).highlights.filter(h=>highlightPose(t,h).opacity>.5).map(h=>h.target);
 assert.deepEqual(DATA.draws.map(t=>lit(t+.45)),[['data-height'],['data-width'],['data-length']],'one at a time, in sequence');
});

test('chapters 13-15: Reports -> Data Board, anomalies, then back to the Overview history',()=>{
 const p=(id,t)=>at(id,t).pages;
 assert.equal(p('dashboards',DASHBOARDS.switch-.01).data,0);assert.equal(p('dashboards',DASHBOARDS.switch+MOTION.out).data,1);
 assert.equal(p('anomalies',1).data,1);assert.deepEqual(rings('anomalies').map(h=>h.target),['anomaly-height','anomaly-length']);
 assert.equal(p('history',HISTORY.switch-.01).data,1);assert.deepEqual(p('history',HISTORY.switch+MOTION.out),{overview:1,data:0,usage:0});
 assert.equal(at('history',HISTORY.view-.01).view,'Running');assert.equal(at('history',HISTORY.view+.01).view,'History');
 assert.equal(at('history',HISTORY.switch+.5).drawer,0,'the Overview comes back without the sidebar');
 assert.deepEqual(historyByUnit().map(g=>g.label),['West Location','Main Location']);
});

test('chapters 16-20: the Usage Report is grouped by mission, person, checkpoint; Gallery View; the area over a week',()=>{
 const m=GROUPS.byMission;
 assert.deepEqual(rings('byMission').map(h=>h.target),['nav-Reports','group-by','group-Mission']);
 assert.deepEqual(at('byMission',m.switch-.01).pages,{overview:1,data:0,usage:0});assert.deepEqual(at('byMission',m.switch+MOTION.out).pages,{overview:0,data:0,usage:1});
 assert.equal(at('byMission',m.menu-.01).groupBy,'Unit');
 for(const [id,g] of Object.entries(GROUPS)){
  assert.equal(at(id,g.menu-.01).menu,0);assert.ok(at(id,g.menu+.5).menu>.99);assert.equal(at(id,g.regroup+.01).menu,0);
  assert.equal(at(id,g.regroup+.01).groupBy,g.to);
 }
 assert.ok(m.press-MOTION.lead>=m.switch+MOTION.cam-1e-9,'Group by is pressed once the camera frames the report');
 assert.deepEqual(reportTree('Mission').map(g=>g.label),['Storage Room Check','Check supplies']);
 const photos=reportTree('Checkpoint')[0];assert.equal(photos.label,'Is the storage room organized?');
 assert.deepEqual(photos.children.map(r=>r.media.name),STORAGE_PHOTOS.map(p=>p.name),'one photo per day, in date order');
 assert.equal(RESPONSES.filter(r=>r.anchor).length,1);
 assert.deepEqual([GALLERY.press-.05,GALLERY.press+.01].map(t=>at('gallery',t).gallery.checked),[false,true]);
 assert.ok(at('gallery',GALLERY.open+.8).gallery.rows>.99);assert.deepEqual(rings('gallery').map(h=>h.target),['gallery-view','date-range']);
 assert.deepEqual([EVOLUTION.scroll[0]-.05,EVOLUTION.scroll[1]+.05].map(t=>at('evolution',t).reportScroll),[0,1]);
 assert.equal(at('conclusion',.2).reportScroll,1,'the page fades as it was');assert.equal(at('conclusion',.2).pages.usage,1);
 assert.equal(devicesAt(start('conclusion')+CONCLUSION.out).webOut,1);
 assert.equal(RUNS.filter(r=>r.photo).length,7);
});
test('West Location: open all green; claimed empty x4, green x4, then orange with the last red; every pill keeps its color',()=>{
 const rows=RUNNING.find(u=>u.unit==='West Location').teams.flatMap(t=>t.rows);
 assert.equal(RUNNING.find(u=>u.unit==='West Location').teams.length,1,'no Support team');
 const tone=s=>s>1800?'red':s>600?'orange':'green';
 for(const t of [0,OVERSIGHT_LENGTH]){
  assert.ok(rows.every(r=>tone(r.open+(r.state==='Open'?t:0))==='green'),`open column at ${t}`);
  const claimed=rows.map(r=>r.state==='Open'?null:tone(r.claimed+(r.state==='Claimed'?t:0)));
  assert.deepEqual(claimed,[null,null,null,null,'green','green','green','green',...Array(rows.length-9).fill('orange'),'red'],`claimed column at ${t}`);
 }
 assert.deepEqual(rows.map(r=>r.state),[...Array(4).fill('Open'),...Array(4).fill('Claimed'),...Array(rows.length-8).fill('Closed')]);
 assert.equal(rows.length,12,'fills the board: the red one is the last visible row');
});
