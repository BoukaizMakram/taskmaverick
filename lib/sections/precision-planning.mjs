// Precision Planning (website Narration (October 14, 2026).docx, section "Precision Planning"): the format is described at the top of live-oversight.mjs and dynamic-auditing.mjs.
// The art is components/sections/PlanningStage.jsx: the web app's Overview, Personal Board, Timeline view (the product's own look, the user, 2026-10-19), a location opened to its teams, a team to
// its missions, the schedule boxes that sum a mission up. The cursor's "number 1" (badge-<mission>) is the count in the first hour the mission occurs.
const s = (state, scrollTo) => ({...state, scrollTo});
const SHUT = {unit: false, ops: false, kitchen: false, boxes: []};
const UNIT = {...SHUT, unit: true};
const OPS = {...UNIT, ops: true};
const BOTH = {...OPS, kitchen: true};
export default {
  id: 'precision-planning',
  board: 'precision-planning-v2',
  name: 'Precision Planning',
  stage: 'precision-planning',
  view: 'web',
  base: {focus: null, unit: false, ops: false, kitchen: false, boxes: [], scrollTo: null, pan: 0},
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'Planning Dashboards / Optimize Workload Distribution'},
    {id: 'units', name: 'Units or locations', words: 'An Organization Can Be Divided / Into Units Or Locations', art: s(SHUT, 'top'), marks: [{target: 'units-block'}]},
    {id: 'teams', name: 'Teams within a location', words: 'Departments Or Teams / Exist Within Units Or Locations', art: s(SHUT, 'top'), end: [s(UNIT, 'top')], marksAfter: true, marks: [{target: 'teams-block'}]},
    {id: 'distribution', name: 'Distributed over time', words: 'The Workload For Each Team / Can Be Distributed Over Time', art: s(UNIT, 'top'), marks: [{target: 'distribution'}]},
    {id: 'missions', name: 'The missions scheduled', words: 'Expanding The Team View / Shows What Missions Are Scheduled', art: s(UNIT, 'top'), end: [s(OPS, 'team-ops')], marksAfter: true, marks: [{target: 'missions-ops'}]},
    {id: 'specific', name: 'At specific times', words: 'A Mission Can Be Planned To Occur / At Specific Times', art: s(OPS, 'team-ops'), marks: [{target: 'mission-opening'}]},
    {id: 'recurring', name: 'Within time intervals', words: 'A Mission Can Be Planned To Recur / Within Time Intervals', art: s(OPS, 'team-ops'), marks: [{target: 'mission-restroom-ops'}]},
    {id: 'summary', name: 'A summary of the schedule', words: 'Expand To View A Summary / Of A Mission’s Schedule', art: s(OPS, 'team-ops'), acts: [
      {target: 'badge-restroom-ops', name: 'the number 1', state: {boxes: ['opening', 'restroom-ops']}},
    ]},
    {id: 'multiple', name: 'For multiple teams', words: 'The Same Mission Can Be Scheduled / For Multiple Teams', art: {...OPS, boxes: [], scrollTo: 'team-ops'}, end: [{...BOTH, boxes: [], scrollTo: 'team-ops'}], marksAfter: true, marks: [{target: 'mission-restroom-ops'}, {target: 'mission-restroom-kitchen'}]},
    {id: 'custom', name: 'Customized per team', words: 'For Each Team / A Mission’s Schedule Can Be Customized', art: {...BOTH, boxes: [], scrollTo: 'team-ops'}, marksLate: true, marks: [{target: 'mission-restroom-ops'}, {target: 'mission-restroom-kitchen'}], end: [{name: 'the schedule boxes', state: {boxes: ['restroom-ops', 'restroom-kitchen']}, marks: false}]},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Planning Dashboards Optimize / Work Distribution / No Team Is Ever Overloaded / Or Underutilized'},
  ],
  details: {
    dashboard: {scenes: {
      units: ['The dashboard lists every location.'],
      teams: ['The manager opens one location.', 'Its six teams appear.'],
      distribution: ['Each team shows its workload by the hour.'],
      missions: ['The manager opens one team.', 'The missions scheduled for it appear.'],
    }},
    schedules: {scenes: {
      specific: ['This mission occurs at two set times.'],
      recurring: ['This one recurs every three hours.'],
      summary: ['The manager taps the number.', 'The schedules of both missions open.'],
      multiple: ['The same mission is in two teams.', 'One is at set times, one recurs.'],
      custom: ['Each team has its own schedule.', 'The schedule boxes open.'],
    }},
  },
  chunks: [
    {id: 'dashboard', title: 'Units, teams and their workload', lines: ['intro', 'units', 'teams', 'distribution', 'missions']},
    {id: 'schedules', title: 'How a mission is scheduled', lines: ['specific', 'recurring', 'summary', 'multiple', 'custom', 'conclusion'], pace: {summary: {extra: 2.5}, custom: {extra: 2.5}}},
  ],
};
