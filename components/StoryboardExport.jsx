'use client';
// Exporting a storyboard video as an MP4 file (the user, 2026-10-28: "add a way to export the videos in /storyboard"). The buttons ask /api/storyboard/export, which runs
// scripts/storyboard-export.mjs (a headless Chrome puts the video on each moment of itself, ffmpeg makes the file); the file is downloaded when it is done and is kept in
// exports/storyboard/<board>/. Where the buttons are: the video editor's top bar (`ExportButton`) and the sidebar, with a video picked (`ExportSection`: the size and the pictures a second).
// What an export is doing is kept here, not in a button: picking something else (the button goes) does not lose it, and the file still comes when it is done.
import {useState, useSyncExternalStore} from 'react';
import {Section, SelectField} from './StoryboardPanel';

const API = '/api/storyboard/export';
const IDLE = {state: 'idle'};
const jobs = new Map(), listeners = new Set();
const keyOf = (board, title) => `${board}\n${title}`;
const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener); };
const put = (key, job) => { jobs.set(key, job); listeners.forEach(l => l()); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function download(id, name) { // (the browser saves it: the server answers with an attachment)
  const a = document.createElement('a');
  a.href = `${API}?id=${encodeURIComponent(id)}&download=1`; a.download = name || 'video.mp4'; a.style.display = 'none';
  document.body.appendChild(a); a.click(); a.remove();
}

async function follow(key, id) {
  for (let lost = 0; ;) {
    await sleep(700);
    let job;
    try {
      const res = await fetch(`${API}?id=${encodeURIComponent(id)}`, {cache: 'no-store'}), body = await res.json();
      if (!res.ok) { put(key, {state: 'error', error: body.error ?? 'The export was lost.'}); return; }
      job = body; lost = 0;
    } catch { if (++lost > 5) { put(key, {state: 'error', error: 'Lost the connection to the site.'}); return; } continue; }
    put(key, job);
    if (job.state === 'done') { download(id, job.name); return; }
    if (job.state !== 'running') return;
  }
}

// Starts the export of the video called `title` on `board`: {width, fps} (the size of the file, pictures a second) are the usual when left out.
export async function startExport(board, title, options = {}) {
  const key = keyOf(board, title);
  if (jobs.get(key)?.state === 'running') return;
  put(key, {state: 'running', done: 0, total: 0, id: null});
  try {
    const res = await fetch(API, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({video: board, title, ...options})}), body = await res.json();
    if (!res.ok) { put(key, {state: 'error', error: body.error ?? 'The export could not start.'}); return; }
    put(key, {state: 'running', done: 0, total: 0, id: body.id});
    follow(key, body.id);
  } catch { put(key, {state: 'error', error: 'Could not reach the site.'}); }
}
export async function cancelExport(board, title) {
  const job = jobs.get(keyOf(board, title));
  if (job?.id) await fetch(`${API}?id=${encodeURIComponent(job.id)}`, {method: 'DELETE'}).catch(() => {});
}

export const useExport = (board, title) => {
  const key = keyOf(board, title);
  return useSyncExternalStore(subscribe, () => jobs.get(key) ?? IDLE, () => IDLE);
};

const Icon = {
  down: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 19.5h14"/></svg>,
};
const percent = job => (job.total ? Math.min(99, Math.floor((job.done / job.total) * 100)) : 0);
const label = job => (job.state !== 'running' ? 'Export' : job.total ? `Exporting ${percent(job)} %` : 'Starting…');

// A button for the video editor's top bar: Export, then the percent while it is made (the file is downloaded when it is done; a click while it is made stops it).
export function ExportButton({board, title, options}) {
  const job = useExport(board, title), running = job.state === 'running';
  const tip = running ? 'Making the MP4… click to stop it' : job.state === 'error' ? `${job.error} (click to try again)` : job.state === 'done' ? `Saved ${job.name} in exports/storyboard/${board}/ and downloaded (click to export again)` : 'Export this video as an MP4 file (1920 x 1080, 30 pictures a second)';
  return <button type="button" className={`sb-ve-export${running ? ' is-running' : ''}${job.state === 'error' ? ' is-error' : ''}`} onMouseDown={e => e.preventDefault()} onClick={() => (running ? cancelExport(board, title) : startExport(board, title, options))} title={tip} aria-label="Export the video as an MP4 file">
    {Icon.down}<span>{label(job)}</span>
  </button>;
}

// The board's menu on a video (right-click): the usual export, or a stop while it is made. The progress is in the sidebar (the video is picked by the right-click).
export function ExportMenuItem({board, title, onStart, text = 'Export as MP4'}) {
  const job = useExport(board, title), running = job.state === 'running';
  return <button type="button" role="menuitem" onClick={() => { (running ? cancelExport : startExport)(board, title); onStart?.(); }} title={running ? 'Stop making the MP4' : 'A silent MP4 of this video exactly as it plays (1920 x 1080, 30 pictures a second); it is downloaded when it is done. The size and rate are in the sidebar.'}>
    {running ? 'Stop the export' : text}<kbd>{running ? label(job) : '1920 × 1080'}</kbd>
  </button>;
}

const SIZES = [['1280', '1280 x 720'], ['1600', '1600 x 900 (as it is drawn)'], ['1920', '1920 x 1080'], ['2560', '2560 x 1440'], ['3840', '3840 x 2160 (4K)']];
const RATES = [['24', '24 pictures a second'], ['30', '30 pictures a second'], ['60', '60 pictures a second']];

// The sidebar's section for a picked video.
export function ExportSection({board, title}) {
  const [width, setWidth] = useState('1920'), [fps, setFps] = useState('30'), job = useExport(board, title), running = job.state === 'running';
  return <Section title="Export">
    <SelectField wide label="Size" value={width} options={SIZES.map(([value, name]) => ({value, label: name}))} onChange={setWidth}/>
    <SelectField wide label="Pictures a second" value={fps} options={RATES.map(([value, name]) => ({value, label: name}))} onChange={setFps}/>
    <div className="sb-apply-all sb-export">
      <button type="button" onClick={() => (running ? cancelExport(board, title) : startExport(board, title, {width: Number(width), fps: Number(fps)}))}>{running ? `${label(job)} · stop` : 'Export as MP4'}</button>
      <small>{running ? (job.total ? `Picture ${job.done} of ${job.total}. The file is downloaded when it is done.` : 'Opening the board in a hidden browser…')
        : job.state === 'done' ? `Saved ${job.name} (exports/storyboard/${board}/) and downloaded it.`
        : job.state === 'error' ? job.error
        : job.state === 'cancelled' ? 'Stopped. Nothing was saved.'
        : 'A silent MP4 of this video, exactly as it plays. A minute of video takes a few minutes. Needs the dev server, Chrome and ffmpeg.'}</small>
    </div>
  </Section>;
}
