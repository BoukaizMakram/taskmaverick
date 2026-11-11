// Exception Management (website Narration (October 14, 2026).docx, section "Exception Management"): the format is described at the top of live-oversight.mjs and dynamic-auditing.mjs.
// The art is components/sections/ExceptionsStage.jsx: what raises an alert, as the mission or the card it comes from, an arrow, and the ticket that pops for the manager.
const cause = (id, name, words, kind, extra = {}) => ({id, name, words, view: 'panel', art: {view: 'panel', kind, step: 0, alert: 0}, end: [{name: 'the answer', state: {step: 1}}, {name: 'the alert', state: {alert: 1}}], ...extra});
const card = (id, name, words, kind, extra = {}) => ({id, name, words, view: 'flow', art: {view: 'flow', kind, alert: 0}, end: [{name: 'the alert', state: {alert: 1}}], ...extra});
export default {
  id: 'exception-management',
  board: 'exception-management-v2',
  name: 'Exception Management',
  stage: 'exception-management',
  view: 'tablet',
  base: {view: 'board', tickets: 0, kind: 'data', step: 0, alert: 0},
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'Managing By Exception / Optimizes Resource Utilization'},
    {id: 'alerted', name: 'Managers are alerted', words: 'Managers Can Be Automatically Alerted…', art: {view: 'board', tickets: 0}},
    cause('data', 'Data entries', 'Based On Data Entries…', 'data', {point: ['alert', 'field-temp']}),
    cause('audit', 'Audit findings', 'Based On Audit Findings', 'audit', {point: ['alert', 'cp-hazard']}),
    card('delays', 'Excessive delays', 'Based On Excessive Delays', 'delays', {point: ['alert'], marks: [{target: 'source-pill'}]}),
    card('executions', 'Unreasonable executions', 'Based On Unreasonable Executions', 'executions', {marks: [{target: 'source-exec'}]}),
    card('ratings', 'Poor ratings', 'Based On Poor Ratings', 'ratings', {marks: [{target: 'source-ratings'}]}),
    cause('surveys', 'Survey answers', 'Based On Survey Answers', 'surveys', {point: ['alert', 'cp-injured']}),
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Managing By Exception / Frees Up Managers / To Focus On The Big Picture'},
  ],
  details: {
    exceptions: {scenes: {
      alerted: ['No one watches every number.', 'The software watches them.'],
      data: ['A temperature is entered.', 'It is out of range.', 'A Temperature Alert is raised.'],
      audit: ['An audit finds a hazard.', 'A video is attached.', 'A Safety Alert is raised.'],
      delays: ['A mission has aged too long.', 'A Performance Delays ticket is raised.'],
      executions: ['A mission was done too fast.', 'A Quality Concern ticket is raised.'],
      ratings: ['Peers rate the mission poorly.', 'A Low Rating Alert is raised.'],
      surveys: ['A survey answer reports an injury.', 'An Injury Alert is raised.'],
    }},
  },
  chunks: [
    {id: 'exceptions', title: 'What raises an alert', lines: ['intro', 'alerted', 'data', 'audit', 'delays', 'executions', 'ratings', 'surveys', 'conclusion']},
  ],
};
