// ---------------------------------------------------------------------------
// Software simulator — shared state. One store can back several devices at
// once (a phone and the shared tablet), so an action on one shows on the other,
// exactly like the product syncing through the cloud. Plain JS: React reads it
// with useSyncExternalStore (components/sim/useSim.js).
//
// Automations run on Close, as in the product:
//   - an answer with `ticketOn[answer]` raises a Ticket on that ticket board,
//     carrying the question, the answer, the proof and who triggered it;
//   - a failed Test assigns the missed topics (Media) to the personal board.
//
// loadPack() adds a whole industry (a unit, its boards, missions and a
// personal training — lib/sim/packs.mjs toSim()) on top of the demo data.
// ---------------------------------------------------------------------------

import { BOARDS, MEDIA_LIBRARY, AGING, UNITS } from './data.mjs';

const pad = n => String(Math.floor(n)).padStart(2, '0');
export function clock(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const days = Math.floor(s / 86400), r = s % 86400;
  return { days, text: `${pad(r / 3600)}:${pad((r / 60) % 60)}:${pad(r % 60)}` };
}
export const stamp = ms => {
  const d = new Date(ms);
  const hours = d.getHours() % 12 || 12;
  return { date: `${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${String(d.getFullYear()).slice(2)}`, time: `${pad(hours)}:${pad(d.getMinutes())} ${d.getHours() < 12 ? 'AM' : 'PM'}` };
};
export const fileStamp = (ms, kind = 'photo') => {
  const d = new Date(ms);
  return `${kind === 'video' ? 'Video' : 'Photo'} ${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} at ${d.toLocaleTimeString('en-US')}.${kind === 'video' ? 'mp4' : 'jpg'}`;
};

export function timers(m, now) {
  const end = m.status === 'closed' ? m.closedAt : now;
  return { pill: Math.max(0, (end - m.postedAt) / 1000), exec: m.claimedAt ? Math.max(0, (end - m.claimedAt) / 1000) : 0 };
}
export function pillTone(m, pillSeconds) {
  if (m.status === 'closed') return 'gray';
  const rule = AGING[m.aging];
  if (!rule) return 'green';
  return pillSeconds >= rule.red ? 'red' : pillSeconds >= rule.orange ? 'orange' : 'green';
}
export const unitOf = (id, units = UNITS) => units.find(u => u.id === id);
export const unitLabel = (id, units = UNITS) => { const u = unitOf(id, units); return u ? `${u.code} - ${u.name}` : 'Organization'; };

// Column order: Open by time posted (oldest on top); Claimed / Closed by the
// latest action, so a moving mission always lands at the top of its column.
export function column(missions, boardId, status) {
  const list = missions.filter(m => m.boardId === boardId && m.status === status);
  if (status === 'open') return list.sort((a, b) => (b.boosted - a.boosted) || (a.postedAt - b.postedAt));
  const key = status === 'claimed' ? 'claimedAt' : 'closedAt';
  return list.sort((a, b) => b[key] - a[key]);
}
export const counts = (missions, boardId) => ['open', 'claimed', 'closed'].map(s => missions.filter(m => m.boardId === boardId && m.status === s).length);

// A question item is complete when answered (and its proof, if one is required
// for that answer, is attached). Lessons are complete once passed.
export function itemDone(m, item) {
  if (item.kind === 'lesson') return m.lessonsDone?.includes(item.id);
  const value = m.answers?.[item.id];
  if (item.kind === 'photo') return !!m.proofs?.[item.id];
  if (value == null || value === '') return false;
  if (item.kind === 'number' && !/^-?\d+(\.\d+)?$/.test(String(value))) return false;
  const proofKind = item.proofOn?.[value] || (item.photo ? 'photo' : null);
  return !proofKind || !!m.proofs?.[item.id];
}
export function outOfRange(item, value) {
  if (item.kind !== 'number' || value == null || value === '') return false;
  const n = Number(value);
  return (item.min != null && n < item.min) || (item.max != null && n > item.max);
}
export function canClose(m) {
  if (m.type === 'Ticket' || m.type === 'Task') return true;
  if (m.type === 'Test') return m.questions.every(q => m.answers?.[q.id] != null);
  if (m.lessons) return m.lessons.every(l => m.lessonsDone?.includes(l.id));
  if (m.items) return m.items.every(item => itemDone(m, item));
  return true;
}

let seq = 0;
const newId = prefix => `${prefix}-${Date.now().toString(36)}-${(++seq).toString(36)}`;

function hydrate(raw, boardId, epoch, index) {
  const at = s => (s == null ? null : epoch - s * 1000);
  const proofs = Object.fromEntries(Object.entries(raw.proofs || {}).map(([k, p]) => [k, { ...p, at: at(p.agoAt ?? raw.closedAgo ?? 0) }]));
  const { ago = 600, claimedAgo, closedAgo, ...rest } = raw;
  return {
    status: 'open', points: 10, answers: {}, lessonsDone: [], ratings: [], boosted: false,
    ...rest, proofs,
    id: `${boardId}-${index}`, boardId,
    postedAt: at(ago), claimedAt: at(claimedAgo), closedAt: at(closedAgo),
    answers: { ...(raw.answers || {}) },
    lessonsDone: raw.status === 'closed' && raw.lessons ? raw.lessons.map(l => l.id) : [...(raw.lessonsDone || [])],
  };
}

export function createSimStore({ epoch = Date.now(), identity = 'Anna F. - Staff' } = {}) {
  // Industries loaded on top of the demo data: unit id → { sim, at }.
  const packs = new Map();
  const packMissions = (sim, at) => [
    ...sim.boards.flatMap(board => board.missions.map((m, i) => hydrate(m, board.id, at, i))),
    ...sim.personal.map((m, i) => ({ ...hydrate(m, 'personal', at, i), id: `personal-${sim.unit.id}-${i}` })),
  ];
  const build = () => {
    const loaded = [...packs.values()];
    return {
      epoch, identity,
      units: [...loaded.map(p => p.sim.unit).reverse(), ...UNITS],
      industry: loaded.length ? loaded[loaded.length - 1].sim.unit : null,
      boards: [...BOARDS, ...loaded.flatMap(p => p.sim.boards)].map(({ missions, ...board }) => board),
      missions: [...BOARDS.flatMap(board => board.missions.map((m, i) => hydrate(m, board.id, epoch, i))), ...loaded.flatMap(p => packMissions(p.sim, p.at))],
      events: [],
    };
  };
  let state = build();
  const listeners = new Set();
  const commit = next => { state = next; listeners.forEach(fn => fn()); };
  const patch = (id, fn) => commit({ ...state, missions: state.missions.map(m => (m.id === id ? fn(m) : m)) });
  const get = id => state.missions.find(m => m.id === id);
  const log = (events, event) => [{ id: newId('e'), at: Date.now(), ...event }, ...events].slice(0, 40);

  const api = {
    getState: () => state,
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); },
    reset: () => commit(build()),
    // Put every mission with this title back to its seed state (same id, same
    // posting time), so a scripted flow can run again.
    restoreMission(title) {
      const seeds = [...BOARDS.map(board => [board, state.epoch]), ...[...packs.values()].flatMap(p => p.sim.boards.map(board => [board, p.at]))];
      const fresh = seeds.flatMap(([board, at]) => board.missions.map((m, i) => (m.title === title ? hydrate(m, board.id, at, i) : null)).filter(Boolean));
      if (!fresh.length) return false;
      const ids = new Set(fresh.map(m => m.id));
      commit({ ...state, missions: [...state.missions.filter(m => !ids.has(m.id)), ...fresh] });
      return true;
    },
    // Add (or replace) an industry: its unit goes first in the unit list and
    // becomes the current industry; its missions are posted relative to now.
    loadPack(sim) {
      const at = Date.now();
      const id = sim.unit.id;
      packs.delete(id);
      packs.set(id, { sim, at });
      const old = new Set(state.boards.filter(b => b.unit === id).map(b => b.id));
      commit({
        ...state,
        units: [sim.unit, ...state.units.filter(u => u.id !== id)],
        industry: sim.unit,
        boards: [...state.boards.filter(b => !old.has(b.id)), ...sim.boards.map(({ missions, ...board }) => board)],
        missions: [...state.missions.filter(m => !old.has(m.boardId) && !m.id.startsWith(`personal-${id}-`)), ...packMissions(sim, at)],
      });
      return sim.unit;
    },
    get,
    claim(id, performer) {
      const m = get(id);
      if (!m || m.status !== 'open') return false;
      const at = Date.now();
      commit({ ...state, missions: state.missions.map(x => x.id === id ? { ...x, status: 'claimed', claimedAt: at, performer } : x),
        events: log(state.events, { kind: 'claim', missionId: id, boardId: m.boardId, title: m.title, performer }) });
      return true;
    },
    close(id, performer) {
      const m = get(id);
      if (!m || m.status !== 'claimed' || !canClose(m)) return null;
      const at = Date.now();
      const location = `${unitLabel(state.boards.find(b => b.id === m.boardId)?.unit, state.units)} - ${state.boards.find(b => b.id === m.boardId)?.title}`;
      const created = [];
      for (const item of m.items || []) {
        const answer = m.answers[item.id];
        const rule = item.ticketOn?.[answer];
        if (!rule) continue;
        created.push({
          type: 'Ticket', title: rule.title, points: null, status: 'open', answers: {}, lessonsDone: [], ratings: [], proofs: {},
          id: newId('t'), boardId: rule.board, postedAt: at, claimedAt: null, closedAt: null,
          trigger: { question: item.label, answer, source: m.title, sourceId: m.id, performer: performer || m.performer, location, proof: m.proofs[item.id] || null, responses: 1 },
        });
      }
      let result = null;
      const assigned = [];
      if (m.type === 'Test') {
        const right = m.questions.filter(q => m.answers[q.id] === q.correct);
        const pct = Math.round((right.length / m.questions.length) * 100);
        result = { score: right.length, pct, missed: m.questions.filter(q => m.answers[q.id] !== q.correct).map(q => q.topic) };
        for (const topic of result.missed) {
          const template = MEDIA_LIBRARY[m.assignOnFail?.[topic]];
          if (template) assigned.push({ ...template, status: 'open', answers: {}, lessonsDone: [], ratings: [], proofs: {}, boosted: false,
            id: newId('a'), boardId: 'personal', postedAt: at, claimedAt: null, closedAt: null, assignedBy: m.title });
        }
      }
      let events = log(state.events, { kind: 'close', missionId: id, boardId: m.boardId, title: m.title, performer });
      created.forEach(t => { events = log(events, { kind: 'ticket', missionId: t.id, boardId: t.boardId, title: t.title, performer: t.trigger.performer, source: m.title }); });
      if (assigned.length) events = log(events, { kind: 'assign', boardId: 'personal', title: assigned.map(a => a.title).join(', '), performer });
      commit({
        ...state, events,
        missions: [...state.missions.map(x => x.id === id ? { ...x, status: 'closed', closedAt: at, performer: x.performer || performer, closedBy: performer, result } : x), ...created, ...assigned],
      });
      return { tickets: created, assigned, result };
    },
    answer(id, itemId, value) { patch(id, m => ({ ...m, answers: { ...m.answers, [itemId]: value } })); },
    attachProof(id, itemId, proof) { patch(id, m => ({ ...m, proofs: { ...m.proofs, [itemId]: { ...proof, at: Date.now() } } })); },
    completeLesson(id, lessonId) { patch(id, m => (m.lessonsDone.includes(lessonId) ? m : { ...m, lessonsDone: [...m.lessonsDone, lessonId] })); },
    resetLessons(id, keep = []) { patch(id, m => ({ ...m, lessonsDone: m.lessonsDone.filter(l => keep.includes(l)) })); },
    rate(id, rater, score) {
      const initials = rater.split(/[\s.-]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
      patch(id, m => ({ ...m, ratings: [...m.ratings.filter(r => r.initials !== initials), { initials, name: rater, score }] }));
    },
    toggleBoost(id) { patch(id, m => ({ ...m, boosted: !m.boosted })); },
    addMission(boardId, template, by) {
      const at = Date.now();
      const mission = { status: 'open', points: 10, answers: {}, lessonsDone: [], ratings: [], proofs: {}, boosted: false, ...template,
        id: newId('r'), boardId, postedAt: at, claimedAt: null, closedAt: null, postedBy: by ? `Requested by ${by}` : template.postedBy };
      commit({ ...state, missions: [...state.missions, mission], events: log(state.events, { kind: 'request', missionId: mission.id, boardId, title: mission.title, performer: by }) });
      return mission.id;
    },
  };
  return api;
}
