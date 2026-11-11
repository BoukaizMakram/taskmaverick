// Live Oversight (the user, 2026-10-14: "work on all the other sections ... same as the Improved Quality videos"; the narration is website Narration (October 14, 2026).docx, section
// "Live Oversight"). A section is data: the words of each chapter (the narration, as written), the state its art is in, what is outlined, what the cursor presses and what that
// does to the art. scripts/capture-sections.mjs makes the board's frames from it (public/storyboard/live-oversight-v2.json), the director and the engine play them like every other board.
//
//   chapter  {id, name, words ('/' ends a line), art (state at the start), end (state at the end: the art goes there), marks [{target | col | head | rows+to}], acts [{target, name, state}], title, focus (what the page looks at while outlined: its outlines else)}
//   state    what the stage (components/sections/LiveOversightStage.jsx) draws; what a chapter says is added to the state before it
//   mark     a yellow outline: `target` is a data-iq-target of the stage, `col` a column of the table (header to the bottom of the visible table), `head` a column's title by itself,
//            `rows` + `to` the rows of the missions in a state, from the name to that column (lib/sections/rows.mjs)
//   act      the cursor presses `target`; the art goes to `state`
// The window shows 1110 px of a 1600 px page: `pan` says which (LEFT: the names; RIGHT: the sidebar and the report's table).
const LEFT = 0, RIGHT = 490, TABLE = 330, USAGE = 340; // (TABLE: the Data Board's statements, their first words not cut by the window's edge)
export default {
  id: 'live-oversight',
  board: 'live-oversight-v2',
  name: 'Live Oversight',
  stage: 'live-oversight',
  base: {full: false, page: 'overview', pan: LEFT, view: 'Running', scroll: 1, drawer: 0, viewer: null, groupBy: 'Unit', menu: 0, gallery: false, reportScroll: 0},
  chapters: [
    // The full board, with the words under it (the user, 2026-10-17: "add a video where we have the full board with the words under it, do it fast ... in videos first line first slide"): the whole overview page
    // in the upper part of the picture on the dark, the narration of the overview under it, an outline moving over the columns, each scene short (`layout: 'under'`, the video `full`).
    {id: 'fb-rhythm', name: 'The full board', layout: 'under', words: 'Feel The Business Rhythm', art: {full: true, page: 'overview', scroll: 1, pan: 0}},
    // the missions are outlined as ROWS, with their column's title (the CEO, 2026-10-20: "instead of being up like this, it would be horizontal"; the user, 2026-10-21: "highlight two things: open, then
    // claimed, then closed with the words on top"): the open ones from their name to Open, the claimed ones to Claimed, the closed ones to Closed At. Who performed and the duration stay columns, and
    // "Who Is Performing" is gone (the user, 2026-10-21: "it's the same thing as who performed each mission").
    {id: 'fb-aging', name: 'The full board: aging', layout: 'under', words: 'What Missions Are Aging', art: {full: true}, marks: [{rows: 'open', to: 'open'}, {head: 'open'}]},
    {id: 'fb-claimed', name: 'The full board: claimed', layout: 'under', words: 'What Missions Are Claimed', art: {full: true}, marks: [{rows: 'claimed', to: 'claimed'}, {head: 'claimed'}]},
    {id: 'fb-completed', name: 'The full board: completed', layout: 'under', words: 'What Missions Are Completed', art: {full: true}, marks: [{rows: 'closed', to: 'closed'}, {head: 'closed'}]},
    {id: 'fb-performed', name: 'The full board: performed', layout: 'under', words: 'Who Performed Each Mission', art: {full: true}, marks: [{col: 'by'}]},
    {id: 'fb-duration', name: 'The full board: duration', layout: 'under', words: 'The Execution Duration Per Mission', art: {full: true}, marks: [{col: 'duration'}]},
    {id: 'intro', name: 'The title', title: true, words: 'Remotely Monitor Operations / From Anywhere'},
    {id: 'rhythm', name: 'The overview board', words: 'Feel The Business Rhythm', art: {full: false, scroll: 0}, end: {scroll: 1}},
    {id: 'aging', name: 'What missions are aging', words: 'What Missions Are Aging', art: {pan: LEFT}, marks: [{rows: 'open', to: 'open'}, {head: 'open'}]},
    {id: 'claimed', name: 'What missions are claimed', words: 'What Missions Are Claimed', art: {pan: LEFT}, marks: [{rows: 'claimed', to: 'claimed'}, {head: 'claimed'}]},
    {id: 'completed', name: 'What missions are completed', words: 'What Missions Are Completed', art: {pan: LEFT}, marks: [{rows: 'closed', to: 'closed'}, {head: 'closed'}], focus: ['head:closed']}, // (the rows to Closed At are wider than the window: it looks at Closed At, the video shows the whole page)
    {id: 'performed', name: 'Who performed each mission', words: 'Who Performed Each Mission', art: {pan: RIGHT}, marks: [{col: 'by'}]},
    {id: 'duration', name: 'The execution duration', words: 'The Execution Duration Per Mission', art: {pan: RIGHT}, marks: [{col: 'duration'}]},
    {id: 'details', name: 'Review details per mission', words: 'Review Details Per Mission', art: {pan: LEFT}, acts: [{target: 'name-storage', name: 'the mission', state: {drawer: 1, pan: RIGHT}}]},
    {id: 'photos', name: 'Retrieve photos', words: 'Retrieve Photos', art: {pan: RIGHT, drawer: 1}, acts: [{target: 'file-photo', name: 'the photos', state: {viewer: {kind: 'photo', index: 0}}}, {target: 'viewer-next', name: 'next photo', state: {viewer: {kind: 'photo', index: 1}}}]},
    {id: 'videos', name: 'Play videos', words: 'Play Videos', art: {pan: RIGHT, drawer: 1, viewer: null}, acts: [{target: 'file-video', name: 'the video', state: {viewer: {kind: 'video', live: 6}}}]},
    {id: 'data', name: 'See what data was collected', words: 'See What Data Was Collected', art: {pan: RIGHT, drawer: 1, viewer: null}, marksSequence: true, marks: [{target: 'data-height', pad: 2}, {target: 'data-width', pad: 2}, {target: 'data-length', pad: 2}]},
    {id: 'dashboards', name: 'Live dashboards', words: 'Collected The Data In Live Dashboards', art: {pan: RIGHT, drawer: 1}, acts: [{target: 'nav-Reports', name: 'Reports', state: {page: 'data', drawer: 0, pan: TABLE}}], marksSequence: true, marks: [{target: 'stmt-height'}, {target: 'stmt-width'}, {target: 'stmt-length'}]},
    {id: 'anomalies', name: 'Anomalies are flagged', words: 'Anomalies Are Instantly Flagged / For Instant Correction', art: {page: 'data', pan: TABLE}, marks: [{target: 'anomaly-height'}, {target: 'anomaly-length'}]},
    // Performance history, then the search: on the History board itself, with a column's ⋮ menu (the user, 2026-10-20: "it's just the three dots on all of the boards ... it's like
    // the filter to search by whatever you want"; "in live oversight last video we should stay in history board and filter there"): the Name column's keyword, then the Closed By
    // column's People. The searches add up: the Storage Room Check runs, then the ones Emily Carter closed.
    {id: 'history', name: 'Performance history', words: 'Performance History Is Stored', art: {page: 'data', pan: RIGHT}, acts: [{target: 'nav-Overview', name: 'Overview', state: {page: 'overview', view: 'Running', scroll: 1, pan: RIGHT}}, {target: 'view-History', name: 'History', state: {view: 'History', scroll: 0}}]},
    {id: 'byMission', name: 'Search by mission', words: 'Search / By Mission', art: {page: 'overview', view: 'History', scroll: 0, pan: LEFT, colMenu: null, filter: null}, acts: [
      {target: 'dots-name', name: 'the Name column’s menu', state: {colMenu: {col: 'name'}}},
      {target: 'kw-name', name: 'Search By Keyword', state: {colMenu: {col: 'name', kw: 'Storage Room Check'}}},
      {target: 'apply-name', name: 'Apply', state: {colMenu: null, filter: {name: 'Storage Room Check'}}},
    ]},
    // by person is the toolbar's Group by, on History (the CEO, 2026-10-20: "group by, I would say ... you can do it by person with group by"; the user, 2026-10-21): the runs of the mission
    // searched for, under the person who closed each one
    {id: 'byPerson', name: 'By person', words: 'By Person', art: {page: 'overview', view: 'History', scroll: 0, pan: LEFT, colMenu: null, filter: {name: 'Storage Room Check'}, boardGroup: 'Unit', boardGroupMenu: false}, acts: [
      {target: 'board-group-by', name: 'Group by', state: {boardGroupMenu: true}},
      {target: 'board-group-Person', name: 'Person', state: {boardGroupMenu: false, boardGroup: 'Person'}},
    ]},
    // by checkpoint: History has none (the real board's columns); the checkpoints are in the report, where the gallery and the area's evolution are too (the user, 2026-10-20: "Report's Gallery View")
    {id: 'byCheckpoint', name: 'By checkpoint', words: 'By Checkpoint', art: {page: 'overview', view: 'History', scroll: 0, pan: LEFT, colMenu: null, filter: {name: 'Storage Room Check'}, boardGroup: 'Person'}, acts: [{target: 'nav-Reports', name: 'Reports', state: {page: 'usage', pan: USAGE, groupBy: 'Unit', menu: 0}}, {target: 'group-by', name: 'Group by', state: {menu: 1}}, {target: 'group-Checkpoint', name: 'Checkpoint', state: {menu: 0, groupBy: 'Checkpoint'}}]},
    {id: 'gallery', name: 'In gallery view', words: 'In Gallery View', art: {page: 'usage', pan: USAGE, groupBy: 'Checkpoint'}, acts: [{target: 'gallery-view', name: 'Gallery View', state: {gallery: true}}], marks: [{target: 'date-range'}]},
    {id: 'evolution', name: "An area's evolution", words: 'Managers Can Inspect / An Area’s Evolution Over Time', art: {page: 'usage', pan: USAGE, groupBy: 'Checkpoint', gallery: true, reportScroll: 0}, end: {reportScroll: 1}},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Remotely Monitor Trends / Audit Conditions / And Maintain Constant Visibility'},
  ],
  // The steps of each video's detailed twin (lib/storyboardDetails.mjs): what the manager does and finds, short; the words of the narration stay as they are.
  details: {
    board: {scenes: {rhythm: ['The board scrolls through every unit.']}, each: ['rhythm']},
    proofs: {scenes: {
      details: ['The manager clicks a mission.', 'Its details open at the right.'],
      photos: ['The manager clicks the photos.', 'The photo opens full screen. An arrow shows the next.', 'Every photo of the checkpoint is a click away.'],
      videos: ['The manager clicks the video.', 'It opens and plays.'],
      dashboards: ['The manager clicks Reports.', 'The Data Board lists every response.'],
    }},
    history: {scenes: {
      history: ['The manager clicks Overview.', 'Then History.', 'Every closed mission is stored.'],
      byMission: ['The manager opens the Name column’s menu.', 'Types the mission’s name.', 'Applies the filter.', 'Only that mission’s runs remain.'],
      byPerson: ['The manager opens Group by.', 'Picks Person.', 'The runs are grouped by person.'],
      byCheckpoint: ['The manager clicks Reports.', 'Then Group by.', 'Then Checkpoint.', 'Responses are grouped by checkpoint.'],
      gallery: ['The manager checks Gallery View.', 'Every proof shows as a picture.'],
    }},
  },
  // The videos of the section (the chunks): lines (chapters) in order
  chunks: [
    {id: 'full', title: 'The full board', noTwin: true, lines: ['fb-rhythm', 'fb-aging', 'fb-claimed', 'fb-completed', 'fb-performed', 'fb-duration'],
      beat: {seconds: 2.2, hold: 0.2, fade: 0.3}, profile: {tempo: 0.6, natural: 0.3, rest: 0.2}}, // (fast; the pen is the usual 30 letters a second)
    {id: 'board', title: 'The overview board', lines: ['intro', 'rhythm', 'aging', 'claimed', 'completed', 'performed', 'duration']},
    {id: 'proofs', title: 'Mission details, proofs and data', lines: ['details', 'photos', 'videos', 'data', 'dashboards', 'anomalies']},
    {id: 'history', title: 'Stored history', lines: ['history', 'byMission', 'byPerson', 'byCheckpoint', 'gallery', 'evolution', 'conclusion']},
  ],
};
