// Mass Broadcasting (website Narration (October 14, 2026).docx, section "Mass Broadcasting", group Training): the format is described at the top of live-oversight.mjs and dynamic-auditing.mjs.
// The art is components/sections/BroadcastStage.jsx: an announcement as a card on its own (`flow`: 'card'), opened (`view: 'mission'`: the product's opened Media mission, its text a document, or a video), sent to every person (their faces,
// each with the announcement on its right: 'sent'), its quiz and who passed it ('results'), the Confirmation Delay ticket the two who failed raise ('alert'), and the web app's Team Board of
// announcements (`view: 'web'`: the Overview › Personal Board, grouped by person) whose Open / Claimed / Closed At columns say who has not reviewed, who is reviewing and who understood.
// The quiz is the Improved Quality lesson screen (lib/storyboardLesson.mjs) with the announcement's own notice and statements (`lessonTopics`).
// the announcement's words (the stage writes them in the opened mission, the quiz's lesson screen has them as its notice)
export const ALLERGEN_NOTICE = ['From Monday, every dish lists its allergens on the menu board.', 'Ask every guest about allergies before taking the order.', 'Allergen-free orders use the purple board and fresh gloves.'];

const card = ann => ({view: 'flow', ann, flow: 'card', who: null, expand: 1, om: 'open', done: [], pressed: null});
const open = who => ({view: 'mission', who, expand: 0, om: 'open', done: [], pressed: null});
export default {
  id: 'mass-broadcasting',
  board: 'mass-broadcasting-v2',
  name: 'Mass Broadcasting',
  group: 'Training',
  stage: 'mass-broadcasting',
  view: 'flow',
  base: {view: 'flow', ann: 'doc', flow: 'card', who: null, expand: 1, om: 'open', done: [], pressed: null, focus: null, pan: 0, rows: null},
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'Important Announcements / Must Be Understood / By All Recipients'},
    // the announcement on its own, opened (the product's opened Media mission: its text is the document), sent to everyone (each face with it on its right), and opened by one of them
    {id: 'document', name: 'A document', words: 'An Announcement / Can Include A Document', view: 'flow', art: card('doc'), acts: [
      {target: 'announcement', name: 'the announcement', state: open(null), then: [{name: 'it opens: the document', state: {expand: 1}}, {name: 'sent to every person', state: {view: 'flow', flow: 'sent', expand: 1}}]},
      {target: 'copy-carla', name: 'Carla’s announcement', state: open('Carla M'), then: [{name: 'she opens it', state: {expand: 1}}]},
    ]},
    // the same with a video: sent to everyone, opened by one of them: the video plays (the Improved Quality lesson screen in the videos: the clip, then its quiz), then the mission with it done
    {id: 'video', name: 'A video', words: 'An Announcement / Can Include A Video', view: 'flow', art: card('video'), before: [{name: 'sent to every person', state: {flow: 'sent'}}], acts: [
      {target: 'copy-leo', name: 'Leo’s announcement', state: open('Leo T'), then: [{name: 'he opens it', state: {expand: 1}}]},
    ], end: [{name: 'the video watched', state: {om: 'claimed', done: ['video']}}]},
    // its quiz (the lesson screen in the videos: the notice, the quiz under it, the statements ticked, Submit & Close), then who passed (3 ✓) and who did not (2 ✗)
    {id: 'confirm', name: 'Receipt and understanding confirmed', words: 'Each Person’s / Receipt & Understanding / Can Be Confirmed', view: 'mission',
      art: {view: 'mission', ann: 'doc', who: 'Anna F', expand: 1, om: 'claimed', done: [], pressed: null}, acts: [
        {target: 'row-quiz', name: 'the quiz', state: {pressed: 'quiz'}},
      ], end: [{name: 'who passed it', state: {view: 'flow', flow: 'results', pressed: null}}]},
    {id: 'delays', name: 'Confirmation delays', words: 'Confirmation Delays / Can Alert Senders', view: 'flow', point: ['ticket', 'fail-ben', 'fail-dan'], art: {view: 'flow', ann: 'doc', flow: 'results'},
      end: [{name: 'the Confirmation Delay ticket', state: {flow: 'alert'}}]},
    // the Personal Board of announcements: it scrolls, then its columns
    {id: 'dashboards', name: 'Live dashboards', words: 'Live Dashboards / Monitor Announcements', view: 'web', art: {view: 'web', rows: null, pan: 0}, end: {rows: 'person-dan'}},
    {id: 'notReviewed', name: 'Who has not reviewed', words: 'Who Has Not / Reviewed An Announcement', view: 'web', art: {view: 'web', rows: null}, marks: [{col: 'open'}]},
    {id: 'reviewing', name: 'Who is reviewing', words: 'Who is reviewing / An Announcement', view: 'web', art: {view: 'web', rows: null}, marks: [{col: 'claimed'}]},
    {id: 'understood', name: 'Who understood', words: 'Who Understood / An Announcement', view: 'web', art: {view: 'web', rows: null}, marks: [{col: 'closed'}]},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Announcing With Taskmaverick / Provides Assurance / Of Receipt & Understanding'},
  ],
  // The quiz's lesson screen (lib/storyboardLesson.mjs LESSON_TOPICS' shape): the mission sits at the middle of the plate (x 521: left 434 in the lesson's camera).
  lessonTopics: {
    allergens: {
      left: 434, title: 'New Allergen Policy', notice: ALLERGEN_NOTICE,
      statements: ['Every guest is asked about allergies before ordering.', 'Allergen-free orders use the purple board and fresh gloves.', 'Allergens only need to be listed when a guest asks.'],
    },
  },
  details: {
    content: {scenes: {
      document: ['The manager opens the announcement.', 'Its text is the new policy.', 'Every person gets it. Carla opens hers.', 'She reads the policy.'],
      video: ['Leo opens his announcement.', 'He plays the video.', 'It plays on his phone.', 'A short quiz follows.', 'He ticks the answers.', 'Then submits.', 'The video is done.'],
    }},
    confirm: {scenes: {
      confirm: ['Anna opens the quiz.', 'She ticks the right statements.', 'Then taps Submit & Close.', 'Three people passed, two did not.'],
      delays: ['Ben and Dan have not confirmed.', 'A Confirmation Delay ticket goes to the sender.'],
    }, each: ['delays']},
    monitor: {scenes: {
      dashboards: ['The Personal Board lists each person’s announcements.'],
      notReviewed: ['Open: not reviewed yet.'],
      reviewing: ['Claimed: being reviewed now.'],
      understood: ['Closed At: when each was understood.'],
    }, each: ['dashboards']},
  },
  chunks: [
    {id: 'content', title: 'Announcements with a document or a video', lines: ['intro', 'document', 'video'], lesson: {scene: 'video'}},
    {id: 'confirm', title: 'Receipt and understanding confirmed', lines: ['confirm', 'delays'], lesson: {scene: 'confirm', topic: 'allergens'}},
    {id: 'monitor', title: 'Monitoring announcements', lines: ['dashboards', 'notReviewed', 'reviewing', 'understood', 'conclusion']},
  ],
};
