// Powering Franchising (website Narration (October 14, 2026).docx, section "Powering Franchising", group Knowledge): the format is described at the top of live-oversight.mjs and dynamic-auditing.mjs.
// The art is components/sections/FranchisingStage.jsx, the product's own screens and pieces only (the user, 2026-10-20): the franchisor's marketplace in the web app (Riverside Bakery: its
// catalogs, bundles and missions), a franchisee importing its Operations and Training catalogs (Update once imported), one of its missions (the product's mission card) at three
// franchisees, its title retyped in the mission builder and updated at all of them, the Overview scrolling through the locations, a brand audit opened
// on the tablet with its video, and the Usage Report's Gallery View. "No Need To Update / Every Franchisee" is words only (`title`), as the narration says ("Words").
export default {
  id: 'powering-franchising',
  board: 'powering-franchising-v2',
  name: 'Powering Franchising',
  group: 'Knowledge',
  stage: 'powering-franchising',
  view: 'web',
  base: {view: 'web', imported: [], focus: null, pan: 0, step: 3, edit: 0, title: 0, scroll: 0, expand: 1, video: 0, gallery: false},
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'Simplifying Operation / Makes A Franchise / More Appealing To Own'},
    {id: 'market', name: 'The franchisor’s marketplace', words: 'Franchisors Are Given / A Dedicated Marketplace', view: 'web', art: {view: 'web', imported: []},
      marksLate: true, marks: [{target: 'filter-vendor'}, {target: 'catalogs'}]},
    {id: 'import', name: 'Franchisees import', words: 'Franchisees Can Import / Operational & Training Standards', view: 'web', art: {view: 'web', imported: []}, acts: [
      {target: 'import-ops', name: 'Import (Operations)', state: {imported: ['ops']}},
      {target: 'import-training', name: 'Import (Training)', state: {imported: ['ops', 'training']}},
    ], end: [{name: 'Main Street', state: {view: 'cards', step: 1, edit: 0}}, {name: 'Harbor Point', state: {step: 2}}, {name: 'Lakeside', state: {step: 3}}]},
    {id: 'edit', name: 'One edit for all', words: 'Editing In The Marketplace / Updates The Content For All', view: 'web', art: {view: 'builder', title: 0}, acts: [
      {target: 'field-title', name: 'the title', state: {title: 1}},
    ], end: [{name: 'updated at every franchisee', state: {view: 'cards', step: 3, edit: 2}}], marksAfter: true, marks: [{target: 'copy-main-title', pad: 8}, {target: 'copy-harbor-title', pad: 8}, {target: 'copy-lakeside-title', pad: 8}]},
    {id: 'noUpdate', name: 'No need to update each', title: true, words: 'No Need To Update / Every Franchisee'},
    {id: 'monitor', name: 'Live monitoring', words: 'Remotely Monitor / Execution Standards', view: 'web', art: {view: 'overview', scroll: 0}, end: {scroll: 1}},
    {id: 'audits', name: 'Brand audits on time', words: 'Ensure That Brand Audits / Are Performed On Time', view: 'tablet', art: {view: 'board'}, acts: [
      {target: 'card-audit-main', name: 'Main Street Brand Audit', state: {view: 'mission', expand: 0, video: 0}, then: [{name: 'the audit expands', state: {expand: 0.999}}]}, // (0.999: parts.jsx MissionPanel keeps an inset clip, which the video can move; at 1 it drops the clip and the expand jumps)
      {target: 'play-walk', name: 'the video', state: {video: 1}, then: [{name: 'the video plays', state: {video: 4}}]},
    ]},
    {id: 'gallery', name: 'Touring the evidence', words: 'Tour Visual Evidence / To Confirm Performance', view: 'web', art: {view: 'gallery', gallery: false}, acts: [
      {target: 'gallery-view', name: 'Gallery View', state: {gallery: true}},
    ]},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Simplify Franchise Ownership / And Maintain Constant Visibility / To Support Standards'},
  ],
  details: {
    marketplace: {scenes: {
      market: ['The franchisor has a marketplace of its own.', 'Its catalogs hold every standard.'],
      import: ['A franchisee imports the Operations catalog.', 'Then the Training catalog.', 'Main Street has it.', 'Harbor Point too.', 'And Lakeside.'],
      edit: ['The franchisor retypes the title once.', 'Every franchisee shows it.'],
    }, each: ['import']},
    oversight: {scenes: {
      monitor: ['The board scrolls through every location.'],
      audits: ['The auditor opens Main Street’s audit.', 'The audit expands.', 'The auditor plays its video.', 'The video plays.'],
      gallery: ['The manager turns on Gallery View.', 'Every proof shows as a picture.'],
    }, each: ['monitor']},
  },
  chunks: [
    {id: 'marketplace', title: 'The franchisor’s marketplace', lines: ['intro', 'market', 'import', 'edit', 'noUpdate']},
    {id: 'oversight', title: 'Watching every franchisee', lines: ['monitor', 'audits', 'gallery', 'conclusion']},
  ],
};
