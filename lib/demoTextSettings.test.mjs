import test from 'node:test';
import assert from 'node:assert/strict';
import {demoClock,editedTimeline,EMPTY_DEMO_TEXT,textLineStarts,validateDemoText,textPositionAt,setTextPosition} from './demoTextSettings.mjs';
const story=[{id:'first',text:'One\nTwo',start:0,end:4,duration:4},{id:'second',text:'Three',start:4,end:10,duration:6}];
test('unchanged captions preserve the animation clock exactly',()=>{
 for(const time of [0,2,4,7,10])assert.equal(demoClock(story,EMPTY_DEMO_TEXT,time).originalTime,time);
});
test('edited durations move following scenes while preserving their choreography',()=>{
 const config={...EMPTY_DEMO_TEXT,captions:{first:{duration:8,text:'Changed\nCaption'}}};
 assert.deepEqual(editedTimeline(story,config).map(s=>[s.start,s.end]),[[0,8],[8,14]]);
 assert.equal(demoClock(story,config,4).originalTime,2);
 assert.equal(demoClock(story,config,8).originalTime,4);
 assert.equal(demoClock(story,config,11).originalTime,7);
 assert.equal(demoClock(story,config,0).originalTime,0);
 assert.equal(demoClock(story,config,4).scene.text,'Changed\nCaption');
});
test('line starts support the original pace, custom pauses, and explicit beats',()=>{
 assert.deepEqual(textLineStarts('a\nb',{},1),[.1,1.2000000000000002]);
 assert.deepEqual(textLineStarts('a\nb',{reveal:.5,pause:1}),[.1,1.6]);
 assert.deepEqual(textLineStarts('a\nb',{lineStarts:[0,2.5]}),[0,2.5]);
});
test('save validation preserves literal text and rejects dangerous or invalid formatting',()=>{
 const valid={version:1,captions:{first:{text:'<b>literal</b>\nNext',size:110,duration:8,lineStarts:[0,2],fontStyle:'italic',decoration:'underline'}},ui:{'first-label':{text:'New name',source:'Old name',scene:'first',color:'#123abc',fontStyle:'normal'}}};
 assert.deepEqual(validateDemoText(valid),valid);
 for(const patch of [{size:-1},{duration:0},{color:'red;display:none'},{font:'url(example)'},{fontStyle:'italic;display:none'},{decoration:'blink'},{lineStarts:[2,1]},{reveal:Infinity}])assert.throws(()=>validateDemoText({...valid,captions:{first:patch}}));
 assert.throws(()=>validateDemoText(JSON.parse('{"version":1,"captions":{"__proto__":{}},"ui":{}}')));
});

test('position keys hold endpoints and seek deterministically through smooth motion',()=>{
 const keys=[{time:1,x:800,y:450},{time:5,x:1000,y:650}];
 assert.equal(textPositionAt([],3),null);
 assert.deepEqual(textPositionAt(keys,0),keys[0]);
 assert.deepEqual(textPositionAt(keys,8),keys[1]);
 assert.deepEqual(textPositionAt(keys,3),{x:900,y:550});
 assert.deepEqual(textPositionAt(keys,2),{x:831.25,y:481.25});
 assert.deepEqual(textPositionAt(keys,3),{x:900,y:550});
 assert.deepEqual(textPositionAt([keys[0]],4),keys[0]);
});
test('editing a key replaces it, while added keys stay in time order',()=>{
 const keys=[{time:1,x:800,y:450},{time:5,x:1000,y:650}];
 assert.deepEqual(setTextPosition(keys,{time:1,x:200,y:300}),[{time:1,x:200,y:300},keys[1]]);
 assert.deepEqual(setTextPosition(keys,{time:3,x:900,y:550}).map(p=>p.time),[1,3,5]);
});
test('position data survives saves and rejects invalid coordinates or duplicate times',()=>{
 const entry={positions:[{time:0,x:0,y:900},{time:4,x:1600,y:0}],positionStyle:{fontSize:27,lineHeight:1.45}};
 const config={...EMPTY_DEMO_TEXT,captions:{first:entry}};
 assert.deepEqual(validateDemoText(config),config);
 for(const positions of [[{time:0,x:1601,y:0}],[{time:NaN,x:0,y:0}],[{time:0,x:0,y:0},{time:0,x:2,y:2}],[{time:2,x:0,y:0},{time:1,x:0,y:0}]])assert.throws(()=>validateDemoText({...config,captions:{first:{positions}}}));
 assert.throws(()=>validateDemoText({...config,captions:{first:{positionStyle:{fontSize:Infinity,lineHeight:1}}}}));
});
