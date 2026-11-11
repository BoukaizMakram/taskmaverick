'use client';
// The references of a board (lib/storyboardRefs.mjs): files put on the canvas, drawn in its world (they pan and zoom with it, over the frames) where they were put. A picture, a video or a sound with its own
// bar, anything else a card with its name (a double-click opens it). A drag moves it (Shift: along one axis), a corner resizes it, a click plays a video or a sound; the page says what is picked and keeps the
// changes (`onPick`, `onChange`, `onMenu`). Used by the boards (components/Storyboard.jsx) and the All videos page.
import {memo, useRef, useState} from 'react';
import {clock} from '@/lib/storyboardPlayer.mjs';
import {fitRef, kindOfFile, newRefId, resizedRef} from '@/lib/storyboardRefs.mjs';
import './StoryboardRefs.css';

const HANDLES = ['nw', 'ne', 'se', 'sw'];
const Icon = {
  play: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2Z"/></svg>,
  pause: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4.2" height="14" rx="1.2"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.2"/></svg>,
  sound: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11"/></svg>,
  muted: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z"/><path d="m16 9.5 5 5m0-5-5 5"/></svg>,
  file: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3.5h8l4.5 4.5v12a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z"/><path d="M14 3.5V8h4.5"/></svg>,
  note: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9.5 17.5V6l9-2v11.5"/><circle cx="7" cy="17.5" r="2.5"/><circle cx="16" cy="15.5" r="2.5"/></svg>,
};

async function saveFile(file) {
  const response = await fetch(`/api/storyboard/reference?name=${encodeURIComponent(file.name || '')}`, {method: 'POST', body: file});
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'it could not be saved');
  return (await response.json()).url;
}
const imageSize = url => new Promise(resolve => { const img = new Image(); img.onload = () => resolve(img.naturalWidth ? {w: img.naturalWidth, h: img.naturalHeight} : null); img.onerror = () => resolve(null); img.src = url; });
const videoSize = url => new Promise(resolve => { const v = document.createElement('video'); v.preload = 'metadata'; v.muted = true; v.onloadedmetadata = () => resolve(v.videoWidth ? {w: v.videoWidth, h: v.videoHeight} : null); v.onerror = () => resolve(null); v.src = url; });

const sizeOf = async (kind, url) => { // (read again a moment later if it failed: the site may not serve a file it has just saved yet)
  const read = kind === 'image' ? imageSize : kind === 'video' ? videoSize : null;
  if (!read) return null;
  const first = await read(url);
  if (first) return first;
  await new Promise(resolve => setTimeout(resolve, 700));
  return read(url);
};
// The files saved and made references, their middle at the world point `at` (several: each a little further). What the browser cannot show (a codec, a format) is a card.
export async function makeRefs(files, at, zoom) {
  const made = [], failed = [], step = 40 / zoom;
  for (const file of files) {
    try {
      const url = await saveFile(file), wanted = kindOfFile(file), size = await sizeOf(wanted, url);
      const kind = (wanted === 'image' || wanted === 'video') && !size ? 'file' : wanted, box = fitRef(size, zoom), n = made.length;
      made.push({id: newRefId(), kind, url, name: file.name || 'File', x: at.x - box.w / 2 + n * step, y: at.y - box.h / 2 + n * step, ...box});
    } catch (error) { failed.push(`${file.name || 'a file'}: ${error.message}`); }
  }
  return {made, failed};
}

// A video or a sound and its bar. `flip`: what a click on the reference does (play, pause).
function Media({item, flip}) {
  const el = useRef(null), seek = useRef(null), [on, setOn] = useState(false), [time, setTime] = useState(0), [length, setLength] = useState(0), [quiet, setQuiet] = useState(false);
  const Tag = item.kind === 'audio' ? 'audio' : 'video';
  const toggle = () => { const m = el.current; if (!m) return; if (m.paused) m.play().catch(() => {}); else m.pause(); };
  flip.current = toggle;
  const seekTo = event => { const m = el.current, r = seek.current.getBoundingClientRect(); if (!m || !length || !r.width) return; m.currentTime = Math.min(1, Math.max(0, (event.clientX - r.left) / r.width)) * length; setTime(m.currentTime); };
  const press = event => { event.currentTarget.setPointerCapture(event.pointerId); seekTo(event); };
  return <>
    <Tag ref={el} className="sb-ref-media" src={item.url} preload="metadata" playsInline muted={quiet} onPlay={() => setOn(true)} onPause={() => setOn(false)} onTimeUpdate={e => setTime(e.currentTarget.currentTime)}
      onDurationChange={e => setLength(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}/>
    <div className={`sb-ref-bar${on ? '' : ' is-held'}`} onPointerDown={e => e.stopPropagation()}>
      <button type="button" onClick={toggle} aria-label={on ? 'Pause' : 'Play'}>{on ? Icon.pause : Icon.play}</button>
      <div ref={seek} className="sb-ref-seek" onPointerDown={press} onPointerMove={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) seekTo(e); }} role="slider" aria-label="Position" aria-valuemin={0} aria-valuemax={Math.round(length)} aria-valuenow={Math.round(time)}><i style={{transform: `scaleX(${length ? Math.min(1, time / length) : 0})`}}/></div>
      <span>{clock(time)} / {clock(length)}</span>
      <button type="button" onClick={() => setQuiet(q => !q)} aria-label={quiet ? 'Sound on' : 'Sound off'} aria-pressed={quiet}>{quiet ? Icon.muted : Icon.sound}</button>
    </div>
  </>;
}

const Ref = memo(function Ref({item, picked, zoomNow, free, onPick, onChange, onMenu}) {
  const [box, setBox] = useState(null), hold = useRef(null), flip = useRef(null);
  const shown = box ?? item, plays = item.kind === 'video' || item.kind === 'audio';
  const press = (event, handle = null) => {
    if (event.button !== 0 || !free()) return; // (Space or the Hand tool: the canvas pans)
    if (handle) event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onPick(item.id);
    hold.current = {handle, x: event.clientX, y: event.clientY, from: {x: item.x, y: item.y, w: item.w, h: item.h}, zoom: zoomNow(), box: null};
  };
  const move = event => {
    const h = hold.current;
    if (!h || (!h.box && Math.hypot(event.clientX - h.x, event.clientY - h.y) < 4)) return; // (a click is not a move)
    let dx = (event.clientX - h.x) / h.zoom, dy = (event.clientY - h.y) / h.zoom;
    if (!h.handle && event.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
    h.box = h.handle ? resizedRef(h.from, h.handle, dx, dy) : {...h.from, x: h.from.x + dx, y: h.from.y + dy};
    setBox(h.box);
  };
  const release = () => {
    const h = hold.current;
    hold.current = null;
    if (!h) return;
    if (h.box) { onChange(item.id, h.box); setBox(null); } else if (!h.handle) flip.current?.();
  };
  const cancel = () => { hold.current = null; setBox(null); };
  return <div className={`sb-ref sb-ref--${item.kind}${picked ? ' is-picked' : ''}${box ? ' is-held' : ''}`} data-sb-ui="" title={item.name} style={{left: shown.x, top: shown.y, width: shown.w, height: shown.h}}
    onPointerDown={e => press(e)} onPointerMove={move} onPointerUp={release} onPointerCancel={cancel}
    onDoubleClick={() => { if (item.kind === 'file') window.open(item.url, '_blank', 'noopener'); }}
    onContextMenu={event => { event.preventDefault(); event.stopPropagation(); onPick(item.id); onMenu(event, item); }}>
    {item.kind === 'image' && <img src={item.url} alt={item.name} draggable={false} decoding="async"/>}
    {plays && <Media item={item} flip={flip}/>}
    {item.kind !== 'image' && item.kind !== 'video' && <div className="sb-ref-card">{item.kind === 'audio' ? Icon.note : Icon.file}<b>{item.name}</b></div>}
    {picked && <>
      <span className="sb-ref-name">{item.name}</span>
      {HANDLES.map(h => <i key={h} className={`sb-ref-handle sb-ref-handle--${h}`} onPointerDown={e => press(e, h)}/>)}
    </>}
  </div>;
});

// `zoom`: the view's, to keep the outline and the handles the same size on the screen; `zoomNow()`: the zoom this moment; `free()`: can a reference be picked now (not with the Hand tool, a Space held).
export default function StoryboardRefs({items, picked, zoom, zoomNow, free, onPick, onChange, onMenu}) {
  if (!items.length) return null;
  return <div className="sb-refs" style={{'--sb-k': 1 / zoom}}>
    {items.map(item => <Ref key={item.id} item={item} picked={picked === item.id} zoomNow={zoomNow} free={free} onPick={onPick} onChange={onChange} onMenu={onMenu}/>)}
  </div>;
}
