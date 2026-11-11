import { spawn } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { videoOf } from '@/lib/storyboardStore.mjs';
import { eventOf, optionsOf, slugOf } from '@/lib/storyboardExport.mjs';
import { cutOf, renderCommandOf } from '@/lib/remotion/cuts.mjs';

// Exporting a storyboard video as an MP4 file (the user, 2026-10-28: "add a way to export the videos in /storyboard"). The work is scripts/storyboard-export.mjs (a headless Chrome
// puts the video on each moment of itself, ffmpeg makes the file); this runs it for the buttons (components/StoryboardExport.jsx) and keeps track of it. One export at a time.
// A board's REMOTION CUT is exported too (the user, 2026-11-11: "add a way to export videos from the storyboard videos"; the films of the All videos page had only a command to copy):
// POST { video, cut: true } renders the cut the board plays (its variation's: lib/remotion/cuts.mjs `renderCommandOf`) with the Remotion project's own `npx remotion render`, there, and
// the file it writes (that project's out/) is the one downloaded. Its progress is the pictures Remotion says it has rendered.
// POST { video, title, fps?, width? } -> { id }, or 409 { error, id } while another is on
// GET ?id=<id> -> { state: 'running' | 'done' | 'error' | 'cancelled', done, total, name, file, error }; with &download=1 the file itself (MP4)
// DELETE ?id=<id>: stops it
// The files are kept in exports/storyboard/<board>/ (not in git). Local development only, like /api/storyboard: the script needs the dev server, Chrome and ffmpeg.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROOT = process.cwd(), OUT = path.join(ROOT, 'exports', 'storyboard'), SCRIPT = path.join(ROOT, 'scripts', 'storyboard-export.mjs');
const jobs = (globalThis.__sbExportJobs ??= new Map()); // (kept across the dev server's reloads of this file)
const KEEP = 20;

const same = request => request.headers.get('origin') === new URL(request.url).origin;
const none = () => new Response(null, { status: 404 });
const viewOf = ({ id, state, board, title, done, total, name, error }) => ({ id, state, board, title, done, total, name, error });

function killTree(child) { // (Chrome and ffmpeg are the script's children: all of them stop)
  if (!child?.pid || child.exitCode !== null) return;
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
  else child.kill('SIGTERM');
}

function start(board, title, options, origin) {
  const id = Math.random().toString(36).slice(2, 10);
  const job = { id, state: 'running', board, title, done: 0, total: 0, name: null, file: null, error: null, child: null };
  const args = [SCRIPT, '--json', '--video', board, '--line', title, '--exact', '--site', origin, '--out', OUT, '--fps', String(options.fps), '--width', String(options.width)];
  const child = spawn(process.execPath, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  job.child = child;
  let pending = '', errors = '';
  const take = line => {
    const event = eventOf(line);
    if (!event) return;
    if (event.event === 'start') job.total = Number(event.frames) || 0;
    else if (event.event === 'progress') { job.done = Number(event.done) || 0; job.total = Number(event.total) || job.total; }
    else if (event.event === 'done') { job.file = event.file; job.name = event.name; job.done = job.total; }
    else if (event.event === 'error') job.error = String(event.message ?? 'The export failed.');
  };
  child.stdout.on('data', chunk => { pending += chunk; const lines = pending.split('\n'); pending = lines.pop(); lines.forEach(take); });
  child.stderr.on('data', chunk => { errors = (errors + chunk).slice(-1500); });
  child.on('error', error => { job.error = `Could not start the export: ${error.message}`; });
  child.on('close', async () => {
    take(pending);
    if (job.state === 'cancelled') await rm(path.join(OUT, board, `${slugOf(title)}.mp4`), { force: true }).catch(() => {}); // (the half of a file it left)
    else job.state = job.file && !job.error ? 'done' : 'error';
    if (job.state === 'error' && !job.error) job.error = errors.trim().split('\n').pop() || 'The export stopped before it was done.';
    job.child = null;
  });
  jobs.set(id, job);
  for (const old of [...jobs.keys()].slice(0, Math.max(0, jobs.size - KEEP))) if (jobs.get(old).state !== 'running') jobs.delete(old);
  return job;
}

// A board's Remotion cut: the command that renders it is `cd "<the Remotion project>" && npx remotion render <composition> <file>` (lib/remotion/cuts.mjs); it is run there, as it is written
const RENDER = /^cd "(.+?)" && npx remotion render (\S+) (\S+)$/;
function startCut(board, title, command) {
  const [, dir, composition, out] = command.match(RENDER), file = path.join(dir, out);
  const id = Math.random().toString(36).slice(2, 10);
  const job = { id, state: 'running', board, title, done: 0, total: 0, name: path.basename(out), file: null, error: null, child: null };
  const child = spawn('npx', ['remotion', 'render', composition, out], { cwd: dir, shell: true, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }); // (npx is a .cmd on Windows: through the shell)
  job.child = child;
  let said = '';
  const take = chunk => {
    const text = String(chunk);
    said = (said + text).slice(-2000);
    for (const m of text.matchAll(/Rendered\s+(\d+)\s*\/\s*(\d+)/g)) { job.done = Number(m[1]); job.total = Number(m[2]); } // (Remotion: "Rendered 120/3127")
  };
  child.stdout.on('data', take);
  child.stderr.on('data', take);
  child.on('error', error => { job.error = `Could not start the render: ${error.message}`; });
  child.on('close', async code => {
    if (job.state === 'cancelled') await rm(file, { force: true }).catch(() => {}); // (the half of a file it left)
    else if (code === 0 && !job.error) { job.state = 'done'; job.file = file; job.done = job.total; }
    else { job.state = 'error'; job.error ??= said.trim().split('\n').filter(Boolean).pop() || 'The render stopped before it was done.'; }
    job.child = null;
  });
  jobs.set(id, job);
  return job;
}

export async function POST(request) {
  if (process.env.NODE_ENV === 'production') return none();
  if (!same(request)) return Response.json({ error: 'Must come from this site.' }, { status: 403 });
  let body, board;
  try { body = await request.json(); board = videoOf(body.video); } catch { /* answered below */ }
  const cut = body?.cut === true, title = typeof body?.title === 'string' ? body.title.trim() : '';
  if (!board || (!cut && !title) || title.length > 300) return Response.json({ error: 'Which video? A board and the title of the video are needed.' }, { status: 400 });
  const running = [...jobs.values()].find(j => j.state === 'running');
  if (running) return Response.json({ error: `"${running.title}" is being exported. One at a time.`, id: running.id }, { status: 409 });
  if (cut) { // the Remotion cut the board plays now (its saved edits say which variation)
    let edits = null;
    try { edits = JSON.parse(await readFile(path.join(ROOT, 'content', 'storyboard', `${board}.json`), 'utf8')); } catch { /* a board never edited: the cut as it is made */ }
    const command = renderCommandOf(board, edits);
    if (!command || !RENDER.test(command)) return Response.json({ error: 'This board has no Remotion cut to render.' }, { status: 400 });
    return Response.json({ id: startCut(board, cutOf(board, edits).title, command).id });
  }
  const job = start(board, title, optionsOf(body), new URL(request.url).origin);
  return Response.json({ id: job.id });
}

export async function GET(request) {
  if (process.env.NODE_ENV === 'production') return none();
  const params = new URL(request.url).searchParams, job = jobs.get(params.get('id') ?? '');
  if (!job) return Response.json({ error: 'No such export (the site was restarted?). The files are in exports/storyboard/.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  if (!params.has('download')) return Response.json(viewOf(job), { headers: { 'Cache-Control': 'no-store' } });
  if (job.state !== 'done' || !job.file) return Response.json({ error: 'Not done yet.' }, { status: 409 });
  try {
    const data = await readFile(job.file);
    return new Response(data, { headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(data.length), 'Content-Disposition': `attachment; filename="${job.name}"`, 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'The file is not there any more.' }, { status: 404 }); }
}

export async function DELETE(request) {
  if (process.env.NODE_ENV === 'production') return none();
  if (!same(request)) return Response.json({ error: 'Must come from this site.' }, { status: 403 });
  const job = jobs.get(new URL(request.url).searchParams.get('id') ?? '');
  if (!job) return Response.json({ error: 'No such export.' }, { status: 404 });
  if (job.state === 'running') { job.state = 'cancelled'; killTree(job.child); }
  return Response.json(viewOf(job));
}
