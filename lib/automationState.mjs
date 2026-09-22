// State and motion use the same clock, so scrubbing never replays clicks.
import { TIMING, SCENE, BOARD_ACTION_DURATION, BOARD_PHASES, ENGAGED_ACTION_DURATION } from './demoNarration.mjs';
export { DEMO_LENGTH } from './demoNarration.mjs';
export const BOARD_END = TIMING.boardEnd;
export const TIME_SKIP = { start: TIMING.timeSkip, end: TIMING.close, seconds: 3600 };
export const PRIORITY_BOOST = { highlight: SCENE['urgency-priority'].start + .25, move: SCENE['urgency-priority'].start + .65, duration: .85 };
const boardAction = (person, mission, start, from, to) => ({ person, mission, start, confirm: start + BOARD_PHASES.transfer, arrive: start + BOARD_PHASES.arrive, end: start + BOARD_ACTION_DURATION, from, to });
const directAction = (person, start, from, to) => ({ person, mission: person, start, confirm: start + (to === 'closed' ? .85 : .45), arrive: start + 1.4, end: start + ENGAGED_ACTION_DURATION, from, to, direct: true });
export const BOARD_ACTIONS = [
  boardAction(0, 0, TIMING.claim, 'open', 'claimed'),
  boardAction(1, 1, TIMING.claim + BOARD_ACTION_DURATION, 'open', 'claimed'),
  boardAction(1, 1, TIMING.close, 'claimed', 'closed'),
  ...[[0, 'claimed', 'closed'], [2, 'open', 'claimed'], [2, 'claimed', 'closed'], [3, 'open', 'claimed'], [3, 'claimed', 'closed'], [4, 'open', 'claimed']].map(([person, from, to], index) =>
    directAction(person, TIMING.shared + index * ENGAGED_ACTION_DURATION, from, to)),
];

const smoothProgress = (time, start, end) => {
  const p = Math.max(0, Math.min(1, (time - start) / (end - start)));
  return p * p * (3 - 2 * p);
};
// Five simulated minutes per playback second, continuously through the final claim.
export const ENGAGED_CLOCK_RATE = 300;
export const elapsedTimeOffset = time => TIME_SKIP.seconds * smoothProgress(time, TIME_SKIP.start, TIME_SKIP.end)
  + Math.max(0, Math.min(time, BOARD_ACTIONS.at(-1).confirm) - TIMING.shared) * (ENGAGED_CLOCK_RATE - 1);
export const simulatedTime = time => time + elapsedTimeOffset(time);
export function missionTimers(now, postedAt, claimedAt, closedAt) {
  const clock = closedAt ?? now;
  return {
    ageSeconds: Math.max(0, clock - postedAt),
    executionSeconds: claimedAt == null ? 0 : Math.max(0, clock - claimedAt),
  };
}

export function demoColumnMissions(missions, status) {
  const column = missions.filter(mission => mission.status === status);
  return status === 'open' ? column.sort((a, b) => Number(Boolean(b.boosted)) - Number(Boolean(a.boosted))) : column.sort((a, b) => (b.stopped ?? b.started ?? 0) - (a.stopped ?? a.started ?? 0));
}

export function automationState(time, templates, people) {
  const action = BOARD_ACTIONS.find(a => time >= a.start && time < a.end) ?? null;
  const typing = action && !action.direct ? time - action.start - BOARD_PHASES.typing : -1;
  const digits = typing < 0 ? 0 : Math.min(6, 1 + Math.floor((typing + 1e-8) / .21));
  // One shared passage of time advances every mission on this device.
  const missions = templates.map((mission, i) => {
    const claim = BOARD_ACTIONS.find(a => a.mission === i && a.to === 'claimed');
    const close = BOARD_ACTIONS.find(a => a.mission === i && a.to === 'closed');
    const status = close && time >= close.confirm ? 'closed' : claim && time >= claim.confirm ? 'claimed' : mission.status ?? 'open';
    const progress = close ? smoothProgress(time, close.direct ? close.start : TIME_SKIP.start, close.direct ? close.start + .65 : TIME_SKIP.end) : 0;
    const clockTime = status === 'closed' ? close.confirm : time;
    const birthOffset = mission.appearsAt != null ? mission.appearsAt + elapsedTimeOffset(mission.appearsAt) : 0;
    const timers = missionTimers(
      simulatedTime(time),
      mission.appearsAt != null ? simulatedTime(mission.appearsAt) : -(mission.age ?? 0),
      status !== 'open' ? claim ? simulatedTime(claim.confirm) : mission.claimedAt : undefined,
      status === 'closed' ? simulatedTime(close.confirm) : undefined,
    );
    const colorScene = SCENE['urgency-colors'];
    const colorProgress = smoothProgress(time, colorScene.start, colorScene.end - .3);
    const inUrgency = time >= colorScene.start;
    const priority = mission.id === 'new-restock';
    const urgencyColor = colorProgress < 1/3 ? 'rgb(0 122 51)' : colorProgress < 2/3 ? 'rgb(191 75 0)' : 'rgb(189 31 89)';
    if (status !== 'closed' && inUrgency) {
      const extra = 1800 * colorProgress;
      timers.ageSeconds += extra;
      if (status === 'claimed') timers.executionSeconds += extra;
    }
    return {
      ...mission, status, ...timers,
      demoTimeOffset: elapsedTimeOffset(clockTime) - birthOffset,
      timerColor: close && time >= (close.direct ? close.start : TIME_SKIP.start) ? (progress < .5 ? 'rgb(0 122 51)' : 'rgb(191 75 0)') : undefined,
      ...(claim && status !== 'open' ? { performer: people[claim.person].name, performerAvatar: people[claim.person].src, started: claim.confirm + elapsedTimeOffset(claim.confirm) - birthOffset } : {}),
      ...(!claim && status === 'claimed' && mission.claimedAt != null ? { started: mission.claimedAt - birthOffset } : {}),
      ...(status === 'closed' ? { stopped: close.confirm } : {}),
      ...(status === 'open' && inUrgency ? {timerColor: urgencyColor} : {}),
      ...(priority ? { highlighted: time >= PRIORITY_BOOST.highlight, boosted: time >= PRIORITY_BOOST.move } : {}),
      ...(priority && time >= SCENE['gamification-extra'].start ? {title: 'Deep Clean Freezer', points: 25} : {}),
      showPerformerName: status === 'closed' || time >= SCENE['recognition-stamped'].start,
    };
  }).filter(mission => time >= (mission.appearsAt ?? 0));
  return {
    missions, action, elapsed: time, selected: null, codeOpen: false,
    showCode: Boolean(action && !action.direct && time >= action.start + BOARD_PHASES.codeIn && time < action.start + BOARD_PHASES.codeHidden),
    code: action ? people[action.person].code.slice(0, digits) : '',
    activeDigit: digits > 0 ? digits - 1 : -1,
    activeKey: action && digits > 0 ? people[action.person].code[digits - 1] : null,
    codeAction: action?.to === 'closed' ? 'Close Mission' : 'Claim Mission',
  };
}
