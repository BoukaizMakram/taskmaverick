export const TTS_VOICE_ID = 'O4Sq7yQC1fd484Lr500R';
export const TTS_MODEL_ID = 'eleven_multilingual_v2';

// Spoken copy and display copy intentionally differ. The opening is silent.
export const DEMO_SCRIPT = [
  { id: 'title-main', display: 'Automated Business Manager', text: null, duration: 1.8, center: true },
  { id: 'title-sub1', display: 'Automate Team Guidance', text: 'Taskmaverick automatically guides teams to take initiatives on their own.', duration: 2 },
  { id: 'title-sub2', display: 'No Need For A Micro-Manager', text: 'There is no need for a human manager to constantly remind people.', duration: 2 },
  { id: 'cue-personal', display: 'Directly Assign To Individuals', text: 'Work Missions can be automatically assigned to individual Personal Boards…', duration: 5.2 },
  { id: 'cue-team', display: 'Or Post Assignments For A Whole Team', text: '…or they can be posted on Team Boards to facilitate Team cooperation.', duration: 3.5 },
  { id: 'msg-mid', display: 'A Single Device Can Be Shared By A Team', text: 'Multiple people can share a single device to save on hardware costs.', duration: 12.05 },
  { id: 'cue-shared', display: 'Team Constantly Engaged', text: 'When clearly displayed, a shared device can effectively engage a whole team.', duration: 11.6 },
  { id: 'engagement-title', display: 'Constant Engagement', text: null, duration: 1.5, feature: 'overview', chapter: 'Constant Engagement' },
  { id: 'engagement-closed', display: 'Missions Completed', text: null, duration: 2, feature: 'closed', chapter: 'Constant Engagement' },
  { id: 'engagement-claimed', display: 'Missions In Progress', text: null, duration: 2, feature: 'claimed', chapter: 'Constant Engagement' },
  { id: 'engagement-open', display: 'Missions Open', text: null, duration: 2, feature: 'open', chapter: 'Constant Engagement' },
  { id: 'urgency-title', display: 'Timers Create A Sense Of Urgency', text: null, duration: 2.4, feature: 'timers', chapter: 'Urgency' },
  { id: 'urgency-colors', display: 'Green → Orange → Red', text: null, duration: 3, feature: 'timer-colors', chapter: 'Urgency' },
  { id: 'urgency-priority', display: 'Important Work Prioritizes Itself', text: null, duration: 2.3, feature: 'priority', chapter: 'Urgency' },
  { id: 'gamification-points', display: 'Reward Points Motivate Teams', text: null, duration: 2.5, feature: 'points', chapter: 'Gamification' },
  { id: 'gamification-extra', display: 'More Points For Less Popular Work', text: null, duration: 2.5, feature: 'extra-points', chapter: 'Gamification' },
  { id: 'recognition-stamped', display: 'See Who Performed Each Mission', text: null, duration: 4.4, feature: 'names', chapter: 'Recognition' },
  { id: 'recognition-time', display: 'Track Execution Time Per Mission', text: null, duration: 2.5, feature: 'execution', chapter: 'Recognition' },
  { id: 'recognition-efficient', display: 'Spot The Most Efficient Performers', text: null, duration: 2.5, feature: 'efficient', chapter: 'Recognition' },
  { id: 'msg-end', display: 'No Important Task\nIs Ever Forgotten Or Delayed', text: 'No important task is ever forgotten or delayed.', duration: 2.8, center: true },
];
