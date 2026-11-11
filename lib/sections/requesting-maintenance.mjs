// Requesting Maintenance (website Narration (October 14, 2026).docx, section "Requesting Maintenance"): the format is described at the top of live-oversight.mjs and dynamic-auditing.mjs.
// The art is components/sections/MaintenanceStage.jsx: the tablet board and its On-Demand list, the request by itself, the alert ticket (Isolated missions), the ticket opened, claimed and closed.
export default {
  id: 'requesting-maintenance',
  board: 'requesting-maintenance-v2',
  name: 'Requesting Maintenance',
  stage: 'requesting-maintenance',
  view: 'tablet',
  base: {view: 'board', board: 'base', drawer: null, pick: null, typed: false, doc: 'none', flow: 'alert', flowStep: 0, expand: 1, watch: 0, panel: 'request'},
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'Maintenance Requests Can Be Made / At A Press Of A Button'},
    {id: 'list', name: 'Selecting from a list', words: 'A Request Can Be Made / By Selecting From A List', art: {view: 'board', board: 'base', drawer: null}, acts: [
      {target: 'add', name: 'Add', state: {drawer: 'demand'}},
      {target: 'demand-maintenance-request', name: 'Maintenance Request', state: {drawer: null, pick: null, board: 'requested'}},
    ]},
    {id: 'document', name: 'Documenting the issue', words: 'Issues Can Be Documented / By Text, Photo, Or Video', view: 'mission', art: {view: 'board', board: 'requested', drawer: null}, acts: [
      {target: 'card-req', name: 'the request', state: {view: 'mission', panel: 'request', expand: 0, typed: false, doc: 'none'}, then: [{name: 'the request expands', state: {expand: 1}}]},
      {target: 'field-describe', name: 'Describe issue', state: {typed: true}},
      {target: 'yes-doc', name: 'Yes', state: {doc: 'ask'}},
      {target: 'add-video-doc', name: 'Add video', state: {doc: 'done'}},
    ]},
    {id: 'alert', name: 'An alert ticket', words: 'An Alert Ticket Is Triggered / To A Vendor Or To A Manager', view: 'flow', point: ['alert', 'request'], art: {view: 'flow', flow: 'alert', flowStep: 0}, end: [{name: 'the alert', state: {flowStep: 1}}]},
    {id: 'delays', name: 'Escalation alerts', words: 'Response Delays / Trigger Escalation Alerts', view: 'flow', point: ['escalation', 'alert'], art: {view: 'flow', flow: 'aging', flowStep: 0}, end: [{name: 'orange', state: {flowStep: 1}}, {name: 'red', state: {flowStep: 2}}, {name: 'the escalation alert', state: {flowStep: 3}}]},
    {id: 'evidence', name: 'The visual evidence', words: 'The Visual Evidence Is Included / Making It Easier To Respond Properly', art: {view: 'board', board: 'ticketed', drawer: null}, acts: [
      {target: 'card-ticket', name: 'the ticket', state: {view: 'mission', panel: 'ticket', expand: 0, watch: 0}, then: [{name: 'the ticket expands', state: {expand: 1}}]},
      {target: 'play-evidence', name: 'the video', state: {watch: 2}, then: [{name: 'the video plays', state: {watch: 4}}]},
    ]},
    {id: 'responder', name: 'Who is responding', words: 'The Person Responding Can Be Identified', point: ['card-ticket'], art: {view: 'board', board: 'ticketed'}, end: [{name: 'claimed', state: {board: 'claimed'}}]},
    {id: 'tracked', name: 'The response time', words: 'The Response Time Is Tracked / Until A Resolution Is Confirmed', art: {view: 'board', board: 'claimed'}, end: [{name: 'closed', state: {board: 'closed'}}], marksAfter: true, marks: [{target: 'card-ticket-exec'}, {target: 'card-ticket-who'}]},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Requests Can Be Made Seamlessly / From Taskmaverick While People Work'},
  ],
  details: {
    request: {scenes: {
      list: ['The user taps the plus.', 'The On-Demand list opens.', 'The user taps Maintenance Request.', 'The request is posted on the board.'],
      document: ['The user opens the new request.', 'The request expands.', 'The user describes the issue.', 'Then taps Yes to document it.', 'A video is attached.'],
    }},
    ticket: {scenes: {
      alert: ['The request raises an alert ticket.', 'It goes to a vendor or a manager.'],
      delays: ['A ticket nobody answers turns orange.', 'Then it turns red.', 'An escalation alert is raised.'],
      evidence: ['The ticket opens.', 'The video of the issue is attached.', 'The video plays.'],
      responder: ['The person who responds takes the ticket.', 'Their avatar shows on it.'],
      tracked: ['The ticket is closed.', 'Its execution time is kept.', 'So is who did it.'],
    }},
  },
  chunks: [
    {id: 'request', title: 'Making the request', lines: ['intro', 'list', 'document']},
    {id: 'ticket', title: 'The ticket, its evidence and its response', lines: ['alert', 'delays', 'evidence', 'responder', 'tracked', 'conclusion']},
  ],
};
