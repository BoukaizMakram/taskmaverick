'use client';
import {useEffect,useLayoutEffect,useRef} from 'react';

// The lower preview mirrors the rendered frame, including GSAP transforms.
// It owns its DOM, so inline controls never disturb the live React scene.
export default function useDemoMirror(sourceRef,hostRef,playing,onSync) {
  const syncRef=useRef(onSync);syncRef.current=onSync;
  const drawRef=useRef(null);
  useLayoutEffect(()=>{
    const source=sourceRef.current,host=hostRef.current;
    if(!source||!host)return;
    let map=new Map(),pending=[],raf=0;
    const drawMedia=()=>{
      for(const media of source.querySelectorAll('canvas,video')){
        const copy=map.get(media);if(!copy)continue;
        if(media.tagName==='CANVAS'){
          const ctx=copy.getContext('2d');ctx?.clearRect(0,0,copy.width,copy.height);ctx?.drawImage(media,0,0);
        }else{
          copy.muted=true;
          if(Number.isFinite(media.currentTime)&&Math.abs(copy.currentTime-media.currentTime)>.15)copy.currentTime=media.currentTime;
          copy.playbackRate=media.playbackRate;
          if(media.paused)copy.pause();else copy.play().catch(()=>{});
        }
      }
    };
    const rebuild=()=>{
      const copy=source.cloneNode(true);map=new Map();
      const pair=(a,b)=>{map.set(a,b);a.childNodes.forEach((child,i)=>pair(child,b.childNodes[i]));};pair(source,copy);
      copy.removeAttribute('role');copy.removeAttribute('tabindex');copy.removeAttribute('aria-label');
      copy.querySelectorAll('button,a,input,[tabindex]').forEach(el=>el.setAttribute('tabindex','-1'));
      host.replaceChildren(copy);
      drawMedia();
    };
    const flush=()=>{
      raf=0;
      const changes=pending;pending=[];
      if(changes.some(record=>record.type==='childList'))rebuild();
      else for(const record of changes){
        const target=map.get(record.target);if(!target)continue;
        if(record.type==='characterData')target.data=record.target.data;
        else if(record.type==='attributes'){
          const value=record.target.getAttribute(record.attributeName);
          if(value===null)target.removeAttribute(record.attributeName);else target.setAttribute(record.attributeName,value);
        }
      }
      drawMedia();syncRef.current?.();
    };
    rebuild();syncRef.current?.();drawRef.current=drawMedia;
    const observer=new MutationObserver(changes=>{pending.push(...changes);if(!raf)raf=requestAnimationFrame(flush);});
    observer.observe(source,{subtree:true,childList:true,characterData:true,attributes:true});
    const resize=new ResizeObserver(()=>syncRef.current?.());resize.observe(host);
    return()=>{observer.disconnect();resize.disconnect();cancelAnimationFrame(raf);drawRef.current=null;host.replaceChildren();};
  },[sourceRef,hostRef]);
  useEffect(()=>{
    if(!playing){drawRef.current?.();return;}
    let raf;
    const draw=()=>{drawRef.current?.();raf=requestAnimationFrame(draw);};raf=requestAnimationFrame(draw);
    return()=>cancelAnimationFrame(raf);
  },[playing]);
}
