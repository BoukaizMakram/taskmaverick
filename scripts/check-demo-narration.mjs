import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { SCENES, NARRATION, DEMO_LENGTH, TIMING, TABLET_NOTES, AUTOMATION_SCENES, AUTOMATION_LENGTH, EFFICIENCY_START, EFFICIENCY_LENGTH } from '../lib/demoNarration.mjs';
import { BOARD_ACTIONS, BOARD_END, TIME_SKIP } from '../lib/automationState.mjs';
import { DEMO_AUDIO } from '../lib/demoAudio.mjs';
import { TTS_VOICE_ID } from '../lib/demoScript.mjs';
import { mp3Duration } from './mp3-duration.mjs';

assert.equal(SCENES.length, 20);
assert.deepEqual(AUTOMATION_SCENES.slice(-2).map(scene=>scene.id),['cue-shared','msg-end']);
assert.equal(AUTOMATION_SCENES.at(-2).end,AUTOMATION_SCENES.at(-1).start);
assert.ok(AUTOMATION_SCENES.every(scene=>!scene.feature));
assert.equal(AUTOMATION_LENGTH,AUTOMATION_SCENES.at(-1).end);
assert.equal(EFFICIENCY_START,SCENES.find(scene=>scene.feature).start);
assert.equal(EFFICIENCY_START+EFFICIENCY_LENGTH,DEMO_LENGTH);
assert.ok(BOARD_ACTIONS.at(-1).end<EFFICIENCY_START-.6);
assert.ok(!SCENES.some(scene => scene.id === 'urgency-critical'));
const featureScenes=SCENES.filter(scene=>scene.feature);
assert.deepEqual(featureScenes.slice(1,4).map(scene=>scene.feature),['closed','claimed','open']);
assert.ok(featureScenes.every(scene=>scene.duration<=3));
assert.equal(featureScenes.at(-1).end,SCENES.find(scene=>scene.id==='msg-end').start);
assert.equal(NARRATION.length, 7);
assert.equal(SCENES[0].text, null);
assert.ok(!NARRATION.some(line => line.id === 'title-main'));
assert.equal(TTS_VOICE_ID, 'O4Sq7yQC1fd484Lr500R');
assert.deepEqual(SCENES.filter(line => !line.feature && !['title-main', 'msg-end'].includes(line.id)).map(line => line.display), [
  'Automate Team Guidance', 'No Need For A Micro-Manager', 'Directly Assign To Individuals',
  'Or Post Assignments For A Whole Team', 'A Single Device Can Be Shared By A Team', 'Team Constantly Engaged',
]);
for (let i = 0; i < SCENES.length; i++) {
  const scene = SCENES[i];
  if (i) assert.equal(scene.start, SCENES[i-1].end);
  if (!scene.text) continue;
  const duration = mp3Duration(await fs.readFile(new URL(`../public/tts/${scene.id}.mp3`, import.meta.url)));
  assert.equal(duration, DEMO_AUDIO[scene.id].duration);
  assert.equal(DEMO_AUDIO[scene.id].voice, TTS_VOICE_ID);
}
assert.equal(SCENES.at(-1).end, DEMO_LENGTH);
assert.ok(DEMO_LENGTH < 80, 'Silent demo should not wait for narration');
assert.ok(SCENES.slice(0, 3).every(scene => scene.duration <= 2));
assert.ok(BOARD_ACTIONS[1].end <= TIME_SKIP.start, 'Finish both claims before advancing the clocks');
assert.ok(BOARD_ACTIONS[2].end < TIMING.shared, 'Finish closing before the team engagement scene');
assert.ok(BOARD_ACTIONS[2].end < BOARD_END, 'Finish closing before fading the tablet');
assert.ok(BOARD_ACTIONS.at(-1).end < BOARD_END, 'Finish the repeated workflow before fading');
assert.equal(TABLET_NOTES.at(-1).end, SCENES.find(s=>s.id==='engagement-title').start);
assert.equal(TABLET_NOTES.at(-1).lower, true);
const sharedDevice = SCENES.find(scene => scene.id === 'msg-mid');
assert.ok(sharedDevice.start < BOARD_ACTIONS[0].start && sharedDevice.end > BOARD_ACTIONS[2].end, 'Keep the shared-device title throughout the board actions');
for (const id of ['msg-end']) {
  const card = SCENES.find(scene => scene.id === id);
  assert.ok(card.center && card.start >= BOARD_END + .6 - 1e-8, 'Show centered takeaway cards only after the board fades');
}
assert.deepEqual(TABLET_NOTES.map(note=>note.text), ['Each Person Uses Their Code', 'No Need To Sign-In', 'No Need To Log-In', 'Team Constantly Engaged']);
assert.equal(TABLET_NOTES[0].start, BOARD_ACTIONS[0].start, 'Explain personal codes during the first claim');
assert.equal(TABLET_NOTES[1].start, BOARD_ACTIONS[1].start, 'Show sign-in text during the second claim');
assert.equal(TABLET_NOTES[2].start, BOARD_ACTIONS[2].start, 'Show log-in text during closure');
assert.ok(TABLET_NOTES[2].end >= BOARD_ACTIONS[2].end);
assert.equal(TABLET_NOTES[0].end, TABLET_NOTES[1].start);
assert.equal(TABLET_NOTES[1].end, TABLET_NOTES[2].start);
assert.ok(TABLET_NOTES[2].end < BOARD_END, 'Finish tablet notes before fading the board');
assert.ok(TIMING.personal + 4.7 <= TIMING.team - .4, 'Show the final phone mission before the phones fade');
console.log(`Demo pacing checks passed: fast title cards, ordered scenes, complete board actions, saved voice assets retained (${DEMO_LENGTH}s).`);
