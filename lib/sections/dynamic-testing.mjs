// Dynamic Testing (website Narration (October 14, 2026).docx, section "Dynamic Testing", group Training): the format is described at the top of live-oversight.mjs and dynamic-auditing.mjs.
// The art is components/sections/TestingStage.jsx: a test (True / False on top, a single choice of four in the middle, True / False at the bottom) whose wrong answers each trigger the lesson
// that goes with them (a card pops beside the question, with a purple arrow) and whose right answer triggers nothing ("No Training Needed"); then three people, their scores and the lessons
// each gets (5, 1, 3).
const TEST = extra => ({view: 'test', ...extra});
export default {
  id: 'dynamic-testing',
  board: 'dynamic-testing-v2',
  name: 'Dynamic Testing',
  group: 'Training',
  stage: 'dynamic-testing',
  view: 'mission',
  base: {view: 'test', answers: [null, null, null], lessons: 0, none: 0, shown: 0},
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'Micro-Trainings Can Be Automated / In Reaction To Test Answers'},
    {id: 'incorrect', name: 'Wrong answers trigger lessons', words: 'Each Incorrect Answer / Triggers A Corresponding Lesson', view: 'mission', point: ['lesson-2', 'lesson-1'], art: TEST({answers: [null, null, null], lessons: 0, none: 0}), acts: [
      {target: 'q1-true', name: 'True', state: {answers: [0, null, null]}, then: [{name: 'a lesson is triggered', state: {lessons: 1}}]},
      {target: 'q2-120-f', name: '120°F', state: {answers: [0, 2, null]}, then: [{name: 'another lesson is triggered', state: {lessons: 2}}]},
    ]},
    {id: 'correct', name: 'A right answer triggers nothing', words: 'Answering Correctly / Does Not Trigger Assignments', view: 'mission', art: TEST({answers: [0, 2, null], lessons: 2, none: 0}), acts: [
      {target: 'q3-true', name: 'True', state: {answers: [0, 2, 0]}, then: [{name: 'no training needed', state: {none: 1}}]},
    ], marks: [{target: 'no-training'}]},
    {id: 'competency', name: 'By competency level', words: 'Training Is Customized / Based On Competency Levels', view: 'flow', point: ['list-carla', 'list-ben', 'list-anna'], art: {view: 'people', shown: 0},
      end: [{name: "Anna F's five lessons", state: {shown: 1}}, {name: "Ben R's lesson", state: {shown: 2}}, {name: "Carla M's three lessons", state: {shown: 3}}]},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Fill Knowledge Gaps / Without Burdening Teams / With Unnecessary Training'},
  ],
  details: {
    testing: {scenes: {
      incorrect: ['Anna F answers True.', 'That is wrong: a lesson is assigned.', 'She picks 120°F.', 'Wrong again: another lesson.'],
      correct: ['She answers True.', 'That is right.', 'No training is needed.'],
      competency: ['Three people took the same test.', 'Anna F missed five answers: five lessons.', 'Ben R missed one: one lesson.', 'Carla M missed three: three lessons.'],
    }, each: ['competency']},
  },
  chunks: [
    {id: 'testing', title: 'Lessons triggered by test answers', lines: ['intro', 'incorrect', 'correct', 'competency', 'conclusion']},
  ],
};
