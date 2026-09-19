import { DEMO_SCRIPT } from './demoScript.mjs';
import { DEMO_AUDIO } from './demoAudio.mjs';
export { TTS_VOICE_ID, TTS_MODEL_ID } from './demoScript.mjs';

// Visual pacing is independent of the saved narration recordings.
let cursor = 0;
export const SCENES = DEMO_SCRIPT.map(line => {
  const audio = DEMO_AUDIO[line.id];
  const start = cursor;
  const duration = line.duration;
  cursor = Math.round((cursor + duration) * 1000) / 1000;
  return { ...line, start, end: cursor, at: start + .35, duration, audioDuration: audio?.duration ?? 0, version: audio?.hash };
});
export const NARRATION = SCENES.filter(scene => scene.text);
export const DEMO_LENGTH = cursor;
export const SCENE = Object.fromEntries(SCENES.map(scene => [scene.id, scene]));
// Each page has its own playback range; the efficiency demo resumes the populated board.
export const EFFICIENCY_START = SCENE['engagement-title'].start;
export const AUTOMATION_SCENES = SCENES.filter(scene => !scene.feature).map(scene => scene.id === 'msg-end'
  ? { ...scene, start: EFFICIENCY_START, end: EFFICIENCY_START + scene.duration, at: EFFICIENCY_START + .35 }
  : scene);
export const AUTOMATION_LENGTH = AUTOMATION_SCENES.at(-1).end;
export const EFFICIENCY_LENGTH = DEMO_LENGTH - EFFICIENCY_START;
export const EFFICIENCY_SCENES = SCENES.filter(scene => scene.start >= EFFICIENCY_START).map(scene => scene.id === 'msg-end'
  ? { ...scene, display: 'Engage, Motivate, Reward,\nBoost Team Efficiency', text: null }
  : scene);
export const AVATAR_MOTION_SPEED = .7;
export const BOARD_PHASES = {
  approach: .24 / AVATAR_MOTION_SPEED,
  codeIn: .46,
  typing: .6,
  codeOut: 1.75,
  codeHidden: 1.9,
  transfer: 1.94,
  arrive: 2.24,
};
export const BOARD_ACTION_DURATION = BOARD_PHASES.arrive + .25 / AVATAR_MOTION_SPEED;
export const ENGAGED_ACTION_DURATION = 1.6;
export const TIMING = {
  personal: SCENE['cue-personal'].start,
  team: SCENE['cue-team'].start,
  sharing: SCENE['msg-mid'].start,
  // Board actions run under the shared-device title, before the closing cards.
  claim: SCENE['msg-mid'].start + 2.3,
  timeSkip: SCENE['msg-mid'].start + 2.3 + 2 * BOARD_ACTION_DURATION,
  close: SCENE['msg-mid'].start + 2.3 + 2 * BOARD_ACTION_DURATION + .75,
  boardEnd: SCENE['msg-end'].start - .6,
  shared: SCENE['cue-shared'].start,
  end: SCENE['msg-end'].start,
};

export const TABLET_NOTES = [
  { id: 'personal-code', text: 'Each Person Uses Their Code', start: TIMING.claim, end: TIMING.claim + BOARD_ACTION_DURATION },
  { id: 'sign-in', text: 'No Need To Sign-In', start: TIMING.claim + BOARD_ACTION_DURATION, end: TIMING.close },
  { id: 'log-in', text: 'No Need To Log-In', start: TIMING.close, end: TIMING.close + BOARD_ACTION_DURATION + .2 },
  { id: 'engaged', text: 'Team Constantly Engaged', start: TIMING.shared, end: SCENE['cue-shared'].end, lower: true },
];


