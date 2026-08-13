// ---------------------------------------------------------------------------
// Sample data for the "Opened mission" phone detail views (all types).
// One shape drives every type; the `type` field selects the body renderer in
// components/OpenedMission.jsx. Recreated from the Figma "Assets for website
// animation" opened-mission screens. See docs/mission-animation.md.
//
// Timer rules (docs/mission-animation.md): the right pill is the "Timer" and is
// GREEN by default (color aging is opt-in). Both timers run while Open/Claimed;
// the left Execution timer only shows once claimed (`showExec`). These samples
// are in the OPEN state (Claim footer), so they show the green pill only.
// ---------------------------------------------------------------------------

// Shared summary fields, tweaked per mission below.
// Lifecycle: open (brief + Claim) -> claimed (deep content + Close, claimer +
// execution timer appear) -> closed (moves to Closed; pill snaps gray, frozen).
const base = {
  points: 25,
  location: 'Kitchen / 1',
  postedBy: 'J. Maverick', // shown while OPEN (the poster)
  claimer: 'Anna F. - Staff', // shown once CLAIMED (the claimer)
  date: '04-01-24',
  time: '06:56 PM',
  pillTime: '00:07:40',
  pillClass: 'chip--green', // default GREEN per timer rules (Figma shows red aging)
};

// 1) TASK — the simplest opened mission: just an instruction banner.
export const task = {
  ...base,
  id: 'task',
  type: 'Task',
  title: 'Cook Pasta',
  description: 'Perform the mission',
  notice: 'Read safety instructions',
  headerRight: 'es-menu',};

// 2) CHECKLIST — collapsible groups with numeric checklist items.
export const checklist = {
  ...base,
  id: 'checklist',
  type: 'Checklist',
  title: 'Closing Checklist',
  description: 'This is the description it can be one line or more if they really want it to.',
  notice: 'Do Not Cross Contaminate. Use The Designated Mops And Tools For Every Surface',
  headerRight: 'es-undo',
  // Figma shows this one with a "Close" footer + filled items -> already CLAIMED.
  initialState: 'claimed',
  claimedWho: 'J. Maverick',
  claimedFooter: { label: 'Close', variant: 'muted' },
  sectionTitle: 'Checklist',
  groups: [
    {
      title: 'Shelf',
      done: 2,
      total: 2,
      items: [
        { n: 1, label: 'Plates', value: 2 },
        { n: 2, label: 'Cups', value: 2 },
      ],
    },
    {
      title: 'Shelf 2',
      done: 2,
      total: 2,
      items: [
        { n: 1, label: 'Plates', value: 2 },
        { n: 2, label: 'Cups', value: 2 },
      ],
    },
    { title: 'Warehouse', done: 0, total: 4, collapsed: true },
    { title: 'Shelf', done: 2, total: 4, collapsed: true },
    {
      title: 'Total',
      tone: 'yellow',
      items: [{ n: 1, label: 'Dish', value: 4 }],
    },
  ],
};

// 3) MEDIA — an ordered content playlist (audio / quiz / illustration / video).
export const media = {
  ...base,
  id: 'media',
  type: 'Media',
  title: 'Cook Pasta',
  description: 'Perform the mission',
  notice: 'Read safety instructions',
  headerRight: 'es-menu',
  estimated: '00:20',
  contents: [
    { n: 1, label: 'Wash Hands Topic', kind: 'audio', meta: '00:50' },
    { label: 'Quiz-1', kind: 'quiz', meta: 'n/a', sub: true },
    { label: 'Quiz-2', kind: 'quiz', meta: 'n/a', sub: true },
    { n: 2, label: 'Washing Hands Illustration', kind: 'illustration', meta: 'n/a' },
    { label: 'Quiz-3', kind: 'quiz', meta: 'n/a', sub: true },
    { n: 3, label: 'Sanitizer Caution', kind: 'audio', meta: '00:50' },
    { n: 4, label: 'Sanitizer Video', kind: 'video', meta: '00:50' },
  ],
};

// 4) SURVEY — "Workplace Check": yes/no/na questions + photo/video attachments.
export const survey = {
  ...base,
  id: 'survey',
  type: 'Survey',
  title: 'Workplace Check',
  postedBy: 'J. Maverick',
  description: 'Read carefully and answer the questions',
  notice: 'Safety related survey',
  headerRight: 'es-menu',
  intro: 'Does your team experience any of the problems?',
  questions: [
    {
      kind: 'yesno',
      prompt: 'Do you have a car?',
      options: [
        { label: 'Yes', state: 'on' },
        { label: 'No' },
        { label: 'N/A' },
      ],
      attach: {
        note: 'Attach at least one photo and one video:',
        rows: [
          { photo: { label: 'Photo', count: '2/4' }, video: { label: 'Add Video', count: '0/1' } },
        ],
      },
    },
    {
      kind: 'yesno',
      prompt: 'A mess on tables',
      options: [{ label: 'Yes', state: 'on' }, { label: 'No' }],
    },
    {
      kind: 'yesno',
      prompt: 'Broken equipment',
      options: [{ label: 'Yes', state: 'on' }, { label: 'No' }],
    },
  ],
};

// 5) TEST — collapsible sections of graded questions (status per question).
export const test = {
  ...base,
  id: 'test',
  type: 'Test',
  title: 'BYOD Policy Test',
  description: 'This is the description it can be one line or more if they really want it to.',
  notice: 'Follow the content carefully',
  headerRight: 'es-menu',
  // Figma shows sections + a "Continue" footer -> already CLAIMED.
  initialState: 'claimed',
  claimedWho: 'Posted by: J. Maverick - Staff',
  claimedFooter: { label: 'Continue', variant: 'primary' },
  sections: [
    {
      title: 'Section 1',
      done: 0,
      total: 5,
      questions: [
        { n: 1, label: 'The effective BYOD policy includes:' },
        { n: 2, label: 'What is NOT a benefit of BYOD?' },
        { n: 3, label: 'The allowed personal devices in…' },
      ],
    },
    {
      title: 'Section 2',
      done: 0,
      total: 4,
      questions: [
        { n: 1, label: 'Viruses and security issues are NO…' },
        { n: 2, label: 'Workplace integration is not a…' },
        { n: 3, label: 'Watch this video before continuing' },
        { n: 4, label: 'Provide your thoughts (if any)' },
      ],
    },
  ],
};

// 6) AUDIT — mixed question types (yes/no/na, multi-select, single choice).
// Note: the Audit summary header has no points badge in the source design.
export const audit = {
  ...base,
  id: 'audit',
  type: 'Audit',
  title: 'Cook Pasta',
  points: null, // Audit shows no points badge
  description: 'Please answer all the questions below',
  notice: 'Answer carefully the questions',
  headerRight: 'es-close',
  questions: [
    {
      kind: 'yesno',
      prompt: 'Are all the employees wearing the required safety gear?',
      options: [{ label: 'Yes' }, { label: 'No' }, { label: 'N/A' }],
    },
    {
      kind: 'multi',
      prompt: 'Which of the following safety measures are currently in place?',
      hint: '*select multiple options',
      options: [
        { label: 'Fire extinguisher in accessible location' },
        { label: 'First aid kit stocked' },
        { label: 'Emergency exit clearly marked' },
        { label: 'Weekly safety briefing held' },
      ],
    },
    {
      kind: 'single',
      prompt: 'How would you rate the cleanliness of the work area?',
      options: [{ label: 'Excellent' }, { label: 'Good' }, { label: 'Fair' }],
    },
  ],
};

// All six, in the order shown on the Figma board.
export const OPENED_MISSIONS = [task, checklist, media, survey, test, audit];
