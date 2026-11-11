// Automated Coaching (website Narration (October 14, 2026).docx, section "Automated Coaching", group Training): the format is described at the top of live-oversight.mjs and dynamic-auditing.mjs.
// The art is components/sections/CoachingStage.jsx, only the product's own screens: three personal boards the micro-lessons are posted to (4, 2 and 3), a micro-lesson opened (the product's
// opened Media mission: a video 00:45, a text read aloud 00:38, a quiz; its translate button), the lessons playing as the Improved Quality lesson screen (lib/storyboardLesson.mjs: the
// video lesson is its shelving clip, the text and the quiz are written lessons, `lessonTopics`), and the web app's Timeline over a month (a few lessons a day, their total, a lesson posted
// on the 1st of every month).
// The written lesson (Storage Rules) and the quiz: what the lesson screens show.
export const NOTICE = ['Store heavy items on the lower shelves.', 'Keep every label facing out.', 'Use older stock first.', 'Never leave boxes on the floor.'];
const PHONES = extra => ({view: 'phones', ...extra});
const LESSON = extra => ({view: 'lesson', expand: 1, pressed: null, ...extra});
const TIMELINE = extra => ({view: 'timeline', ben: false, ...extra});
export default {
  id: 'automated-coaching',
  board: 'automated-coaching-v2',
  name: 'Automated Coaching',
  group: 'Training',
  stage: 'automated-coaching',
  view: 'phone',
  base: {view: 'phones', posted: 0, expand: 1, pressed: null, done: [], lang: 'en', focus: null, pan: 0, ben: false},
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'People Are Constantly Trained / Without Disrupting Work'},
    {id: 'assigned', name: 'Micro-lessons are assigned', words: 'Micro-Trainings Are / Automatically Assigned', view: 'phones', point: ['phone-anna-3', 'phone-carla-2', 'phone-anna-2', 'phone-ben-1', 'phone-anna-1', 'phone-anna-0'], art: PHONES({posted: 0}),
      end: [1, 2, 3, 4].map(n => ({name: `${n === 1 ? 'the first lessons' : `lesson ${n}`}`, state: {posted: n}}))},
    // (the narration: "Place words on screen"; the lesson is opened here, so that its length is seen)
    {id: 'seconds', name: 'Done in seconds', words: 'A Micro-Lesson Can Be / Completed In Mere Seconds', view: 'lesson', art: PHONES({posted: 4}), acts: [
      {target: 'phone-anna-0', name: 'Stock Shelving', state: LESSON({expand: 0, done: []}), then: [{name: 'the lesson opens', state: {expand: 1}}]},
    ], marks: [{target: 'estimate'}]},
    // a lesson tapped plays as the Improved Quality lesson screen (the chunk's `lesson`): the row pressed, then (after the screen) the lesson watched
    {id: 'video', name: 'A short video', words: 'It Can Be / A Short Video', view: 'lesson', art: LESSON({done: []}), marksFirst: true, marks: [{target: 'tag-video'}], acts: [
      {target: 'row-video', name: 'Shelving Standards', state: {pressed: 'video'}},
    ], end: [{name: 'the video is watched', state: {pressed: null, done: ['video']}}]},
    {id: 'text', name: 'A short text', words: 'It Can Be / A Short Text', view: 'lesson', art: LESSON({done: ['video']}), marksFirst: true, marks: [{target: 'tag-text'}], acts: [
      {target: 'row-text', name: 'Storage Rules', state: {pressed: 'text'}},
    ], end: [{name: 'the text is read', state: {pressed: null}}]},
    {id: 'audio', name: 'Converted to audio', words: 'All Text Is Automatically / Converted To Audio', view: 'lesson', art: LESSON({done: ['video']}), marks: [{target: 'tag-text'}]},
    {id: 'podcasts', name: 'Consumed as podcasts', words: 'Lessons Can Be / Consumed As Podcasts', view: 'lesson', point: ['row-text'], art: LESSON({done: ['video']})},
    {id: 'translated', name: 'Instantly translated', words: 'All Content Can Be / Instantly Translated', view: 'lesson', art: LESSON({done: ['video']}), acts: [
      {target: 'translate', name: 'ES', state: {lang: 'es'}},
    ]},
    {id: 'quiz', name: 'A quiz', words: 'To Confirm Learning / A Quiz Can Be Required', view: 'lesson', art: LESSON({done: ['video'], lang: 'en'}), acts: [
      {target: 'row-quiz', name: 'Quiz', state: {pressed: 'quiz'}},
    ], end: [{name: 'the quiz is done', state: {pressed: null, done: ['video', 'quiz']}}]},
    {id: 'distributed', name: 'Distributed over the days', words: 'Micro-Lessons Can / Be Distributed / To Minimize Disruption', view: 'web', art: TIMELINE(), marksLate: true, marksSequence: true, marks: [{target: 'pick-1', pad: 6}, {target: 'pick-2', pad: 6}]},
    {id: 'adds', name: 'Adding up over time', words: 'A Few Lessons Per Day / Can Add Up Over Time', view: 'web', art: TIMELINE(), marksLate: true, marksSequence: true, marks: [{target: 'period'}, {target: 'anna-right', pad: 6}, {target: 'anna-left', pad: 6}, {target: 'total-anna'}]},
    {id: 'repeated', name: 'Repeated for emphasis', words: 'All Training Is Not Equal / Important Concepts Should Be / Repeated For Emphasis', view: 'web', art: TIMELINE(), acts: [
      {target: 'toggle-ben', name: 'Ben R', state: {ben: true}},
    ], marksSequence: true, marks: [{target: 'lesson-harassment', pad: 4}, {target: 'harassment-1'}, {target: 'harassment-31'}]},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Taskmaverick Ensures Learning / Without Burdening Teams / Or Disrupting Their Work'},
  ],
  // The written lessons the lesson screen plays (lib/storyboardLesson.mjs LESSON_TOPICS' shape: the mission is in the middle of the plate, as every phone view is). The cursor ticks the
  // first two statements (the right ones) and presses Submit & Close.
  lessonTopics: {
    'coaching-storage': {
      left: 434, title: 'Storage Rules', notice: NOTICE,
      statements: ['Every label faces out.', 'Heavy items go on the lower shelves.', 'Boxes can be left on the floor when the shelves are full.'],
    },
    'coaching-quiz': {
      left: 434, title: 'Stock Shelving: Quiz', notice: ['Shelving Standards (video) and Storage Rules (text) are done.', 'Select all of the correct statements to finish the mission.'],
      statements: ['Heavy items are stored on the lower shelves.', 'Older stock is used first.', 'It is OK to stack boxes in front of the shelves.'],
    },
  },
  details: {
    assigned: {scenes: {
      assigned: ['Lessons arrive on three personal boards.', 'One at a time, by themselves.', 'Anna F gets four, Ben R two, Carla M three.'],
      seconds: ['Anna F taps Stock Shelving.', 'The lesson opens.', 'It takes about a minute and a half.'],
      video: ['The video lasts 45 seconds.', 'Anna F taps it.', 'The lesson video plays.', 'A short quiz follows.', 'She ticks the right statements.', 'Then taps Submit & Close.'],
    }, each: ['assigned']},
    formats: {scenes: {
      text: ['The text takes 38 seconds.', 'Anna F taps it.', 'The written lesson opens.', 'She ticks the right statements.', 'Then taps Submit & Close.'],
      audio: ['Every text is also read aloud.'],
      podcasts: ['She can listen while she works.'],
      translated: ['Anna F taps ES.', 'The lesson turns to Spanish.'],
    }},
    schedule: {scenes: {
      quiz: ['Anna F taps the quiz.', 'The quiz opens.', 'She ticks the right statements.', 'Then taps Submit & Close.', 'The lesson is done.'],
      distributed: ['The Timeline shows every day of the month.', 'Two lessons for Anna F on 09/01.', 'One on 09/09.'],
      adds: ['The period is one month.', 'Her lessons each day, from the last day.', 'Back to the first day.', '20 lessons in the month.'],
      repeated: ['The manager opens Ben R.', 'His lessons appear.', 'Sexual Harassment is posted on 09/01.', 'And again on 10/01: every month.'],
    }},
  },
  chunks: [
    {id: 'assigned', title: 'Micro-lessons, assigned and done in seconds', lines: ['intro', 'assigned', 'seconds', 'video'], lesson: {scene: 'video'}},
    {id: 'formats', title: 'A short text, read aloud and translated', lines: ['text', 'audio', 'podcasts', 'translated'], lesson: {scene: 'text', topic: 'coaching-storage'}},
    {id: 'schedule', title: 'A quiz, lessons spread over time and repeated', lines: ['quiz', 'distributed', 'adds', 'repeated', 'conclusion'], lesson: {scene: 'quiz', topic: 'coaching-quiz'}},
  ],
};
