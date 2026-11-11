// Live Monitoring (website Narration (October 14, 2026).docx, section "Live Monitoring", group Training): the format is described at the top of live-oversight.mjs and dynamic-auditing.mjs.
// The art is components/sections/MonitoringStage.jsx: the web app's Overview › Course board (the product's screen): each person, their course (● Pending) and its lessons (● Open / Claimed / Closed)
// with the Open, Claimed, Duration and Closed At columns. The outlines go round a column (`col`), as Live Oversight's; the lesson that has waited too long has its Open timer red; its alert is shown
// outside the product (`alert`: the lesson's mission card on its own, then the Performance Delays ticket popping out of it, as Exception Management's). (The narration says "The Execution Duration Of Each Lesson" twice: it is one chapter, the Duration column.)
export default {
  id: 'live-monitoring',
  board: 'live-monitoring-v2',
  name: 'Live Monitoring',
  group: 'Training',
  stage: 'live-monitoring',
  view: 'web',
  base: {focus: null, pan: 0, scrollTo: null, alert: 0},
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'Remotely Monitor Each / Person’s Training Progress'},
    {id: 'who', name: 'Who is training', words: 'Who Is Currently Training', art: {alert: 0}, marksSequence: true, marks: [{target: 'person-anna'}, {target: 'person-ben'}]},
    {id: 'pending', name: 'Lessons pending', words: 'What Lessons Are Pending', art: {alert: 0}, marks: [{col: 'open'}]},
    {id: 'process', name: 'Lessons in process', words: 'What Lessons Are In Process', art: {alert: 0}, marks: [{col: 'claimed'}]},
    {id: 'completed', name: 'Lessons completed', words: 'What Lessons Were Completed', art: {alert: 0}, marks: [{col: 'closed'}]},
    {id: 'duration', name: 'The duration of each lesson', words: 'The Execution Duration Of Each Lesson', art: {alert: 0}, marks: [{col: 'duration'}]},
    // the aging Timer outlined on the board, then, outside the product, the lesson's own mission card (its Timer red) and the Performance Delays ticket popping out of it
    {id: 'alert', name: 'Excessive delays', words: 'Management Is Alerted / About Excessive Delays', point: ['ticket', 'lesson-card', 'aged-timer'], art: {alert: 0}, marks: [{target: 'aged-timer'}],
      end: [{name: 'the lesson on its own', state: {alert: 1}, marks: false}, {name: 'the Performance Delays ticket', state: {alert: 2}}]},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Monitor Training Progress / To Assess Efficacy'},
  ],
  // The steps of each video's detailed twin (lib/storyboardDetails.mjs): short, what the manager sees.
  details: {
    progress: {scenes: {
      who: ['Each person is listed with their course.', 'Anna and Ben each have a lesson underway.'],
      pending: ['The Open column times the lessons not yet started.'],
      process: ['The Claimed column times the lessons being taken.'],
      completed: ['Closed At shows when each lesson was finished.'],
    }},
    delays: {scenes: {
      duration: ['Duration adds up each lesson’s time.'],
      alert: ['Cash Drawer Setup has waited too long.', 'A Performance Delays ticket goes to the manager.'],
    }, each: ['alert']},
  },
  chunks: [
    {id: 'progress', title: 'Training progress on the course board', lines: ['intro', 'who', 'pending', 'process', 'completed']},
    {id: 'delays', title: 'Durations and delays', lines: ['duration', 'alert', 'conclusion']},
  ],
};
