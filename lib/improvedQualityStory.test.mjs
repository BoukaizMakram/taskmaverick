import test from 'node:test';
import assert from 'node:assert/strict';
import {QUALITY_STORY,QUALITY_STORY_LENGTH,qualityStoryFrame,highlightPose,cameraAt,devicesAt,captionAt,layoutAt,toScreen,CAPTION,LAYOUT,MICRO,HANDOFF} from './improvedQualityStory.mjs';
const start=id=>QUALITY_STORY.find(s=>s.id===id).start;
const at=(id,elapsed)=>qualityStoryFrame(start(id)+elapsed);
test('the script stops at chapter 8, continuous, with explicit line breaks',()=>{
 assert.deepEqual(QUALITY_STORY.map(s=>s.id),['guidance','knowledge','instructions','alerts','links','translation','steps','micro']);
 QUALITY_STORY.forEach((scene,i)=>{assert.equal(scene.start,i?QUALITY_STORY[i-1].end:0);assert.ok(scene.duration>scene.ready+1);assert.ok(!scene.text.includes(' / '));});
 assert.equal(QUALITY_STORY.at(-1).text,'Micro-Trainings Are Delivered\nIn Context Of Actual Work');
});
test('chapter 2: words first, then down, then the tablet; the KB sequence follows',()=>{
 const ch=start('knowledge');
 assert.deepEqual(captionAt(ch+2),CAPTION.center);assert.equal(devicesAt(ch+2).tabletIn,0);
 assert.ok(captionAt(ch+2.9).top===450&&devicesAt(ch+5).tabletIn===1);
 assert.deepEqual(captionAt(ch+5),CAPTION.below);
 assert.equal(at('knowledge',4.5).menu,false);assert.equal(at('knowledge',4.7).menu,true);
 // No mission is opened: only Menu and Knowledge Base are pressed, then kinds are highlighted in turn.
 assert.deepEqual(at('knowledge',0).highlights.filter(h=>h.press!=null).map(h=>h.target),['menu','knowledge']);
 const lit=t=>at('knowledge',t).highlights.filter(h=>highlightPose(t,h).opacity>.5).map(h=>h.target);
 assert.deepEqual([7.2,8.7,10.3].map(lit),[['kb-type-0'],['kb-type-1'],['kb-type-4']]);
});
test('chapters 3-6: words travel into the empty phone area and follow the zoom',()=>{
 const inside=t=>{const cam=cameraAt(t),c=captionAt(t),p=toScreen(cam,LAYOUT.inside.x,LAYOUT.inside.y);return Math.abs(c.top-p.y)<.01&&Math.abs(c.width-LAYOUT.inside.width*cam.s)<.01;};
 for(const id of ['alerts','links','translation'])for(const t of [0,1,2,3])assert.ok(inside(start(id)+t),id);
 assert.ok(inside(start('instructions')+6));
 // chapter 3: straight to the phone (the tablet never opens the mission); words inside from the start
 const ch=start('instructions');
 assert.equal(at('instructions',1).mission,false);
 for(let t=ch;t<ch+7;t+=.05)assert.ok(inside(t),`not inside at ${(t-ch).toFixed(2)}`);
 assert.ok(cameraAt(ch+HANDOFF.text).s>1.8,'zoomed in before the words type');
 assert.ok(cameraAt(start('links')+2).s>=1.85,'zoomed in close');
 // phone zooms keep the top of the phone on screen
 for(let t=start('instructions')+1.2;t<QUALITY_STORY_LENGTH;t+=.05){if(devicesAt(t).phoneOpacity<1)continue;assert.ok(toScreen(cameraAt(t),0,LAYOUT.phone.top).y>=LAYOUT.topMargin-.01,`top hidden at ${t.toFixed(2)}`);}
});
test('with words below, devices never reach the caption line (whole timeline)',()=>{
 for(let t=start('knowledge');t<QUALITY_STORY_LENGTH;t+=.05){
  const l=layoutAt(t);if(l.mode!=='below')continue;
  assert.ok(toScreen(cameraAt(t),0,l.bottom).y<=l.captionTop+.01,`overlap at ${t.toFixed(2)}`);
 }
});
test('chapter 7: phone leaves, words centered then down, phone returns with the checklist',()=>{
 const d=t=>devicesAt(start('steps')+t);
 assert.equal(d(.5).phoneOpacity,0);assert.equal(d(.5).guided,true);assert.equal(d(3.5).phoneOpacity,1);
 assert.deepEqual(captionAt(start('steps')+1.5),CAPTION.center);assert.deepEqual(captionAt(start('steps')+3.5),CAPTION.belowPhone);
 assert.deepEqual([3.8,4,4.8,5.7,.5].map(t=>at('steps',t).steps),[0,1,2,3,0]);
});
test('camera never jumps while something is visible',()=>{
 const cut=start('steps')+.5;
 for(let t=0;t<QUALITY_STORY_LENGTH;t+=.02){if(Math.abs(t-cut)<.1)continue;const a=cameraAt(t),b=cameraAt(t+.02);assert.ok(Math.abs(a.s-b.s)<.06&&Math.abs(a.cy-b.cy)<25&&Math.abs(a.cx-b.cx)<25,`jump at ${t.toFixed(2)}`);}
});
test('translation, training press and video pop',()=>{
 assert.equal(at('translation',1.5).translated,false);assert.equal(at('translation',1.8).translated,true);
 assert.deepEqual(at('micro',0).highlights.map(h=>[h.target,h.press]),[['training',MICRO.press]]);
 assert.equal(devicesAt(start('micro')+MICRO.press-.1).popup,0);assert.ok(devicesAt(start('micro')+MICRO.press+1).popup>.99);
 // chapter 8: words inside the phone, under the checklist, following the camera
 const c=captionAt(start('micro')+5),p=toScreen(cameraAt(start('micro')+5),800,LAYOUT.training.y);
 assert.ok(Math.abs(c.top-p.y)<.01&&Math.abs(c.left-p.x)<.01);
});
