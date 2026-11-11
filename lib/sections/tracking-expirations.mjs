// Tracking Expirations (website Narration (October 14, 2026).docx, section "Tracking Expirations"): the format is described at the top of live-oversight.mjs and dynamic-auditing.mjs.
// The art is components/sections/ExpirationsStage.jsx: the board of food items with their timers (green, orange, red), the order they stand in, and the alert that goes out.
const PILLS = ['chicken', 'salmon', 'mozzarella', 'tomatoes', 'rice'].map(id => ({target: `card-${id}-pill`}));
export default {
  id: 'tracking-expirations',
  board: 'tracking-expirations-v2',
  name: 'Tracking Expirations',
  stage: 'tracking-expirations',
  view: 'tablet',
  base: {view: 'board', items: 5, phase: 0, flow: 'alert', flowStep: 0},
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'Expiration Tracking Can Be / Automated To Minimize Waste'},
    {id: 'posted', name: 'Items are posted', words: 'Items Are Automatically Posted / Upon Being Received Or Produced', point: ['card-rice', 'card-tomatoes', 'card-mozzarella', 'card-salmon', 'card-chicken'], art: {view: 'board', items: 0, phase: 0},
      end: [1, 2, 3, 4, 5].map(n => ({name: `item ${n}`, state: {items: n}}))},
    {id: 'timers', name: 'Each item has a timer', words: 'Each Item Has A Timer / Measuring Its Aging Duration', art: {view: 'board', items: 5, phase: 0}, marksLate: true, marksSequence: true, marks: PILLS},
    {id: 'nears', name: 'Green to orange', words: 'As The Item Nears Expiration / It Changes From Green To Orange', point: ['card-rice'], art: {view: 'board', items: 5, phase: 0}, end: [{name: 'the last item turns orange and rises', state: {phase: 1}}]},
    {id: 'cue', name: 'A visual cue', words: 'Teams Are Given A Visual Cue / That The Item Approached Expiration', art: {view: 'board', items: 5, phase: 1}, marksLate: true, marks: [{target: 'card-chicken-pill'}, {target: 'card-rice-pill'}]},
    {id: 'expired', name: 'Orange to red', words: 'Upon Reaching Expiration / It Changes From Orange To Red', point: ['card-rice'], art: {view: 'board', items: 5, phase: 1}, end: [{name: 'the item turns red and goes to the top', state: {phase: 2}}]},
    {id: 'alert', name: 'An alert', words: 'An Alert Can Be Automated / For Teams To Remove The Item', view: 'flow', point: ['alert', 'expired'], art: {view: 'flow', flow: 'alert', flowStep: 0}, end: [{name: 'the alert pops', state: {flowStep: 1}}]},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Expirations Are Automatically Tracked / No Time Is Wasted / On Manual Inspections'},
  ],
  details: {
    expiring: {scenes: {
      posted: ['Items arrive on the board.', 'Each one is posted as it is received.'],
      timers: ['Every item carries a timer.'],
      nears: ['A timer turns orange near expiration.', 'The item rises up the list.'],
      cue: ['The orange timers tell the team.'],
      expired: ['At expiration the timer turns red.', 'The item goes to the top.'],
      alert: ['The red timer raises an alert.', 'It tells the team to remove the item.'],
    }, each: ['posted']},
  },
  chunks: [
    {id: 'expiring', title: 'Items, timers and the expiration alert', lines: ['intro', 'posted', 'timers', 'nears', 'cue', 'expired', 'alert', 'conclusion']},
  ],
};
