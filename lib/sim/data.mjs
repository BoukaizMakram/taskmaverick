// ---------------------------------------------------------------------------
// Software simulator — seed data. Recreates the boards shown in the product
// demo recording (restaurant teams, a factory QC board, a personal training
// board and ticket boards) as plain data. The store (lib/sim/store.mjs) turns
// `ago` (seconds before the store started) into live timestamps.
//
// Mission `items` drive the interactive Mission Details body
// (components/sim/SimMissionBody.jsx):
//   lesson   — "Please complete this lesson before proceeding" (Play → Done)
//   yesno    — Yes / No (/ N/A) with optional proof + ticket trigger per answer
//   number   — "#" numeric entry, optional photo proof, optional range flag
//   text     — free text (e.g. a lot number)
//   passfail — Pass / Fail with a photo
//   photo    — take a photo of the result
// Media missions carry `lessons` (audio / video / image / quiz), Tests carry
// `questions` + `assignOnFail`. Translations live in `es` on the mission.
// Names are generic stand-ins; no real customer data.
// ---------------------------------------------------------------------------

export const UNITS = [
  { id: 'L001', code: 'L001', name: 'Sweet Beverly', industry: 'Restaurant & cafe' },
  { id: 'P001', code: 'P001', name: 'Riverside Plant', industry: 'Food manufacturing' },
];

export const PERFORMERS = {
  '123456': 'Anna F. - Staff',
  '456456': 'Ben R. - Staff',
  '789789': 'Carla M. - Staff',
  '654321': 'J. Maverick',
};

// Timer color rules (opt-in per mission, as in Mission Settings → Timer Settings).
export const AGING = {
  standard: { orange: 1800, red: 3600 },          // green 30m, orange to 1h, red after
  breaks: { orange: 300, red: 600 },              // break reminders turn red fast
  freshness: { orange: 3 * 86400, red: 5 * 86400 }, // food prep items expire in days
};

const T = (title, extra = {}) => ({ type: 'Task', points: 10, title, ...extra });
const C = (title, extra = {}) => ({ type: 'Checklist', points: 25, title, ...extra });
const S = (title, extra = {}) => ({ type: 'Survey', points: 10, title, ...extra });

const FRY_TRAINING = {
  kind: 'video', title: 'Fry Dispenser Cleaning', src: '/demo-quality/shelving-training.mp4',
  quiz: [
    { prompt: 'Switch off the appliance at the main switch before cleaning.', options: ['True', 'False'], correct: 0 },
    { prompt: 'The hopper can be cleaned while the dispenser is plugged in.', options: ['True', 'False'], correct: 1 },
  ],
};

// ---- L001 · Team A — the live "phone + shared tablet" simulation -----------
const TEAM_A = [
  T('Refresh Restroom', { reference: "Men's", ago: 5220, points: 10 }),
  T('Brew Coffee', { ago: 5100, description: 'Use a new urn, or wash the existing urn properly before brewing a new batch.', notice: 'Machine must be Docked and Powered "On" when done. Brewer power must be set to "Medium".',
    es: { title: 'Preparar Café', description: 'Use una urna nueva o lave bien la urna existente antes de preparar un nuevo lote.', notice: 'La máquina debe quedar acoplada y encendida al terminar. La potencia debe estar en "Medio".' } }),
  T('Sanitize Surfaces', { ago: 5040 }),
  T('Maintain Trash Bags', { ago: 4980 }),
  C('Fry Dispenser Cleaning', {
    ago: 4200, points: 25,
    description: 'Please confirm that you have cleaned the fry dispenser as follows.',
    notice: 'Ensure to use the following supplies: Dishwashing detergent, Warm water, Cleaning cloth, Clean container.',
    items: [
      { id: 'train', kind: 'lesson', label: 'Please complete this lesson before proceeding.', lesson: FRY_TRAINING },
      { id: 'hopper', kind: 'yesno', label: 'I removed and emptied the hopper.' },
      { id: 'rack', kind: 'yesno', label: 'I removed the insulation and wire rack.' },
      { id: 'working', kind: 'yesno', label: 'Is the fry dispenser working properly?',
        proofOn: { No: 'video' }, ticketOn: { No: { board: 'L001-maintenance', title: 'Maintenance Alert' } } },
    ],
    es: {
      title: 'Limpieza del Dispensador de Papas', description: 'Confirme que limpió el dispensador de papas de la siguiente manera.',
      notice: 'Asegúrese de usar: detergente, agua tibia, paño de limpieza y un recipiente limpio.',
      items: { train: 'Complete esta lección antes de continuar.', hopper: 'Retiré y vacié la tolva.', rack: 'Retiré el aislamiento y la rejilla.', working: '¿El dispensador de papas funciona correctamente?' },
    },
  }),
  C('Spill Clean', { ago: 4700, items: [{ id: 'sign', kind: 'yesno', label: 'Wet floor sign placed?' }, { id: 'photo', kind: 'photo', label: 'Take a photo of the clean floor.' }] }),
  C('Maintenance Check', { ago: 3900, items: [{ id: 'hvac', kind: 'yesno', label: 'Is the air conditioning working properly?', proofOn: { No: 'video' }, ticketOn: { No: { board: 'L001-maintenance', title: 'Maintenance Alert' } } }, { id: 'lights', kind: 'yesno', label: 'Are all of the lights working?' }] }),
  { type: 'Audit', points: 25, title: 'Health Department Audit', ago: 3600, items: [
    { id: 'temps', kind: 'yesno', label: 'Are all cold holding units at 41°F or below?', options: ['Yes', 'No', 'N/A'] },
    { id: 'hands', kind: 'yesno', label: 'Is the hand sink stocked with soap and towels?', options: ['Yes', 'No', 'N/A'] },
    { id: 'labels', kind: 'yesno', label: 'Are all prepped items labeled and dated?', options: ['Yes', 'No', 'N/A'] },
  ] },
  C('Cleaning Supplies', { ago: 3500, items: [{ id: 'count', kind: 'number', label: 'Spray bottles on hand', unit: '#' }] }),
];

// ---- L001 · Kitchen ---------------------------------------------------------
const KITCHEN_TEMP = S('Kitchen Temp', {
  reference: 'Food Safety / Temperature', status: 'closed', ago: 7200, claimedAgo: 5400, closedAgo: 5020, performer: 'Nelson P',
  description: 'Please enter the temperature of each corresponding freezer or refrigerator and take a photo or video of the temp reading. Take a temp of the tomatoes, meat, and cheese.',
  notice: 'Ensure to take photos of the temp reading next to the unit label! Use the temp gun or probe to take the temp. Enter temp in decimals (Example: 36.2)',
  items: [
    { id: 'f7', kind: 'number', label: 'Fridge - 7', unit: '°F', photo: true, max: 41 },
    { id: 'f8', kind: 'number', label: 'Fridge - 8', unit: '°F', photo: true, max: 41 },
    { id: 'f9', kind: 'number', label: 'Fridge - 9', unit: '°F', photo: true, max: 41 },
    { id: 'z10', kind: 'number', label: 'Freezer - 10', unit: '°F', photo: true, max: 0 },
  ],
  answers: { f7: '36', f8: '35.9', f9: '34.1', z10: '-1.2' },
  es: { title: 'Temperatura de Cocina', description: 'Ingrese la temperatura de cada congelador o refrigerador y tome una foto o video de la lectura. Tome la temperatura de los tomates, la carne y el queso.', notice: '¡Tome fotos de la lectura junto a la etiqueta de la unidad! Use el termómetro o la sonda. Ingrese la temperatura con decimales (Ejemplo: 36.2)',
    items: { f7: 'Refrigerador - 7', f8: 'Refrigerador - 8', f9: 'Refrigerador - 9', z10: 'Congelador - 10' } },
  proofs: { f7: { kind: 'photo', src: '/demo-quality/proofs/equipment-thermostat.jpg', agoAt: 5300 }, f8: { kind: 'photo', src: '/demo-quality/proofs/equipment-gauge.jpg', agoAt: 5250 }, f9: { kind: 'photo', src: '/demo-quality/proofs/storage-containers.jpg', agoAt: 5180 }, z10: { kind: 'photo', src: '/demo-quality/proofs/storage-racking.jpg', agoAt: 5100 } },
  rateable: true,
});
const KITCHEN = [
  T('10-Min Break AM', { reference: 'Angel', ago: 8300, aging: 'breaks', points: null, description: 'Take your 10-minute rest break now (California labor law).' }),
  S('Order Items', { ago: 1700, items: [{ id: 'cups', kind: 'number', label: 'Cups (sleeves)', unit: '#' }, { id: 'lids', kind: 'number', label: 'Lids (sleeves)', unit: '#' }] }),
  S('Station Inventory', { reference: 'Stations', status: 'claimed', ago: 1840, claimedAgo: 1000, performer: 'Nelson P', items: [{ id: 'grill', kind: 'number', label: 'Grill station pans', unit: '#' }, { id: 'prep', kind: 'number', label: 'Prep station pans', unit: '#' }] }),
  C('Food Labels', { status: 'closed', ago: 9300, claimedAgo: 8700, closedAgo: 8100, performer: 'Nelson P', rateable: true }),
  KITCHEN_TEMP,
  C('Pastry Quality Check', { status: 'closed', ago: 9800, claimedAgo: 9000, closedAgo: 8940, performer: 'Nelson P', rateable: true }),
  C('Protein Prep Chicken', { status: 'closed', ago: 10300, claimedAgo: 9500, closedAgo: 9480, performer: 'Nelson P', rateable: true }),
  C('Salad Station Quality Check', { status: 'closed', ago: 11000, claimedAgo: 10000, closedAgo: 9960, performer: 'Nelson P', rateable: true }),
  C('Protein Prep Beef Tenderloin', { status: 'closed', ago: 11500, claimedAgo: 10500, closedAgo: 10480, performer: 'Nelson P', rateable: true }),
  C('Protein Prep Salmon', { status: 'closed', ago: 12000, claimedAgo: 11000, closedAgo: 10990, performer: 'Nelson P', rateable: true }),
  T('Sanitizer Bucket', { status: 'closed', ago: 12600, claimedAgo: 12000, closedAgo: 11980, performer: 'Nelson P', rateable: true }),
  T('Touchscreens', { status: 'closed', ago: 13000, claimedAgo: 12400, closedAgo: 12390, performer: 'Nelson P', rateable: true }),
  C('Kitchen Hand Sink', { status: 'closed', ago: 13400, claimedAgo: 12900, closedAgo: 12860, performer: 'Nelson P', rateable: true }),
];

// ---- L001 · Register — boosted break reminders, lots of closed work --------
const closed = (title, type, ago, took, performer = 'Angel R') => ({ type, points: 10, title, status: 'closed', ago: ago + took + 60, claimedAgo: ago + took, closedAgo: ago, performer, rateable: true });
const REGISTER = [
  T('10-Min Break AM', { reference: 'Freddy', ago: 10820, boosted: true, aging: 'breaks', points: null }),
  T('10-Min Break AM', { reference: 'Nelson', ago: 10810, boosted: true, aging: 'breaks', points: null }),
  C('Rest Breaks AM', { ago: 3620, boosted: true, aging: 'breaks' }),
  C('Training Complete', { ago: 2 * 86400 + 73800, aging: 'standard' }),
  T('POS Tabs', { ago: 66000, aging: 'standard' }),
  closed('Utensils Restock', 'Checklist', 1300, 600),
  closed('Croissants Bake', 'Task', 2000, 217),
  closed('Table Run', 'Checklist', 2500, 261),
  closed('Order Items', 'Survey', 3000, 739),
  closed('Water Dispenser', 'Checklist', 3600, 100),
  { ...closed('Electronics Inventory', 'Checklist', 4000, 431), description: 'Please count all electronic devices in the store and record the corresponding numbers below.', notice: 'Ensure all devices are functioning properly.',
    items: ['Phones & Tablets', 'Computers', 'Chargers', 'TVs', "KDS's", "POS's"].map((label, i) => ({ id: `e${i}`, kind: 'number', label, unit: '#', min: [10, 1, 10, 6, 4, 2][i] })),
    answers: { e0: '11', e1: '1', e2: '11', e3: '8', e4: '5', e5: '2' } },
  closed('Secondary AC', 'Checklist', 4600, 90),
  closed('Stock Side Chips', 'Task', 5200, 70),
  closed('Stock Ketchup', 'Task', 5800, 60),
  closed('Confirm Storage Locked', 'Survey', 6400, 45),
  closed('Backup CC Test', 'Checklist', 7000, 120),
  closed('Menu Stands', 'Task', 7600, 50),
  closed('Music Level', 'Checklist', 8200, 30),
];

// ---- L001 · Food Preparation — freshness timers measured in days ------------
const prep = (title, days, extra = {}) => C(title, { ago: Math.round(days * 86400) + 1400, aging: 'freshness', boosted: days >= 5, reference: extra.reference, ...extra });
const FOOD_PREP = [
  prep('Raspberry Vinaigrette Dressing', 6.5), prep('Chicken Poached Shredded', 6.5), prep('Chimichurri Sauce', 6.4),
  prep('Spicy Aioli', 6.3), prep('Secret Sauce', 6.2), prep('Hummus', 2.5), prep('Truffle Mushroom Aioli', 2.4),
  prep('Tomato Soup', 2.3), prep('Whipped Cream', 2.2),
  prep('Iced Tea Black', 4.6, { status: 'claimed', claimedAgo: 2700, performer: 'Julian D' }),
  prep('Iced Tea Green', 4.6, { status: 'claimed', claimedAgo: 2500, performer: 'Julian D' }),
  prep('Savory Crepe Batter', 4.5, { status: 'claimed', claimedAgo: 2560, performer: 'Julian D' }),
  prep('Lemonade', 4.5, { status: 'claimed', claimedAgo: 2480, performer: 'Julian D' }),
];

const filler = (names, type = 'Task', baseAgo = 900) => names.map((title, i) => ({ type, points: 10, title, ago: baseAgo + i * 240 }));
const BACKUP = filler(['Cup Sleeves Restock', 'Paper Towel Backup', 'Dry Storage Rotation', 'Syrup Inventory', 'Napkin Backup'], 'Checklist', 3000);
const CONTROLS = filler(['Walk-In Door Seal', 'Hood Filter Check', 'Fire Extinguisher Tag', 'Pest Trap Check'], 'Checklist', 1800);
const CREPE = [...filler(['Crepe Batter Temp'], 'Survey', 1200), { type: 'Task', points: 10, title: 'Crepe Station Clean', status: 'claimed', ago: 1500, claimedAgo: 300, performer: 'Carla M.' }];
const DELIVERIES = filler(['Receive Produce', 'Receive Dairy', 'Check Invoice', 'Rotate Stock (FIFO)', 'Log Delivery Temps', 'Break Down Boxes', 'Sign Driver Log', 'Put Away Frozen'], 'Checklist', 600);
const OUTSIDE = [];
const TRAINING_BOARD = [];

// ---- P001 · QC Line Inspections — the factory scoreboard -------------------
const LINE_INSPECTION = {
  description: 'Please complete the inspection:',
  es: { description: 'Complete la inspección:', notice: 'Verifique la cuchilla de la guillotina y registre cada dimensión con una báscula o calibrador.',
    items: { lot: 'Número de lote', blade: 'Verifique que la cuchilla de la guillotina esté completa, bien instalada y en buen estado.', units: 'Unidades de topping: indique el número de trozos en una barra. El objetivo es 3-4 unidades.', weight: 'Peso promedio del topping (g): antes del chocolate, retire los trozos y pese el topping.', dough: 'Peso promedio de la masa SIN trozos', height: 'Altura promedio (pulgadas)' } },
  notice: 'Verify the guillotine blade and record every dimension with a scale or caliper.',
  items: [
    { id: 'lot', kind: 'text', label: 'Lot Number', placeholder: 'Enter lot number' },
    { id: 'blade', kind: 'passfail', label: 'Verify that the guillotine blade is complete, properly installed, and in good condition.', photo: true },
    { id: 'units', kind: 'number', label: 'Chunk Topper Units: Please provide the number of chunks present in one bar. The target is 3-4 units.', unit: '#', min: 3, max: 4, group: 'Dimensions' },
    { id: 'weight', kind: 'number', label: 'Chunk TOPPER WEIGHT Avg: Before chocolate, remove the chunks from the bar and put the average weight of the topper.', unit: 'g', min: 5, max: 8, group: 'Dimensions' },
    { id: 'dough', kind: 'number', label: 'DOUGH weight WITHOUT chunks Avg', unit: 'g', min: 26, max: 31, group: 'Dimensions' },
    { id: 'height', kind: 'number', label: 'Height Avg (in)', unit: 'in', min: 1.1, max: 1.4, group: 'Dimensions' },
  ],
};
const qc = (title, reference, ago, took, performer, extra = {}) => C(title, { reference, status: 'closed', ago: ago + took + 900, claimedAgo: ago + took, closedAgo: ago, performer, ...extra });
const QC = [
  C('L4 - Inspection Notes', { reference: 'Cookie Dough Chunk', postedBy: 'By System User', ago: 12520, aging: 'standard', ...LINE_INSPECTION }),
  { type: 'Audit', points: 25, title: 'Line 4 Walk Through', ago: 11050, aging: 'standard', items: [
    { id: 'guards', kind: 'yesno', label: 'Are all machine guards in place?', options: ['Yes', 'No', 'N/A'], proofOn: { No: 'photo' }, ticketOn: { No: { board: 'P001-qc', title: 'Safety Alert' } } },
    { id: 'floor', kind: 'yesno', label: 'Is the floor free of debris and spills?', options: ['Yes', 'No', 'N/A'] },
  ] },
  C('L4 - Lee Kettles Verification', { ago: 2700, aging: 'standard', items: [{ id: 'temp', kind: 'number', label: 'Kettle temperature (°F)', unit: '°F', min: 180, max: 195, photo: true }] }),
  C('L4 - Line Inspection', { reference: 'Brownie Batter Puff', status: 'claimed', ago: 3200, claimedAgo: 2420, performer: 'Maria Jose S', ...LINE_INSPECTION }),
  qc('L3 - Chunk Line Inspection', 'Cookie Dough Chunk', 900, 2034, 'Alex V', { ...LINE_INSPECTION,
    answers: { lot: '4252025021', blade: 'Pass', units: '2', weight: '6', dough: '29', height: '1.2' },
    proofs: { blade: { kind: 'photo', src: '/demo-quality/proofs/equipment-breakers.jpg', agoAt: 1900 } }, rateable: true }),
  qc('Texture Analyzer Verification', null, 1500, 56, 'Maria Jose S', { rateable: true }),
  qc('L4 - Metal Detector', 'Brownie Batter Puff', 2100, 1852, 'Maria Jose S', { rateable: true }),
  qc('L3 - Metal Detector', 'Cookie Dough Chunk', 2700, 284, 'Alex V', { rateable: true }),
  qc('Samples to Micro Lab', null, 3300, 22, 'Miguel A', { rateable: true }),
  qc('L3 - Pre Operational Mixing', null, 3900, 1649, 'Maria Jose S', { rateable: true }),
  qc('EMP Sample Submission', null, 4500, 1847, 'Maria Jose S', { rateable: true }),
];

// ---- Personal board — training, surveys, tests ------------------------------
const PUNCTUALITY_TEXT = 'You are an important member of our team. We hired you because we believe in you as a person, and as a professional. Your punctuality is important to the stability of the business. It also shows your respect and appreciation, both for the business and for your coworkers. Please plan to arrive to work on time, and contact a designated manager as soon as possible if you think that you will be running late to a scheduled shift.';
const PUNCTUALITY_TEXT_ES = 'Usted es un miembro importante de nuestro equipo. Lo contratamos porque creemos en usted como persona y como profesional. Su puntualidad es importante para la estabilidad del negocio y demuestra respeto por el negocio y por sus compañeros. Planee llegar a tiempo y contacte a un gerente lo antes posible si cree que llegará tarde a un turno.';
export const MEDIA_LIBRARY = {
  punctuality: { type: 'Media', title: 'Punctuality', reference: 'Organization', points: 10,
    description: 'Please listen or read carefully. This lesson will repeat until you pass the Quiz.',
    lessons: [
      { id: 'audio', kind: 'audio', title: 'Audio', text: PUNCTUALITY_TEXT, textEs: PUNCTUALITY_TEXT_ES, seconds: 26 },
      { id: 'quiz', kind: 'quiz', title: 'Quiz', questions: [
        { prompt: 'Punctuality is important, but arriving on time is not necessary when the store is not busy.', promptEs: 'La puntualidad es importante, pero llegar a tiempo no es necesario cuando la tienda no está ocupada.', options: ['True', 'False'], optionsEs: ['Cierto', 'Falso'], correct: 1 },
        { prompt: 'Punctuality is not only about being at work on time, but it is also about being ready for work at that time.', promptEs: 'La puntualidad no solo se trata de estar en el trabajo a tiempo, sino también de estar listo para trabajar en ese momento.', options: ['True', 'False'], optionsEs: ['Cierto', 'Falso'], correct: 0 },
        { prompt: 'Your management and coworkers will understand if you often arrive late, but always have a good explanation.', promptEs: 'La gerencia y sus compañeros entenderán si llega tarde a menudo, pero siempre tenga una buena explicación.', options: ['True', 'False'], optionsEs: ['Cierto', 'Falso'], correct: 1 },
      ] },
    ],
    es: { title: 'Puntualidad', description: 'Por favor, escuche o lea con atención. Este mensaje se repetirá hasta que apruebe el cuestionario.' } },
  discrimination: { type: 'Media', title: 'Discrimination Policy', reference: 'Organization', points: 10, description: 'Please read carefully.',
    lessons: [{ id: 'audio', kind: 'audio', title: 'Audio', text: 'We do not tolerate discrimination of any kind. Every team member is treated with respect regardless of race, religion, gender, age, nationality or disability. If you experience or witness discrimination, report it immediately to a manager or through the anonymous survey.', seconds: 18 }] },
  gift: { type: 'Media', title: 'Gift Policy', reference: 'Organization', points: 10, description: 'Please read carefully.',
    lessons: [{ id: 'audio', kind: 'audio', title: 'Audio', text: 'Team members may not accept cash gifts from guests or vendors. Small non-cash gifts under twenty-five dollars must be reported to your manager.', seconds: 12 }] },
  breaks: { type: 'Media', title: 'Break Policy', reference: 'Organization', points: 10, description: 'Please read carefully.',
    lessons: [{ id: 'audio', kind: 'audio', title: 'Audio', text: 'You are entitled to a ten-minute paid rest break for every four hours worked, and a thirty-minute meal break before the end of your fifth hour. Taskmaverick reminds you on the board when a break is due.', seconds: 14 }] },
};
const PERSONAL = [
  { type: 'Media', title: 'Office Attire', reference: 'Image Training', points: 10, ago: 5500,
    description: 'Please answer the following.',
    lessons: [
      { id: 'attire', kind: 'choice', title: 'Attire', prompt: 'Select the correct option: which outfit follows the dress code?', options: ['Option 1 — Uniform shirt, black pants, closed-toe shoes', 'Option 2 — Uniform shirt, shorts, sandals', 'Option 3 — Hoodie, jeans, sneakers'], correct: 0 },
      { id: 'jewelry', kind: 'choice', title: 'Jewelry', prompt: 'Select the correct option: which jewelry is allowed on shift?', options: ['Option 1 — Rings, bracelets and a watch', 'Option 2 — A plain wedding band only', 'Option 3 — Long earrings and necklaces'], correct: 1 },
    ] },
  { type: 'Survey', title: 'Discrimination Survey', reference: 'Organization', points: 10, ago: 1760,
    description: 'Please answer the following honestly and accurately.',
    notice: "If it's your first time taking this survey, your answers should apply from your hiring date till now.",
    items: [
      { id: 'train', kind: 'lesson', label: 'Please complete this training before answering the following questions.', lesson: { kind: 'audio', title: 'Discrimination Policy', text: MEDIA_LIBRARY.discrimination.lessons[0].text, seconds: 18, quiz: [{ prompt: 'You should report discrimination you witness, even if it did not happen to you.', options: ['True', 'False'], correct: 0 }] } },
      { id: 'self', kind: 'yesno', label: 'Since the last time that you took this Survey, have you been discriminated against while on the job?', ticketOn: { Yes: { board: 'ORG-hr', title: 'Discrimination Alert' } } },
      { id: 'witness', kind: 'yesno', label: 'Since the last time that you took this Survey, have you witnessed anyone get discriminated against while on the job?', ticketOn: { Yes: { board: 'ORG-hr', title: 'Discrimination Alert' } } },
    ] },
  { type: 'Test', title: 'HR Competency', reference: 'Organization', points: 25, ago: 1440, timeLimit: 300,
    description: 'You have 5 minutes to complete this test. Missed topics are assigned to your personal board.',
    questions: [
      { id: 'q1', topic: 'discrimination', prompt: 'A coworker makes jokes about a teammate’s religion. What should you do?', options: ['Ignore it — it is only a joke', 'Report it to a manager', 'Join in so you fit in'], correct: 1 },
      { id: 'q2', topic: 'gift', prompt: 'A vendor offers you $100 cash as a thank-you. What is the policy?', options: ['Accept it and keep it', 'Decline it and tell your manager', 'Split it with the team'], correct: 1 },
      { id: 'q3', topic: 'breaks', prompt: 'When is your 30-minute meal break due?', options: ['Before the end of your 5th hour', 'Whenever the shift is slow', 'Only on double shifts'], correct: 0 },
    ],
    assignOnFail: { discrimination: 'discrimination', gift: 'gift', breaks: 'breaks' } },
  { ...MEDIA_LIBRARY.punctuality, ago: 1300 },
];

export const BOARDS = [
  { id: 'personal', kind: 'personal', title: 'Personal Board', unit: 'ORG', missions: PERSONAL },
  { id: 'L001-team-a', kind: 'team', unit: 'L001', title: 'Team A', missions: TEAM_A },
  { id: 'L001-kitchen', kind: 'team', unit: 'L001', title: 'Kitchen', missions: KITCHEN },
  { id: 'L001-register', kind: 'team', unit: 'L001', title: 'Register', missions: REGISTER },
  { id: 'L001-food-prep', kind: 'team', unit: 'L001', title: 'Food Preparation', missions: FOOD_PREP },
  { id: 'L001-backup', kind: 'team', unit: 'L001', title: 'Back Up Storage', missions: BACKUP },
  { id: 'L001-controls', kind: 'team', unit: 'L001', title: 'Controls', missions: CONTROLS },
  { id: 'L001-crepe', kind: 'team', unit: 'L001', title: 'Crepe Station', missions: CREPE },
  { id: 'L001-deliveries', kind: 'team', unit: 'L001', title: 'Deliveries', missions: DELIVERIES },
  { id: 'L001-outside', kind: 'team', unit: 'L001', title: 'Outside Duties', missions: OUTSIDE },
  { id: 'L001-training', kind: 'team', unit: 'L001', title: 'Training', missions: TRAINING_BOARD },
  { id: 'P001-qc', kind: 'team', unit: 'P001', title: 'QC Line Inspections', missions: QC },
  { id: 'P001-line4', kind: 'team', unit: 'P001', title: 'Production Line 4', missions: filler(['Line 4 Start-Up', 'Allergen Changeover', 'Mixer Sanitation', 'Oven Temp Log'], 'Checklist', 2000) },
  { id: 'P001-sanitation', kind: 'team', unit: 'P001', title: 'Sanitation', missions: filler(['Drain Cleaning', 'Floor Scrub', 'Conveyor Wash'], 'Checklist', 1500) },
  { id: 'L001-maintenance', kind: 'ticket', unit: 'L001', title: 'Maintenance Tickets', missions: [] },
  { id: 'ORG-hr', kind: 'ticket', unit: 'ORG', title: 'Human Resources Tickets', missions: [] },
  { id: 'P001-qc-tickets', kind: 'ticket', unit: 'P001', title: 'QC Tickets', missions: [
    { type: 'Ticket', title: 'Out of Range: Topper Units', ago: 900, trigger: { question: 'Chunk Topper Units', answer: '2 (target 3-4)', source: 'L3 - Chunk Line Inspection', performer: 'Alex V', location: 'P001 - Riverside Plant - QC Line Inspections' } },
  ] },
];

// Requests a team can make from the "+" (On-Demand) button, per board kind.
export const ON_DEMAND = [
  { type: 'Task', title: 'Spill Clean-Up Needed' }, { type: 'Task', title: 'Restock Cups & Lids' },
  { type: 'Checklist', title: 'Deep Clean Restroom' }, { type: 'Task', title: 'Manager Assistance' },
  { type: 'Survey', title: 'Anonymous Incident Log' }, { type: 'Checklist', title: 'Equipment Issue Report' },
];

export const KNOWLEDGE = [
  { id: 'kb-bed', title: 'Bed Exit Alarm', kind: 'video', src: '/videos/training%20video%201.mp4', date: '07-28-26' },
  { id: 'kb-fry', title: 'Fry Dispenser Cleaning', kind: 'video', src: '/demo-quality/shelving-training.mp4', date: '07-12-26' },
  { id: 'kb-punctuality', title: 'Punctuality', kind: 'audio', text: PUNCTUALITY_TEXT, date: '06-02-26' },
  { id: 'kb-pizza', title: 'Pizza Boxing', kind: 'audio', text: 'Whenever you pack a pizza, leave a small opening gap on the top and make sure the edges of the lid are completely inside the box. Keep thin crust pizzas vented until pickup so they do not get soggy.', date: '05-18-26' },
  { id: 'kb-shelving', title: 'Shelving Standards', kind: 'image', src: '/demo-quality/shelving.png', date: '04-30-26' },
];
