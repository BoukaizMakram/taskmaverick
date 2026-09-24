import test from 'node:test';
import assert from 'node:assert/strict';
import {QUALITY_STORY,QUALITY_STORY_LENGTH,qualityStoryFrame} from './improvedQualityStory.mjs';
const at=(id,elapsed)=>qualityStoryFrame(QUALITY_STORY.find(s=>s.id===id).start+elapsed);
test('all 23 script scenes are continuous, readable, and preserve explicit line breaks',()=>{
 assert.equal(QUALITY_STORY.length,23);
 QUALITY_STORY.forEach((scene,i)=>{assert.equal(scene.start,i?QUALITY_STORY[i-1].end:0);assert.ok(scene.duration>scene.ready+1);assert.ok(!scene.text.includes(' / '));});
 assert.equal(QUALITY_STORY.find(s=>s.id==='capture').text.split('\n').length,4);
 assert.equal(QUALITY_STORY.at(-1).text.split('\n').length,3);
 assert.equal(QUALITY_STORY.at(-1).end,QUALITY_STORY_LENGTH);
 assert.equal(qualityStoryFrame(QUALITY_STORY_LENGTH).scene.id,'conclusion');
});
test('Knowledge Base runs overview, lesson and chart without mission claiming',()=>{
 assert.equal(at('knowledge',2.8).target,'menu');assert.equal(at('knowledge',3).menu,true);
 assert.deepEqual([4,5.2,6.5,8.2,4].map(t=>at('knowledge',t).knowledgeStep),['list','overview','lesson','chart','list']);
 for(const t of [3,4,5.2,6.5,8.2])assert.equal(at('knowledge',t).mission,false);
});
test('three Yes presses happen in sequence and backward seeking resets them',()=>{
 assert.deepEqual([.5,1.8,2.8,3.8,.5].map(t=>at('steps',t).steps),[0,1,2,3,0]);assert.equal(at('micro',.1).steps,3);
});
test('quiz stays blocked until both answers have been selected and checked',()=>{
 assert.equal(at('quiz',1).answers,0);assert.equal(at('quiz',2).answers,1);assert.equal(at('quiz',3.2).answers,2);
 assert.equal(at('quiz',3.2).passed,false);assert.equal(at('quiz',4).passed,true);assert.equal(at('quiz',0).passed,false);
});
test('quiz emphasis follows each selection before submitting, and resets on seek',()=>{
 assert.deepEqual([1.5,2.8,3.7,4.3,1.5].map(t=>at('quiz',t).target),['quiz-answer-0','quiz-answer-1','quiz-submit',null,'quiz-answer-0']);
 for(const t of [1.5,2.8,3.7])assert.equal(at('quiz',t).passed,false);
});
test('photo capture precedes video capture and both persist into evidence review',()=>{
 assert.equal(at('capture',1).photoCaptured,false);assert.equal(at('capture',2).photoCaptured,true);assert.equal(at('capture',2).videoCaptured,false);assert.equal(at('capture',5).videoCaptured,true);
 for(const id of ['photo','video','evidence','gallery']){assert.equal(at(id,1).photoCaptured,true);assert.equal(at(id,1).videoCaptured,true);}
});
test('translation happens on the button beat and reverses on seek',()=>{
 assert.equal(at('translation',2.2).translated,false);assert.equal(at('translation',2.4).translated,true);assert.equal(at('translation',1).translated,false);assert.equal(at('instructions',1).translated,false);
});
