'use client';
import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {demoClock, EMPTY_DEMO_TEXT, textFont, validateDemoText} from '@/lib/demoTextSettings.mjs';

const projectSaving = process.env.NODE_ENV !== 'production';
const hash = text => {let n=2166136261; for(const letter of text) n=Math.imul(n^letter.charCodeAt(0),16777619); return (n>>>0).toString(36);};
function nodePath(element, root) {
  const parts=[];
  while(element && element!==root){
    if(element.dataset.missionId){parts.unshift(`mission:${element.dataset.missionId}`); break;}
    parts.unshift(`${element.tagName}:${Array.prototype.indexOf.call(element.parentElement?.children||[],element)}`);
    element=element.parentElement;
  }
  return parts.join('/');
}

export default function useDemoTextEditor(id, story, initial, time, stageRef) {
  const [config,setConfig]=useState(initial || EMPTY_DEMO_TEXT);
  const [saved,setSaved]=useState(JSON.stringify(initial || EMPTY_DEMO_TEXT));
  const [revision,setRevision]=useState(null);
  const [ready,setReady]=useState(!projectSaving);
  const [status,setStatus]=useState('');
  const [saving,setSaving]=useState(false);
  const records=useRef(new Map());
  const draft=useRef(config); draft.current=config;
  const clock=useMemo(()=>demoClock(story,config,time),[story,config,time]);
  const dirty=JSON.stringify(config)!==saved;
  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      try {
        let loaded;
        if(projectSaving){
          const response=await fetch(`/api/demo-text/${id}`,{cache:'no-store'});
          const data=await response.json();
          if(!response.ok)throw new Error(data.error || 'Could not load saved text.');
          loaded=validateDemoText(data.config);
          if(!cancelled)setRevision(data.revision);
        }else{
          const stored=localStorage.getItem(`demo-text:${id}`);
          loaded=stored?validateDemoText(JSON.parse(stored)):initial;
        }
        if(!cancelled){setConfig(loaded);setSaved(JSON.stringify(loaded));setReady(true);}
      }catch(error){if(!cancelled){setStatus(error.message);setReady(!projectSaving);}}
    })();
    return()=>{cancelled=true;};
  },[id]);
  useEffect(()=>{
    if(!dirty)return;
    const warn=event=>{event.preventDefault();event.returnValue='';};
    window.addEventListener('beforeunload',warn);
    return()=>window.removeEventListener('beforeunload',warn);
  },[dirty]);

  // Only text-node values are changed: no React-owned elements are inserted,
  // removed or reordered. Keep each latest source value for reset and seeking.
  useLayoutEffect(()=>{
    const root=stageRef.current;if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const parents=new Map();
    let node;
    while((node=walker.nextNode())){
      const element=node.parentElement;
      if(!element || element.closest('[data-demo-caption],[data-demo-caption-source],script,style,svg'))continue;
      let record=records.current.get(node);
      if(record && node.data!==record.applied)record=null;
      const source=record?.source ?? node.data;
      if(!source.trim())continue;
      const index=Array.prototype.indexOf.call(element.childNodes,node);
      // Digits are normalized so running timers keep the same editable slot.
      const key=`${clock.scene.id}-${hash(nodePath(element,root)+':'+index+':'+source.replace(/\d/g,'#'))}`;
      record={key,source,applied:config.ui[key]?.text ?? source};
      records.current.set(node,record);
      if(node.data!==record.applied)node.data=record.applied;
      if(!parents.has(element))parents.set(element,[]);
      parents.get(element).push(key);
    }
    for(const [element,keys] of parents)element.dataset.demoUi=keys.join(' ');
    for(const [textNode] of records.current)if(!root.contains(textNode))records.current.delete(textNode);
  },[time,clock.scene.id,config,stageRef]);

  const update=(group,key,patch)=>{
    setStatus('');
    setConfig(previous=>{const entry={...previous[group][key],...patch};for(const field of Object.keys(entry))if(entry[field]===undefined)delete entry[field];return {...previous,[group]:{...previous[group],[key]:entry}};});
  };
  const reset=(group,key)=>setConfig(previous=>{const next={...previous[group]};delete next[key];return {...previous,[group]:next};});
  const save=async()=>{
    setSaving(true);setStatus('');
    const snapshot=draft.current;
    try {
      const valid=validateDemoText(snapshot);
      if(projectSaving){
        const response=await fetch(`/api/demo-text/${id}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({config:valid,revision})});
        const data=await response.json();if(!response.ok)throw new Error(data.error || 'Save failed.');
        setRevision(data.revision);
      }else localStorage.setItem(`demo-text:${id}`,JSON.stringify(valid));
      setSaved(JSON.stringify(snapshot));setStatus(projectSaving?'Saved to project.':'Saved in this browser.');
    }catch(error){setStatus(error.message);}
    finally{setSaving(false);}
  };
  const importFile=async file=>{try{const next=validateDemoText(JSON.parse(await file.text()));setConfig(next);setStatus('Imported. Preview your changes, then Save.');}catch(error){setStatus(error.message);}};
  const exportFile=()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(config,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=`${id}-text.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const uiStyles=Object.entries(config.ui).map(([key,value])=>{
    const declarations=[];
    if(value.size)declarations.push(`zoom:${value.size/100}!important`);
    if(value.color)declarations.push(`color:${value.color}!important`);
    if(value.weight)declarations.push(`font-weight:${value.weight}!important`);
    if(value.fontStyle)declarations.push(`font-style:${value.fontStyle}!important`);
    if(value.decoration)declarations.push(`text-decoration:${value.decoration}!important`);
    if(textFont(value.font))declarations.push(`font-family:${textFont(value.font)}!important`);
    if(value.lineHeight)declarations.push(`line-height:${value.lineHeight}!important`);
    if(value.align)declarations.push(`text-align:${value.align}!important`);
    if(value.letterSpacing!==undefined)declarations.push(`letter-spacing:${value.letterSpacing}px!important`);
    if(value.text?.includes('\n'))declarations.push('white-space:pre-line!important');
    return `.demo-text-scope [data-demo-ui~="${key}"]{${declarations.join(';')}}`;
  }).join('\n');
  const describeUI=key=>{for(const record of records.current.values())if(record.key===key)return {...record,scene:clock.scene.id};return config.ui[key]?{...config.ui[key],key}:null;};
  return {id,config,clock,ready,dirty,status,saving,projectSaving,update,reset,save,importFile,exportFile,uiStyles,stageRef,describeUI};
}
