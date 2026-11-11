// Learning Efficiency (website Narration (October 14, 2026).docx, section "Learning Efficiency", group Training): the format is described at the top of live-oversight.mjs and dynamic-auditing.mjs.
// The art is components/sections/LearningStage.jsx: the lesson on the phone (its video, skipped by a swipe up to the quiz, the quiz failed and the lesson repeated), the Overview's Course board in
// its History view and one lesson's side window (its responses: the video skipped, the quiz passed), the work mission whose 4th step is a training that pops out beside it as its lesson screen, Dynamic Auditing's audit that
// assigns trainings, a test whose wrong answers assign lessons, the Knowledge Base on the tablet, and Automated Certification's certificate leading to a training.
// The quiz is the Improved Quality one (`lesson`: the video plays lib/storyboardLesson.mjs's lesson screen with the topic below; the stage draws its quiz page from the same words).
export default {
  id: 'learning-efficiency',
  board: 'learning-efficiency-v2',
  name: 'Learning Efficiency',
  group: 'Training',
  stage: 'learning-efficiency',
  view: 'mission',
  base: {view: 'lesson', page: 0, t: 1, ticks: '00', failed: false, sent: false, drawer: 0, expand: 1, scrollTo: 'top', side: 0, flowStep: 1, menu: false, kb: false, certScene: 'cert'},
  lessonTopics: {
    'learning-shelves': {
      left: 434, title: 'Stocking Shelves Safely',
      notice: ['You skipped the video: you already know this lesson.', 'Answer the quiz to confirm what you know.'],
      statements: ['Heavy items are stored on the lower shelves.', 'Boxes can stay on the floor in front of a full shelf.', 'Older stock is placed in front, to be used first.'],
    },
  },
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'Innovative Strategies / Increase Learning Efficiency'},
    {id: 'skip', name: 'Skipping a known lesson', words: 'Skipping A Known Lesson / Reduces Training Time', art: {view: 'lesson', page: 0, t: 1, ticks: '00', failed: false},
      before: [{name: 'the video plays', state: {t: 3}}], acts: [{target: 'skip', name: 'the down arrow', state: {page: 1}}]}, // (the lesson screen's own arrow to the next page: the video is skipped, the screen scrolls up to the quiz)
    {id: 'quiz', name: 'A quiz instead', words: 'A Quiz Is Taken Instead / To Confirm Knowledge', art: {view: 'lesson', page: 1, t: 3, ticks: '00', failed: false},
      acts: [{target: 'lq-box-1', name: 'the first statement', state: {ticks: '11'}}], // (the video plays the lesson screen here: the cursor ticks two statements and presses Submit & Close)
      end: [{name: 'the quiz is sent', state: {sent: true}}]}, // (the slide after Submit & Close: its button gray)
    {id: 'fail', name: 'The quiz failed', words: 'Failing The Quiz / Repeats The Lesson', point: ['failed', 'quiz-page'], art: {view: 'lesson', page: 1, t: 3, ticks: '11', failed: false, sent: true},
      end: [{name: 'the quiz closes, failed', state: {page: 0, t: 0, ticks: '00', failed: true, sent: false}}], marksAfter: true, marks: [{target: 'failed'}]},
    {id: 'history', name: 'Training durations', words: 'Historical Data Shows / Minimal Training Durations', view: 'web', art: {view: 'web', drawer: 0}, marks: [{target: 'col-duration'}]},
    {id: 'budget', name: 'Under its budgeted time', words: 'Skipping To Pass A Quiz / Completes A Training / Under Its Budgeted Time', view: 'web', art: {view: 'web', drawer: 0},
      acts: [{target: 'row-stocking', name: 'Stocking Shelves Safely', state: {drawer: 1}}], marks: [{target: 'dur-stocking'}]}, // (the side window opens; its duration, in the row, is outlined)
    {id: 'increases', name: 'Learning efficiency increases', words: 'Learning Efficiency Increases', point: ['mission-chip'], art: {view: 'work', expand: 0, scrollTo: 'top', side: 0, t: 0},
      end: [{name: 'the mission opens', state: {expand: 1}}]},
    {id: 'context', name: 'Training in context of work', words: 'By Training In Context Of Work', art: {view: 'work', expand: 1, scrollTo: 'top', side: 0, t: 0},
      before: [{name: 'the 4th step', state: {scrollTo: 'cp-4'}}],
      acts: [{target: 'play-4', name: 'the training', state: {side: 1, t: 0}, then: [{name: 'the video plays', state: {t: 3}}]}]},
    {id: 'audits', name: 'Training after audits', words: 'By Training In Reaction To Audits', view: 'flow', point: ['training-2', 'training-1', 'audit'], art: {view: 'audit', flowStep: 0},
      end: [{name: 'two trainings pop', state: {flowStep: 1}}]},
    {id: 'tests', name: 'Training after tests', words: 'By Training In Reaction To Tests', view: 'flow', point: ['lesson-2', 'lesson-1', 'test'], art: {view: 'test', flowStep: 0},
      end: [{name: 'two lessons pop', state: {flowStep: 1}}]},
    {id: 'knowledge', name: 'Access to knowledge', words: 'Learning Efficiency Increases / With Access To Knowledge', view: 'tablet', art: {view: 'board', menu: false, kb: false}, acts: [
      {target: 'menu', name: 'Menu', state: {menu: true}},
      {target: 'menu-knowledge-base', name: 'Knowledge Base', state: {menu: false, kb: true}},
    ]},
    {id: 'certs', name: 'Maintaining certifications', words: 'Learning Efficiency Is Also / Applied To Maintaining Certifications', view: 'flow', point: ['renew', 'cert'], art: {view: 'cert', certScene: 'cert'},
      end: [{name: 'the training it leads to', state: {certScene: 'renew'}}], marksAfter: true, marks: [{target: 'renew'}]},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Lesson Automation & Accessibility / Increases Learning Efficiency'},
  ],
  details: {
    skip: {scenes: {
      skip: ['The lesson’s video plays.', 'The user already knows it.', 'The user taps the down arrow.', 'The video is skipped: the quiz comes up.'],
      quiz: ['The user ticks a statement.', 'Then a second one.', 'Then taps Submit & Close.'],
      fail: ['One answer was wrong: the quiz is failed.', 'The lesson starts again.'],
    }, each: ['skip', 'fail']},
    durations: {scenes: {
      history: ['Every lesson is kept in History.', 'Each one took a few minutes.'],
      budget: ['The manager opens a lesson.', 'Its side panel shows the video skipped, the quiz passed.', 'The lesson took just over two minutes.'],
    }},
    context: {scenes: {
      increases: ['A work mission opens.'],
      context: ['The user scrolls to step 4.', 'The user taps the training.', 'The video plays beside the mission.'],
      audits: ['An audit finds an issue.', 'Trainings go to the people involved.'],
      tests: ['A test has two wrong answers.', 'A lesson is assigned for each.'],
    }, each: ['increases', 'context', 'audits', 'tests']},
    knowledge: {scenes: {
      knowledge: ['The user taps Menu.', 'The Knowledge Base is among the options.', 'The Knowledge Base opens.'],
      certs: ['A certificate is about to expire.', 'A refresher training is assigned.'],
    }, each: ['certs']},
  },
  chunks: [
    {id: 'skip', title: 'Skipping a known lesson', lines: ['intro', 'skip', 'quiz', 'fail'], lesson: {scene: 'quiz', topic: 'learning-shelves'}},
    {id: 'durations', title: 'Training durations and budgets', lines: ['history', 'budget']},
    {id: 'context', title: 'Training in context', lines: ['increases', 'context', 'audits', 'tests']},
    {id: 'knowledge', title: 'Knowledge and certifications', lines: ['knowledge', 'certs', 'conclusion']},
  ],
};
