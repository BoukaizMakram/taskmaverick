// Standardizing Enterprise (website Narration (October 14, 2026).docx, section "Standardizing Enterprise", group Knowledge): the format is described at the top of live-oversight.mjs and dynamic-auditing.mjs.
// The art is components/sections/StandardizingStage.jsx, the product's own screens and pieces only (the user, 2026-10-20): the Operations Manual turned into one mission of each type (the
// product's mission cards), each type opened in turn (Mission Details: Task, Checklist, Survey, Audit; the Media mission as the product's own Media screen, its audio and video rows), the web library (Missions › In Library, its
// Type column), a library mission's side panel (Content, then Assigned: its People and Team Boards schedules), the mission arriving on Anna's phone (the team: its Team Boards count), its
// title retyped in the mission builder and updated on both copies, and a schedule of its own for each. The two "Words" lines of the narration are words only (`title`).
const TYPES = {view: 'types', conv: 5};
const open = (id, name, extra = []) => ({target: `type-${id}`, name, state: {view: 'mission', open: id, expand: 0}, then: [{name: 'the mission expands', state: {expand: 1}}, ...extra]});
export default {
  id: 'standardizing-enterprise',
  board: 'standardizing-enterprise-v2',
  name: 'Standardizing Enterprise',
  group: 'Knowledge',
  stage: 'standardizing-enterprise',
  view: 'flow',
  base: {view: 'types', conv: 5, open: 'task', expand: 1, focus: null, pan: 0, pulled: null, panel: 0, tab: 'Content', assigned: 0, title: 0, step: 2, edit: 0, sched: 0},
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'An Organization’s Knowledge / Should Be Preserved / And Transferred To Everyone'},
    {id: 'convert', name: 'Knowledge becomes missions', words: 'As Knowledge Is Acquired / It Is Converted To Missions', view: 'flow', art: {view: 'types', conv: 0},
      end: [{name: 'a task', state: {conv: 1}}, {name: 'a checklist', state: {conv: 2}}, {name: 'a survey', state: {conv: 3}}, {name: 'an audit', state: {conv: 4}}, {name: 'a media mission', state: {conv: 5}}]},
    {id: 'tasks', name: 'Tasks', words: 'Tasks', view: 'flow', art: TYPES, acts: [open('task', 'Restock Front Shelves')]},
    {id: 'checklists', name: 'Checklists', words: 'Checklist', view: 'flow', art: TYPES, acts: [open('checklist', 'Opening Checklist')]},
    {id: 'surveys', name: 'Surveys', words: 'Surveys', view: 'flow', art: TYPES, acts: [open('survey', 'Customer Experience Survey')]},
    {id: 'audits', name: 'Audits', words: 'Audits', view: 'flow', art: TYPES, acts: [open('audit', 'Food Safety Audit')]},
    {id: 'media', name: 'Media: its audio and its video', words: 'Media', view: 'flow', art: TYPES, acts: [
      {target: 'type-media', name: 'Stock Shelving Training', state: {view: 'mission', open: 'media'}},
    ], marksSequence: true, marks: [{target: 'media-row-audio', pad: 6}, {target: 'media-row-video', pad: 6}]},
    {id: 'library', name: 'The library', words: 'Missions Are Stored / In The Library', view: 'web', art: {view: 'web', panel: 0, tab: 'Content', assigned: 0}, marks: [{col: 'type'}]},
    {id: 'assign', name: 'Assigned to people or teams', words: 'Missions Can Be Assigned / To People Or Teams', view: 'web', art: {view: 'web', panel: 0, tab: 'Content', assigned: 0}, acts: [
      {target: 'lib-opening', name: 'Opening Checklist', state: {panel: 1, focus: ['side-panel']}},
      {target: 'panel-tab-assigned', name: 'Assigned', state: {tab: 'Assigned', assigned: 1}},
    ], end: [
      {name: 'Anna’s phone', state: {view: 'phone', step: 0}}, {name: 'the mission on her phone', state: {step: 1}},
    ]},
    {id: 'edit', name: 'One edit for all', words: 'Editing The Mission / Updates Content For All', view: 'web', art: {view: 'web', panel: 1, tab: 'Content', assigned: 1, focus: ['side-panel']}, acts: [
      {target: 'panel-actions', name: 'Actions', state: {view: 'builder', title: 0, focus: null, pan: 0}},
      {target: 'field-title', name: 'the title', state: {title: 1}},
    ], end: [{name: 'updated for all', state: {view: 'cards', step: 2, edit: 2, sched: 0}}], marksAfter: true, marks: [{target: 'copy-anna-title', pad: 8}, {target: 'copy-kitchen-title', pad: 8}]},
    {id: 'noUpdate', name: 'No need to update each', title: true, words: 'No Need To Update / Every Team Or Location'},
    {id: 'schedule', name: 'Scheduled for each', words: 'The Same Mission / Can Be Scheduled Differently / For Each Person / Or Team', view: 'flow', art: {view: 'cards', step: 2, edit: 2, sched: 0},
      end: [{name: 'Anna’s schedule', state: {sched: 1}}, {name: 'the team’s schedule', state: {sched: 2}}], marksAfter: true, marks: [{target: 'sched-anna'}, {target: 'sched-kitchen'}]},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Knowledge Is Standardized / While Scheduling Is Customized / Based On Each Recipients’ Needs'},
  ],
  details: {
    missions: {scenes: {
      convert: ['The manual becomes missions.', 'First, a task mission.', 'Then a checklist.', 'Then a survey.', 'Then an audit.', 'And a media mission.'],
      tasks: ['The user opens the task.', 'Its instructions and alert are inside.'],
      checklists: ['The user opens the checklist.', 'Its steps are inside.'],
      surveys: ['The user opens the survey.', 'Its questions are inside.'],
      audits: ['The user opens the audit.', 'Its checks are inside.'],
      media: ['The user opens the media mission.', 'It holds an audio lesson.', 'It also holds a video.'],
    }, each: ['convert']},
    library: {scenes: {
      library: ['The library holds every mission.', 'Each one with its type.'],
      assign: ['The manager opens Opening Checklist.', 'Its details open at the right.', 'The manager clicks Assigned.', 'One person and one team board have it.', 'It reaches Anna’s phone.'],
      edit: ['The manager clicks Actions.', 'The mission opens for editing.', 'The manager retypes the title.', 'Both copies show it.'],
      schedule: ['Anna gets it daily at 8:00 AM.', 'The team gets it three days a week.'],
    }, each: ['assign', 'schedule']},
  },
  chunks: [
    {id: 'missions', title: 'Knowledge turned into missions', lines: ['intro', 'convert', 'tasks', 'checklists', 'surveys', 'audits', 'media']},
    {id: 'library', title: 'The library, assigned, edited and scheduled', lines: ['library', 'assign', 'edit', 'noUpdate', 'schedule', 'conclusion']},
  ],
};
