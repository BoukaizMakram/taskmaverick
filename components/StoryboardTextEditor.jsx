'use client';
// The video's text editor (the user, 2026-10-14: "work on a video editor so that I can double click any text on any video and I should be able to change the text size, font,
// content, position, boundaries on the fly"). A double-click on a text in a video stops it on that frame and retypes the words in place (components/StoryboardPlayer.jsx); this is
// what comes with it ON THE VIDEO: the text's box drawn over the picture, with handles to resize it (its boundaries) and its edges to move it. Its look (the font, the size, the weight,
// the color, the alignment) and the box's numbers are in the sidebar, the video's inspector (`TextFields` below; the user, 2026-10-21: "I would love to have it as an inspector on the right
// instead of popping up. Same thing for the text and everything ... when it comes to the content itself, I can just double click and change the text on the video itself").
// Everything is put on the text at once (the engine's `liveText`) and kept on the frame (`vtext`, lib/storyboardEdits.mjs): the slide on the board is not touched, only the video's text.
//   read()                 the text box now ({rect: [x, y, w, h] (stage px), look, own, auto}), asked every picture so the frame follows typing, a font coming in, the board's pan and zoom
//   onPreview(patch)       while a handle is dragged: shown, not kept
//   onCommit(patch)        shown and kept
//   onDone(keep)           the editing ends: a press anywhere but on the text, its box or the sidebar's Text is Done. The look that was changed is THIS video's words' (the user, 2026-10-21:
//                          "it doesn't apply to all until I hit an apply to all button ... first it should apply to only the video I have"): the inspector's Apply to all gives it to every video
//   holding, focusText     a handle held (a ref: the text is not left because the press took the keyboard from it), and the keyboard given back to the text
import {useEffect, useRef, useState} from 'react';
import {FONTS} from '@/lib/storyboardEdits.mjs';
import {MIN_BOX, draggedRect, typedRect} from '@/lib/storyboardTextEdit.mjs';
import {ColorField, IconButtons, NumField, PanelIcon, Section, SelectField, solidHex} from './StoryboardPanel';

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const WEIGHTS = [[300, 'Light'], [400, 'Regular'], [500, 'Medium'], [600, 'Semibold'], [700, 'Bold'], [800, 'Extra bold']];
const ALIGN = [{id: 'left', label: 'Text: left', icon: PanelIcon.tleft}, {id: 'center', label: 'Text: center', icon: PanelIcon.tcenter}, {id: 'right', label: 'Text: right', icon: PanelIcon.tright}];
const weightOf = n => Math.min(800, Math.max(300, Math.round((Number(n) || 400) / 100) * 100));
const sameBox = (a, b) => JSON.stringify([a?.rect, a?.look, a?.own, a?.auto]) === JSON.stringify([b?.rect, b?.look, b?.own, b?.auto]);
// Where the screen is on the page and how big the board's zoom draws it (its own px are 1600 wide).
const viewOf = screen => { const r = screen.getBoundingClientRect(); return {left: r.left, top: r.top, scale: r.width / (screen.offsetWidth || 1600) || 1}; };
// The text box as it is, asked every picture: the state only changes when it did.
function useBox(read) {
  const [box, setBox] = useState(() => read());
  useEffect(() => {
    let id = 0;
    const tick = () => { const next = read(); if (next) setBox(prev => (sameBox(prev, next) ? prev : next)); id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [read]);
  return box;
}

// ---- On the video: the box, its handles and its edges ----
export default function StoryboardTextEditor({screen, read, onPreview, onCommit, onDone, holding, focusText}) {
  const box = useBox(read), [view, setView] = useState(() => viewOf(screen)), drag = useRef(null);
  const doneRef = useRef(onDone); doneRef.current = onDone;
  useEffect(() => { // the board's pan and zoom move the screen
    let id = 0;
    const tick = () => { const v = viewOf(screen); setView(prev => (prev.left === v.left && prev.top === v.top && prev.scale === v.scale ? prev : v)); id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [screen]);
  useEffect(() => { // a press anywhere else (not on the box, not on the text, not on the sidebar's Text) ends it: Done
    const away = event => {
      if (event.target.closest?.('[data-sb-te], [contenteditable]')) return;
      const field = document.activeElement; // (a number typed in the sidebar and not left yet is kept first)
      if (field instanceof HTMLInputElement && field.closest('[data-sb-te]')) field.blur();
      doneRef.current(true);
    };
    document.addEventListener('pointerdown', away, true);
    return () => document.removeEventListener('pointerdown', away, true);
  }, []);
  if (!box) return null;

  const [x, y, w, h] = box.rect, inv = 1 / view.scale;
  const press = (event, mode) => { // a handle (or an edge: move) is pressed: the text keeps the keyboard
    if (event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    holding.current = true; focusText(); // (the press may have taken the keyboard from the text: it is given back)
    drag.current = {mode, x: event.clientX, y: event.clientY, rect: box.rect, auto: box.auto, scale: view.scale, last: null};
  };
  const drive = event => {
    const d = drag.current;
    if (!d) return;
    let dx = (event.clientX - d.x) / d.scale, dy = (event.clientY - d.y) / d.scale;
    if (event.shiftKey && d.mode === 'move') { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; } // (Shift: along one line, like Figma)
    d.last = draggedRect(d, dx, dy);
    onPreview({rect: d.last});
  };
  const release = () => { const d = drag.current; drag.current = null; holding.current = false; focusText(); if (d?.last) onCommit({rect: d.last}); };
  const keepFocus = event => event.preventDefault(); // (pressing a handle is not leaving the text: the keyboard stays in it)
  return <div className="sb-te" data-sb-te="" style={{'--inv': inv}}>
    <div className="sb-te-box" style={{left: x, top: y, width: w, height: h}}>
      <i className="sb-te-grip" onMouseDown={keepFocus} onPointerDown={event => press(event, 'move')} onPointerMove={drive} onPointerUp={release} onPointerCancel={release} title="Drag to move (Shift: along one line)"><svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v16M2 10h16M10 2 7.2 4.8M10 2l2.8 2.8M10 18l-2.8-2.8M10 18l2.8-2.8M2 10l2.8-2.8M2 10l2.8 2.8M18 10l-2.8-2.8M18 10l-2.8 2.8"/></svg></i>
      {['n', 's', 'e', 'w'].map(side => <i key={side} className={`sb-te-edge sb-te-edge--${side}`} onMouseDown={keepFocus} onPointerDown={event => press(event, 'move')} onPointerMove={drive} onPointerUp={release} onPointerCancel={release} title="Drag to move (Shift: along one line)"/>)}
      {HANDLES.map(handle => <i key={handle} className={`sb-te-h sb-te-h--${handle}`} onMouseDown={keepFocus} onPointerDown={event => press(event, handle)} onPointerMove={drive} onPointerUp={release} onPointerCancel={release} title="Drag to change the boundaries"/>)}
    </div>
  </div>;
}

// ---- In the sidebar: the look and the box of the text being retyped (the board's video inspector, components/Storyboard.jsx) ----
// `edit`: what the video hands the board while a text is retyped ({kind, read, preview, commit, reset, done, focusText}: components/StoryboardPlayer.jsx).
export function TextFields({edit}) {
  const box = useBox(edit.read);
  if (!box) return null;
  const {rect: [x, y, w, h], look, own, auto} = box;
  const font = own.font ?? look.font ?? '', weight = weightOf(own.weight ?? look.weight), align = own.align ?? look.align ?? 'left', color = own.color ?? solidHex(look.color) ?? '#ffffff', size = Math.round(own.fontSize ?? look.fontSize);
  const rectWith = (i, value) => typedRect(box.rect, auto, i, value); // (a number of the box typed in; the height left empty is as tall as its words)
  const keepText = event => { if (!event.target.closest('input, select')) event.preventDefault(); }; // (a press on a button does not take the keyboard from the text)
  return <div data-sb-te="" onMouseDown={keepText} onKeyDown={event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) edit.done(true); }}>
    <Section title="Text · this video">
      <SelectField wide label="Font" value={font} options={[...(font ? [] : [{value: '', label: 'As the video has it', disabled: true}]), ...Object.entries(FONTS).map(([value, label]) => ({value, label}))]} onChange={v => edit.commit({font: v || null})}/>
      <div className="sb-row">
        <SelectField label="Weight" value={String(weight)} options={WEIGHTS.map(([value, label]) => ({value: String(value), label}))} onChange={v => edit.commit({weight: Number(v)})}/>
        <NumField label="Aa" title="Text size" value={size} min={4} onChange={v => edit.commit({fontSize: v})}/>
      </div>
      <IconButtons items={ALIGN} value={align} onChange={v => edit.commit({align: v})}/>
      <div className="sb-sublabel">Color</div>
      <ColorField label="Text color" value={color} onChange={c => edit.commit({color: c})}/>
    </Section>
    <Section title="Box">
      <div className="sb-row">
        <NumField label="X" value={Math.round(x)} step={5} onChange={n => edit.commit({rect: rectWith(0, n)})}/>
        <NumField label="Y" value={Math.round(y)} step={5} onChange={n => edit.commit({rect: rectWith(1, n)})}/>
      </div>
      <div className="sb-row">
        <NumField label="W" value={Math.round(w)} step={10} min={MIN_BOX.w} onChange={n => edit.commit({rect: rectWith(2, n)})}/>
        <NumField label="H" value={auto ? '' : Math.round(h)} placeholder="Auto" step={10} min={MIN_BOX.h} onChange={n => edit.commit({rect: rectWith(3, n)})}/>
      </div>
      <p className="sb-side-none">Type in the text on the video to change its words · drag its edges to move it, its handles to resize it</p>
    </Section>
    <div className="sb-buttons sb-te-end">
      <button type="button" onClick={() => edit.reset()} title="This text, and this video's words, as the videos have them">Reset</button>
      <button type="button" onClick={() => edit.done(true)} title="Done with this text (Ctrl+Enter): the change stays on this video">Done</button>
    </div>
  </div>;
}
