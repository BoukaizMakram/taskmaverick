// Content Adaptation (website Narration (October 14, 2026).docx, section "Content Adaptation", group Knowledge): the format is described at the top of live-oversight.mjs and dynamic-auditing.mjs.
// The art is components/sections/AdaptationStage.jsx, the product's own screens and pieces only (the user, 2026-10-20), what is not the product drawn outside it: the library's Meal & Rest
// Breaks mission (the product's mission card) scheduled in California and in Texas (their outlines, a schedule in each one's time zone), the mission opened in Texas, then in California
// (Mission Details), its guide written line by line as that state's law has it, and the web app's Units page (tm/47-units.png): the locations' State, then County, then City columns
// outlined as the three lines of the words come.
// The narration has no closing words of its own: its last sentence ("Content Is Automatically Adapted / To Laws, Rules & Regulations / By State, County, And City") is said over the Units
// page, then shown again as the closing title (white on the dark), the way every board ends.
const MAP = {view: 'map', step: 2, sched: 2};
const open = (id, name) => ({target: `copy-${id}`, name, state: {view: 'mission', juris: id, expand: 0, write: 0}, then: [{name: 'the mission expands', state: {expand: 0.999}}]}); // (0.999: parts.jsx MissionPanel keeps an inset clip, which the video can move; at 1 it drops the clip and the expand jumps)
const write = [{name: 'the first rule', state: {write: 1}}, {name: 'the second rule', state: {write: 2}}, {name: 'the third rule', state: {write: 3}}];
export default {
  id: 'content-adaptation',
  board: 'content-adaptation-v2',
  name: 'Content Adaptation',
  group: 'Knowledge',
  stage: 'content-adaptation',
  view: 'flow',
  base: {view: 'map', step: 2, sched: 2, juris: 'tx', expand: 1, write: 3, focus: null, pan: 0},
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'Mission Content / Automatically Adapts / To Local Jurisdictions'},
    {id: 'states', name: 'One mission, two states', words: 'The Same Mission / Can Be Scheduled / In Two States (CA & TX)', view: 'flow', art: {view: 'map', step: 0, sched: 0},
      end: [{name: 'California', state: {step: 1, sched: 1}}, {name: 'Texas', state: {step: 2, sched: 2}}], marksAfter: true, marks: [{target: 'sched-ca'}, {target: 'sched-tx'}]},
    {id: 'texas', name: 'The Texas content', words: 'In Texas It Shows / Texas Compliant Content', view: 'flow', art: MAP, acts: [open('tx', 'Meal & Rest Breaks in Texas')], end: write},
    {id: 'california', name: 'The California content', words: 'In California It Shows / California Compliant Content', view: 'flow', art: MAP, acts: [open('ca', 'Meal & Rest Breaks in California')], end: write},
    {id: 'tree', name: 'State, county and city', words: 'Content Is Automatically Adapted / To Laws, Rules & Regulations / By State, County, And City', view: 'web', art: {view: 'web'},
      marksLate: true, marks: [{col: 'state'}, {col: 'county'}, {col: 'city'}]},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Content Is Automatically Adapted / To Laws, Rules & Regulations / By State, County, And City'},
  ],
  details: {
    adapts: {scenes: {
      states: ['The mission goes to California.', 'And to Texas.', 'Each on a schedule of its own.'],
      texas: ['The user opens it in Texas.', 'The mission expands.', 'Its guide follows Texas law.', 'Rule by rule.'],
      california: ['The user opens it in California.', 'The mission expands.', 'Its guide follows California law.', 'Rule by rule.'],
      tree: ['Every location has its state.', 'Its county.', 'And its city.'],
    }, each: ['states', 'tree']},
  },
  chunks: [
    {id: 'adapts', title: 'One mission, adapted to every jurisdiction', lines: ['intro', 'states', 'texas', 'california', 'tree', 'conclusion']},
  ],
};
