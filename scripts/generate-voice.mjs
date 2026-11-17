// The voice-over of every Remotion cut, made with ElevenLabs (the user, 2026-11-16: "add voice over to all videos"; Increased Efficiency's since 2026-11-13).
//
//   node scripts/generate-voice.mjs                    # every board whose playing variation is a Remotion cut with a voice: the missing or changed lines only
//   node scripts/generate-voice.mjs --video <board>    # one board (requesting-maintenance-v2, improved-quality-v2, ...): the cut it plays
//   node scripts/generate-voice.mjs --layout narrator  # the narrator's variation of every board that has one (any voiced layout: not the one that plays)
//   node scripts/generate-voice.mjs --force            # all the lines again
//   node scripts/generate-voice.mjs --dry              # list what is said, when, and what is made already; call nothing, write nothing
//
// The lines are the cut's own (lib/remotion/efficiencyVoice.mjs `voiceLinesOf`: the title, each sentence, the titles added on the All videos page), with the words as retyped there
// (content/storyboard/<board>.json). One maker for all (lib/remotion/cutVoiceMake.mjs): public/tts/cuts/<cut id>/<line>.mp3 + lib/remotion/cutVoiceAudio.mjs (Increased Efficiency's:
// public/tts/ie/<layout>/ + lib/remotion/efficiencyVoiceAudio.mjs), and a copy in D:\Documents\Saas\videos\public, where the MP4 render finds them.
// Reads ELEVENLABS_API_KEY from the environment or .env.local (gitignored); the key never leaves this machine's request to ElevenLabs and is never printed.
// THE VOICE SETS THE PACE (lib/remotion/cutCore.mjs `story`): once a line's audio is made the film takes its real length, so the times printed by --dry after a run are the film's own.
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {CUTS, cutFor, cutLayoutOf, playingCutOf} from '../lib/remotion/cuts.mjs';
import {cutWordsOf} from '../lib/remotion/cutWords.mjs';
import {titlesCut} from '../lib/remotion/cutTitles.mjs';
import {voiceHash, voiceLinesOf} from '../lib/remotion/efficiencyVoice.mjs';
import {madeVoiceOf} from '../lib/remotion/cutVoice.mjs';
import {loadVoiceKey, makeVoice} from '../lib/remotion/cutVoiceMake.mjs';

const ROOT = process.cwd();
const args = process.argv.slice(2), FORCE = args.includes('--force'), DRY = args.includes('--dry');
const only = args.includes('--video') ? args[args.indexOf('--video') + 1] : null;
const asked = args.includes('--layout') ? args[args.indexOf('--layout') + 1] : null; // (a layout by name; none: the one each board plays)
if (only && !CUTS[only]) { console.error(`No Remotion cut for "${only}". Boards: ${Object.keys(CUTS).join(', ')}`); process.exit(1); }

if (!DRY && !(await loadVoiceKey(ROOT))) { console.error('Missing ELEVENLABS_API_KEY (set it in the environment or .env.local).'); process.exit(1); }

let sent = 0, made = 0, films = 0;
for (const board of only ? [only] : Object.keys(CUTS)) {
  let saved = {};
  try { saved = JSON.parse(await fs.readFile(path.join(ROOT, 'content', 'storyboard', `${board}.json`), 'utf8')); } catch { /* a board with nothing saved: the cut's own words */ }
  if (!only && !asked && !playingCutOf(board, saved)) { console.log(`\n${board}: plays its slides, not a Remotion cut: skipped`); continue; }
  const layout = asked ?? cutLayoutOf(saved);
  if (!titlesCut(board, layout)) { console.log(`\n${board}${layout ? ` (layout ${layout})` : ''}: this cut has no voice: skipped`); continue; }
  const cut = cutFor(board, layout), plan = cut.make(cutWordsOf(saved, cut.id), {layout}), lines = voiceLinesOf(plan);
  films++;
  console.log(`\n${board} · ${cut.id}${layout ? ` (layout ${layout})` : ''}: ${lines.length} lines, the film is ${plan.seconds.toFixed(2)} s`);
  if (DRY) {
    const had = madeVoiceOf(plan, layout);
    lines.forEach((line, i) => {
      const m = had[line.id], ok = m?.hash === voiceHash(line.text), room = (lines[i + 1]?.at ?? plan.seconds) - line.at;
      console.log(`${line.at.toFixed(2).padStart(7)} s  ${String(line.id).padEnd(13)} ${ok ? `${m.duration.toFixed(2)} s of ${room.toFixed(2)} s${m.duration > room - 0.05 ? '  <-- runs into the next' : ''}` : 'no audio yet     '}  ${line.text}`);
    });
    continue;
  }
  const out = await makeVoice({root: ROOT, layout, cut: plan, force: FORCE, log: text => console.log(`  ${text}`)});
  sent += out.sent; made += out.made.length;
  if (out.missing.length) console.log(`  no audio for: ${out.missing.join(', ')}`);
}
if (DRY) process.exit(0);
console.log(`\nDone: ${made} lines made in ${films} films (${sent} characters sent to ElevenLabs).`);
if (made) { // the films as they are now, with the real length of each line (a new process: the plans read what was just written)
  console.log('\nThe films with their voice:');
  spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--dry', ...(only ? ['--video', only] : []), ...(asked ? ['--layout', asked] : [])], {stdio: 'inherit', cwd: ROOT});
}
