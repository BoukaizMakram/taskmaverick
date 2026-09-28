import test from 'node:test';
import assert from 'node:assert/strict';
import { createSimStore, canClose, column, pillTone, clock } from './store.mjs';

const find = (store, board, title) => store.getState().missions.find(m => m.boardId === board && m.title === title && m.status !== 'closed');

test('claiming moves a mission to the top of Claimed with its performer', () => {
  const store = createSimStore();
  const m = find(store, 'L001-team-a', 'Brew Coffee');
  assert.equal(store.claim(m.id, 'Anna F. - Staff'), true);
  const claimed = column(store.getState().missions, 'L001-team-a', 'claimed');
  assert.equal(claimed[0].title, 'Brew Coffee');
  assert.equal(claimed[0].performer, 'Anna F. - Staff');
});

test('a checklist cannot close until every answer (and its required proof) is in', () => {
  const store = createSimStore();
  const m = find(store, 'L001-team-a', 'Fry Dispenser Cleaning');
  store.claim(m.id, 'Anna F. - Staff');
  store.completeLesson(m.id, 'train');
  store.answer(m.id, 'hopper', 'Yes');
  store.answer(m.id, 'rack', 'Yes');
  store.answer(m.id, 'working', 'No');
  assert.equal(canClose(store.get(m.id)), false, 'a "No" needs its video first');
  store.attachProof(m.id, 'working', { kind: 'video', src: '/x.mp4' });
  assert.equal(canClose(store.get(m.id)), true);
});

test('answering "No" raises a Maintenance Alert ticket with the evidence on close', () => {
  const store = createSimStore();
  const m = find(store, 'L001-team-a', 'Fry Dispenser Cleaning');
  store.claim(m.id, 'Anna F. - Staff');
  store.completeLesson(m.id, 'train');
  ['hopper', 'rack'].forEach(id => store.answer(m.id, id, 'Yes'));
  store.answer(m.id, 'working', 'No');
  store.attachProof(m.id, 'working', { kind: 'video', src: '/x.mp4' });
  const { tickets } = store.close(m.id, 'Anna F. - Staff');
  assert.equal(tickets.length, 1);
  const ticket = column(store.getState().missions, 'L001-maintenance', 'open')[0];
  assert.equal(ticket.title, 'Maintenance Alert');
  assert.equal(ticket.trigger.answer, 'No');
  assert.equal(ticket.trigger.proof.kind, 'video');
  assert.equal(store.get(m.id).status, 'closed');
});

test('a failed test assigns exactly the missed topics to the personal board', () => {
  const store = createSimStore();
  const m = find(store, 'personal', 'HR Competency');
  store.claim(m.id, 'Anna F. - Staff');
  store.answer(m.id, 'q1', 0); // wrong
  store.answer(m.id, 'q2', 1); // right
  store.answer(m.id, 'q3', 1); // wrong
  const { result, assigned } = store.close(m.id, 'Anna F. - Staff');
  assert.equal(result.pct, 33);
  assert.deepEqual(assigned.map(a => a.title).sort(), ['Break Policy', 'Discrimination Policy']);
});

test('timers: green by default, aging colors only when a mission opts in, gray once closed', () => {
  const store = createSimStore();
  const plain = find(store, 'L001-team-a', 'Refresh Restroom');
  const aging = find(store, 'L001-kitchen', '10-Min Break AM');
  assert.equal(pillTone(plain, 99999), 'green');
  assert.equal(pillTone(aging, 60), 'green');
  assert.equal(pillTone(aging, 700), 'red');
  assert.equal(pillTone({ ...plain, status: 'closed' }, 5), 'gray');
  assert.deepEqual(clock(2 * 86400 + 3725), { days: 2, text: '01:02:05' });
});
