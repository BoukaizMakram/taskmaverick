'use client';
// The Titles of a Remotion cut, in the inspector of the All videos page (the user, 2026-11-14: "add a way to add titles to the video and the audio generates automatically, like in inspector if I double click
// the video I should be able to see all titles and their sequence vertically and I can add title (position always follow bottom) and generate voice automatically"; written, NOT tested).
// Every title of the cut that plays, top to bottom as the film plays them: its second, its label and its words (retyped here, kept in the board's file like a double-click on the video: lib/remotion/cutWords.mjs),
// a mark for its voice (made, or not yet), a click on its second takes the video there. The voice of every title that has none is made by ElevenLabs as soon as it is added or retyped
// (POST /api/storyboard/voice, dev only: the same voice as the demos). A title added here can be deleted.
// EVERY cut with a voice has it since 2026-11-16 (the user: "add voice over to all videos ... with also a new feature where we can put text in between texts and generate the voice over"; written, NOT
// tested): between two titles a "+ Insert a title here" opens a small form there; the new title is said right after the one above it, where that one was, and what follows comes later
// (lib/remotion/cutTitles.mjs `placeAfter`, 'add:<k>:after'; lib/remotion/cutCore.mjs `story`). The form at the bottom adds one after the last.
// A NARRATOR'S VARIATION (the look `remotion-narrator`; the user, 2026-11-16: "the same video just with a narrator behind it instead of reading what's on screen"; written, NOT tested): under
// each title a second box, what the NARRATOR says for it (the plan's `c.voice`: its script's line, or as retyped here: the words' key '<id>:voice', lib/remotion/cutCore.mjs `story`); emptied,
// the script's line is back; a title with no line of its own (one added here) is read as it is written. The titles themselves are the film's: retyped here, they change in its other variation too.
// `edits`: the board's; `apply(board, fn)`: the page's way of changing and keeping them; `seek(second)`: the video stops there.
import {Fragment, useCallback, useMemo, useRef, useState} from 'react';
import {addTitle, addedOf, newTitleId, placeAfter, removeTitle, wrapVoice} from '@/lib/remotion/cutTitles.mjs';
import {cutWordsOf, setCutText} from '@/lib/remotion/cutWords.mjs';
import {madeVoiceOf} from '@/lib/remotion/cutVoice.mjs';
import {voiceHash, voiceLinesOf} from '@/lib/remotion/efficiencyVoice.mjs';
import {clock} from '@/lib/storyboardPlayer.mjs';

const DEV = process.env.NODE_ENV !== 'production';

export default function StoryboardTitlesPanel({board, cut, layout, edits, apply, seek}) {
  const words = useMemo(() => cutWordsOf(edits, cut.id), [edits?.cuts, cut.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const plan = useMemo(() => cut.make(words, {layout}), [cut, words, layout]);
  const anchors = useMemo(() => Object.fromEntries(addedOf(words).map(a => [a.id, a.after])), [words]); // (an added title's id -> the sentence it follows)
  const [made, setMade] = useState({}), [busy, setBusy] = useState(false), [error, setError] = useState(''), [draft, setDraft] = useState({label: '', text: ''});
  const [mid, setMid] = useState(null); // the form open between two titles: {index (the row it comes after), label, text}
  const run = useRef(0);

  // the voice of a line is made when audio for exactly its text is known: from the file the cut has, or from what the server said it made
  const lines = useMemo(() => voiceLinesOf(plan), [plan]), had = madeVoiceOf(plan, layout);
  const readyOf = line => {
    const hash = voiceHash(line.text);
    return made[line.id]?.hash === hash || had[line.id]?.hash === hash;
  };
  const voiced = lines.filter(readyOf).length;

  // ElevenLabs makes the audio that is missing, for the words as they will be (the server makes the cut from them)
  const generate = useCallback(async nextWords => {
    if (!DEV) return;
    const mine = ++run.current;
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/storyboard/voice', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({board, layout, words: nextWords})});
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || `The voice could not be made (${res.status}).`);
      if (run.current === mine) {
        setMade(m => ({...m, ...Object.fromEntries((out.lines ?? []).filter(l => l.ready).map(l => [l.id, {hash: voiceHash(l.text), duration: l.duration}]))}));
        if (out.missing?.length) setError('No ElevenLabs key on this machine (ELEVENLABS_API_KEY in .env.local): the voice is not made.');
      }
    } catch (e) { if (run.current === mine) setError(e.message); }
    finally { if (run.current === mine) setBusy(false); }
  }, [board, layout]);

  // the titles as the film plays them (an added one is said as the cut chains its sentences: by its second)
  const narrated = !!plan.narrated; // (a narrator's variation: `says` is what the narrator says for a title)
  const rows = [{key: 'title', id: 'title', at: 0.4, label: '', text: plan.title.lines.join('\n'), isTitle: true, says: plan.voiceTitle ?? ''},
    ...[...plan.captions].sort((a, b) => a.at - b.at).map(c => ({key: c.id, id: c.id, at: c.white ?? c.at, label: c.kickerLines?.join(' ') ?? c.kicker, text: c.lines.join('\n'), label0: c.kicker, after: anchors[c.id] ?? null, added: c.id in anchors, says: c.voice ?? ''}))];
  const lineOf = id => lines.find(l => l.id === id);

  const change = fn => { apply(board, fn); generate(cutWordsOf(fn(edits), cut.id)); }; // kept in the board's file, then the voice
  // a text retyped
  const retype = (key, text) => { const original = (plan.textOf(key)?.original ?? []).join('\n'); change(e => setCutText(e, cut.id, key, text, original)); };
  // what the narrator says for a title, retyped (kept on lines of at most 100 letters; the same as the script's line: the key goes and the script's is back)
  const resay = (id, text) => { const key = `${id}:voice`, original = (plan.textOf(key)?.original ?? []).join(' '); change(e => setCutText(e, cut.id, key, wrapVoice(text), wrapVoice(original))); };
  // a new title right after the row `index` (the last row: at the end)
  const addAfter = (index, {label, text}) => {
    if (!text.trim()) return;
    const k = newTitleId(), where = placeAfter(rows, index, k);
    change(e => addTitle(e, cut.id, {label, text, ...where}, k));
  };
  const remove = id => { const k = id.slice(4); change(e => removeTitle(e, cut.id, k)); };

  return <div className="sb-av-titles">
    <p className="sb-side-note">{rows.length} titles, in the order the film plays them · voice made for {voiced} of {lines.length}{busy ? ' · making the voice…' : ''}</p>
    {narrated && <p className="sb-side-note">A narrator’s variation: the screen shows each title, the voice says the line under it.</p>}
    {error && <p className="sb-av-titles-error" role="alert">{error}</p>}
    <ol className="sb-av-titles-list">
      {rows.map((r, i) => { const line = lineOf(r.id), ok = line ? readyOf(line) : false; return <Fragment key={r.key}>
        <li className={`sb-av-title${r.added ? ' is-added' : ''}`}>
          <div className="sb-av-title-head">
            <i className="sb-av-title-n">{i + 1}</i>
            <button type="button" className="sb-av-title-at" onClick={() => seek(r.at)} title="Go to this title on the video">{clock(r.at)}</button>
            {r.label0 !== undefined && <input className="sb-av-title-label" defaultValue={r.label} key={`l:${r.key}:${r.label}`} aria-label="Label" placeholder="Label" onBlur={e => { if (e.target.value.trim() !== r.label) retype(`${r.id}:kicker`, e.target.value); }}/>}
            <span className={`sb-av-title-voice${ok ? ' is-ready' : ''}`} title={ok ? 'Its voice is made' : DEV ? 'Its voice is not made yet' : 'Voices are made on the local site'}>{ok ? '♪' : '–'}</span>
            {r.added && <button type="button" className="sb-av-var-rm" onClick={() => remove(r.id)} title="Delete this title" aria-label="Delete this title">×</button>}
          </div>
          <textarea className="sb-av-title-text" rows={2} defaultValue={r.text} key={`t:${r.key}:${r.text}`} aria-label={`Title ${i + 1}`} onBlur={e => { if (e.target.value.trim() !== r.text.trim()) retype(r.id, e.target.value); }}/>
          {narrated && <textarea className="sb-av-title-text sb-av-title-says" rows={2} defaultValue={r.says} key={`v:${r.key}:${r.says}`} aria-label={`What the narrator says for title ${i + 1}`} placeholder="The narrator reads the title as it is written" title="What the narrator says for this title" onBlur={e => { if (e.target.value.replace(/\s+/g, ' ').trim() !== r.says) resay(r.id, e.target.value); }}/>}
        </li>
        {/* between this title and the next: a new one here (not right after the film's own title, which the first sentence follows by itself; after the last: the form at the bottom) */}
        {!r.isTitle && i < rows.length - 1 && (mid?.index === i
          ? <li className="sb-av-title-add is-between">
              <b>A title here, after {i + 1}</b>
              <input className="sb-av-title-label" value={mid.label} onChange={e => setMid(m => ({...m, label: e.target.value}))} placeholder="Label (optional)" aria-label="Label of the new title"/>
              <textarea className="sb-av-title-text" rows={2} autoFocus value={mid.text} onChange={e => setMid(m => ({...m, text: e.target.value}))} placeholder="The words, as the narrator says them" aria-label="Words of the new title"/>
              <div className="sb-av-title-row">
                <button type="button" className="sb-av-title-go" disabled={!mid.text.trim()} onClick={() => { addAfter(i, mid); setMid(null); }}>{DEV ? 'Insert and make the voice' : 'Insert'}</button>
                <button type="button" className="sb-av-title-go is-quiet" onClick={() => setMid(null)}>Cancel</button>
              </div>
            </li>
          : <li className="sb-av-title-between"><button type="button" onClick={() => setMid({index: i, label: '', text: ''})} title={`Put a title between ${i + 1} and ${i + 2}`}>+ Insert a title here</button></li>)}
      </Fragment>; })}
    </ol>
    <div className="sb-av-title-add">
      <b>Add a title</b>
      <small>It comes after the last one, where that one is. To put one between two titles, use “+ Insert a title here”.</small>
      <input className="sb-av-title-label" value={draft.label} onChange={e => setDraft(d => ({...d, label: e.target.value}))} placeholder="Label (optional)" aria-label="Label of the new title"/>
      <textarea className="sb-av-title-text" rows={2} value={draft.text} onChange={e => setDraft(d => ({...d, text: e.target.value}))} placeholder="The words, as the narrator says them" aria-label="Words of the new title"/>
      <button type="button" className="sb-av-title-go" onClick={() => { addAfter(rows.length - 1, draft); setDraft({label: '', text: ''}); }} disabled={!draft.text.trim()}>{DEV ? 'Add title and make the voice' : 'Add title'}</button>
      {DEV && lines.length > voiced && !busy && <button type="button" className="sb-av-title-go is-quiet" onClick={() => generate(words)}>Make the missing voices</button>}
    </div>
  </div>;
}
