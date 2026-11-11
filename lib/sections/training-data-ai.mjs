// Data & AI (website Narration (October 14, 2026).docx, section "Data & AI", group Training): the format is described at the top of live-oversight.mjs and dynamic-auditing.mjs.
// The art is components/sections/TrainingDataStage.jsx, the product's real screens only: the Reports page (a report's side panel, its Open), the Training Summary report (the Data Board's look and
// columns, as Reporting & AI's) grouped by person (ten people; a person opened to their ten trainings), and the Overview › Course board's History view, where each lesson taken has its Open
// (aging: how long it waited) and Claimed (execution: how long it took) timers.
export default {
  id: 'training-data-ai',
  board: 'training-data-ai-v2',
  name: 'Data & AI',
  group: 'Training',
  stage: 'training-data-ai',
  view: 'web',
  base: {focus: null, page: 'list', panel: 0, level: 0, open: 0, pan: 0, scrollTo: null},
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'AI Optimization Requires / Collecting Extensive Data'},
    // the report is opened (its row, then Open in its side panel): its ten people are outlined
    {id: 'people', name: 'Per person', words: 'Detailed Reports Show / Training Summary Per Person', art: {page: 'list', panel: 0, level: 0}, acts: [
      {target: 'report-training', name: 'Training Summary', state: {panel: 1}},
      {target: 'panel-open', name: 'Open', state: {page: 'report', panel: 0, level: 0}},
    ], marks: [{target: 'people-block', pad: 6}]},
    // a person opened: their ten trainings are outlined
    {id: 'trainings', name: 'Per training', words: 'For Any Person / Review Details Per Training', art: {page: 'report', level: 0}, acts: [
      {target: 'toggle-person-0', name: 'Anna Fischer', state: {level: 1}},
    ], marks: [{target: 'missions-block', pad: 6}]},
    // the Course board's History: Anna's course opened to each lesson she took; its aging (Open), then its execution (Claimed)
    {id: 'lesson', name: 'Aging and execution', words: 'Within Any Lesson / See Aging & Execution Durations', art: {page: 'history', open: 0}, acts: [
      {target: 'toggle-course-food-safety', name: 'Food Safety Course', state: {open: 1}},
    ], marksSequence: true, marks: [{col: 'open'}, {col: 'claimed'}]},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Unprecedented Details / Can Feed AI Models / To Optimize Training Curriculums'},
  ],
  details: {
    summary: {scenes: {
      people: ['The manager clicks Training Summary.', 'Then the manager clicks Open.', 'Each person’s trainings add up to a line.'],
      trainings: ['The manager opens Anna’s line.', 'Each of her trainings is listed.'],
    }},
    detail: {scenes: {
      lesson: ['The manager opens Anna’s course in History.', 'Each lesson she took is listed.', 'Open: how long it waited.', 'Claimed: how long it took.'],
    }},
  },
  chunks: [
    {id: 'summary', title: 'From the person to the training', lines: ['intro', 'people', 'trainings']},
    {id: 'detail', title: 'Within a lesson: aging and execution', lines: ['lesson', 'conclusion']},
  ],
};
