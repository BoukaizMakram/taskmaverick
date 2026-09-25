// Editorial inventory for the Improved Quality video. References are local-only.
export const QUALITY_ASSETS = [
  {id:'board',title:'Mission board',group:'Missions',shot:'Opening',kind:'existing',icon:'team',note:'Original mission chips and board layout, with frozen timers.',refs:['tablet-missions','mobile-missions']},
  {id:'opened',title:'Mission opened',group:'Missions',shot:'01–05',kind:'existing',icon:'file',note:'Instructions, warning and mission summary. Uses OpenedMission.',refs:['tablet-mission-opened']},
  {id:'checklist',title:'Checklist expanded',group:'Missions',shot:'07',kind:'existing',icon:'file',note:'Existing checklist groups and numeric entries.',refs:['tablet-checklist','mobile-checklist']},
  {id:'translate',title:'Instant translation',group:'Guidance',shot:'06',kind:'new',icon:'book',note:'English and Spanish demo states. Live translation reference still needed.',states:['English','Español']},
  {id:'steps',title:'Step-by-step execution',group:'Guidance',shot:'07',kind:'new',icon:'process',note:'Three sequential Yes checkpoints, followed by the training step.',states:['Step 1','Step 2','Step 3','Step 4']},
  {id:'training',title:'Micro-training list',group:'Guidance',shot:'08',kind:'existing',icon:'course',note:'Existing media playlist and local training video.',refs:['mobile-training-list']},
  {id:'lesson',title:'Training player',group:'Guidance',shot:'08',kind:'new',icon:'course',note:'Reusable local video player. Text lesson reference captured from live app.',refs:['tablet-training-lesson'],states:['Video','Text']},
  {id:'quiz',title:'Required quiz',group:'Guidance',shot:'09',kind:'new',icon:'file',note:'Quiz layout follows the captured live mission. Answers stay local.',refs:['mobile-quiz','tablet-quiz'],states:['Unanswered','Answer selected','Passed']},
  {id:'photo',title:'Photo checkpoint',group:'Evidence',shot:'10–11',kind:'new',icon:'image',note:'Capture and review states. Add the shelving photo before recording.',states:['Capture','Captured','Zoom'],needsMedia:true},
  {id:'video',title:'Video checkpoint',group:'Evidence',shot:'10, 12',kind:'new',icon:'image',note:'Capture and playback states. Add the broken-item video before recording.',states:['Capture','Captured','Playback'],needsMedia:true},
  {id:'closed',title:'Closed missions',group:'Accountability',shot:'13',kind:'existing',icon:'clock',note:'Original closed mission chips and frozen timers.'},
  {id:'self-rating',title:'Self-rating',group:'Accountability',shot:'14',kind:'new',icon:'like',note:'Local rating states; live populated rating reference still needed.',states:['Unrated','Rated']},
  {id:'peer-rating',title:'Peer ratings',group:'Accountability',shot:'15',kind:'new',icon:'like',note:'Two colleagues rate in sequence. Demo data; live reference still needed.',states:['First person','Second person']},
  {id:'menu',title:'Manager menu',group:'Visibility',shot:'16–17',kind:'existing',icon:'team',note:'Reuses BoardMenu icons. Business Media is a demo navigation addition.',refs:['tablet-team-menu']},
  {id:'business-media',title:'Business Media feed',group:'Visibility',shot:'18, 20',kind:'new',icon:'image',note:'Scrollable photo/video evidence with names and timestamps. Live populated feed still needed.',needsMedia:true},
  {id:'gallery',title:'Evidence gallery',group:'Visibility',shot:'19–20',kind:'new',icon:'image',note:'Filterable gallery, available in mobile and tablet layouts. Live gallery reference still needed.',needsMedia:true},
  {id:'performed-by',title:'Who performed it',group:'Visibility',shot:'21',kind:'new',icon:'person',note:'Evidence detail with performer emphasis.',needsMedia:true},
  {id:'timestamp',title:'Exact date & time',group:'Visibility',shot:'22',kind:'new',icon:'calendar',note:'Evidence detail with capture timestamp emphasis.',needsMedia:true},
];
export const assetById = id => QUALITY_ASSETS.find(asset => asset.id === id) || QUALITY_ASSETS[0];
