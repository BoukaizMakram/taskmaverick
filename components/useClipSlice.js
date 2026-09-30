'use client';
import {useEffect,useMemo} from 'react';

// Plays one slice of a demo for the Assets Library (/assets-library). A clip is
// named by chapter ids, never by seconds, so it follows the chapters when the
// words (and so the timing) are edited: "alerts", "instructions:video" (from
// the start of the first to the end of the last) or "all". A clip starts when
// its first chapter's own art has begun (`skips`: seconds into each chapter),
// not while the last scene is still leaving.
//   mode 'page'    the whole demo, nothing changes
//   mode 'player'  the slice with its controls (waiting to be played, or playing
//                  right away with `autoplay`)
//   mode 'preview' the slice on a loop, no controls (a hover preview)
//   mode 'still'   paused on one frame, `still` of the way through the slice
export function clipRange(timeline,clip,skips={}){
 const [first,last]=String(clip||'all').split(':'),end=timeline.at(-1).end;
 const a=timeline.find(s=>s.id===first),b=timeline.find(s=>s.id===(last||first));
 if(!a||!b||b.end<=a.start)return {from:0,to:end};
 // skips are seconds of the original timing; the chapter may have been stretched
 const scale=a.original?a.duration/(a.original.end-a.original.start):1;
 return {from:Math.min(a.start+(skips[first]??0)*scale,b.end-.05),to:b.end};
}

export default function useClipSlice({playback,timeline,clip,mode='page',still=.7,autoplay=false,skips}){
 const {time,playing,toggle,seek}=playback,clipped=mode!=='page';
 const total=timeline.at(-1).end;
 const {from,to}=useMemo(()=>clipped?clipRange(timeline,clip,skips):{from:0,to:total},[clipped,timeline,clip,total,skips]);
 const jump=value=>seek({target:{value}});
 // Start on the slice: playing for a preview, parked on its frame for a still.
 useEffect(()=>{
  if(!clipped)return;
  jump(mode==='still'?from+still*(to-from):from);
  if(mode==='preview'||(mode==='player'&&autoplay))toggle();
 },[clipped,mode,from,to,still,autoplay]);// eslint-disable-line react-hooks/exhaustive-deps
 // Stop where the slice ends: on its last frame, not the next chapter's first.
 useEffect(()=>{if(clipped&&playing&&to<total&&time>=to-.02)jump(to-.02);},[clipped,playing,time,to,total]);// eslint-disable-line react-hooks/exhaustive-deps
 // A preview rests on its last frame for a moment, then starts over.
 const done=clipped&&!playing&&time>=to-.05;
 useEffect(()=>{
  if(mode!=='preview'||!done)return;
  const timer=setTimeout(()=>{jump(from);toggle();},900);
  return()=>clearTimeout(timer);
 },[mode,done,from]);// eslint-disable-line react-hooks/exhaustive-deps
 // Say when the first frame is drawn: to the page that embeds this one, and on
 // the document (the poster script waits for it).
 useEffect(()=>{
  if(!clipped)return;
  let frames=2,raf;
  const tell=()=>{if(--frames>0)raf=requestAnimationFrame(tell);else{document.documentElement.dataset.embedReady=mode;if(window.parent!==window)window.parent.postMessage({type:'asset-ready',clip,mode},window.location.origin);}};
  raf=requestAnimationFrame(tell);
  return()=>cancelAnimationFrame(raf);
 },[clipped,clip,mode]);
 const play=()=>{if(!playing&&time>=to-.05){jump(from);toggle();}else toggle();};
 const restart=()=>{jump(from);toggle();};
 return {from,to,play,restart,done};
}
