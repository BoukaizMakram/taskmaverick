'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {FONT_OPTIONS,textLineStarts,textPositionAt,setTextPosition} from '@/lib/demoTextSettings.mjs';
import useDemoMirror from './useDemoMirror';
import './DemoTextEditor.css';

const label=time=>`${Math.floor(time/60)}:${String(Math.floor(time%60)).padStart(2,'0')}`;
const round=n=>Math.round(n*100)/100;
const hex=color=>{const values=color.match(/[\d.]+/g);return values?.length>=3?'#'+values.slice(0,3).map(n=>Math.round(Number(n)).toString(16).padStart(2,'0')).join(''):'#202a37';};
function NumberField({label,value,onChange,min,max,step=.05}){return <label>{label}<input aria-label={label} type="number" value={value??''} min={min} max={max} step={step} placeholder="Original" onChange={e=>{if(e.target.value===''){onChange(undefined);return;}const n=Number(e.target.value);if(Number.isFinite(n)&&n>=min&&n<=max)onChange(n);}}/></label>;}

export default function DemoTextEditor({editor,seek,toggle,playing=false,baseSpeed=1}){
 const host=useRef(null),surface=useRef(null),textarea=useRef(null),selectionRef=useRef(null);
 const [selection,setSelection]=useState(null),[geometry,setGeometry]=useState(null),[more,setMore]=useState(false),[positionMode,setPositionMode]=useState(false);
 const drag=useRef(null);
 selectionRef.current=selection;
 const {clock,config}=editor,scene=clock.scene;
 const settings=selection?config[selection.group][selection.key]||{}:{};
 const value=selection?(settings.text??selection.source):'';
 const time=scene.start+clock.elapsed;
 const finish=()=>{setSelection(null);setGeometry(null);setMore(false);setPositionMode(false);};
 const change=patch=>{
  if(!selection)return;
  editor.update(selection.group,selection.key,selection.group==='ui'?{source:selection.source,scene:scene.id,...patch}:patch);
 };
 const syncSelection=()=>{
  const current=selectionRef.current,root=host.current;
  if(!current||!root||!surface.current)return;
  const node=current.group==='captions'?root.querySelector('[data-demo-caption] p'):root.querySelector(`[data-demo-ui~="${current.key}"]`);
  if(!node)return;
  root.querySelectorAll('[data-dve-selected]').forEach(el=>el.removeAttribute('data-dve-selected'));
  node.setAttribute('data-dve-selected','');
  const r=node.getBoundingClientRect(),container=surface.current.getBoundingClientRect(),style=getComputedStyle(node);
  const scale=r.width/Math.max(1,node.offsetWidth);
  const next={left:r.left-container.left,top:r.top-container.top,width:r.width,height:r.height,fontSize:parseFloat(style.fontSize)*scale,lineHeight:parseFloat(style.lineHeight)*scale||parseFloat(style.fontSize)*scale*1.4,fontFamily:style.fontFamily,fontWeight:style.fontWeight,fontStyle:style.fontStyle,color:style.color,textAlign:style.textAlign,letterSpacing:(parseFloat(style.letterSpacing)||0)*scale,containerWidth:container.width};
  setGeometry(previous=>JSON.stringify(previous)===JSON.stringify(next)?previous:next);
 };
 useDemoMirror(editor.stageRef,host,playing,syncSelection);
 useLayoutEffect(()=>{
  if(!selection){host.current?.querySelectorAll('[data-dve-selected]').forEach(el=>el.removeAttribute('data-dve-selected'));return;}
  syncSelection();
 },[selection,settings]);
 useEffect(()=>{finish();},[scene.id]);
 useEffect(()=>{
  if(!selection)return;
  const frame=requestAnimationFrame(()=>{textarea.current?.focus();textarea.current?.select();});
  return()=>cancelAnimationFrame(frame);
 },[selection?.key]);
 useEffect(()=>{
  if(!selection)return;
  const outside=event=>{if(!surface.current?.contains(event.target)&&!event.target.closest('[data-dve-save],[data-dve-keep]'))finish();};
  document.addEventListener('pointerdown',outside);
  return()=>document.removeEventListener('pointerdown',outside);
 },[selection]);
 const beginEdit=event=>{
  if(!editor.ready)return;
  event.preventDefault();event.stopPropagation();
  const caption=event.target.closest('[data-demo-caption]');
  const node=caption?.querySelector('p')||event.target.closest('[data-demo-ui]');
  if(!node)return;
  if(playing)seek({target:{value:time}});
  if(caption){setSelection({group:'captions',key:scene.id,source:scene.original.text});}
  else{
   const keys=node.dataset.demoUi.split(' ');
   let key=keys[0];
   // A label can contain separate name/count nodes. Prefer the clicked node.
   const point=document.caretPositionFromPoint?.(event.clientX,event.clientY);
   if(point?.offsetNode?.parentElement===node){const textNodes=[...node.childNodes].filter(n=>n.nodeType===3&&n.data.trim());const index=textNodes.indexOf(point.offsetNode);key=keys[index]||key;}
   const entry=editor.describeUI(key);if(entry)setSelection({group:'ui',key,source:entry.source});
  }
  setMore(false);
 };
 const bold=(settings.weight??Number(geometry?.fontWeight))>=600;
 const italic=(settings.fontStyle??geometry?.fontStyle)==='italic';
 const seekTo=value=>{seek({target:{value}});};
 const canvasScale=()=>host.current?.getBoundingClientRect().width/1600||1;
 const measuredPosition=()=>({x:round((geometry.left+geometry.width/2)/canvasScale()),y:round((geometry.top+geometry.height/2)/canvasScale())});
 const position=textPositionAt(settings.positions,clock.elapsed)||(geometry?measuredPosition():{x:800,y:450});
 const keyTime=round(clock.elapsed);
 const activeKey=settings.positions?.find(p=>Math.abs(p.time-keyTime)<.026);
 const savePosition=(point=position)=>{
  if(!geometry)return;
  const next={time:keyTime,x:round(Math.max(0,Math.min(1600,point.x))),y:round(Math.max(0,Math.min(900,point.y)))};
  change({positions:setTextPosition(settings.positions,next),positionStyle:settings.positionStyle||{fontSize:geometry.fontSize/canvasScale()/((settings.size??100)/100),lineHeight:geometry.lineHeight/geometry.fontSize},...(settings.weight===undefined?{weight:Number(geometry.fontWeight)||400}:{})});
 };
 const startDrag=event=>{
  if(!positionMode)return;
  event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);
  drag.current={x:event.clientX,y:event.clientY,position,scale:canvasScale()};
 };
 const moveDrag=event=>{
  const origin=drag.current;if(!origin)return;
  savePosition({x:origin.position.x+(event.clientX-origin.x)/origin.scale,y:origin.position.y+(event.clientY-origin.y)/origin.scale});
 };
 const toolbarWidth=Math.min(520,geometry?.containerWidth-16||520);
 const toolbarLeft=geometry?Math.max(8,Math.min(geometry.containerWidth-toolbarWidth-8,geometry.left+geometry.width/2-toolbarWidth/2)):8;
 const toolbarTop=geometry?Math.max(8,geometry.top-52):8;
 const starts=textLineStarts(value,settings,baseSpeed);
 return <section className="dve" aria-label="Video text editor">
  <header className="dve-header"><div><h2>Edit video</h2><p>Double-click any text below to edit it. Enter adds a new line.</p></div><button className="dve-save" data-dve-save disabled={!editor.ready||!editor.dirty||editor.saving} onClick={editor.save}>{editor.saving?'Saving…':'Save changes'}</button></header>
  <div className="dve-surface demo-text-scope" ref={surface}>
   <style>{editor.uiStyles}</style>
   <div className="ad-fit dve-preview" aria-label="Editable video preview" ref={host} onDoubleClick={beginEdit} onClick={event=>{event.preventDefault();event.stopPropagation();}}/>
   {selection&&geometry&&<>
    <textarea ref={textarea} className={`dve-inline-text${positionMode?' dve-move-text':''}`} aria-label="Edit selected text" readOnly={positionMode} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} spellCheck={false} value={value} onChange={e=>change({text:e.target.value,...(selection.group==='captions'?{lineStarts:undefined,casing:'original'}:{})})} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();finish();}if((e.ctrlKey||e.metaKey)&&['b','i'].includes(e.key.toLowerCase())){e.preventDefault();change(e.key.toLowerCase()==='b'?{weight:bold?400:700}:{fontStyle:italic?'normal':'italic'});}}} style={{left:geometry.left-3,top:geometry.top-3,width:Math.max(70,geometry.width+6),height:Math.max(geometry.height+8,geometry.lineHeight*Math.max(1,value.split('\n').length)+8),fontFamily:geometry.fontFamily,fontSize:geometry.fontSize,fontWeight:geometry.fontWeight,fontStyle:geometry.fontStyle,color:geometry.color,textAlign:geometry.textAlign,lineHeight:`${geometry.lineHeight}px`,letterSpacing:geometry.letterSpacing,textDecoration:settings.decoration,whiteSpace:selection.group==='captions'&&!settings.width?'pre':'pre-wrap'}}/>
    <div className="dve-floating" role="toolbar" aria-label="Text formatting" style={{left:toolbarLeft,top:toolbarTop,width:toolbarWidth}}>
     <div className="dve-format-row">
      <button aria-label="Bold" title="Bold" aria-pressed={bold} onMouseDown={e=>e.preventDefault()} onClick={()=>change({weight:bold?400:700})}><b>B</b></button>
      <button aria-label="Italic" title="Italic" aria-pressed={italic} onMouseDown={e=>e.preventDefault()} onClick={()=>change({fontStyle:italic?'normal':'italic'})}><i>I</i></button>
      <button aria-label="Underline" title="Underline" aria-pressed={settings.decoration==='underline'} onMouseDown={e=>e.preventDefault()} onClick={()=>change({decoration:settings.decoration==='underline'?'none':'underline'})}><u>U</u></button>
      <span className="dve-divider"/>
      <input aria-label="Text size (%)" title="Text size (%)" className="dve-size" type="number" min="25" max="300" step="5" value={settings.size??100} onChange={e=>{const size=Number(e.target.value);if(size>=25&&size<=300)change({size});}}/><span className="dve-percent">%</span>
      <input aria-label="Text color" title="Text color" type="color" value={settings.color??hex(geometry.color)} onChange={e=>change({color:e.target.value})}/>
      {selection.group==='captions'&&<button aria-pressed={positionMode} onClick={()=>{setPositionMode(!positionMode);setMore(false);}}>Position</button>}
      <button aria-label="More text options" aria-expanded={more} title="More text options" onClick={()=>setMore(!more)}>•••</button>
      <button className="dve-done" onClick={finish}>Done</button>
     </div>
     {more&&<div className="dve-more">
      <label>Font<select aria-label="Font" value={settings.font??'original'} onChange={e=>change({font:e.target.value})}>{FONT_OPTIONS.map(font=><option key={font} value={font}>{font==='original'?'Original':font}</option>)}</select></label>
      <label>Alignment<select aria-label="Alignment" value={settings.align??''} onChange={e=>change({align:e.target.value||undefined})}><option value="">Original</option>{['left','center','right'].map(align=><option key={align}>{align}</option>)}</select></label>
      <NumberField label="Line spacing" value={settings.lineHeight} min={.7} max={3} onChange={lineHeight=>change({lineHeight})}/>
      <NumberField label="Letter spacing" value={settings.letterSpacing} min={-3} max={15} onChange={letterSpacing=>change({letterSpacing})}/>
      {selection.group==='captions'&&<>
       <NumberField label="Delay (s)" value={settings.delay??(editor.id==='increased-efficiency'&&scene.id==='conclusion'?.5:0)} min={0} max={120} onChange={delay=>change({delay})}/>
       <NumberField label="Line reveal (s)" value={round(settings.reveal??.65/baseSpeed)} min={.05} max={10} onChange={reveal=>change({reveal})}/>
       <NumberField label="Line pause (s)" value={round(settings.pause??.45/baseSpeed)} min={0} max={20} onChange={pause=>change({pause,lineStarts:undefined})}/>
       <NumberField label="Scene length (s)" value={round(settings.duration??scene.duration)} min={.5} max={180} onChange={duration=>change({duration})}/>
       <NumberField label="Fade in (s)" value={round(settings.fadeIn??.35/baseSpeed)} min={0} max={5} onChange={fadeIn=>change({fadeIn})}/>
       <NumberField label="Fade out (s)" value={settings.fadeOut??.28} min={0} max={5} onChange={fadeOut=>change({fadeOut})}/>
       <NumberField label="Text width" value={settings.width} min={100} max={1500} step={1} onChange={width=>change({width})}/>
       <label>Letter case<select aria-label="Letter case" value={settings.casing??'title'} onChange={e=>change({casing:e.target.value})}><option value="original">As typed</option><option value="title">Title Case</option><option value="uppercase">UPPERCASE</option></select></label>
       {value.split('\n').map((_,i)=><NumberField key={i} label={`Line ${i+1} starts (s)`} value={round(starts[i])} min={0} max={180} onChange={n=>{const next=[...starts];next[i]=n??0;change({lineStarts:next});}}/>)}</>}
      <button className="dve-reset" onClick={()=>editor.reset(selection.group,selection.key)}>Reset selected text</button>
     </div>}
    </div>
   </>}
  </div>
  {selection?.group==='captions'&&positionMode&&<div className="dve-position" data-dve-keep>
   <p>Drag the text to set its position. Add another position later to animate between them. Line breaks stay the same.</p>
   <div className="dve-position-row"><label>Scene time <input aria-label="Position time" type="range" min="0" max={Math.max(0,scene.duration-.01)} step=".05" value={clock.elapsed} onChange={e=>seekTo(scene.start+Number(e.target.value))}/><output>{keyTime.toFixed(2)}s</output></label>
    <NumberField label="Position X" value={round(position.x)} min={0} max={1600} step={1} onChange={x=>savePosition({...position,x:x??800})}/>
    <NumberField label="Position Y" value={round(position.y)} min={0} max={900} step={1} onChange={y=>savePosition({...position,y:y??450})}/>
    <button onClick={()=>savePosition()}>{activeKey?'Update keyframe':'Add keyframe'}</button>
    <button disabled={!activeKey} onClick={()=>change({positions:settings.positions.filter(p=>p!==activeKey)})}>Delete keyframe</button>
   </div>
   <div className="dve-keys">{settings.positions?.map(p=><button key={p.time} aria-pressed={p===activeKey} onClick={()=>seekTo(scene.start+p.time)}>◆ {p.time.toFixed(2)}s</button>)}{!!settings.positions?.length&&<button onClick={()=>change({positions:undefined,positionStyle:undefined})}>Use original movement</button>}</div>
  </div>}
  <div className="dve-controls" data-dve-keep><button onClick={()=>{finish();toggle();}}>{playing?'Pause':'Play'}</button><input aria-label="Seek editable video" type="range" min="0" max={clock.duration} step=".05" value={time} onChange={e=>seekTo(Number(e.target.value))}/><span>{label(time)} / {label(clock.duration)}</span><select aria-label="Editing scene" value={scene.id} onChange={e=>{const next=clock.timeline.find(s=>s.id===e.target.value);seekTo(next.start+Math.min(next.duration-.3,2.4));}}>{clock.timeline.map((s,i)=><option key={s.id} value={s.id}>{String(i+1).padStart(2,'0')} · {s.text.replaceAll('\n',' / ')}</option>)}</select></div>
  <footer className="dve-footer"><span role="status">{editor.status||(!editor.ready?'Loading saved text…':editor.dirty?'Unsaved changes':'All changes saved')}</span><details><summary>Text files</summary><div><button onClick={editor.exportFile}>Export</button><label>Import<input aria-label="Import text file" type="file" accept="application/json,.json" onChange={e=>{if(e.target.files[0])editor.importFile(e.target.files[0]);e.target.value='';}}/></label></div></details></footer>
 </section>;
}
