// Dynamic Auditing (website Narration (October 14, 2026).docx, section "Dynamic Auditing"): the format is described at the top of live-oversight.mjs. The art is
// components/sections/AuditingStage.jsx: the tablet board of audits, the audit by itself, the cards that follow from it (Isolated missions, with their connectors), the Knowledge Base, the web gallery.
//   chapter.then (of an act)  what the click goes on to do by itself (a mission that opens and then expands)
//   chapter.marksAfter        the outlines are drawn on the state the chapter ends in
//   chapter.end               a state, or a list of {name, state}: the art goes on to them one after the other while the words are said
const POST = n => ({audits: n});
export default {
  id: 'dynamic-auditing',
  board: 'dynamic-auditing-v2',
  name: 'Dynamic Auditing',
  stage: 'dynamic-auditing',
  view: 'tablet',
  base: {view: 'board', audits: 4, menu: false, kb: false, expand: 1, steps: 0, hazard: 'none', scrollTo: 'top', link: false, flow: 'corrective', flowStep: 0, panel: 'audit', training: 'none', watch: 0, quiz: [null, null], gallery: false, reportScroll: 0},
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'Audits Are Automatically Assigned / Exactly When Due'},
    {id: 'posted', name: 'Audits are posted', words: 'Audits Are Posted Exactly When Due', point: ['card-audit-West', 'card-audit-East', 'card-audit-South', 'card-audit-North'], art: {view: 'board', ...POST(0)},
      end: [{name: 'North Building Audit', state: POST(1)}, {name: 'South Building Audit', state: POST(2)}, {name: 'East Building Audit', state: POST(3)}, {name: 'West Building Audit', state: POST(4)}]},
    {id: 'guided', name: 'Guided step by step', words: 'Auditors Can Be Guided / Step-By-Step To Ensure Precision', art: {view: 'board', ...POST(4)}, acts: [
      {target: 'card-audit-North', name: 'North Building Audit', state: {view: 'mission', panel: 'audit', expand: 0, steps: 0, scrollTo: 'top'}, then: [{name: 'the audit expands', state: {expand: 1, scrollTo: 'cp-0'}}]},
      {target: 'yes-0', name: 'Yes', state: {steps: 1, scrollTo: 'cp-1'}},
      {target: 'yes-1', name: 'Yes', state: {steps: 2, scrollTo: 'cp-2'}},
      {target: 'yes-2', name: 'Yes', state: {steps: 3, scrollTo: 'cp-hazard'}},
    ]},
    {id: 'hazard', name: 'A hazard is filmed', words: 'When Issues Are Detected / Photos Or Videos Can Be Taken', view: 'mission', art: {view: 'mission', panel: 'audit', expand: 1, steps: 3, scrollTo: 'cp-hazard'}, acts: [
      {target: 'yes-hazard', name: 'Yes', state: {hazard: 'ask', scrollTo: 'cp-hazard'}},
      {target: 'add-video-hazard', name: 'Add video', state: {hazard: 'rec'}, then: [{name: 'the video is attached', state: {hazard: 'done'}}]},
    ]},
    {id: 'corrective', name: 'Corrective actions', words: 'Corrective Actions / Can Be Automated', view: 'flow', point: ['corrective', 'audit'], art: {view: 'flow', flow: 'corrective', flowStep: 0}, end: [{name: 'the mission pops', state: {flowStep: 1}}]},
    {id: 'evidence', name: 'Evidence is included', words: 'Evidence Can Be Included / To Facilitate A Proper Response', view: 'flow', art: {view: 'flow', flow: 'corrective', flowStep: 1}, acts: [
      {target: 'corrective', name: 'the mission', state: {view: 'mission', panel: 'corrective', expand: 0}, then: [{name: 'the mission expands', state: {expand: 1}}]},
      {target: 'play-evidence', name: 'the video', state: {watch: 2}, then: [{name: 'the video plays', state: {watch: 4}}]},
    ]},
    {id: 'time', name: 'Response times', words: 'Response Times Are Measured / Resolutions Can Be Confirmed', view: 'flow', art: {view: 'mission', panel: 'corrective', expand: 1, watch: 4},
      end: [{name: 'the mission collapses', state: {expand: 0}}, {name: 'the closed mission', state: {view: 'flow', flow: 'time'}}], marksAfter: true, marks: [{target: 'corrective-exec'}, {target: 'corrective-who'}]},
    {id: 'followup', name: 'A follow-up audit', words: 'Upon Completing the Corrections / A Follow-Up Audit Can Be Assigned', view: 'flow', point: ['followup', 'corrective', 'audit'], art: {view: 'flow', flow: 'followup', flowStep: 0}, end: [{name: 'the follow-up audit', state: {flowStep: 1}}]},
    {id: 'trainings', name: 'Micro-trainings', words: 'Detecting An Issue Can Also Trigger / Micro-Trainings To All Involved', view: 'flow', point: ['training-2', 'training-1', 'audit'], art: {view: 'flow', flow: 'training', flowStep: 0}, end: [{name: 'two trainings pop', state: {flowStep: 1}}]},
    {id: 'text', name: 'The training as text', words: 'The Content Can Be As Text / Dually Serving As Written Notice', view: 'flow', art: {view: 'flow', flow: 'training', flowStep: 1}, acts: [
      {target: 'training-2', name: 'the lower training', state: {view: 'mission', panel: 'training', training: 'none', expand: 0}, then: [{name: 'the training expands', state: {expand: 1}}, {name: 'the text', state: {training: 'text'}}]},
    ]},
    {id: 'quiz', name: 'A quiz', words: 'A Quiz Can Be Required / To Confirm Receipt & Understanding', view: 'mission', art: {view: 'mission', panel: 'training', training: 'text', expand: 1, scrollTo: 'cp-lesson'}, acts: [
      {target: 'play-lesson', name: 'the training', state: {training: 'quiz', scrollTo: 'quiz-lesson'}},
    ], end: [{name: 'the training is done', state: {training: 'done', scrollTo: 'top'}}]},
    {id: 'knowledge', name: 'The Knowledge Base', words: 'As Auditors Work / Information Is Readily Available', art: {view: 'board', ...POST(4), menu: false, kb: false}, acts: [
      {target: 'menu', name: 'Menu', state: {menu: true}},
      {target: 'menu-knowledge-base', name: 'Knowledge Base', state: {menu: false, kb: true}},
    ]},
    {id: 'links', name: 'Links to outside resources', words: 'Links Can Be Added To Outside Resources', view: 'mission', art: {view: 'mission', panel: 'audit', expand: 1, steps: 0, hazard: 'none', scrollTo: 'top', link: true, kb: false}, marks: [{target: 'link'}]},
    {id: 'gallery', name: 'Touring the evidence', words: 'Managers Can Tour Evidence / Collected During Audits', view: 'web', art: {view: 'web', gallery: false}, acts: [
      {target: 'gallery-view', name: 'Gallery View', state: {gallery: true}},
    ]},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Automated Audits Maintain Standards / Trigger Follow-Up Actions / And Ensure Timely Resolutions'},
  ],
  details: {
    audits: {scenes: {
      posted: ['Four audits arrive on the tablet.', 'Each one appears when it is due.'],
      guided: ['The auditor opens the North Building Audit.', 'The audit expands.', 'The auditor taps Yes.', 'The next point appears.', 'The auditor taps Yes again.', 'Then once more.'],
      hazard: ['The auditor answers Yes to hazards.', 'A video is required.', 'The auditor records the hazard.', 'The video is attached.'],
    }, each: ['posted']},
    actions: {scenes: {
      corrective: ['The hazard triggers a mission.', 'Correct Safety Hazard is assigned.'],
      evidence: ['The mission opens.', 'The evidence is attached.', 'The video plays.'],
      time: ['The mission is closed.', 'Its execution time is kept.', 'So is who did it.'],
      followup: ['The audit was corrected.', 'A follow-up audit is assigned.'],
    }},
    training: {scenes: {
      trainings: ['The issue triggers a training.', 'Two people each get one.'],
      text: ['The lower training opens.', 'It is written as text.'],
      quiz: ['The user opens the training.', 'A quiz follows its notice.', 'The user ticks the right statements.', 'Then taps Submit & Close.'],
      knowledge: ['The auditor taps Menu.', 'The Knowledge Base is among the options.', 'The Knowledge Base opens.'],
      links: ['The instructions hold a link.'],
      gallery: ['The manager turns on Gallery View.', 'Every proof shows as a picture.'],
    }},
  },
  chunks: [
    {id: 'audits', title: 'Audits posted, guided and recorded', lines: ['intro', 'posted', 'guided', 'hazard'], showStep: {scene: 'guided', gap: 105}},
    {id: 'actions', title: 'Corrective actions and follow-up', lines: ['corrective', 'evidence', 'time', 'followup']},
    {id: 'training', title: 'Training, knowledge and evidence', lines: ['trainings', 'text', 'quiz', 'knowledge', 'links', 'gallery', 'conclusion'], lesson: {scene: 'quiz', topic: 'exits'}},
  ],
};
