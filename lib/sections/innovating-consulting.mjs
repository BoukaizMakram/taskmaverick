// Innovating Consulting (website Narration (October 14, 2026).docx, section "Innovating Consulting", group Knowledge): the format is described at the top of live-oversight.mjs and dynamic-auditing.mjs.
// The art is components/sections/ConsultingStage.jsx, the product's own screens and pieces only (the user, 2026-10-20), what is not the product drawn outside it: the consultant's marketplace
// (Summit Ops Consulting), its operational and training standards (the product's mission cards) going into a new catalog of it, the catalog open to a crowd and the revenue that comes from
// it (outside the product), one of its missions at three clients, its title retyped in the mission builder and updated at all of them, the Overview (Running, then History) scrolled, the Data Board opened level by level
// (Reporting & AI's art), a plain BI report of the program's value against its cost (outside the product: no Taskmaverick bar or tabs). The two "Words" lines are words only (`title`): "No Need To Update / Every Client" and the free support.
export default {
  id: 'innovating-consulting',
  board: 'innovating-consulting-v2',
  name: 'Innovating Consulting',
  group: 'Knowledge',
  stage: 'innovating-consulting',
  view: 'web',
  base: {view: 'web', added: false, focus: null, pan: 0, flow: 1, crowd: 0, dollars: 0, step: 3, edit: 0, title: 0, overview: 'Running', scroll: 0, level: 0, reportTo: 'top', chart: 1},
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'Consulting Strategies / Can Be Automated / To Generate Recurring Revenue'},
    {id: 'market', name: 'The consultant’s marketplace', words: 'Consultants Are Given / A Dedicated Marketplace', view: 'web', art: {view: 'web', added: false},
      marksLate: true, marks: [{target: 'filter-vendor'}, {target: 'catalogs'}]},
    {id: 'export', name: 'Exporting standards', words: 'Consultants Can Export / Operational & Training Standards', view: 'flow', art: {view: 'export', flow: 0},
      end: [{name: 'into a catalog', state: {flow: 1}}, {name: 'the new catalog in the marketplace', state: {view: 'web', added: true}}], marksAfter: true, marks: [{target: 'catalog-lean'}]},
    {id: 'public', name: 'Made public', words: 'A Consultant’s Marketplace / Can Be Made Public', view: 'flow', art: {view: 'masses', crowd: 0, dollars: 0},
      end: [{name: 'open to everyone', state: {crowd: 1}}]},
    {id: 'revenue', name: 'Revenue from mass adoption', words: 'A Consultant May Generate Revenue / From Mass Adoption', view: 'flow', art: {view: 'masses', crowd: 1, dollars: 0},
      end: [{name: 'the first sales', state: {dollars: 1}}, {name: 'the monthly revenue', state: {dollars: 2}}], marksAfter: true, marks: [{target: 'revenue'}]},
    {id: 'edit', name: 'One edit for all', words: 'Editing In The Marketplace / Updates The Content For All', view: 'web', art: {view: 'builder', title: 0}, acts: [
      {target: 'field-title', name: 'the title', state: {title: 1}},
    ], end: [{name: 'updated at every client', state: {view: 'cards', step: 3, edit: 2}}], marksAfter: true, marks: [{target: 'copy-harbor-title', pad: 8}, {target: 'copy-lakeside-title', pad: 8}, {target: 'copy-downtown-title', pad: 8}]},
    {id: 'noUpdate', name: 'No need to update each', title: true, words: 'No Need To Update / Every Client'},
    {id: 'monitor', name: 'Live monitoring', words: 'Remotely Monitor / Execution Standards', view: 'web', art: {view: 'overview', overview: 'Running', scroll: 0}, end: {scroll: 1}},
    {id: 'overview', name: 'Properly executed', words: 'Ensure That Consulting Strategies / Are Being Properly Executed', view: 'web', art: {view: 'overview', overview: 'History', scroll: 0}, end: {scroll: 1}},
    {id: 'reports', name: 'Detailed reports', words: 'Detailed Reports / Provide Progress Evidence / To Justify Contract Extensions', view: 'web', art: {view: 'overview', overview: 'History', scroll: 1}, acts: [
      {target: 'nav-Reports', name: 'Reports', state: {view: 'report', level: 0, reportTo: 'top'}},
    ], end: [{name: 'a unit', state: {level: 1, reportTo: 'unit-0'}}, {name: 'a team', state: {level: 2, reportTo: 'team-0'}}, {name: 'a person', state: {level: 3, reportTo: 'person-0'}}]},
    {id: 'value', name: 'Value against cost', words: 'Easily Demonstrate That / The Value Provided / Is Greater Than Its Cost', view: 'flow', art: {view: 'value', chart: 0}, end: [{name: 'value against cost', state: {chart: 1}}], marksAfter: true, marks: [{target: 'roi'}]},
    {id: 'support', name: 'Free support', title: true, words: 'Taskmaverick Provides Consultants / With Free Support / To Configure & Deploy The System'},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Increase Revenue / By Revisiting & Improving / Past Projects With / Taskmaverick Automation'},
  ],
  details: {
    marketplace: {scenes: {
      market: ['The consultant has a marketplace of its own.', 'Its catalogs hold its methods.'],
      export: ['Its operational and training standards are picked.', 'They go into one catalog.', 'The new catalog is in the marketplace.'],
      public: ['The catalog is open to everyone.', 'Anyone can import it.'],
      revenue: ['Businesses import it.', 'Revenue comes in every month.'],
      edit: ['The consultant retypes the title once.', 'Every client shows it.'],
    }, each: ['export', 'public', 'revenue']},
    evidence: {scenes: {
      monitor: ['The board scrolls through every location.'],
      overview: ['The history shows what was done.', 'By whom, and how long it took.'],
      reports: ['The manager clicks Reports.', 'The report opens a unit.', 'Then a team.', 'Then a person.'],
      value: ['The value is set against the cost.', 'The return is 4.4 times the cost.'],
    }, each: ['monitor', 'overview', 'reports', 'value']},
  },
  chunks: [
    {id: 'marketplace', title: 'The consultant’s marketplace', lines: ['intro', 'market', 'export', 'public', 'revenue', 'edit', 'noUpdate']},
    {id: 'evidence', title: 'Evidence that justifies the contract', lines: ['monitor', 'overview', 'reports', 'value', 'support', 'conclusion']},
  ],
};
