// Replenishing Inventory (website Narration (October 14, 2026).docx, section "Replenishing Inventory"): the format is described at the top of live-oversight.mjs and dynamic-auditing.mjs.
// The art is components/sections/InventoryStage.jsx: the board where the inventory check is posted and the replenishment ordered, the check with its counts, the replenishment with its
// count and its photo, the aging card with its escalation (Isolated missions), the photos on a tablet and in the web gallery.
export default {
  id: 'replenishing-inventory',
  board: 'replenishing-inventory-v2',
  name: 'Replenishing Inventory',
  stage: 'replenishing-inventory',
  view: 'tablet',
  base: {view: 'board', board: 'base', panel: 'check', counts: 0, expand: 1, count: null, photo: 'none', flow: 'aging', flowStep: 0, scroll: 0, gallery: true, scrollTo: 'top'},
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'Inventory Audits Automatically / Trigger Follow-Up Actions / For Replenishment'},
    {id: 'posted', name: 'The audit is posted', words: 'Inventory Audits Can Be Automatically Posted', point: ['card-check'], art: {view: 'board', board: 'base'}, end: [{name: 'the Inventory Check', state: {board: 'posted'}}]},
    {id: 'data', name: 'Data is collected', words: 'Data Is Collected / On Available Items', point: ['cp-item-C', 'cp-item-B', 'cp-item-A'], view: 'mission', art: {view: 'mission', panel: 'check', counts: 0, scrollTo: 'top', expand: 1}, end: [
      {name: 'Item-A', state: {counts: 1}}, {name: 'Item-B', state: {counts: 2, scrollTo: 'cp-item-B'}}, {name: 'Item-C is below par', state: {counts: 3, scrollTo: 'cp-item-C'}}]},
    {id: 'order', name: 'Orders are triggered', words: 'When Counts Are Below Par / Orders Are Automatically Triggered', art: {view: 'board', board: 'checked'}, before: [{name: 'Replenish Item-C', state: {board: 'ordered'}}], acts: [
      {target: 'card-replenish', name: 'Replenish Item-C', state: {view: 'mission', panel: 'replenish', expand: 0, count: null, photo: 'none'}, then: [{name: 'the mission expands', state: {expand: 1}}]},
    ]},
    {id: 'delays', name: 'Escalation alerts', words: 'Delays In Ordering / Trigger Escalation Alerts', view: 'flow', point: ['escalation', 'replenish'], art: {view: 'flow', flow: 'aging', flowStep: 0}, end: [{name: 'orange', state: {flowStep: 1}}, {name: 'red', state: {flowStep: 2}}, {name: 'the escalation alert', state: {flowStep: 3}}]},
    {id: 'evidence', name: 'Visual evidence', words: 'Visual Evidence Is Collected / To Prove The Replenishment', view: 'mission', art: {view: 'mission', panel: 'replenish', count: null, photo: 'none', expand: 1, scrollTo: 'top'}, acts: [
      {target: 'field-count', name: 'the count', state: {count: 30}},
      {target: 'add-photo-shelf', name: 'Add photo', state: {photo: 'done', scrollTo: 'cp-shelf'}},
    ]},
    {id: 'tablet', name: 'From a mobile device', words: 'Remotely Perform Visual Inspections / From A Mobile Device', view: 'proofs', art: {view: 'proofs', scroll: 0}, end: [{name: 'the photos scroll', state: {scroll: 1}}]},
    {id: 'web', name: 'Or from the web', words: 'Or From The Web', view: 'web', art: {view: 'web', gallery: true, scroll: 0}, end: [{name: 'the gallery scrolls', state: {scroll: 1}}]},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Timely Replenishments Prevent Losses / Due To Poorly-Stocked Displays'},
  ],
  details: {
    audit: {scenes: {
      posted: ['The inventory check is posted.', 'It arrives on its own when it is due.'],
      data: ['The count of Item-A is entered.', 'Then the count of Item-B.', 'Item-C is below par.'],
      order: ['An order mission is triggered.', 'The user opens Replenish Item-C.', 'The mission expands.'],
      delays: ['An order nobody places turns orange.', 'Then it turns red.', 'An escalation alert is raised.'],
    }, each: ['data']},
    evidence: {scenes: {
      evidence: ['The user enters the new count.', 'Then adds a photo of the shelf.'],
      tablet: ['A manager scrolls the photos on a tablet.'],
      web: ['Or scrolls them on the web.'],
    }},
  },
  chunks: [
    {id: 'audit', title: 'The audit, its counts and the order', lines: ['intro', 'posted', 'data', 'order', 'delays']},
    {id: 'evidence', title: 'The replenishment and its proof', lines: ['evidence', 'tablet', 'web', 'conclusion']},
  ],
};
