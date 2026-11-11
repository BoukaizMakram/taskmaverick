// Reactive Training (website Narration (October 14, 2026).docx, section "Reactive Training", group Training): the format is described at the top of live-oversight.mjs and dynamic-auditing.mjs.
// The art is components/sections/ReactiveStage.jsx: a safety audit whose Fails each give a lesson (a purple line from the Fail to the lesson's card, the audit scrolls on to the next Fail); a survey answer ("Stressful") and the
// lesson it gives (How To Inform Management); that lesson opened, written (a written notice), and its quiz (the Improved Quality lesson screen: `lessonTopics`).
// The lesson's written notice: the stage shows it in the mission, the quiz's lesson screen above its statements.
export const STATEMENTS = ['Concerns are told to a manager as soon as possible.', 'A report says what happened, when and where.', 'Problems are kept to yourself until the end of the shift.'];
export const NOTICE = ['Tell your manager as soon as something at work worries you.', 'Use the request button on your board, or speak to them in person.', 'Say what happened, when and where.'];
export default {
  id: 'reactive-training',
  board: 'reactive-training-v2',
  name: 'Reactive Training',
  group: 'Training',
  stage: 'reactive-training',
  view: 'mission',
  base: {view: 'audit', closed: false, picked: [], failed: [], triggered: [], flow: 'survey', step: 0, expand: 1, pressed: null, done: [], scrollTo: 'top'},
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'Micro-Trainings Can Be Automated / In Reaction To Events'},
    // a Fail gives a lesson at once, then the audit scrolls on and another Fail gives another (the user, 2026-10-21: "if he fails on something, just show a purple line going to a mission, and then you
    // scroll down, and then a purple line going to another mission"; the CEO, 2026-10-20: "I don't think we need to get into auditor closed ... when you say no it triggers that")
    {id: 'audit', name: 'A failed audit', words: 'Failing A Safety Audit / Triggers A Lesson On Safety', view: 'mission', point: ['lesson-extinguishers', 'lesson-hinges', 'cp-hinges'],
      art: {view: 'audit', failed: [], triggered: [], expand: 1, scrollTo: 'top'}, acts: [
        {target: 'hinges-fail', name: 'Fail', state: {failed: ['hinges']}, then: [{name: 'a lesson on safety', state: {triggered: ['hinges']}}, {name: 'the audit scrolls down', state: {scrollTo: 'cp-extinguishers@bottom'}}]},
        {target: 'extinguishers-fail', name: 'Fail', state: {failed: ['hinges', 'extinguishers']}, then: [{name: 'another lesson', state: {triggered: ['hinges', 'extinguishers']}}]},
      ]},
    {id: 'survey', name: 'A survey answer', words: 'Survey Answers Can / Trigger Training Lessons', view: 'mission', point: ['inform', 'survey'], art: {view: 'survey', picked: [], closed: false, expand: 1}, acts: [
      {target: 'mood-stressful', name: 'Stressful', state: {picked: ['Stressful']}},
      {target: 'close', name: 'Close', state: {closed: true}},
    ], end: [{name: 'the survey folds into its card', state: {expand: 0}}, {name: 'the closed survey', state: {view: 'flow', flow: 'survey', step: 0}}, {name: 'the lesson', state: {step: 1}}]},
    {id: 'text', name: 'A written notice', words: 'If The Content Is In Text / It Dually Serves As Written Notice', view: 'mission', art: {view: 'flow', flow: 'survey', step: 1}, acts: [
      {target: 'inform', name: 'the lesson', state: {view: 'training', expand: 0, pressed: null, done: []}, then: [{name: 'the lesson opens', state: {expand: 1}}]},
    ], marks: [{target: 'description'}]},
    {id: 'quiz', name: 'A quiz', words: 'A Quiz Can Be Required / To Confirm Receipt & Understanding', view: 'mission', art: {view: 'training', expand: 1, pressed: null, done: []}, acts: [
      {target: 'row-quiz', name: 'Quiz', state: {pressed: 'quiz'}},
    ], end: [{name: 'the quiz is done', state: {pressed: null, done: ['quiz']}}]},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Reactive Training / Improves Performance / By Automating Corrective Actions'},
  ],
  // The written lesson the quiz plays (lib/storyboardLesson.mjs LESSON_TOPICS' shape: the mission is in the middle of the plate, as every phone view is).
  lessonTopics: {
    'reactive-inform': {
      left: 434, title: 'How To Inform Management', notice: NOTICE,
      statements: STATEMENTS,
    },
  },
  details: {
    events: {scenes: {
      audit: ['The auditor taps Fail.', 'The door hinges fail.', 'Workplace Safety is triggered.', 'The audit scrolls down.', 'The auditor taps Fail again.', 'The extinguishers fail too.', 'Fire Safety is triggered.'],
      survey: ['Dan K ticks Stressful.', 'Then taps Close.', 'The survey is closed.', 'His answer triggers a lesson.', 'How To Inform Management is his.'],
    }, each: ['audit', 'survey']},
    notice: {scenes: {
      text: ['Dan K taps the lesson.', 'The lesson opens.', 'Its text is a written notice.'],
      quiz: ['Dan K taps the quiz.', 'It opens under the notice.', 'He ticks the right statements.', 'Then taps Submit & Close.'],
    }},
  },
  chunks: [
    {id: 'events', title: 'Lessons triggered by events', lines: ['intro', 'audit', 'survey']},
    {id: 'notice', title: 'A written notice and its quiz', lines: ['text', 'quiz', 'conclusion'], lesson: {scene: 'quiz', topic: 'reactive-inform'}},
  ],
};
