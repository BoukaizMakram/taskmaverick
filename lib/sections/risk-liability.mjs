// Risk & Liability (website Narration (October 14, 2026).docx, section "Risk & Liability", group Risk): the format is described at the top of live-oversight.mjs and dynamic-auditing.mjs.
// The art is components/sections/RiskStage.jsx: three people and the Discrimination Survey each of them gets (its card under each face), the three surveys opened and answered, Ben R's
// "Yes" raising the Discrimination Alert, the art pushed right to left onto the alert opened with the steps that guide the responder (`page`); a survey with its HR training video;
// the web report grouped by person, opened down to the answers of a survey, and the trainings the person completed.
const OPEN = {view: 'people', step: 3, expand: 1, page: 'surveys'};
export default {
  id: 'risk-liability',
  board: 'risk-liability-v2',
  name: 'Risk & Liability',
  group: 'Risk',
  stage: 'risk-liability',
  view: 'mission',
  base: {view: 'people', step: 0, expand: 0, answers: 0, alert: 0, page: 'surveys', tExpand: 0, steps: 0, tScroll: 'top', done: false, trScroll: 'top', level: 0, focus: null, pan: 0, scrollTo: null},
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'There Is No Reason / To Live In Fear / Of Business Risk / And Legal liability'},
    {id: 'surveys', name: 'A survey for each', words: 'Surveys Are Automated / To Detect HR Risks', view: 'flow', point: ['face-ben'], art: {view: 'people', step: 0, expand: 0, answers: 0, alert: 0, page: 'surveys'},
      end: [{name: 'Anna F gets her survey', state: {step: 1}}, {name: 'Ben R gets his survey', state: {step: 2}}, {name: 'Carla M gets her survey', state: {step: 3}}]},
    {id: 'detect', name: 'A risk triggers an alert', words: 'Detecting A Risk / Triggers An Alert', point: ['cp-ben-q2'], art: {...OPEN, answers: 0, alert: 0},
      end: [{name: 'the first answers', state: {answers: 1}}, {name: 'the second answers', state: {answers: 2}}, {name: 'the third answers', state: {answers: 3}}, {name: 'the alert', state: {alert: 1}}]},
    {id: 'responders', name: 'The responder is guided', words: 'Responders Are Guided / To Ensure Proper Resolutions', art: {...OPEN, answers: 3, alert: 1}, acts: [
      {target: 'alert', name: 'the alert', state: {page: 'ticket', tExpand: 0, steps: 0, tScroll: 'top'}, then: [{name: 'the alert opens', state: {tExpand: 1}}]},
      {target: 'yes-s0', name: 'Yes', state: {steps: 1}},
      {target: 'yes-s1', name: 'Yes', state: {steps: 2, tScroll: 'cp-s2'}},
      {target: 'yes-s2', name: 'Yes', state: {steps: 3}},
    ]},
    {id: 'training', name: 'HR training in the survey', words: 'HR Training Is Refreshed / Or Reinforced / With Every Survey', art: {view: 'training', done: false, trScroll: 'top'}, acts: [
      {target: 'play-hr', name: 'the training', state: {trScroll: 'cp-hr'}},
    ], end: [{name: 'the training is done', state: {done: true, trScroll: 'top'}}]},
    {id: 'records', name: 'Records by person', words: 'Records Are Maintained / To Defend Against Frivolous Claims', view: 'web', art: {view: 'report', level: 0, scrollTo: 'top'}, acts: [
      {target: 'person-anna', name: 'Anna F', state: {level: 1}},
      {target: 'survey-0', name: 'the survey', state: {level: 2}},
    ]},
    {id: 'every', name: 'Every survey, answer and training', words: 'Every Survey Taken / Every Answer Given / Every Training Completed', view: 'web', art: {view: 'report', level: 2},
      marksLate: true, marksSequence: true, marks: [{target: 'surveys-block', pad: 4}, {target: 'answers-block', pad: 4}, {target: 'trainings-block', pad: 4}]},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Automated Surveys / Prevent Legal Liability / Deter Bad Actors / Improve The Work Environment / Increase Staff Retention'},
  ],
  details: {
    surveys: {scenes: {
      surveys: ['A survey is sent to each person.', 'Anna F gets hers.', 'Then Ben R.', 'Then Carla M.'],
      detect: ['The surveys open.', 'Each person answers.', 'Ben R answers Yes.', 'An alert is raised.'],
      responders: ['The manager opens the alert.', 'Its steps guide the response.', 'The manager taps Yes.', 'The next step appears.', 'Then Yes again.', 'And once more.'],
    }, each: ['surveys', 'detect']},
    records: {scenes: {
      training: ['The survey starts with a training.', 'The user opens it.', 'The user ticks the right statements.', 'Then taps Submit & Close.', 'The training is done.'],
      records: ['The report lists every person.', 'The manager opens Anna F.', 'Her surveys and trainings appear.', 'The manager opens a survey.', 'Every answer she gave appears.'],
      every: ['All of it is in the report.'],
    }},
  },
  // The training the survey opens (the Improved Quality lesson screen: a written notice where the video is, then the quiz; lib/storyboardLesson.mjs LESSON_TOPICS' shape; `left`: where the
  // survey is on this stage, the camera's way: MissionPanel at 341, 1.5).
  lessonTopics: {
    respect: {
      left: 434, title: 'Respect In The Workplace',
      notice: ['Everyone at work is treated with respect, whatever their race, gender, age, religion or background.', 'Report any discrimination you see or experience to your manager or to HR.', 'Every report is confidential, and retaliation is never allowed.'],
      statements: ['Discrimination is reported to a manager or to HR.', 'Every report is kept confidential.', 'Discrimination can be ignored if it is not aimed at you.'],
    },
  },
  chunks: [
    {id: 'surveys', title: 'Surveys, alerts and guided responses', lines: ['intro', 'surveys', 'detect', 'responders']},
    {id: 'records', title: 'Training and records', lines: ['training', 'records', 'every', 'conclusion'], lesson: {scene: 'training', topic: 'respect'}},
  ],
};
