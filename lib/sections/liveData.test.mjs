import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS, LIVE, applyEdit, cleanSections, describe, fromPack, hoursOf, normalize, ruleOf} from './liveData.mjs';
import {SECTIONS} from './index.mjs';
import {INDUSTRY_PACKS} from '../sim/industryPacks.mjs';

test('the defaults are the board\'s own data, untouched by normalize', () => {
  for (const id of LIVE) assert.deepEqual(normalize(id, DEFAULTS[id]), DEFAULTS[id], id);
  for (const id of LIVE) assert.deepEqual(normalize(id), DEFAULTS[id], `${id} with no data`);
});

test('a schedule\'s words come from its hours, as the board has them', () => {
  for (const team of DEFAULTS['precision-planning'].teams.slice(0, 2)) for (const m of team.missions) assert.equal(ruleOf(m.hours), m.rule, m.name);
  assert.deepEqual(hoursOf({times: '8, 12,16'}), [8, 12, 16]);
  assert.deepEqual(hoursOf({times: '9am, 3 PM, 12am'}), [0, 9, 15]);
  assert.deepEqual(hoursOf({every: 3, from: 9, until: 21}), [9, 12, 15, 18, 21]);
  assert.equal(hoursOf({}), null);
});

test('the video\'s targets are slots: renaming or adding never moves them', () => {
  const spec = SECTIONS.find(s => s.id === 'precision-planning');
  const targets = spec.chapters.flatMap(c => [...(c.marks ?? []).map(m => m.target), ...(c.acts ?? []).map(a => a.target)]).filter(t => /^(mission|badge)-/.test(t));
  let {data} = applyEdit('precision-planning', null, {cmd: 'rename', from: 'Opening Checklist', to: 'Front Desk Opening'});
  ({data} = applyEdit('precision-planning', data, {cmd: 'add', mission: 'Pool Check', team: 'Operations', position: 'Lifeguard', times: '8,12,17'}));
  const ids = new Set(data.teams.slice(0, 2).flatMap(t => t.missions.map(m => m.id)));
  for (const t of targets) assert.ok(ids.has(t.replace(/^(mission|badge)-/, '')), t);
  assert.equal(data.teams[0].missions[0].name, 'Front Desk Opening');
  assert.equal(data.teams[0].missions.at(-1).rule, 'Daily at 8:00 AM, 12:00 PM and 5:00 PM');
});

test('Precision Planning: add, schedule, remove, and the same mission on two teams', () => {
  let r = applyEdit('precision-planning', null, {cmd: 'add', mission: 'Pool Check', team: 'Kitchen', every: '2', from: '8', until: '14'});
  assert.equal(r.chapter, 'multiple');
  assert.equal(r.data.teams[1].missions.at(-1).rule, 'Every 2 hours, starting at 8:00 AM');
  r = applyEdit('precision-planning', r.data, {cmd: 'schedule', mission: 'pool check', times: '7,19'});
  assert.deepEqual(r.data.teams[1].missions.at(-1).hours, [7, 19]);
  r = applyEdit('precision-planning', r.data, {cmd: 'remove', mission: 'Pool Check'});
  assert.equal(r.data.teams[1].missions.length, 2);
  assert.match(applyEdit('precision-planning', r.data, {cmd: 'remove', mission: 'Opening Checklist'}).error, /explains/);
  r = applyEdit('precision-planning', null, {cmd: 'rename', from: 'Restroom Cleaning', to: 'Room Turnover'});
  assert.equal(r.data.teams[0].missions[1].name, 'Room Turnover');
  assert.equal(r.data.teams[1].missions[0].name, 'Room Turnover', 'the shared mission keeps one name');
  r = applyEdit('precision-planning', null, {cmd: 'add', mission: 'Badge Audit', team: 'Support', times: '10'});
  assert.equal(r.chapter, 'distribution');
  assert.equal(r.data.teams[2].count, 5);
  assert.ok(applyEdit('precision-planning', null, {cmd: 'rename', from: 'Nothing Like It', to: 'X'}).error);
  assert.equal(applyEdit('precision-planning', null, {cmd: 'set', unit: 'Downtown Branch'}).data.unit, 'Downtown Branch');
});

test('Requesting Maintenance: the board, the On-Demand list, the issue', () => {
  let r = applyEdit('requesting-maintenance', null, {cmd: 'add', mission: 'Fold Towels', type: 'task'});
  assert.equal(r.chapter, 'list');
  assert.equal(r.data.board.length, 5);
  assert.equal(r.data.board[2].title, 'Fold Towels', 'with the open ones');
  r = applyEdit('requesting-maintenance', r.data, {cmd: 'add', request: 'Extra Linens'});
  assert.equal(r.data.demand.at(-1).title, 'Extra Linens');
  r = applyEdit('requesting-maintenance', r.data, {cmd: 'set', ticketboard: 'Facilities'});
  assert.equal(r.data.ticketBoard, 'Facilities');
  r = applyEdit('requesting-maintenance', r.data, {cmd: 'remove', mission: 'Fold Towels'});
  assert.equal(r.data.board.length, 4);
  assert.ok(applyEdit('requesting-maintenance', r.data, {cmd: 'remove', mission: 'Brew Coffee'}).error, 'the story\'s own cards stay');
  assert.match(describe('requesting-maintenance', r.data), /Facilities/);
});

test('a workspace makes the videos\' data at once, for every premade industry', () => {
  for (const pack of INDUSTRY_PACKS) {
    const out = fromPack(pack);
    const p = out['precision-planning'], m = out['requesting-maintenance'];
    assert.equal(p.unit, pack.name);
    assert.equal(p.teams[0].name, pack.teams[0].name);
    assert.equal(p.teams[1].missions[0].name, p.teams[0].missions[1].name, `${pack.industry}: the shared mission`);
    assert.equal(m.team, pack.teams[0].name);
    assert.ok(m.board.length >= 4 && m.people.length === 4, pack.industry);
    assert.deepEqual(normalize('precision-planning', p), p, `${pack.industry} is stable`);
  }
});

test('what the AI writes is cleaned into the videos\' data', () => {
  const raw = {planning: {location: 'Lakeside Inn', otherLocations: [{name: 'Hilltop Inn', teams: 4}], teams: ['Housekeeping', 'Front Desk', 'Kitchen', 'Spa', 'Security', 'Grounds'],
    specific: {name: 'Linen Count', position: 'Supervisor'}, specificTimes: [9, 17], recurring: {name: 'Lobby Sweep', position: 'Attendant'}, everyHours: 2, startHour: 7, sharedTimes: [11, 15],
    third: {name: 'Minibar Restock', position: 'Attendant'}, thirdTimes: [10, 18], fourth: {name: 'Key Card Audit', position: 'Clerk'}},
  maintenance: {team: 'Housekeeping', area: 'Guest Floors', missions: [{title: 'Turn Down Room 204', type: 'Task'}, {title: 'Restock Carts', type: 'Checklist'}, {title: 'Vacuum Hallway', type: 'Task'}, {title: 'Lost And Found', type: 'Survey'}],
    requests: [{title: 'Extra Towels', type: 'Task'}], problem: 'The room 204 door will not close properly.', ticketBoard: 'Engineering', otherTickets: [{title: 'Leak Alert', problem: 'A shower is leaking.', area: 'Room 310'}], people: ['Maria L', 'Tom K']}};
  const out = cleanSections(raw);
  const p = out['precision-planning'], m = out['requesting-maintenance'];
  assert.equal(p.teams[0].missions[1].rule, 'Every 2 hours, starting at 7:00 AM');
  assert.equal(p.teams[1].missions[0].name, 'Lobby Sweep');
  assert.equal(p.teams[1].missions[0].rule, 'Daily at 11:00 AM and 3:00 PM');
  assert.equal(p.teams.length, 6);
  assert.equal(m.ticketBoard, 'Engineering');
  assert.equal(m.others.length, 3, 'missing tickets are the board\'s own');
  assert.equal(m.people.length, 4);
  assert.deepEqual(cleanSections(null)['precision-planning'], DEFAULTS['precision-planning']);
});
