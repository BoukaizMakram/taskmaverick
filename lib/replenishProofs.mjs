// Replenishing Inventory's proofs (the user, 2026-11-16, of its Remotion cut: "for replishement buisness proof/gallery view, it should show replishement photos", "use chatgpt in chrome",
// "for multiple photos"): the photos people took of the shelves they restocked, for the two scenes of that film that show proofs: Business Proofs on the tablet (the same shape as
// lib/businessProofs.mjs: closed missions with their photos) and the web report's gallery (the same shape as lib/liveOversightData.mjs `reportTree('Checkpoint')`: a checkpoint, then one
// response a run with its photo). The photos are generated ones (ChatGPT, square), self-hosted in public/demo-quality/proofs/replenish-NN.jpg (`proofSrc`), and in the Remotion project's
// public/ too (D:\Documents\Saas\videos). Every other film keeps its own proofs.
// `REPLENISH_READY`: the photos are there (made on 2026-11-16: two 3 x 2 sheets of square photos asked of ChatGPT in the user's Chrome, the chat "Create contact sheet", each sheet shown
// whole in the page, captured and cut at its white lines into six squares, saved 512 px). Were it false the film would show the proofs it showed before (no gray tiles).
export const REPLENISH_READY = true;

// What each photo shows (its alt, and the brief it was generated from): a shelf, a cooler or a station just restocked, as a staff member would photograph it with a phone
export const REPLENISH_PHOTOS = [
  {name: 'replenish-01', alt: 'Stockroom shelf restocked with rows of sealed cartons'},
  {name: 'replenish-02', alt: 'Close view of full cartons lined up on a metal shelf'},
  {name: 'replenish-03', alt: 'Stockroom aisle with every shelf full'},
  {name: 'replenish-04', alt: 'Napkin packs stacked full on a service shelf'},
  {name: 'replenish-05', alt: 'Paper cups and lids restocked at a service station'},
  {name: 'replenish-06', alt: 'Takeout boxes and bags restocked under a counter'},
  {name: 'replenish-07', alt: 'Glass-door cooler fully stocked with bottles'},
  {name: 'replenish-08', alt: 'Cooler shelves with drinks faced forward'},
  {name: 'replenish-09', alt: 'Milk and juice cartons restocked in a fridge'},
  {name: 'replenish-10', alt: 'Dry goods shelf with full labeled containers'},
  {name: 'replenish-11', alt: 'Canned goods restocked and faced on a shelf'},
  {name: 'replenish-12', alt: 'Cleaning supplies shelf restocked with bottles'},
];
const photo = n => REPLENISH_PHOTOS[n - 1];

// ---- Business Proofs (the tablet): the replenishments closed today, each with the photos that prove it ----
export const REPLENISH_PROOFS = [
  {id: 'item-c', kind: 'Task', category: 'Stockroom', title: 'Replenish Item-C', performer: 'Ben R', execution: '00:06:12', duration: '00:18:40', date: '09-23-26 07:24 AM', photos: [photo(1), photo(2), photo(3)]},
  {id: 'napkins', kind: 'Task', category: 'Front Of House', title: 'Restock Napkins', performer: 'Anna F', execution: '00:04:35', duration: '00:22:08', date: '09-23-26 07:02 AM', photos: [photo(4), photo(5), photo(6)]},
  {id: 'cooler', kind: 'Checklist', category: 'Kitchen', title: 'Restock Beverage Cooler', performer: 'Leo T', execution: '00:08:51', duration: '00:31:27', date: '09-22-26 04:46 PM', photos: [photo(7), photo(8), photo(9)]},
  {id: 'dry-goods', kind: 'Checklist', category: 'Stockroom', title: 'Restock Dry Goods', performer: 'Carla M', execution: '00:09:20', duration: '00:27:15', date: '09-22-26 02:10 PM', photos: [photo(10), photo(11), photo(12)]},
];

// ---- the web report's gallery, grouped by checkpoint: each replenishment's photo checkpoint, then one response a run (who, when, the photo) ----
const POSITIONS = {'Ben R': ['Staff', 'Stockroom', '+1'], 'Anna F': ['Lead', 'Front Of House', '+2'], 'Leo T': ['Staff', 'Kitchen', '+1'], 'Carla M': ['Staff', 'Stockroom', '+1']};
const run = (checkpoint, person, date, n) => ({leaf: true, checkpoint, person, positions: POSITIONS[person], response: 'Yes', date, media: {kind: 'photo', name: photo(n).name, alt: photo(n).alt}});
const group = (label, runs) => ({label, kind: 'checkpoint', type: '', children: runs.map(([person, date, n]) => run(label, person, date, n))});
export const replenishTree = () => [
  group('Take a photo of the shelf.', [['Ben R', '09/22/2026, 07:18 AM', 2], ['Carla M', '09/22/2026, 02:10 PM', 10], ['Ben R', '09/23/2026, 07:24 AM', 1], ['Carla M', '09/24/2026, 07:31 AM', 3], ['Ben R', '09/25/2026, 07:20 AM', 11], ['Carla M', '09/26/2026, 07:27 AM', 12]]),
  group('Take a photo of the restocked cooler.', [['Leo T', '09/22/2026, 04:46 PM', 7], ['Leo T', '09/24/2026, 04:52 PM', 8], ['Leo T', '09/26/2026, 04:40 PM', 9]]),
  group('Take a photo of the service station.', [['Anna F', '09/23/2026, 07:02 AM', 4], ['Anna F', '09/25/2026, 07:09 AM', 5], ['Anna F', '09/27/2026, 07:05 AM', 6]]),
];
