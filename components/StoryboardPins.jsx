'use client';
// The comments' pins over a video's picture, on the board and on the All videos page (the user, 2026-10-30: "the comments should be in /storyboard before going to video editor"). The data
// is the video editor's (lib/storyboardComments.mjs, `edits.comments[<video title>]`); a pin is drawn here in the picture's own 1600 x 900 px, as a percent of the layer that holds it,
// so it scales with the board. It is NEVER part of the picture: the layer is a sibling of the video's screen, which is all an export or a clip takes.
//   list    the comments of the video; picked: the id picked (or null)
//   pick(c), move(c, {x, y}), menu(event, c): a press picks it, a drag moves it (one step of Undo), a right-click is its menu
//   screen  () -> the element the picture is drawn in (its box turns a drag into picture px)
//   rootRef the layer's element, for `showPins`; className: more classes for the layer
//   number  (c) -> what its pin says, when it is not its place in `list` (a part of a stitched video: its number in the whole video)
import {STAGE_H, STAGE_W} from '@/lib/storyboardLayers.mjs';
import {sceneAt} from '@/lib/storyboardPlayer.mjs';

// A pin shows only in the scene it was put in, playing or held, and the picked one always (the user, 2026-10-30: "the comment should last only for the scene where I commented, not the whole last half
// of video, just the scene"). A comment marked done shows nowhere, picked or not (the user, 2026-11-03). `t`: the second the video is on, `script`: its script ({played, timeline}). Done by the
// owner each picture, with no React drawing.
export function showPins(root, list, picked, t, script) {
  if (!root || !list) return;
  const {played, timeline} = script ?? {}, scene = sceneAt(played, timeline, t);
  for (const el of root.children) {
    const c = list.find(x => x.id === el.dataset.id);
    el.hidden = !(c && !c.done && (c.id === picked || (scene && sceneAt(played, timeline, c.at)?.from === scene.from)));
  }
}

const round = n => Math.round(n * 10) / 10;

export default function StoryboardPins({rootRef, className = '', screen, list, picked, pick, move, menu, number}) {
  // A pin pressed: it is picked (its words are the sidebar's); dragged it moves. It never plays or pauses the video.
  const down = (event, c) => {
    if (event.button !== 0) return;
    event.stopPropagation(); event.preventDefault();
    const el = event.currentTarget, box = screen()?.getBoundingClientRect(), from = {x: event.clientX, y: event.clientY};
    let to = null;
    pick?.(c);
    if (!box || !box.width) return;
    try { el.setPointerCapture(event.pointerId); } catch {}
    const go = e => {
      if (!to && Math.hypot(e.clientX - from.x, e.clientY - from.y) < 4) return;
      to = {x: round(Math.min(STAGE_W, Math.max(0, c.x + (e.clientX - from.x) / box.width * STAGE_W))), y: round(Math.min(STAGE_H, Math.max(0, c.y + (e.clientY - from.y) / box.height * STAGE_H)))};
      el.style.left = `${to.x / STAGE_W * 100}%`; el.style.top = `${to.y / STAGE_H * 100}%`;
    };
    const up = () => {
      el.removeEventListener('pointermove', go); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      if (to) move?.(c, to);
    };
    el.addEventListener('pointermove', go); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };
  return <div ref={rootRef} className={`sb-pl-pins ${className}`} data-sb-ui="">
    {list.map((c, n) => { const says = number?.(c) ?? n + 1, words = c.text.trim(); return <div key={c.id} data-id={c.id} role="button" aria-label={`Comment ${says}${words ? `: ${words}` : ''}`}
      className={`sb-pl-pin${picked === c.id ? ' is-on' : ''}${c.x > STAGE_W * 0.6 ? ' is-flip' : ''}${words ? ' has-text' : ''}`} style={{left: `${c.x / STAGE_W * 100}%`, top: `${c.y / STAGE_H * 100}%`}}
      onPointerDown={e => down(e, c)} onClick={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()} onContextMenu={e => { e.preventDefault(); e.stopPropagation(); menu?.(e, c); }}>
      <div className="sb-pl-pin-body"><b className="sb-pl-pin-n">{says}</b>{words ? <span className="sb-pl-pin-text">{words}</span> : null}</div>
    </div>; })}
  </div>;
}
