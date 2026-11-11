// Reporting & AI (website Narration (October 14, 2026).docx, section "Reporting & AI"): the format is described at the top of live-oversight.mjs and dynamic-auditing.mjs.
// The art is components/sections/ReportingStage.jsx: the web report, open one level deeper in each chapter (units, teams, people, missions, statements), down to the data entered and the evidence.
//   marksFirst  (a chapter with acts) the outlines are drawn first, then the cursor works
const down = (level, scrollTo) => ({level, scrollTo});
export default {
  id: 'reporting-ai',
  board: 'reporting-ai-v2',
  name: 'Reporting & AI',
  stage: 'reporting-ai',
  view: 'web',
  base: {focus: null, level: 0, pan: 0, scrollTo: null, viewer: null},
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'AI Optimization Requires / Collecting Extensive Data'},
    {id: 'units', name: 'Per unit', words: 'Detailed Reports Show / Execution Summary Per Unit', art: down(0, 'top'), marks: [{target: 'units-block'}]},
    {id: 'teams', name: 'Per team', words: 'Within Any Unit / Review Details By Team', art: down(0, 'top'), end: [down(1, 'unit-0')], marksAfter: true, marks: [{target: 'teams-block'}]},
    {id: 'people', name: 'Per person', words: 'Within Any Team / Review Details Per Person', art: down(1, 'unit-0'), end: [down(2, 'team-0')], marksAfter: true, marks: [{target: 'people-block'}]},
    {id: 'missions', name: 'Per mission', words: 'For Any Person / Review Details Per Mission', art: down(2, 'team-0'), end: [down(3, 'person-0')], marksAfter: true, marks: [{target: 'missions-block'}]},
    {id: 'statements', name: 'Per statement', words: 'Within Any Mission / Review Details Per Statement', art: down(3, 'person-0'), end: [down(4, 'mission-0')], marksAfter: true, marks: [{target: 'statements-block'}]},
    {id: 'evidence', name: 'Data and evidence', words: 'Within A Statement / Review The Data Entered / And The Evidence Collected', art: down(4, 'mission-0'), marksFirst: true, marks: [{target: 'entry'}], acts: [
      {target: 'evidence-photo', name: 'the photo', state: {viewer: 'photo'}, leave: true}, // (the CEO, 2026-10-16: "when you press on it, make the hand disappear ... if you want to close the picture, make the hand appear again and close it")
      {target: 'lightbox-close', name: 'the close button', state: {viewer: null}, leave: true},
      {target: 'evidence-video', name: 'the video', state: {viewer: 'video'}},
    ]},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Unprecedented Details / Can Feed AI Models / To Optimize Performance.'},
  ],
  details: {
    summary: {scenes: {
      units: ['The report lists every unit.', 'With how much was done in each.'],
      teams: ['The manager opens a unit.', 'Its teams appear.'],
      people: ['The manager opens a team.', 'Its people appear.'],
      missions: ['The manager opens a person.', 'Their missions appear.'],
    }},
    detail: {scenes: {
      statements: ['The manager opens a mission.', 'Its statements appear.'],
      evidence: ['The data entered is listed.', 'The manager opens the photo.', 'And closes it.', 'Then opens the video.'],
    }},
  },
  chunks: [
    {id: 'summary', title: 'From the unit to the mission', lines: ['intro', 'units', 'teams', 'people', 'missions']},
    {id: 'detail', title: 'From the mission to the evidence', lines: ['statements', 'evidence', 'conclusion']},
  ],
};
