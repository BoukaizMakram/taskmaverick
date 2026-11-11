// Requesting Support (website Narration (October 14, 2026).docx, section "Requesting Support"): the format is described at the top of live-oversight.mjs and dynamic-auditing.mjs.
// The art is components/sections/SupportStage.jsx: the tablet's On-Demand list, the request, its post to the team that answers, its escalation, claim and close; the QR code, the sign, the package,
// the phone that scans it, the form it opens and the live overview board.
export default {
  id: 'requesting-support',
  board: 'requesting-support-v2',
  name: 'Requesting Support',
  stage: 'requesting-support',
  view: 'tablet',
  base: {view: 'board', board: 'base', drawer: null, pick: null, typed: false, doc: 'none', flow: 'posted', flowStep: 0, expand: 1, panel: 'request', scan: 0, scroll: 0},
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'Requesting Any Type Of Support / Is As Easy As Pressing A Button'},
    {id: 'template', name: 'Selecting a template', words: 'A Request Can Be Made / By Selecting A Template', art: {view: 'board', board: 'base', drawer: null}, acts: [
      {target: 'add', name: 'Add', state: {drawer: 'demand'}},
      {target: 'demand-clean-room', name: 'Clean Room', state: {drawer: null, board: 'requested'}},
    ]},
    {id: 'describe', name: 'By text, photo or video', words: 'A Request Can Be Made / By Text, Photo, Or Video', view: 'mission', art: {view: 'board', board: 'requested', drawer: null}, acts: [
      {target: 'card-req', name: 'the request', state: {view: 'mission', panel: 'request', expand: 0, typed: false, doc: 'none'}, then: [{name: 'the request expands', state: {expand: 1}}]},
      {target: 'field-describe', name: 'Describe issue', state: {typed: true}},
      {target: 'yes-record', name: 'Yes', state: {doc: 'ask'}},
      {target: 'add-video-record', name: 'Add video', state: {doc: 'done'}},
    ]},
    {id: 'posted', name: 'Posted to the team', words: 'The Request Is Posted / To The Appropriate Team', view: 'flow', point: ['post', 'request'], art: {view: 'flow', flow: 'posted', flowStep: 0}, end: [{name: 'the post', state: {flowStep: 1}}]},
    {id: 'delays', name: 'Escalation alerts', words: 'Response Delays / Trigger Escalation Alerts', view: 'flow', point: ['escalation', 'post'], art: {view: 'flow', flow: 'aging', flowStep: 0}, end: [{name: 'orange', state: {flowStep: 1}}, {name: 'red', state: {flowStep: 2}}, {name: 'the escalation alert', state: {flowStep: 3}}]},
    {id: 'responder', name: 'Who is responding', words: 'The Person Responding Can Be Identified', point: ['card-clean'], art: {view: 'board', board: 'posted'}, end: [{name: 'claimed', state: {board: 'claimed'}}]},
    {id: 'tracked', name: 'The response time', words: 'The Response Time Is Tracked / Until The Request Is Fulfilled', art: {view: 'board', board: 'claimed'}, end: [{name: 'closed', state: {board: 'closed'}}], marksAfter: true, marks: [{target: 'card-clean-exec'}, {target: 'card-clean-who'}]},
    {id: 'qr', name: 'A QR code', words: 'Outsiders Can Make Requests / Via QR Code', view: 'qr', point: ['qr'], art: {view: 'qr'}},
    {id: 'placed', name: 'On signs and packages', words: 'QR Codes Can Be Placed / On Signs Or On Packages', view: 'placed', point: ['package', 'sign'], art: {view: 'placed'}},
    {id: 'scan', name: 'Scanning the code', words: 'Scanning The QR Code / Opens A Request Or Survey Form', view: 'phone', point: ['form', 'camera'], art: {view: 'phone', scan: 0}, end: [{name: 'the form', state: {scan: 1}}]},
    {id: 'dashboards', name: 'Live dashboards', words: 'All Requests And Resolutions / Can Be Tracked Live On Dashboards', view: 'web', art: {view: 'web', scroll: 0}, end: [{name: 'the board scrolls', state: {scroll: 1}}]},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Requests Are Seamlessly Made / And Traced To Provide Assurance'},
  ],
  details: {
    request: {scenes: {
      template: ['The user taps the plus.', 'The On-Demand list opens.', 'The user taps Clean Room.', 'The request is posted on the board.'],
      describe: ['The user opens the new request.', 'The request expands.', 'The user describes it.', 'Then taps Yes to record it.', 'A video is attached.'],
      posted: ['The request is posted.', 'It goes to the team that answers it.'],
    }},
    response: {scenes: {
      delays: ['A request nobody answers turns orange.', 'Then it turns red.', 'An escalation alert is raised.'],
      responder: ['The person who responds takes the request.', 'Their avatar shows on it.'],
      tracked: ['The request is closed.', 'Its execution time is kept.', 'So is who did it.'],
    }},
    outsiders: {scenes: {
      qr: ['Every request has a QR code.'],
      placed: ['The code goes on a sign.', 'Or on a package.'],
      scan: ['A visitor scans the code.', 'A form opens on the phone.'],
      dashboards: ['Every request shows on the live board.', 'So does every resolution.'],
    }},
  },
  chunks: [
    {id: 'request', title: 'Making the request', lines: ['intro', 'template', 'describe', 'posted']},
    {id: 'response', title: 'The response is tracked', lines: ['delays', 'responder', 'tracked']},
    {id: 'outsiders', title: 'Requests from outsiders', lines: ['qr', 'placed', 'scan', 'dashboards', 'conclusion']},
  ],
};
