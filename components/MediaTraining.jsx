'use client';
import { useEffect, useRef, useState } from 'react';

const lessonText = 'Micro-Lessons\nAre Easier To Consume\n& Remember';
export const mediaTrainingMission = {
  id: 'media-training', type: 'Media', title: 'Training 3', status: 'open', age: 280,
  postedBy: 'T002 - TM Training & Onboarding - OMC Inc - First Floor',
  date: '08-08-25', time: '12:19 PM', description: lessonText, notice: lessonText,
  lessons: [
    { id: 'text', title: 'Text', kind: 'audio', text: lessonText, seconds: 4 },
    { id: 'video', title: 'Video', kind: 'video', src: '/videos/training%20video%201.mp4' },
    { id: 'image', title: 'Image', kind: 'illustration', src: '/Images/Training.png' },
  ], completedLessons: [],
};
export const mediaComplete = mission => mission.lessons.every(lesson => mission.completedLessons?.includes(lesson.id));
const duration = value => Number.isFinite(value) ? `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}` : '—';
const icons = { audio: 'media-audio', video: 'media-video', illustration: 'media-image' };

function Arrow({down}) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{transform:down?'rotate(180deg)':undefined}}><path d="M12 21V3M4 11l8-8 8 8"/></svg>; }
function LessonPlayer({lesson,visible,onComplete,onDuration}) {
  const video=useRef(null), speech=useRef(null), position=useRef(0), finish=useRef(onComplete), picture=useRef(null);
  finish.current=onComplete;
  const [playing,setPlaying]=useState(false), [time,setTime]=useState(0), [total,setTotal]=useState(lesson.seconds||0), [error,setError]=useState('');
  const [seekVersion,setSeekVersion]=useState(0);
  const audio=lesson.kind==='audio';
  const stop=()=>{if(speech.current){speech.current.onend=null;speech.current.onerror=null;window.speechSynthesis?.cancel();speech.current=null;}};
  useEffect(()=>{if(!visible){video.current?.pause();stop();setPlaying(false);}else if(lesson.kind==='illustration'&&picture.current?.complete&&picture.current.naturalWidth)finish.current();},[visible,lesson.kind]);
  useEffect(()=>()=>stop(),[]);
  useEffect(()=>{if(!playing||!audio)return;const started=performance.now(),from=position.current;const id=setInterval(()=>{position.current=Math.min(total,from+(performance.now()-started)/1000);setTime(position.current);},50);return()=>clearInterval(id);},[playing,audio,total,seekVersion]);
  const speak=start=>{
    if(!window.speechSynthesis){setError('Narration is unavailable in this browser.');return;}
    stop(); const utterance=new SpeechSynthesisUtterance(lesson.text.slice(Math.floor(start/total*lesson.text.length)));
    utterance.lang='en-US';utterance.onend=()=>{setPlaying(false);position.current=total;setTime(total);speech.current=null;finish.current();};
    utterance.onerror=e=>{setPlaying(false);if(!['canceled','interrupted'].includes(e.error))setError('Audio could not play. Please try again.');};
    speech.current=utterance;position.current=start;setTime(start);setSeekVersion(value=>value+1);setPlaying(true);setError('');window.speechSynthesis.speak(utterance);
  };
  const toggle=()=>{if(audio){if(playing){window.speechSynthesis.pause();setPlaying(false);}else if(speech.current&&window.speechSynthesis.paused){window.speechSynthesis.resume();setPlaying(true);}else speak(time>=total?0:time);}else if(playing)video.current.pause();else video.current.play().catch(()=>setError('Video could not play. Please try again.'));};
  const seek=next=>{position.current=next;setTime(next);if(audio){const resume=playing;stop();setPlaying(false);if(resume)speak(next);}else video.current.currentTime=next;};
  return <><div className="mt-stage">
    {audio&&<p>{lesson.text}</p>}
    {lesson.kind==='video'&&<video ref={video} playsInline preload="metadata" src={lesson.src} onLoadedMetadata={e=>{setTotal(e.currentTarget.duration);onDuration(e.currentTarget.duration);}} onTimeUpdate={e=>setTime(e.currentTarget.currentTime)} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>{setPlaying(false);finish.current();}} onError={()=>setError('This video could not be loaded.')}/>}
    {lesson.kind==='illustration'&&<img ref={picture} src={lesson.src} alt="Training illustration" onLoad={()=>{if(visible)finish.current();}}/>}
    </div>{error&&<p className="mt-error" role="alert">{error}</p>}
    {lesson.kind!=='illustration'&&<div className={`mt-transport ${audio?'mt-transport--audio':''}`}><button aria-label={`${playing?'Pause':'Play'} ${audio?'narration':'video'}`} onClick={toggle}><svg viewBox="0 0 24 24" aria-hidden="true">{playing?<path d="M5 3h5v18H5zM14 3h5v18h-5z"/>:<path d="M5 3a1.5 1.5 0 0 1 2-.5l14 8a1.7 1.7 0 0 1 0 3l-14 8A1.5 1.5 0 0 1 5 20z"/>}</svg></button><input type="range" aria-label={lesson.title+' playback position'} min="0" max={total||1} step="0.01" value={time} onChange={e=>seek(Number(e.target.value))} style={{'--mt-progress':(total?time/total*100:0)+'%'}}/><span>{duration(Math.max(0,total-time))}</span></div>}
  </>;
}
export default function MediaTraining({mission,state,active,onSelect,onComplete,summary,footer}) {
  const root=useRef(null), pages=useRef([]), fromScroll=useRef(false), navigating=useRef(false), timeout=useRef(null);
  const [videoDuration,setVideoDuration]=useState(null);
  useEffect(()=>{if(fromScroll.current){fromScroll.current=false;return;}const el=active==null?root.current?.firstElementChild:pages.current[active];if(el&&root.current){navigating.current=true;root.current.scrollTo({top:el.offsetTop,behavior:'smooth'});clearTimeout(timeout.current);timeout.current=setTimeout(()=>{navigating.current=false;},700);}},[active]);
  useEffect(()=>()=>clearTimeout(timeout.current),[]);
  const complete=id=>{if(state==='claimed'&&!mission.completedLessons?.includes(id))onComplete?.(id);};
  return <div className="mt-frame"><div className="mt-scroll" ref={root} onScroll={()=>{if(navigating.current)return;const center=root.current.scrollTop+root.current.clientHeight/2;let next=null;pages.current.forEach((page,index)=>{if(page&&center>=page.offsetTop)next=index;});if(next!==active){fromScroll.current=true;onSelect(next);}}}>
    <div className="mt-overview mt-page">{summary}<div className="mt-list">{mission.lessons.map((item,index)=><button className="mt-row" key={item.id} onClick={()=>onSelect(index)}><span>{index+1}.</span><span className={mission.completedLessons?.includes(item.id)?'mt-read':''}>{item.title}</span><span className={`om-mtag om-mtag--${item.kind}`}><span className="om-mtag-ico"><img src={`/mission-icons/${icons[item.kind]}.svg`} alt=""/></span><span className="om-mtag-meta">{item.kind==='illustration'?'N/A':duration(item.seconds??videoDuration)}</span></span></button>)}<div className="om-media-est"><span>Estimated Time ~</span><span className="om-media-est-box">{duration(videoDuration==null?null:videoDuration+mission.lessons[0].seconds)}</span></div>{footer}</div></div>
    {mission.lessons.map((lesson,index)=><section className="mt-viewer mt-page" key={lesson.id} ref={el=>{pages.current[index]=el;}} aria-label={lesson.title+' lesson'}><div className="mt-viewer-head"><span><small>{index+1}/{mission.lessons.length}</small><b>{lesson.title}</b></span><button aria-label="Previous lesson" disabled={index===0} onClick={()=>onSelect(index-1)}><Arrow/></button><button aria-label="Next lesson" disabled={index===mission.lessons.length-1} onClick={()=>onSelect(index+1)}><Arrow down/></button></div><LessonPlayer lesson={lesson} visible={active===index} onComplete={()=>complete(lesson.id)} onDuration={setVideoDuration}/>{index===mission.lessons.length-1 && footer}</section>)}
  </div>{active != null && <nav className="mt-dots" aria-label="Lessons">{mission.lessons.map((item,i)=><button key={item.id} aria-label={'View '+item.title} aria-current={active===i?'step':undefined} onClick={()=>onSelect(i)}/>)}</nav>}</div>;
}
