// ---------------------------------------------------------------------------
// Web app (/running) fixtures for the sections beyond Overview: Missions
// (Library, Marketplace, mission builder, processes), Reports and Dashboards.
// Recreated from the product demo recording with generic names. No live API.
// ---------------------------------------------------------------------------

const IMG = '/industries/media/';
export const CATALOG_IMAGES = {
  qsr: `${IMG}industry_restaurant_1774643347669.webp`,
  culture: `${IMG}delivery-philosophy_thumb_1779911016810.webp`,
  demo: `${IMG}delivery-management_thumb_1779911006717.webp`,
  clinics: `${IMG}healthcare-healthcare-nursing-management_thumb_1778795919382.webp`,
  plant: `${IMG}industry_manufacturing_1774643344129.webp`,
  security: `${IMG}industry_security_1774643345185.webp`,
  retail: `${IMG}industry_retail_1774643551920.webp`,
};

// ---- Missions · Library -------------------------------------------------------
const m = (title, type, extra = {}) => ({ title, type, guide: true, alert: false, team: [], process: '', course: '', category: 'Operations', tag: [], ...extra });
export const LIBRARY = [
  m('Parking Lot Check', 'Survey', { alert: true, team: ['Team F', 'Team A', '+6'], process: 'TM Test Audit', category: 'Operations', tag: ['Demo', 'Parking Lot'] }),
  m('Safety Audit', 'Audit', { alert: true, category: 'Automotive', tag: ['Manufacturing'] }),
  { folder: true, title: 'Personal Board Missions', count: 9, category: 'Personal Board', tag: ['Demo'], status: 'Active', children: [
    m('Punctuality', 'Media', { category: 'HR', tag: ['Attendance'] }), m('Discrimination Survey', 'Survey', { alert: true, category: 'HR', tag: ['Risk'] }),
    m('HR Competency', 'Test', { category: 'HR', tag: ['Onboarding'] }), m('Office Attire', 'Media', { category: 'HR', tag: ['Dress Code'] }),
  ] },
  m('Discrimination Policy', 'Media', { process: 'PB - Other PB', category: 'HR', tag: ['Discrimination', '+4'] }),
  m('Administrative & Planning', 'Checklist', { team: ['Property Managem…'], category: 'Operations', tag: ['Admin'] }),
  m('Mechanical Systems & Safety', 'Checklist', { team: ['Property Managem…'], category: 'Operations', tag: ['Admin'] }),
  m('Resident Service', 'Checklist', { team: ['Property Managem…'], category: 'Compliance', tag: ['Admin'] }),
  m('Health Inspection Audit', 'Checklist', { alert: true, team: ['Team A', 'Team D', '+2'], category: 'Compliance', tag: ['Web Video'] }),
  m('Lobby Restroom Clean', 'Checklist', { alert: true, team: ['Housekeeping'], category: 'Operations', tag: ['Hotel'] }),
  m('Room Clean Training', 'Media', { category: 'Operations', tag: ['Hotel'] }),
  { folder: true, title: 'Shallow Sports', count: 14, category: 'Operations', tag: ['Manufacturing'], status: 'Active', children: [
    m('Line 2 Changeover', 'Checklist', { category: 'Operations', tag: ['Manufacturing'] }), m('Seam Inspection', 'Checklist', { alert: true, category: 'Quality', tag: ['Manufacturing'] }),
  ] },
  m('Break 30-Min', 'Task', { alert: true, team: ['Team C', 'Picking', '+2'], process: 'Breaks', category: 'HR', tag: ['Breaks'] }),
  m('Break 10-Min', 'Task', { alert: true, team: ['Team C', 'Picking', '+2'], process: 'Breaks', category: 'HR', tag: ['Breaks'] }),
  m('BWC Check', 'Task', { alert: true, team: ['Police'], category: 'Operations', tag: ['Police'] }),
  m('Appointment Confirmation', 'Task', { team: ['Police'], process: 'Training Police', category: 'Training', tag: ['Police'] }),
  { folder: true, title: 'Recipe Observation', count: 56, category: 'Training', tag: ['Recipes', 'Training'], status: 'Active', children: [
    m('Raspberry Vinaigrette Dressing', 'Checklist', { category: 'Training', tag: ['Recipes'] }), m('Chimichurri Sauce', 'Checklist', { category: 'Training', tag: ['Recipes'] }),
  ] },
  { folder: true, title: 'Outside Duties', count: 12, category: 'Operations', tag: ['Attendance'], status: 'Active', children: [m('Patio Sweep', 'Task'), m('Parking Lot Trash', 'Task')] },
  { folder: true, title: 'Training', count: 206, category: 'Training', tag: ['Training'], status: 'Active', children: [m('Pizza Boxing', 'Media', { category: 'Training' }), m('Brewing Coffee - Training', 'Media', { category: 'Training' }), m('Knife Safety', 'Media', { category: 'Training' })] },
  { folder: true, title: 'Human Resources', count: 48, category: 'HR', tag: ['HR'], status: 'Active', children: [m('Gift Policy', 'Media', { category: 'HR' }), m('Break Policy', 'Media', { category: 'HR' })] },
  { folder: true, title: 'Operations', count: 632, category: 'Operations', tag: ['Register'], status: 'Active', children: [
    m('Store Counters', 'Media', { category: 'Operations', tag: ['Training'] }), m('Order Received', 'Checklist', { alert: true, team: ['Deliveries', '+1'], category: 'Operations', tag: ['Inventory', '+1'] }),
    m('Table Run', 'Checklist', { team: ['Test', 'Register'], category: 'Operations', tag: ['Register'] }), m('Items Ordered', 'Checklist', { alert: true, team: ['Deliveries', '+1'], category: 'Operations', tag: ['Inventory'] }),
    m('Backup System Setup', 'Survey', { alert: true, category: 'Operations', tag: ['Training'] }), m('Kitchen Temp', 'Survey', { alert: true, team: ['Kitchen'], category: 'Operations', tag: ['Temperature'] }),
    m('Fry Dispenser Cleaning', 'Checklist', { alert: true, team: ['Team A'], category: 'Operations', tag: ['Maintenance'] }), m('Electronics Inventory', 'Checklist', { team: ['Register'], category: 'Operations', tag: ['Inventory'] }),
  ] },
  { folder: true, title: 'Created From Mobile', count: 1, category: 'Mobile', tag: ['Mobile'], status: 'Active', children: [m('Spill Clean-Up Needed', 'Task', { category: 'Mobile' })] },
];
export const LIBRARY_TOTAL = 606;
export const TEAMS_VIEW = [
  { team: 'L001 - Sweet Beverly - Team A', missions: ['Refresh Restroom', 'Brew Coffee', 'Sanitize Surfaces', 'Maintain Trash Bags', 'Fry Dispenser Cleaning', 'Spill Clean', 'Maintenance Check', 'Health Department Audit'] },
  { team: 'L001 - Sweet Beverly - Kitchen', missions: ['10-Min Break AM', 'Kitchen Temp', 'Station Inventory', 'Food Labels', 'Protein Prep Salmon'] },
  { team: 'L001 - Sweet Beverly - Register', missions: ['10-Min Break AM', 'Rest Breaks AM', 'Electronics Inventory', 'Utensils Restock', 'Table Run'] },
  { team: 'P001 - Riverside Plant - QC Line Inspections', missions: ['L4 - Line Inspection', 'L3 - Chunk Line Inspection', 'L4 - Metal Detector', 'Texture Analyzer Verification'] },
];
export const TICKETS_VIEW = [
  { title: 'Maintenance Alert', board: 'Maintenance Tickets', source: 'Fry Dispenser Cleaning · Maintenance Check', trigger: 'Answer "No"' },
  { title: 'Discrimination Alert', board: 'Human Resources Tickets', source: 'Discrimination Survey', trigger: 'Answer "Yes"' },
  { title: 'Management Alert', board: 'Security Tickets', source: 'Loneworker Request', trigger: 'Open beyond 00:12' },
  { title: 'Out of Range', board: 'QC Tickets', source: 'L3 - Chunk Line Inspection', trigger: 'Value outside target' },
  { title: 'Expired Stock Alert', board: 'Micro Lab Tickets', source: 'Petrifilm Control Setup', trigger: 'Answer "Yes"' },
];
export const COURSES = [
  { title: 'New Hire Onboarding', steps: ['Company Culture', 'Punctuality', 'Office Attire', 'HR Competency'], enrolled: 12 },
  { title: 'Food Safety Basics', steps: ['Hand Washing', 'Temperature Control', 'Allergen Awareness'], enrolled: 31 },
  { title: 'Security Patrol Certification', steps: ['Patrol Routes', 'Geofenced Checkpoints', 'Incident Reports'], enrolled: 8 },
];

// ---- Missions · Processes (event-driven automations) --------------------------
export const PROCESSES = [
  { id: 'kitting', name: 'Econocore - Kitting', tag: 'Kitting', category: 'Production', version: 'v3.12', levels: 18 },
  { id: 'microlab', name: 'Micro Lab - Positive Controls', tag: 'Lab', category: 'Quality', version: 'v2.4', levels: 6 },
  { id: 'patrol', name: 'Night Patrol Rounds', tag: 'Security', category: 'Operations', version: 'v1.9', levels: 5 },
  { id: 'reactive', name: 'Reactive Training', tag: 'HR', category: 'Training', version: 'v1.2', levels: 3 },
];
// A small flow: trigger → checklist → yes/no condition → branches (Figma-like canvas).
export const PROCESS_FLOW = {
  kitting: {
    nodes: [
      { id: 't', kind: 'trigger', x: 30, y: 40, title: 'Trigger', sub: 'Every day at 06:00 AM' },
      { id: 'a', kind: 'mission', x: 250, y: 30, type: 'Checklist', title: 'Econocore (Pallets)', sub: 'Unit From Trigger / Team From Trigger', level: 1 },
      { id: 'c1', kind: 'condition', x: 250, y: 190, title: 'Statement Condition', sub: 'Do you need to record more pallets?', answer: 'Yes', level: 2 },
      { id: 'c2', kind: 'condition', x: 560, y: 190, title: 'Statement Condition', sub: 'Do you need to record more pallets?', answer: 'No', level: 2 },
      { id: 'b', kind: 'mission', x: 250, y: 350, type: 'Checklist', title: 'Econocore (Pallets)', sub: 'Unit From Trigger / Team From Trigger', level: 3 },
      { id: 'f', kind: 'mission', x: 560, y: 350, type: 'Checklist', title: 'Econocore (Final)', sub: 'Unit From Trigger / Team From Trigger', level: 3 },
      { id: 'c3', kind: 'condition', x: 250, y: 510, title: 'Statement Condition', sub: 'Do you need to record more pallets?', answer: 'Yes', level: 4 },
      { id: 'c4', kind: 'condition', x: 560, y: 510, title: 'Statement Condition', sub: 'Do you need to record more pallets?', answer: 'No', level: 4 },
      { id: 't1', kind: 'ticket', x: 870, y: 350, title: 'QC Ticket', sub: 'Ticket Board: QC Tickets', level: 3 },
    ],
    edges: [['t', 'a'], ['a', 'c1'], ['a', 'c2'], ['c1', 'b'], ['c2', 'f'], ['f', 't1'], ['b', 'c3'], ['b', 'c4']],
  },
  microlab: {
    nodes: [
      { id: 't', kind: 'trigger', x: 30, y: 40, title: 'Trigger', sub: 'Sample Collected (Checklist closed)' },
      { id: 'a', kind: 'mission', x: 250, y: 30, type: 'Checklist', title: 'Petrifilm Control Setup', sub: 'Micro Lab / Lab Team', level: 1 },
      { id: 'd', kind: 'delay', x: 250, y: 190, title: 'Delay', sub: 'Wait 24 hours', level: 2 },
      { id: 'b', kind: 'mission', x: 250, y: 330, type: 'Checklist', title: 'Read Positive Controls', sub: 'Micro Lab / Lab Team', level: 3 },
      { id: 'c', kind: 'condition', x: 560, y: 330, title: 'Statement Condition', sub: 'Is any control expired?', answer: 'Yes', level: 3 },
      { id: 'k', kind: 'ticket', x: 560, y: 480, title: 'Expired Stock Alert', sub: 'Ticket Board: Lab Manager', level: 4 },
    ],
    edges: [['t', 'a'], ['a', 'd'], ['d', 'b'], ['b', 'c'], ['c', 'k']],
  },
  patrol: {
    nodes: [
      { id: 't', kind: 'trigger', x: 30, y: 40, title: 'Trigger', sub: 'Every 30 minutes, 10 PM – 6 AM' },
      { id: 'a', kind: 'mission', x: 250, y: 30, type: 'Task', title: 'Patrol Parking Garage', sub: 'Geofenced photo required', level: 1 },
      { id: 'b', kind: 'mission', x: 250, y: 190, type: 'Task', title: 'Patrol Interior Stairwells', sub: 'Geofenced photo required', level: 2 },
      { id: 'c', kind: 'condition', x: 560, y: 110, title: 'Timer Rule', sub: 'Not claimed within 5 minutes', answer: 'Yes', level: 2 },
      { id: 'k', kind: 'ticket', x: 560, y: 270, title: 'Management Alert', sub: 'Guard not responding', level: 3 },
    ],
    edges: [['t', 'a'], ['a', 'b'], ['a', 'c'], ['c', 'k']],
  },
  reactive: {
    nodes: [
      { id: 't', kind: 'trigger', x: 30, y: 40, title: 'Trigger', sub: 'HR Competency test closed' },
      { id: 'c', kind: 'condition', x: 250, y: 30, title: 'Score Condition', sub: 'Score below 70%?', answer: 'Yes', level: 1 },
      { id: 'a', kind: 'mission', x: 250, y: 190, type: 'Media', title: 'Missed topics (Media)', sub: 'Assigned to Personal Board', level: 2 },
      { id: 'b', kind: 'mission', x: 560, y: 190, type: 'Test', title: 'HR Competency (retake)', sub: 'Scheduled in 7 days', level: 2 },
    ],
    edges: [['t', 'c'], ['c', 'a'], ['a', 'b']],
  },
};

// ---- Missions · Marketplace ------------------------------------------------------------
export const CATALOGS = [
  { id: 'qsr', name: 'QSR Generic Library', missions: 163, img: CATALOG_IMAGES.qsr, text: 'This is a library that covers general quick-service restaurant standards: food safety, cleaning, breaks and opening / closing.' },
  { id: 'culture', name: 'Culture', missions: 42, img: CATALOG_IMAGES.culture, text: 'This is a library that covers general company culture: punctuality, attire, respect and teamwork micro-trainings.' },
  { id: 'demo', name: 'Demo', missions: 58, img: CATALOG_IMAGES.demo, text: 'This is a library that covers the demo missions used in Taskmaverick presentations.' },
  { id: 'plant', name: 'Food Plant QC', missions: 96, img: CATALOG_IMAGES.plant, text: 'Line inspections, metal detectors, allergen changeovers and micro-lab processes.' },
  { id: 'security', name: 'Security Patrols', missions: 37, img: CATALOG_IMAGES.security, text: 'Geofenced patrol checkpoints, lone-worker requests and shift clock-ins.' },
  { id: 'retail', name: 'Retail Operations', missions: 71, img: CATALOG_IMAGES.retail, text: 'Opening, closing, merchandising and inventory counts for stores.' },
];
export const BUNDLES = [
  { id: 'clinics', name: 'Medical Clinics', by: 'Taskmaverick Medical', missions: 11, img: CATALOG_IMAGES.clinics, text: 'Taskmaverick Medical Clinics bundle: room maintenance, nurse requests, medication expiration.' },
];
const q = (n, title, media, questions, imported = false) => ({ n, title, media, questions, imported });
export const CATALOG_MISSIONS = [
  q(1, 'Beverage Station Clean', '1 Image', 4), q(2, 'Bathroom Check', '2 Image · 1 Text', 6, true), q(3, 'Bin Liner Change', '', 2),
  q(4, 'Brewing Coffee - Training', '1 Video', 3), q(5, 'Cash Drawer Count', '', 5), q(6, 'Cooler Temp Log', '4 Image', 4, true),
  q(7, 'Dining Room Sweep', '', 3), q(8, 'Drive-Thru Headset Check', '1 Text', 2), q(9, 'Fryer Oil Test', '2 Image', 4),
  q(10, 'Grill Cleaning', '3 Image', 5), q(11, 'Hand Sink Check', '', 3, true), q(12, 'Ice Machine Clean', '2 Image', 4),
  q(13, 'Breading Table Temp', '', 6), q(14, 'Break Area Surfaces Clean', '2 Image · 2 Text', 2), q(15, 'Break Policy', '1 Text', 1),
  q(16, 'Break Room Detail', '', 2), q(17, 'Breakfast Grill Clean', '4 Image', 4), q(18, 'Breakfast Items Restock', '', 4),
  q(19, 'Bun Toaster Closing', '12 Image', 4), q(20, 'Cabinets', '', 3),
];

// ---- Reports --------------------------------------------------------------------------------------
export const REPORTS = [
  { id: 'daily', code: 'DU', name: 'Daily Usage Report', owner: 'J. Maverick', updated: '09-27-26', text: 'Posted vs closed missions by unit and team, with daily distribution.', group: 'Unit' },
  { id: 'productivity', code: 'PR', name: 'Productivity Report', owner: 'J. Maverick', updated: '09-26-26', text: 'Closed % by person and position, down to every answer of every checklist.', group: 'Team' },
  { id: 'usage', code: 'UR', name: 'Usage Report', owner: 'Anna F.', updated: '09-25-26', text: 'Responses with photo and video proof — open Gallery View to watch the work.', group: 'Person', gallery: true },
  { id: 'photos', code: 'FP', name: 'Factory Photos & Videos', owner: 'QA Team', updated: '09-24-26', text: 'Every QC checkpoint photo, by person and checkpoint, searchable.', group: 'Person', gallery: true },
];
const person = (name, posted, closed, position = 'Staff') => ({ name, posted, closed, position });
// Unit → Team → Person → Mission tree for the report tables.
export const REPORT_TREE = [
  { name: 'U002 - Provo - Kitting', ref: '', posted: 52, closed: 50, children: [] },
  { name: 'U001 - American Fork - Kitting', ref: '', posted: 201, closed: 195, children: [] },
  { name: 'U002 - Provo - Quality Control', ref: '', posted: 417, closed: 398, children: [] },
  { name: 'U001 - American Fork - Quality Control', ref: '', posted: 387, closed: 369, open: true, children: [
    { name: 'QC Line Inspections', posted: 269, closed: 258, open: true, children: [
      person('Maria Jose S', 96, 94, 'QC Tech'), person('Alex V', 71, 68, 'QC Tech'), person('Miguel A', 53, 50, 'QC Lead'), person('Freddy M', 49, 46, 'QC Tech'),
    ] },
    { name: 'QC Kitting Inspections', posted: 97, closed: 91, children: [person('Carla M', 57, 55), person('Ben R', 40, 36)] },
    { name: 'Metal Detector Checks', posted: 21, closed: 20, children: [person('Alex V', 21, 20)] },
  ] },
  { name: 'U002 - Provo - Sanitation', ref: '', posted: 272, closed: 256, children: [] },
  { name: 'U001 - American Fork - Micro Lab', ref: '', posted: 27, closed: 21, children: [] },
  { name: 'U002 - Provo - Regulatory', ref: '', posted: 13, closed: 10, children: [] },
  { name: 'U001 - American Fork - Regulatory', ref: '', posted: 28, closed: 21, children: [] },
  { name: 'U001 - American Fork - Sanitation', ref: '', posted: 290, closed: 210, children: [] },
  { name: 'U001 - American Fork - Warehouse', ref: '', posted: 3, closed: 1, children: [] },
  { name: 'U001 - American Fork - Production Line 3', ref: '', posted: 8, closed: 1, children: [] },
];
export const PERSON_MISSIONS = [
  { name: 'L3 - Chunk Line Inspection', ref: 'Bar Name - Cookie Dough Chunk', type: 'Checklist', folder: 'AF - QC L3 Inspections', closedAt: '07/28/2026 12:39 PM', responses: [
    { statement: 'Lot Number', type: 'Text', response: '4252025021' },
    { statement: 'Verify that the guillotine blade is complete, properly installed, and in good condition.', type: 'Pass or Fail', response: 'Pass', photo: '/demo-quality/proofs/equipment-breakers.jpg' },
    { statement: 'Chunk Topper Units (target 3–4)', type: 'Number', response: '2', flagged: true, ticket: 'Out of Range' },
    { statement: 'Chunk TOPPER WEIGHT Avg (g)', type: 'Number', response: '6' },
    { statement: 'DOUGH weight WITHOUT chunks Avg (g)', type: 'Number', response: '29' },
  ] },
  { name: 'L4 - Line Inspection', ref: 'Bar Name - Brownie Batter Puff', type: 'Checklist', folder: 'AF - QC L4 Inspections', closedAt: '07/28/2026 12:02 PM', responses: [
    { statement: 'Lot Number', type: 'Text', response: '4252025017' },
    { statement: 'Verify that the guillotine blade is complete, properly installed, and in good condition.', type: 'Pass or Fail', response: 'Pass', photo: '/demo-quality/proofs/equipment-gauge.jpg' },
    { statement: 'Height Avg (in)', type: 'Number', response: '1.2' },
  ] },
  { name: 'Texture Analyzer Verification', ref: '', type: 'Checklist', folder: 'AF - QC Lab', closedAt: '07/28/2026 11:25 AM', responses: [
    { statement: 'Calibration weight reading is within tolerance', type: 'Yes or No', response: 'Yes', photo: '/demo-quality/proofs/equipment-thermostat.jpg' },
  ] },
  { name: 'L4 - Metal Detector', ref: 'Bar Name - Brownie Batter Puff', type: 'Checklist', folder: 'AF - QC L4 Inspections', closedAt: '07/28/2026 10:57 AM', responses: [
    { statement: 'Ferrous test wand rejected', type: 'Yes or No', response: 'Yes' }, { statement: 'Non-ferrous test wand rejected', type: 'Yes or No', response: 'Yes' },
  ] },
];
export const GALLERY = [
  { mission: 'Clean play area', statement: 'Provide a video of the cleaned area.', person: 'Bailey W', kind: 'video', src: '/demo-quality/condition-report.mp4', poster: '/demo-quality/damaged-hinge.png', type: 'Checklist', response: 'Yes' },
  { mission: 'Cool Room Clean', statement: 'Did you organize the cool room?', person: 'Bailey W', kind: 'photo', src: '/demo-quality/proofs/storage-shelves.jpg', type: 'Checklist', response: 'Yes' },
  { mission: 'Restroom Inspection', statement: 'Take photos of the cleaned restroom.', person: 'Nelson P', kind: 'photo', src: '/demo-quality/proofs/restroom-sinks.jpg', type: 'Survey', response: 'Yes' },
  { mission: 'Fire Safety Check', statement: 'Take photos of the fire safety equipment.', person: 'Anna F', kind: 'photo', src: '/demo-quality/proofs/fire-extinguisher.jpg', type: 'Checklist', response: 'Yes' },
  { mission: 'Storage Room Audit', statement: 'Provide photos of the organized storage room.', person: 'Nelson P', kind: 'photo', src: '/demo-quality/proofs/storage-containers.jpg', type: 'Checklist', response: 'Yes' },
  { mission: 'Equipment Check', statement: 'Take photos of the equipment readings.', person: 'Ben R', kind: 'photo', src: '/demo-quality/proofs/equipment-gauge.jpg', type: 'Survey', response: 'No', ticket: 'Maintenance Alert' },
];

// ---- Dashboards · Reference (live measurements, anomalies flagged) ---------------------------------
export const DASH_TABS = ['Aging', 'Execution', 'Reference', 'Personal', 'Team', 'Unit'];
export const MEASURE_COLUMNS = [
  { key: 'lot', label: 'Lot Number' }, { key: 'height', label: 'HEIGHT Avg. (in)', min: 1.1, max: 1.4 },
  { key: 'width', label: 'WIDTH Avg. (in)', min: 1.2, max: 1.35 }, { key: 'length', label: 'LENGTH Avg. (in)', min: 3.4, max: 3.7 },
  { key: 'wNo', label: 'WEIGHT (without chunks) Avg. (g)', min: 28, max: 34 }, { key: 'wWith', label: 'WEIGHT (with chunks) Avg. (g)', min: 36, max: 46 },
  { key: 'choc', label: 'Chocolate Weight (g)', min: 7, max: 12 }, { key: 'person', label: 'Person' }, { key: 'closed', label: 'Closed' },
];
const r = (name, lot, height, width, length, wNo, wWith, choc, person, closed) => ({ name, lot, height, width, length, wNo, wWith, choc, person, closed });
export const MEASUREMENTS = [
  { unit: 'U001 - American Fork - QA', rows: [
    r('Bar Name - Brownie Batter Pu…', '425300025', 1.2, 1.31, 3.63, 32, 45, 10, 'Carmen Zapata', '10/27/2025 04:07 PM'),
    r('Bar Name - Candy Cone Brownie', '425390024', 0.79, 1.26, 3.57, 34.8, 45.5, 11, 'Alex Vargas', '09/26/2025 01:40 PM'),
    r('Bar Name - Chocolatey Hazel…', '425360023', 0.94, 1.28, 3.6, 32, 42, 10, 'Alex Vargas', '09/27/2025 04:05 PM'),
    r('Bar Name - Coconut v7', '425262021', 0.86, 1.21, 3.51, 32.6, 41.2, 8.7, 'Stefanie Molina', '10/09/2025 09:00 AM'),
    r('Bar Name - Coconut v7', '425260022', 0.59, 1.45, 3.51, 30, 39, 9, 'Delicia Novas', '10/06/2025 04:00 PM'),
    r('Bar Name - Mint Chip v7', '425290022', 0.58, 1.36, 3.45, 30, 39, 9, 'Delicia Novas', '10/17/2025 05:28 PM'),
    r('Bar Name - Strawberry Milk C…', '425471021', 0.7, 1.23, 3.4, 32, 42, 9.2, 'Neisa Sabreira', '10/02/2025 12:25 PM'),
    r('Bar Name - Strawberry Milk C…', '425275021', 0.86, 1.24, 3.49, 32.5, 41.8, 9.3, 'Stefanie Molina', '10/02/2025 12:25 PM'),
  ] },
  { unit: 'U001 - American Fork', rows: [
    r('Bar Name - Brownie Batter v7', '425279022', 0.74, 1.26, 3.52, 32, 45, 13, 'Neisa Sabreira', '10/06/2025 04:00 PM'),
    r('Bar Name - Brownie Batter v7', '425266021', 0.62, 1.34, 3.54, 30, 41, 9, 'Delicia Novas', '10/06/2025 04:00 PM'),
    r('Bar Name - Brownie Batter v7', '425260022', 1.15, 1.27, 3.63, 32, 43, 10, 'Carmen Zapata', '10/10/2025 10:40 AM'),
    r('Bar Name - Brownie Batter v7', '425290021', 0.68, 1.28, 3.62, 30, 40, 9, 'Delicia Novas', '10/10/2025 11:21 AM'),
  ] },
];
export const AGING_ROWS = [
  { team: 'L001 - Sweet Beverly - Register', green: 1, orange: 1, red: 3, oldest: '2d 20:30:12', mission: 'Training Complete' },
  { team: 'L001 - Sweet Beverly - Food Preparation', green: 4, orange: 0, red: 5, oldest: '6d 12:26:54', mission: 'Raspberry Vinaigrette Dressing' },
  { team: 'L001 - Sweet Beverly - Kitchen', green: 1, orange: 0, red: 1, oldest: '02:18:22', mission: '10-Min Break AM' },
  { team: 'L001 - Sweet Beverly - Team A', green: 9, orange: 0, red: 0, oldest: '01:30:08', mission: 'Refresh Restroom' },
  { team: 'P001 - Riverside Plant - QC Line Inspections', green: 1, orange: 0, red: 2, oldest: '03:28:41', mission: 'L4 - Inspection Notes' },
  { team: 'T001 - Tarzana - ED Nurse Requests', green: 6, orange: 2, red: 4, oldest: '02:03:18', mission: 'Nurse Request - Room 12' },
];
export const EXECUTION_ROWS = [
  { mission: 'L3 - Chunk Line Inspection', runs: 21, avg: '00:33:54', min: '00:21:10', max: '00:48:02', target: '00:30:00' },
  { mission: 'Kitchen Temp', runs: 30, avg: '00:05:41', min: '00:03:02', max: '00:11:15', target: '00:10:00' },
  { mission: 'Fry Dispenser Cleaning', runs: 12, avg: '00:22:05', min: '00:17:40', max: '00:31:22', target: '00:25:00' },
  { mission: 'Nurse Request', runs: 113, avg: '00:07:48', min: '00:01:12', max: '02:04:33', target: '00:10:00' },
  { mission: 'Electronics Inventory', runs: 28, avg: '00:07:11', min: '00:04:20', max: '00:12:50', target: '00:10:00' },
  { mission: 'Patrol Parking Garage', runs: 26, avg: '00:01:48', min: '00:00:52', max: '00:04:05', target: '00:05:00' },
];
export const LEADERBOARD = [
  ['Angel Rios', 5220, 3.4, 4.8, 4.9], ['Julian De la Torre', 3305, 2.9, 4.6, 4.7], ['Nelson Posada', 2960, 3.1, 4.9, 4.8],
  ['Maria Jose S', 2840, 2.2, 4.7, 5.0], ['Freddy Espain', 1685, 1.8, 4.2, 4.5], ['Alex V', 1510, 2.0, 4.5, 4.6], ['Guillermo Hernandez', 860, 1.1, 4.0, 4.3],
];
