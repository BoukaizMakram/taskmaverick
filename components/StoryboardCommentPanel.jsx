'use client';
// The inspector of a comment of the video open in the video editor (the user, 2026-10-29: "add a way to add comment to the video, the comment should be a point I can place and write what
// I want and save its placement and the comment itself, it can be deleted right clicking it and delete or selecting and hitting delete on the right inspector"): the words (saved as they
// are typed; a run of typing is one step of Undo), whether it is done, the point it sits on and the second it is at, and a red Delete. The comment itself is in lib/storyboardComments.mjs
// (`edits.comments[<video title>]`); the pin is drawn by the editor (components/StoryboardVideoEditor.jsx) and is never in the video.
import {NumField, Section} from './StoryboardPanel';
import {COMMENT_SHOW, COMMENT_TEXT_MAX} from '@/lib/storyboardComments.mjs';
import {STAGE_H, STAGE_W} from '@/lib/storyboardLayers.mjs';

const two = n => Math.round(n * 100) / 100;
const placedOn = iso => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}); };

// `comment`: the comment (null: it is not in the video any more), `number`: its place in the list, `ops`: the editor's commentOps {change(id, patch, merge), remove(id)},
// `onSeek(seconds)`: the editor's playhead goes there (on the board, where the comment is picked on its video: the video editor opens there; `seekLabel`, `seekTitle` say so),
// `onDelete()`: deletes it and picks nothing (one step of Undo), `offset`: where its video begins in the one it is seen in (a part of a stitched video: the second shown is the whole video's),
// `byScene`: its pin shows for its scene (a board, All videos), not for COMMENT_SHOW.after seconds (the video editor)
export default function CommentPanel({comment: c, number, total, ops, onSeek, onDelete, seekLabel = 'Go to its second', seekTitle = 'Put the playhead on the second of this comment', offset = 0, byScene = false}) {
  if (!c) return <div className="sb-side-head"><b>Comment</b><small>It is not in this video any more</small></div>;
  return <>
    <div className="sb-side-head"><b>Comment {number}</b><small>{number} of {total} · a note on this video, not part of its picture{placedOn(c.created) ? ` · placed ${placedOn(c.created)}` : ''}</small></div>
    <Section title="Comment">
      <textarea className="sb-vl-words sb-cm-text" rows={5} value={c.text} maxLength={COMMENT_TEXT_MAX} placeholder="Write what you want to say here…" aria-label="The comment" spellCheck="true"
        onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape') e.currentTarget.blur(); }} onChange={e => ops.change(c.id, {text: e.target.value}, `ctext:${c.id}`)}/>
      <label className="sb-row"><input type="checkbox" checked={!!c.done} onChange={e => ops.change(c.id, {done: e.target.checked})}/> Done</label>
    </Section>
    <Section title="Place">
      <div className="sb-row">
        <NumField label="X" min={0} max={STAGE_W} value={Math.round(c.x)} title="Where its point is on the picture (the video is 1600 x 900)" onChange={v => ops.change(c.id, {x: v}, `cx:${c.id}`)}/>
        <NumField label="Y" min={0} max={STAGE_H} value={Math.round(c.y)} title="Where its point is on the picture (the video is 1600 x 900)" onChange={v => ops.change(c.id, {y: v}, `cy:${c.id}`)}/>
      </div>
      <div className="sb-row">
        <NumField label="At" unit="s" step={0.1} min={0} value={two(c.at + offset)} title={`The second of the video it is at: its pin is on the picture ${byScene ? 'for the scene of this second' : `from there to ${COMMENT_SHOW.after} s after`} (always while it is picked)`} onChange={v => ops.change(c.id, {at: Math.max(0, two(v - offset))}, `cat:${c.id}`)}/>
        <span className="sb-row-fill"/>
      </div>
      <p className="sb-side-note">{c.done ? 'It is done, so its pin is not on the video. Untick Done to bring it back.' : <>Its pin is on the picture {byScene ? 'for its scene only' : `from ${two(c.at + offset)} s to ${two(c.at + offset + COMMENT_SHOW.after)} s`}, and while it is picked. Drag the pin to move it · right-click it: Delete.</>}</p>
    </Section>
    <div className="sb-buttons">
      <button type="button" onClick={() => onSeek(c.at)} title={seekTitle}>{seekLabel}</button>
      <button type="button" className="sb-danger" onClick={onDelete} title="Delete the comment (Delete, when the keyboard is not in a field)">Delete</button>
    </div>
  </>;
}
