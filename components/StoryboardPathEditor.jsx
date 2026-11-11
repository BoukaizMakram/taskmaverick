'use client';

// The Pen and the points of a path in the video editor (the user, 2026-10-28: "add a path tool to create a new one, change position of its points, delete them etc.. just like after
// effects"), drawn over the picture in the editor's own box (1600 x 900, inside the zoomed picture) and kept out of components/StoryboardVideoEditor.jsx, which only mounts it.
//   Pen (P): a click adds a corner point, a click and a drag adds a smooth one (its handles are pulled out), a click on the first point closes the path; Enter, Esc, a double-click or
//     another tool ends it (a line of one point is dropped); Backspace takes the last point off; Shift keeps a segment to 45°. The path is a new layer of the video.
//   A path picked (Selection tool): its points show. A press on one picks it (Shift: one more) and a drag moves all that are picked; the handles of a point picked are dragged to bend the
//     line (Alt: this one alone); Alt + a press on a point makes it smooth or a corner; Delete takes the points picked off; a double-click on the line adds a point there.
// What it changes it hands to `onChange(id, change)` / `onCreate(layer)` / `onRemove(id)` (the editor's own layer operations: one step of Undo each); while a point is dragged the path is
// drawn at once in the picture (`previewPath`) and kept when it is let go. Everything here is in stage px; the points are in the layer's frame (lib/storyboardPaths.mjs).
import {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {isShownAt, valuesAt} from '@/lib/storyboardLayers.mjs';
import {deletePoints, frameFromStage, frameOf, insertPoint, nearestOnPath, pathD, refitPath, setHandle, setSmooth, stagePoints, toLocal, vecToLocal} from '@/lib/storyboardPaths.mjs';
import {previewPath} from './storyboardLayers';

const PEN = {stroke: '#7b3cf0', strokeWidth: 4, startCap: 'none', endCap: 'none'}; // (a new path: the connectors' purple)
const CLOSE_PX = 10; // (a click this near the first point, on the screen, closes the path)
const SLOP_PX = 12;  // (a double-click this near the line, on the screen, adds a point on it)
const at45 = (from, q) => { // (Shift: the segment from `from` to `q` on the nearest of the 8 directions)
  const dx = q.x - from.x, dy = q.y - from.y, len = Math.hypot(dx, dy), a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
  return {x: from.x + Math.cos(a) * len, y: from.y + Math.sin(a) * len};
};

const StoryboardPathEditor = forwardRef(function StoryboardPathEditor({layer, now, tool, zoom, toStage: stageOf, layersRoot, panning, onChange, onCreate, onRemove}, ref) {
  const [picked, setPicked] = useState([]), [live, setLive] = useState(null), [draft, setDraftNow] = useState(null), [cursor, setCursor] = useState(null);
  const drag = useRef(null), draftRef = useRef(null), pickedRef = useRef(picked), liveRef = useRef(null), layerRef = useRef(layer), nowRef = useRef(now), finishRef = useRef(null);
  layerRef.current = layer; nowRef.current = now; pickedRef.current = picked;
  const setDraft = d => { draftRef.current = d; setDraftNow(d); };
  const isPath = layer?.kind === 'path';
  useEffect(() => { setPicked([]); setLive(null); liveRef.current = null; drag.current = null; }, [layer?.id]);

  // ---- the Pen ----
  const finish = (keep = true, closed = false) => {
    const d = draftRef.current;
    setDraft(null); setCursor(null);
    if (!d || !keep || d.points.length < 2) return false;
    const made = frameFromStage(d.points, closed);
    if (!made) return false;
    onCreate({kind: 'path', name: closed ? 'Shape' : 'Path', ...made, closed, ...PEN});
    return true;
  };
  finishRef.current = finish;
  useEffect(() => { if (tool !== 'pen' && draftRef.current) finishRef.current(true); }, [tool]);
  const penDown = e => {
    if (e.button !== 0 || panning?.()) return; // (the middle button and Space pan the picture: the editor's)
    e.preventDefault(); e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = stageOf(e), cur = draftRef.current, last = cur?.points.at(-1);
    const q = last && e.shiftKey ? at45(last, p) : {x: p.x, y: p.y};
    if (cur && cur.points.length >= 2 && Math.hypot(q.x - cur.points[0].x, q.y - cur.points[0].y) * zoom < CLOSE_PX) { finish(true, true); return; }
    setDraft({points: [...(cur?.points ?? []), q]});
    drag.current = {type: 'pen', p0: q, moved: false};
  };
  const penMove = e => {
    const d = drag.current, p = stageOf(e);
    if (!d) { if (draftRef.current) setCursor(e.shiftKey && draftRef.current.points.length ? at45(draftRef.current.points.at(-1), p) : p); return; }
    if (d.type !== 'pen') return;
    const dx = p.x - d.p0.x, dy = p.y - d.p0.y;
    if (!d.moved && Math.hypot(dx, dy) * zoom < 4) return;
    d.moved = true; // (pulled out: a smooth point, its handles one against the other)
    setDraft({points: draftRef.current.points.map((q, k, all) => (k === all.length - 1 ? {...q, ox: dx, oy: dy, ix: -dx, iy: -dy, smooth: true} : q))});
  };
  const penUp = () => { drag.current = null; };
  const penDouble = e => { // (the two presses of a double-click made two points on one spot)
    e.preventDefault(); e.stopPropagation();
    const d = draftRef.current;
    if (!d) return;
    const [a, b] = [d.points.at(-2), d.points.at(-1)];
    if (a && b && Math.hypot(a.x - b.x, a.y - b.y) * zoom < 6) setDraft({points: d.points.slice(0, -1)});
    finish(true);
  };

  // ---- the points of the path picked ----
  const values = isPath && isShownAt(layer, now) ? valuesAt(layer, now) : null;
  const editing = !!values && !layer.locked && (tool === 'select' || tool === 'pen');
  const points = live ?? layer?.points ?? [];
  const pts = editing ? stagePoints({...layer, points}, values) : [];
  const shown = picked.filter(i => i < pts.length);
  const show = next => { liveRef.current = next; setLive(next); previewPath(layersRoot?.(), {...layerRef.current, points: next}, valuesAt(layerRef.current, nowRef.current)); };
  const downPoint = (e, i) => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const l = layerRef.current;
    if (!l) return;
    if (e.altKey) { // (smooth <-> corner)
      onChange(l.id, x => refitPath({...x, points: setSmooth(x.points, x.closed, i, !x.points[i]?.smooth)}));
      setPicked([i]);
      return;
    }
    const was = pickedRef.current.includes(i), next = e.shiftKey ? (was ? pickedRef.current.filter(k => k !== i) : [...pickedRef.current, i]) : was ? pickedRef.current : [i];
    setPicked(next);
    if (e.shiftKey && was) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {type: 'pts', ids: next, p0: stageOf(e), base: l.points.map(q => ({...q})), f: frameOf(l, valuesAt(l, nowRef.current)), moved: false};
  };
  const downHandle = (e, i, which) => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const l = layerRef.current;
    if (!l) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {type: 'handle', i, which, p0: stageOf(e), base: l.points.map(q => ({...q})), f: frameOf(l, valuesAt(l, nowRef.current)), moved: false};
  };
  const move = e => {
    const d = drag.current;
    if (!d || d.type === 'pen') return;
    e.stopPropagation();
    const p = stageOf(e);
    let dx = p.x - d.p0.x, dy = p.y - d.p0.y;
    if (d.type === 'pts' && e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
    if (!d.moved && Math.hypot(dx, dy) * zoom < 3) return;
    d.moved = true;
    if (d.type === 'pts') {
      const [lx, ly] = vecToLocal(d.f, dx, dy);
      show(d.base.map((q, k) => (d.ids.includes(k) ? {...q, x: q.x + lx, y: q.y + ly} : q)));
    } else {
      const [mx, my] = toLocal(d.f, p.x, p.y), b = d.base[d.i];
      show(d.base.map((q, k) => (k === d.i ? setHandle(e.altKey ? {...q, smooth: false} : q, d.which, mx - b.x, my - b.y) : q))); // (Alt: this handle alone)
    }
  };
  const up = e => {
    const d = drag.current, next = liveRef.current;
    drag.current = null;
    if (!d || d.type === 'pen') return;
    e.stopPropagation();
    liveRef.current = null; setLive(null);
    const l = layerRef.current;
    if (d.moved && next && l) onChange(l.id, x => refitPath({...x, points: next}));
  };

  useImperativeHandle(ref, () => ({
    hasDraft: () => !!draftRef.current,
    finish: keep => finish(keep),
    back: () => { const d = draftRef.current; if (!d) return false; setDraft(d.points.length <= 1 ? null : {points: d.points.slice(0, -1)}); return true; }, // (Backspace in the Pen: the last point)
    hasPicked: () => pickedRef.current.length > 0 && layerRef.current?.kind === 'path',
    deletePicked: () => { // (Delete: the points picked; a path left with fewer than two goes)
      const l = layerRef.current, idx = pickedRef.current;
      if (!l || l.kind !== 'path' || !idx.length) return false;
      if (deletePoints(l.points, idx)) onChange(l.id, x => refitPath({...x, points: deletePoints(x.points, idx) ?? x.points})); else onRemove(l.id);
      setPicked([]);
      return true;
    },
    insertAt: p => { // (a double-click on the line: a point there, the curve kept as it was)
      const l = layerRef.current;
      if (!l || l.kind !== 'path') return false;
      const f = frameOf(l, valuesAt(l, nowRef.current)), [lx, ly] = toLocal(f, p.x, p.y), near = nearestOnPath(l.points, l.closed, lx * f.kx, ly * f.ky, f.kx, f.ky);
      if (!near || near.d > SLOP_PX / zoom) return false;
      const made = insertPoint(l.points, l.closed, near.seg, near.t);
      onChange(l.id, x => refitPath({...x, points: insertPoint(x.points, x.closed, near.seg, near.t).points}));
      setPicked([made.index]);
      return true;
    },
  }));

  if (!draft && !editing && tool !== 'pen') return null;
  const s = 4 / zoom, hs = 3.5 / zoom;
  return <svg className="sb-ve-pts" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
    {tool === 'pen' && <rect className="sb-ve-pen-hit" x={-4000} y={-4000} width={9600} height={9000} onPointerDown={penDown} onPointerMove={penMove} onPointerUp={penUp} onPointerCancel={penUp} onDoubleClick={penDouble}/>}
    {draft && <g className="sb-ve-pen-draft">
      {draft.points.length > 1 && <path className="sb-ve-pts-line" d={pathD(draft.points, false)}/>}
      {cursor && draft.points.length > 0 && <path className="sb-ve-pts-rubber" d={`M${draft.points.at(-1).x} ${draft.points.at(-1).y}L${cursor.x} ${cursor.y}`}/>}
      {draft.points.map((q, i) => <rect key={i} className={`pt${i === 0 && draft.points.length > 1 ? ' is-first' : ''}`} x={q.x - s} y={q.y - s} width={2 * s} height={2 * s} style={{pointerEvents: 'none'}}/>)}
    </g>}
    {editing && <g className="sb-ve-pts-edit">
      <path className="sb-ve-pts-line" d={pathD(pts, !!layer.closed)}/>
      {shown.flatMap(i => [['in', pts[i].ix, pts[i].iy], ['out', pts[i].ox, pts[i].oy]].filter(([, hx, hy]) => hx || hy).map(([which, hx, hy]) => <line key={`l${i}${which}`} className="hd-line" x1={pts[i].x} y1={pts[i].y} x2={pts[i].x + hx} y2={pts[i].y + hy}/>))}
      {pts.map((q, i) => <rect key={i} className={`pt${shown.includes(i) ? ' is-on' : ''}${q.smooth ? ' is-smooth' : ''}`} x={q.x - s} y={q.y - s} width={2 * s} height={2 * s} rx={q.smooth ? s : 0}
        onPointerDown={e => downPoint(e, i)} onPointerMove={move} onPointerUp={up} onPointerCancel={up}><title>{`Point ${i + 1}: drag to move · Alt + press: smooth / corner · Delete: take it off`}</title></rect>)}
      {shown.flatMap(i => [['in', pts[i].ix, pts[i].iy], ['out', pts[i].ox, pts[i].oy]].filter(([, hx, hy]) => hx || hy).map(([which, hx, hy]) => <circle key={`h${i}${which}`} className="hd" cx={pts[i].x + hx} cy={pts[i].y + hy} r={hs}
        onPointerDown={e => downHandle(e, i, which)} onPointerMove={move} onPointerUp={up} onPointerCancel={up}><title>Drag to bend the line (Alt: this handle alone)</title></circle>))}
    </g>}
  </svg>;
});
export default StoryboardPathEditor;
