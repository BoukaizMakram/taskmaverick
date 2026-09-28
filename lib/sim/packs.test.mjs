import test from 'node:test';
import assert from 'node:assert/strict';
import { findPremade, cleanPack, toSim, isComplete, industryKey } from './packs.mjs';
import { INDUSTRY_PACKS } from './industryPacks.mjs';
import { createSimStore, column, canClose } from './store.mjs';

test('premade packs: every one is complete and loads into the simulator', () => {
  assert.ok(INDUSTRY_PACKS.length >= 10);
  const ids = new Set();
  for (const raw of INDUSTRY_PACKS) {
    assert.ok(!ids.has(raw.id), `duplicate ${raw.id}`); ids.add(raw.id);
    const pack = cleanPack(raw);
    assert.ok(isComplete(pack), raw.id);
    const sim = toSim(pack);
    assert.equal(sim.boards.filter(b => b.kind === 'team').length, 3, raw.id);
    assert.equal(sim.boards.filter(b => b.kind === 'ticket').length, 1, raw.id);
    // Alerts point at the pack's own ticket board.
    const ticket = sim.boards.find(b => b.kind === 'ticket').id;
    for (const m of sim.boards.flatMap(b => b.missions)) for (const it of m.items || []) for (const rule of Object.values(it.ticketOn || {})) assert.equal(rule.board, ticket);
  }
});

test('findPremade: builtin demo data first, then packs by name or alias', () => {
  assert.equal(findPremade('a coffee shop', INDUSTRY_PACKS)?.unit, 'L001');
  assert.equal(findPremade('Factory', INDUSTRY_PACKS)?.unit, 'P001');
  assert.equal(findPremade('hotels', INDUSTRY_PACKS)?.id, 'hotel');
  assert.equal(findPremade('my gym business', INDUSTRY_PACKS)?.id, 'fitness');
  assert.equal(findPremade('Nursing home', INDUSTRY_PACKS)?.id, 'senior-living');
  assert.equal(findPremade('dental office', INDUSTRY_PACKS), null);
  assert.equal(findPremade('dental clinic', INDUSTRY_PACKS), null);
  assert.equal(findPremade('a boutique hotel chain', INDUSTRY_PACKS)?.id, 'hotel');
  assert.equal(findPremade('restaurant with 3 locations', INDUSTRY_PACKS)?.unit, 'L001');
  assert.equal(findPremade('animal hospital', INDUSTRY_PACKS)?.id, 'veterinary');
  assert.equal(findPremade('grocery store chain', INDUSTRY_PACKS)?.id, 'retail');
  assert.equal(findPremade('car dealership', INDUSTRY_PACKS)?.id, 'auto');
  assert.equal(industryKey('  The Hotel Industry! '), 'hotel');
});

test('cleanPack: rejects invalid, clamps and drops what the AI got wrong', () => {
  assert.equal(cleanPack({ valid: false }), null);
  assert.equal(cleanPack({ valid: true, teams: [] }), null);
  const p = cleanPack({ valid: true, industry: 'Dental <b>Office</b>', code: 'bad', name: 'Bright Smile', ticketBoard: '', teams: [{ name: 'Front Desk', missions: [
    { type: 'Weird', title: 'Check In', status: 'claimed', minutesAgo: 99999 },
    { type: 'Checklist', title: 'Sterilize Tools', status: 'open', minutesAgo: 20, items: [{ kind: 'number', label: 'Autoclave temp', unit: '°F', min: 250, max: 270 }, { kind: 'yesno', label: 'Indicator strip changed color?', alertOn: 'No', alertTitle: 'Sterilization Alert', proof: 'photo' }, { kind: 'yesno', label: 'x', alertOn: 'none', proof: 'none' }] },
  ] }], personal: [], requests: [] });
  assert.equal(p.industry, 'Dental Office');
  assert.equal(p.code, 'D001');
  assert.equal(p.ticketBoard, 'Alert Tickets');
  assert.equal(p.teams[0].missions[0].type, 'Task');
  assert.equal(p.teams[0].missions[0].minutesAgo, 1440);
  assert.equal(p.teams[0].missions[0].performer, 'Alex R');
  const items = p.teams[0].missions[1].items;
  assert.deepEqual([items[0].min, items[0].max, items[0].unit], [250, 270, '°F']);
  assert.equal(items[1].alertOn, 'No');
  assert.equal(items[2].alertOn, undefined);
});

test('toSim: unique codes and board titles, closed missions come answered', () => {
  const pack = cleanPack(INDUSTRY_PACKS.find(p => p.id === 'hotel'));
  const sim = toSim(pack, { codes: ['H001'], titles: ['Maintenance Tickets', 'Housekeeping'] });
  assert.equal(sim.unit.code, 'H002');
  const titles = sim.boards.map(b => b.title);
  assert.ok(!titles.includes('Maintenance Tickets') && !titles.includes('Housekeeping'), titles.join());
  for (const m of sim.boards.flatMap(b => b.missions).filter(x => x.status === 'closed')) assert.ok(m.closedAgo < m.claimedAgo && m.claimedAgo < m.ago + 1);
});

test('store.loadPack: adds the unit on top, posts its missions, raises its own tickets', () => {
  const store = createSimStore();
  const before = store.getState().missions.length;
  const pack = cleanPack(INDUSTRY_PACKS.find(p => p.id === 'hotel'));
  const s0 = store.getState();
  const unit = store.loadPack(toSim(pack, { codes: s0.units.map(u => u.id), titles: s0.boards.map(b => b.title) }));
  const st = store.getState();
  assert.equal(st.units[0].id, unit.id);
  assert.equal(st.industry.id, unit.id);
  assert.ok(st.missions.length > before + 14);
  assert.ok(st.missions.some(m => m.boardId === 'personal' && m.id.startsWith(`personal-${unit.id}-`)));
  // Loading again replaces, not duplicates.
  const count = st.missions.length;
  store.loadPack(toSim(pack, { codes: ['L001', 'P001'], titles: [] }));
  assert.equal(store.getState().missions.length, count);
  // An alert answer raises a ticket on the hotel's ticket board.
  const withAlert = store.getState().missions.find(m => m.status === 'open' && m.items?.some(i => i.ticketOn) && store.getState().boards.find(b => b.id === m.boardId)?.unit === unit.id);
  const item = withAlert.items.find(i => i.ticketOn);
  const answer = Object.keys(item.ticketOn)[0];
  store.claim(withAlert.id, 'Anna F. - Staff');
  for (const it of withAlert.items) {
    if (it.kind === 'photo') { store.attachProof(withAlert.id, it.id, { kind: 'photo', src: 'x' }); continue; }
    store.answer(withAlert.id, it.id, it === item ? answer : it.kind === 'number' ? String(it.min ?? 1) : it.kind === 'passfail' ? 'Pass' : it.kind === 'text' ? 'ok' : 'Yes');
    const proof = it.proofOn?.[store.get(withAlert.id).answers[it.id]] || (it.photo ? 'photo' : null);
    if (proof) store.attachProof(withAlert.id, it.id, { kind: proof, src: 'x' });
  }
  assert.ok(canClose(store.get(withAlert.id)));
  const { tickets } = store.close(withAlert.id, 'Anna F. - Staff');
  assert.equal(tickets.length >= 1, true);
  const board = store.getState().boards.find(b => b.id === tickets[0].boardId);
  assert.equal(board.unit, unit.id);
  assert.equal(column(store.getState().missions, board.id, 'open').length >= 1, true);
  assert.match(tickets[0].trigger.location, new RegExp(unit.code));
  // Reset keeps the loaded industry.
  store.reset();
  assert.equal(store.getState().industry.id, unit.id);
});
