// The data a section's art is drawn with (the user, 2026-10-19: "make the AI use our storyboards ... change the mission names depending on the industry of the user, adding missions,
// making up schedules in precision planning plan board ... on the fly"). A stage (components/sections/*Stage.jsx) draws its art from a data object; with none it draws the board's own
// (DEFAULTS: what the storyboard was captured with, so the boards on disk do not change). The AI demo call (/demo-ai) draws the same art with the visitor's: written for their industry
// (/api/demo-ai/sections: SECTIONS_SCHEMA, sectionsPrompt, or `fromPack` at once from the workspace it set up), and changed while it talks (`applyEdit`: the [[video …]] commands).
// Only the pilot sections have data so far: Precision Planning and Requesting Maintenance (LIVE).
//   normalize(id, raw)       safe, complete data (anything missing is the default's)
//   applyEdit(id, data, c)   a [[video rename|set|add|schedule|remove …]] command -> {data, chapter (the chapter that shows it best), said} | {error}
//   describe(id, data)       what the AI is told the video shows
//
// The ids of the things the video's script points at (lib/sections/<id>.mjs: mission-opening, badge-restroom-ops, card-req, demand-maintenance-request…) never change: they are slots.
// Precision Planning: the first team's first mission is the one "planned at specific times", its second the one that "recurs", and the second team's first mission is that same mission
// with its own schedule ("the same mission for multiple teams", "customized per team"): so the two always have the same name.

export const LIVE = ['precision-planning', 'requesting-maintenance'];

const str = (v, max = 60) => String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/[\u0000-\u001f<>[\]{}|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const lower = v => String(v ?? '').toLowerCase().trim();
const slug = s => lower(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const int = (v, lo, hi) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : null; };
const same = (a, b) => lower(a) === lower(b);
const find = (list, name, key = 'name') => list.find(x => same(x[key], name)) ?? list.find(x => lower(x[key]).includes(lower(name)) && lower(name).length > 2) ?? null;

// ---- Hours of the day and the words of a schedule ----
const timeOf = h => `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`;
const listWords = words => (words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`);
// The hours, from a list ("8,12,16", [8, 12, 16]) or a rule (every 3 hours from 9 until 21). -> sorted hours 0-23 (at most 24), or null
export function hoursOf({hours, times, every, from, until} = {}) {
  const list = times ?? hours;
  if (list != null && String(list).trim()) {
    const out = [...new Set((Array.isArray(list) ? list : String(list).split(/\s*[,;]\s*|\s+(?=\d)/)).map(parseHour).filter(h => h != null))].sort((a, b) => a - b);
    return out.length ? out.slice(0, 24) : null;
  }
  const step = int(every, 1, 12);
  if (!step) return null;
  const start = parseHour(from) ?? 8, end = parseHour(until) ?? Math.min(23, start + step * 4);
  const out = [];
  for (let h = start; h <= end && out.length < 24; h += step) out.push(h);
  return out.length ? out : null;
}
// "9", "9am", "9:00 PM", "21" -> 21
function parseHour(v) {
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?$/i.exec(String(v ?? '').trim());
  if (!m) return null;
  let h = Number(m[1]);
  const half = m[3]?.[0]?.toLowerCase();
  if (half === 'p' && h < 12) h += 12;
  if (half === 'a' && h === 12) h = 0;
  return h >= 0 && h <= 23 ? h : null;
}
// What the schedule box says: three or more hours the same time apart recur ("Every 3 hours, starting at 9:00 AM"), else they are set times ("Daily at 10:00 AM and 4:00 PM").
export function ruleOf(hours) {
  const gaps = hours.slice(1).map((h, i) => h - hours[i]);
  if (hours.length >= 3 && gaps.every(g => g === gaps[0])) return `Every ${gaps[0]} hour${gaps[0] === 1 ? '' : 's'}, starting at ${timeOf(hours[0])}`;
  return `Daily at ${listWords(hours.map(timeOf))}`;
}

// ---- Precision Planning (components/sections/PlanningStage.jsx) ----
// {unit, others: [{name, teams}], teams: [{id, name, missions: [{id, name, position, hours, rule}]} (the first two: their missions are listed) | {id, name, count, hours} (the others)]}
const PLANNING = {
  unit: 'West Location',
  others: [['East Location', 5], ['North Plant', 8], ['South Plant', 7], ['Downtown Cafe', 4], ['Riverside Hotel', 9], ['Airport Kiosk', 3], ['Harbor Grill', 5]].map(([name, teams]) => ({name, teams})),
  teams: [
    {id: 'ops', name: 'Operations', missions: [
      {id: 'opening', name: 'Opening Checklist', position: 'Manager', hours: [10, 16], rule: 'Daily at 10:00 AM and 4:00 PM'},
      {id: 'restroom-ops', name: 'Restroom Cleaning', position: 'Staff', hours: [9, 12, 15, 18, 21], rule: 'Every 3 hours, starting at 9:00 AM'},
      {id: 'walk', name: 'Safety Walk', position: 'Supervisor', hours: [8, 14], rule: 'Daily at 8:00 AM and 2:00 PM'},
    ]},
    {id: 'kitchen', name: 'Kitchen', missions: [
      {id: 'restroom-kitchen', name: 'Restroom Cleaning', position: 'Staff', hours: [10, 16], rule: 'Daily at 10:00 AM and 4:00 PM'},
      {id: 'temp', name: 'Temperature Log', position: 'Cook', hours: [7, 11, 15, 19], rule: 'Every 4 hours, starting at 7:00 AM'},
    ]},
    {id: 'support', name: 'Support', count: 4, hours: [9, 10, 11, 11, 14, 15, 16]},
    {id: 'admin', name: 'Administration', count: 3, hours: [8, 9, 13, 14, 16]},
    {id: 'service', name: 'Service', count: 5, hours: [10, 11, 12, 12, 17, 18, 18, 19, 20]},
    {id: 'maintenance', name: 'Maintenance', count: 3, hours: [7, 12, 15, 16]},
  ],
};
// (the workload of a team whose missions are not listed: an hour once for each mission in it, so an hour can be there twice)
const workloadOf = list => { const out = (Array.isArray(list) ? list : []).map(h => int(h, 0, 23)).filter(h => h != null).sort((a, b) => a - b).slice(0, 40); return out.length ? out : null; };
const SLOTS = [['opening', 'restroom-ops', 'walk'], ['restroom-kitchen', 'temp']]; // (the ids of the listed teams' missions, in order: the story's slots, then the board's own)
const DETAILED = ['ops', 'kitchen'];
const OTHER_HOURS = PLANNING.teams.slice(2).map(t => t.hours); // (a workload for a team that has no missions listed: the board's own, by its place)

function normalizePlanning(raw = {}) {
  const base = PLANNING;
  const others = (Array.isArray(raw.others) ? raw.others : base.others).map(o => ({name: str(o?.name, 32), teams: int(o?.teams, 1, 12) ?? 4})).filter(o => o.name).slice(0, 8);
  const given = Array.isArray(raw.teams) ? raw.teams : base.teams;
  const ids = new Set();
  const teams = given.slice(0, 7).map((t, i) => {
    const name = str(t?.name, 32) || base.teams[i]?.name || `Team ${i + 1}`;
    let id = i < 2 ? DETAILED[i] : str(t?.id, 24) && /^[a-z0-9-]+$/.test(t.id) ? t.id : slug(name) || `team-${i + 1}`;
    while (ids.has(id) || DETAILED.includes(id) && i >= 2) id = `${id}-${i + 1}`;
    ids.add(id);
    if (i < 2) {
      const list = (Array.isArray(t?.missions) ? t.missions : []).slice(0, 7), used = new Set();
      const missions = list.map((m, j) => {
        const hours = hoursOf(m) ?? base.teams[i].missions[j]?.hours ?? [9, 15];
        let mid = SLOTS[i][j] ?? (/^[a-z0-9-]+$/.test(m?.id ?? '') && !SLOTS.flat().includes(m.id) ? m.id : `m-${slug(m?.name) || j}`);
        while (used.has(mid)) mid = `${mid}-${j}`;
        used.add(mid);
        return {id: mid, name: str(m?.name, 34) || base.teams[i].missions[j]?.name || 'Mission', position: str(m?.position, 18) || 'Staff', hours, rule: str(m?.rule, 60) || ruleOf(hours)};
      });
      while (missions.length < SLOTS[i].length) missions.push({...base.teams[i].missions[missions.length]}); // (the story's slots are always there)
      return {id, name, missions};
    }
    const hours = workloadOf(t?.hours) ?? OTHER_HOURS[(i - 2) % OTHER_HOURS.length];
    return {id, name, count: int(t?.count, 1, 20) ?? Math.max(1, Math.min(9, Math.round(hours.length / 1.7))), hours};
  });
  while (teams.length < 2) teams.push(structuredClone(base.teams[teams.length]));
  teams[1].missions[0].name = teams[0].missions[1].name; // (the same mission, scheduled for two teams)
  return {unit: str(raw.unit, 32) || base.unit, others, teams};
}

function describePlanning(d) {
  const teams = d.teams.map((t, i) => (i < 2
    ? `${t.name} (listed): ${t.missions.map(m => `"${m.name}" [${m.position}] ${m.rule}`).join('; ')}`
    : `${t.name} (${t.count} missions, not listed)`)).join(' | ');
  return `Location "${d.unit}" (others: ${d.others.map(o => o.name).join(', ')}). Teams: ${teams}. "${d.teams[0].missions[0].name}" is the set-times example, "${d.teams[0].missions[1].name}" the recurring one, also scheduled for ${d.teams[1].name} at its own times.`;
}

function editPlanning(d, c) {
  const data = structuredClone(d), listed = data.teams.slice(0, 2);
  const missionOf = name => { for (const t of listed) { const m = find(t.missions, name); if (m) return {team: t, mission: m}; } return null; };
  const chapterOf = team => (team === listed[0] ? 'missions' : 'multiple');
  if (c.cmd === 'add') {
    const name = str(c.mission ?? c.name ?? c.arg, 34);
    if (!name) return {error: 'add needs mission=<name>'};
    const team = c.team ? find(data.teams, c.team) : listed[0];
    const hours = hoursOf(c) ?? [9, 15];
    if (!team) { // a team that is not on the board: added, with its workload (it is not one of the two whose missions are listed)
      if (data.teams.length >= 7) return {error: `no team "${c.team}" (teams: ${data.teams.map(t => t.name).join(', ')})`};
      data.teams.push({id: `team-${slug(c.team) || data.teams.length + 1}`, name: str(c.team, 32), count: 1, hours});
      return {data: normalizePlanning(data), chapter: 'distribution', said: `added the team ${str(c.team, 32)} with ${name}`};
    }
    if (!team.missions) { team.count += 1; team.hours = [...team.hours, ...hours].sort((a, b) => a - b); return {data: normalizePlanning(data), chapter: 'distribution', said: `${team.name} has one more mission (${name}); its missions are not listed, its workload shows it`}; }
    if (team.missions.length >= 7) return {error: `${team.name} has too many missions to show`};
    team.missions.push({id: `m-${slug(name)}`, name, position: str(c.position, 18) || 'Staff', hours, rule: ruleOf(hours)});
    return {data: normalizePlanning(data), chapter: chapterOf(team), said: `added ${name} to ${team.name} (${ruleOf(hours)})`};
  }
  if (c.cmd === 'schedule') {
    const hours = hoursOf(c), hit = missionOf(c.mission ?? c.name ?? c.arg ?? '');
    if (!hit) return {error: `no listed mission "${c.mission ?? c.arg}"`};
    if (!hours) return {error: 'schedule needs times=8,12,16 or every=3; from=9; until=21'};
    hit.mission.hours = hours; hit.mission.rule = ruleOf(hours);
    return {data: normalizePlanning(data), chapter: chapterOf(hit.team), said: `${hit.mission.name} on ${hit.team.name}: ${hit.mission.rule}`};
  }
  if (c.cmd === 'remove') {
    const hit = missionOf(c.mission ?? c.name ?? c.arg ?? '');
    if (!hit) return {error: `no listed mission "${c.mission ?? c.arg}"`};
    if (SLOTS.flat().includes(hit.mission.id)) return {error: `${hit.mission.name} is one the video explains with: rename it or schedule it instead`};
    hit.team.missions = hit.team.missions.filter(m => m !== hit.mission);
    return {data: normalizePlanning(data), chapter: chapterOf(hit.team), said: `removed ${hit.mission.name}`};
  }
  if (c.cmd === 'set') {
    if (c.unit ?? c.location) { data.unit = str(c.unit ?? c.location, 32); return {data: normalizePlanning(data), chapter: 'units', said: `the location is ${data.unit}`}; }
    if (c.position && c.mission) { const hit = missionOf(c.mission); if (!hit) return {error: `no listed mission "${c.mission}"`}; hit.mission.position = str(c.position, 18); return {data: normalizePlanning(data), chapter: chapterOf(hit.team), said: `${hit.mission.name} is for ${hit.mission.position}`}; }
    return {error: 'set takes unit=<name>, or mission=<name>; position=<role>'};
  }
  return null;
}

// ---- Requesting Maintenance (components/sections/MaintenanceStage.jsx) ----
// {team, area, board: [{id, title, type}] (2 open, 1 claimed, 1 closed, then more open), demand: [{type, title}] (the On-Demand list, the request goes 4th), request, instructions, problem,
//  ticketBoard, ticket, others: [{id, title, problem, area, time}], evidence, people: [first poster, second, the one who answers, a fourth]}
const MAINTENANCE = {
  team: 'Kitchen Team', area: 'Kitchen',
  board: [{id: 'sanitize', title: 'Sanitize Surfaces', type: 'Task'}, {id: 'ketchup', title: 'Stock Ketchup', type: 'Task'}, {id: 'coffee', title: 'Brew Coffee', type: 'Task'}, {id: 'utensils', title: 'Utensils Restock', type: 'Checklist'}],
  demand: [{type: 'Task', title: '10-Min Break AM'}, {type: 'Survey', title: 'All Cheese Crepe Waste'}, {type: 'Checklist', title: 'Business Card Inventory'}, {type: 'Checklist', title: 'Chef Coat Inventory'}],
  request: 'Maintenance Request', instructions: 'Tell us what needs to be fixed.',
  problem: 'The walk-in cooler door will not close properly.',
  ticketBoard: 'Maintenance', ticket: 'Maintenance Alert',
  others: [
    {id: 'light', title: 'Light Alert', problem: 'Two lights are out in the dining room.', area: 'Dining Room'},
    {id: 'faucet', title: 'Leak Alert', problem: 'The hand sink faucet is leaking.', area: 'Kitchen'},
    {id: 'latch', title: 'Door Alert', problem: 'The storage door latch is broken.', area: 'Storage'},
  ],
  evidence: 'Damaged door hinge',
  people: ['Anna F', 'Ben R', 'Carla M', 'Leo T'],
};
const TYPES = ['Task', 'Checklist', 'Survey', 'Audit'];
const typeOf = v => TYPES.find(t => same(t, v)) ?? 'Task';
const ID = /^[a-z0-9-]+$/;
function normalizeMaintenance(raw = {}) {
  const base = MAINTENANCE, used = new Set(['req', 'ticket']);
  const idOf = (want, title, i) => { let id = ID.test(want ?? '') ? want : `${slug(title) || 'm'}-${i}`; while (used.has(id)) id = `${id}-${i}`; used.add(id); return id; };
  const board = (Array.isArray(raw.board) ? raw.board : base.board).slice(0, 7).map((m, i) => ({id: idOf(m?.id ?? base.board[i]?.id, m?.title, i), title: str(m?.title, 48) || base.board[i]?.title || 'Mission', type: typeOf(m?.type)}));
  while (board.length < 4) board.push({...base.board[board.length]});
  const demand = (Array.isArray(raw.demand) ? raw.demand : base.demand).slice(0, 6).map(r => ({type: typeOf(r?.type), title: str(r?.title, 40)})).filter(r => r.title);
  const others = (Array.isArray(raw.others) ? raw.others : base.others).slice(0, 3).map((t, i) => ({id: idOf(t?.id ?? base.others[i]?.id, t?.title, i), title: str(t?.title, 24) || base.others[i].title, problem: str(t?.problem, 70) || base.others[i].problem, area: str(t?.area, 22) || base.others[i].area}));
  while (others.length < 3) others.push({...base.others[others.length]});
  const people = (Array.isArray(raw.people) ? raw.people : base.people).map(p => str(p, 16)).filter(Boolean).slice(0, 4);
  while (people.length < 4) people.push(base.people[people.length]);
  const one = (key, max) => str(raw[key], max) || base[key];
  return {team: one('team', 32), area: one('area', 32), board, demand, request: one('request', 30), instructions: one('instructions', 80), problem: one('problem', 90), ticketBoard: one('ticketBoard', 32), ticket: one('ticket', 26), others, evidence: one('evidence', 30), people};
}
function describeMaintenance(d) {
  return `Team board "${d.team}" (area ${d.area}): ${d.board.map(m => `"${m.title}"`).join(', ')}. On-Demand list: ${[...d.demand.slice(0, 3), {title: d.request}, ...d.demand.slice(3)].map(r => `"${r.title}"`).join(', ')}. The request "${d.request}" asks "${d.instructions}"; the issue: "${d.problem}" (the evidence video shows a damaged door hinge). It raises "${d.ticket}" on the "${d.ticketBoard}" ticket board (other tickets: ${d.others.map(t => `"${t.title}"`).join(', ')}). People: ${d.people.join(', ')}.`;
}
const SETTABLE = {team: 32, area: 32, request: 30, instructions: 80, problem: 90, ticketBoard: 32, ticket: 26, evidence: 30};
const CHAPTER = {team: 'list', area: 'list', request: 'list', instructions: 'document', problem: 'document', ticketBoard: 'evidence', ticket: 'evidence', evidence: 'evidence'};
function editMaintenance(d, c) {
  const data = structuredClone(d);
  if (c.cmd === 'add') {
    if (c.request) { if (data.demand.length >= 6) return {error: 'the On-Demand list is full'}; data.demand.push({type: typeOf(c.type), title: str(c.request, 40)}); return {data: normalizeMaintenance(data), chapter: 'list', said: `${str(c.request, 40)} is in the On-Demand list`}; }
    const title = str(c.mission ?? c.name ?? c.arg, 48);
    if (!title) return {error: 'add needs mission=<title> (a card on the board) or request=<title> (the On-Demand list)'};
    if (data.board.length >= 7) return {error: 'the board is full'};
    data.board.splice(2, 0, {id: `m-${slug(title)}`, title, type: typeOf(c.type)}); // (with the open ones)
    return {data: normalizeMaintenance(data), chapter: 'list', said: `${title} is on the ${data.team} board`};
  }
  if (c.cmd === 'remove') {
    const name = c.mission ?? c.request ?? c.name ?? c.arg ?? '';
    const m = find(data.board.slice(2, -2), name, 'title'); // (only a card added among the open ones: the video's own four tell the story)
    if (m) { data.board = data.board.filter(x => x !== m); return {data: normalizeMaintenance(data), chapter: 'list', said: `removed ${m.title}`}; }
    const r = find(data.demand, name, 'title');
    if (r && data.demand.length > 2) { data.demand = data.demand.filter(x => x !== r); return {data: normalizeMaintenance(data), chapter: 'list', said: `removed ${r.title} from the On-Demand list`}; }
    return {error: `nothing removable named "${name}"`};
  }
  if (c.cmd === 'set') {
    const key = Object.keys(SETTABLE).find(k => c[k] != null || c[k.toLowerCase()] != null);
    if (!key) return {error: `set takes one of ${Object.keys(SETTABLE).join(', ')}`};
    data[key] = str(c[key] ?? c[key.toLowerCase()], SETTABLE[key]);
    return {data: normalizeMaintenance(data), chapter: CHAPTER[key], said: `${key} is "${data[key]}"`};
  }
  return null;
}

// ---- All of them ----
export const DEFAULTS = {'precision-planning': PLANNING, 'requesting-maintenance': MAINTENANCE};
const NORMALIZE = {'precision-planning': normalizePlanning, 'requesting-maintenance': normalizeMaintenance};
const DESCRIBE = {'precision-planning': describePlanning, 'requesting-maintenance': describeMaintenance};
const EDIT = {'precision-planning': editPlanning, 'requesting-maintenance': editMaintenance};
export const normalize = (id, raw) => (NORMALIZE[id] ? NORMALIZE[id](raw ?? {}) : null);
export const describe = (id, data) => DESCRIBE[id]?.(data ?? normalize(id)) ?? '';

// Every name in the data that is `from` becomes `to` (a mission, a team, a location, a position, a person, the request...): the same words wherever they are.
function renameAll(value, from, to) {
  if (typeof value === 'string') return same(value, from) ? to : value;
  if (Array.isArray(value)) return value.map(v => renameAll(v, from, to));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, k === 'id' ? v : renameAll(v, from, to)]));
  return value;
}
// Where a name is seen best, for a rename.
function chapterOfName(id, data, name) {
  if (id === 'precision-planning') {
    if (same(data.unit, name) || data.others.some(o => same(o.name, name))) return 'units';
    if (data.teams.some(t => same(t.name, name))) return 'teams';
    if (data.teams[1].missions.some(m => same(m.name, name) || same(m.position, name))) return data.teams[0].missions.some(m => same(m.name, name)) ? 'missions' : 'multiple';
    return 'missions';
  }
  if (data.board.some(m => same(m.title, name)) || data.demand.some(r => same(r.title, name)) || same(data.team, name) || same(data.request, name)) return 'list';
  if (same(data.ticket, name) || same(data.ticketBoard, name) || data.others.some(t => same(t.title, name)) || data.people.some(p => same(p, name))) return 'evidence';
  return 'document';
}
export function applyEdit(id, data, c) {
  if (!NORMALIZE[id]) return {error: `the ${id} video has no data to change`};
  const d = normalize(id, data);
  if (c.cmd === 'rename') {
    const from = str(c.from ?? c.old, 40), to = str(c.to ?? c.new, 34);
    if (!from || !to) return {error: 'rename needs from=<name>; to=<name>'};
    const next = renameAll(d, from, to);
    if (JSON.stringify(next) === JSON.stringify(d)) return {error: `nothing is named "${from}" in the video`};
    const out = normalize(id, next);
    return {data: out, chapter: chapterOfName(id, out, to), said: `"${from}" is now "${to}"`};
  }
  return EDIT[id](d, c) ?? {error: `${c.cmd} is not something the ${id} video can do`};
}

// ---- From the workspace the call set up (lib/sim/packs.mjs), at once: the names it has, the board's own schedules ----
export function fromPack(pack) {
  if (!pack?.teams?.length) return null;
  const [a, b = a, c = a] = pack.teams, titles = t => t.missions.map(m => m.title);
  const pick = (list, i, fallback) => list[i] ?? fallback;
  const planning = {
    unit: pack.name,
    others: PLANNING.others.map((o, i) => ({name: `${pack.industry} ${['East', 'North', 'South', 'Downtown', 'Riverside', 'Airport', 'Harbor'][i]}`, teams: o.teams})).slice(0, 6),
    teams: [
      {name: a.name, missions: [0, 1, 2].map(i => ({...PLANNING.teams[0].missions[i], id: undefined, rule: undefined, name: pick(titles(a), i, PLANNING.teams[0].missions[i].name)}))},
      {name: b === a ? 'Second Shift' : b.name, missions: [0, 1].map(i => ({...PLANNING.teams[1].missions[i], id: undefined, rule: undefined, name: i === 0 ? '' : pick(titles(b), 1, PLANNING.teams[1].missions[1].name)}))},
      {name: c === a ? 'Support' : c.name, count: Math.max(2, c.missions.length)},
      {name: 'Administration'}, {name: 'Service'}, {name: 'Maintenance'},
    ],
  };
  const team = a.missions, open = team.filter(m => m.status === 'open'), claimed = team.find(m => m.status === 'claimed'), closed = team.find(m => m.status === 'closed');
  const board = [open[0], open[1], claimed, closed].map((m, i) => (m ? {title: m.title, type: m.type} : MAINTENANCE.board[i]));
  const people = [...new Set(pack.teams.flatMap(t => t.missions.map(m => m.performer)).filter(Boolean))];
  const maintenance = {team: a.name, area: a.name.replace(/\s+(team|crew|staff|department)$/i, ''), board, demand: (pack.requests ?? []).slice(0, 4).map(r => ({type: r.type, title: r.title})), ticketBoard: pack.ticketBoard.replace(/\s+tickets?$/i, '') || 'Maintenance', people: people.length >= 2 ? [...people, ...MAINTENANCE.people].slice(0, 4) : undefined};
  return {'precision-planning': normalizePlanning(planning), 'requesting-maintenance': normalizeMaintenance(maintenance)};
}

// ---- Written by the AI for an industry (/api/demo-ai/sections) ----
const S = (description, extra = {}) => ({type: 'STRING', description, ...extra});
const HOURS = description => ({type: 'ARRAY', description, items: {type: 'INTEGER'}});
const PLAN_MISSION = {type: 'OBJECT', properties: {name: S('2-4 words, Title Case'), position: S('the role that does it, 1-2 words, e.g. Manager, Staff, Nurse, Guard')}, required: ['name', 'position']};
export const SECTIONS_SCHEMA = {type: 'OBJECT', properties: {
  planning: {type: 'OBJECT', description: 'a planning dashboard: locations, their teams, the missions scheduled by the hour', properties: {
    location: S('the location a manager opens, a short branch name, e.g. "West Location", "Downtown Branch"'),
    otherLocations: {type: 'ARRAY', description: '6 other locations of the same business', items: {type: 'OBJECT', properties: {name: S('short branch name'), teams: {type: 'INTEGER', description: '2 to 9'}}, required: ['name', 'teams']}},
    teams: {type: 'ARRAY', description: 'exactly 6 teams / departments of that location', items: S('team name, 1-2 words')},
    specific: {...PLAN_MISSION, description: 'a mission of team 1 done at two set times of the day'},
    specificTimes: HOURS('the 2 hours of the day (0-23) it is done, e.g. [10, 16]'),
    recurring: {...PLAN_MISSION, description: 'a mission of team 1 that recurs every few hours, and that team 2 ALSO does (at set times)'},
    everyHours: {type: 'INTEGER', description: 'it recurs every 2 to 4 hours'},
    startHour: {type: 'INTEGER', description: 'first hour it is done, 6 to 10'},
    sharedTimes: HOURS('the 2 hours team 2 does that same recurring mission, e.g. [10, 16]'),
    third: {...PLAN_MISSION, description: 'another mission of team 1, at two set times'},
    thirdTimes: HOURS('its 2 hours'),
    fourth: {...PLAN_MISSION, description: 'another mission of team 2, recurring every 4 hours from early morning'},
  }, required: ['location', 'otherLocations', 'teams', 'specific', 'specificTimes', 'recurring', 'everyHours', 'startHour', 'sharedTimes', 'third', 'thirdTimes', 'fourth']},
  maintenance: {type: 'OBJECT', description: 'a team board where a staff member requests maintenance', properties: {
    team: S('the team board name, e.g. "Kitchen Team", "Front Desk"'),
    area: S('the area that team works in, 1-2 words, e.g. Kitchen, Lobby'),
    missions: {type: 'ARRAY', description: '4 everyday missions of that team', items: {type: 'OBJECT', properties: {title: S('2-3 words, Title Case'), type: S('', {enum: TYPES})}, required: ['title', 'type']}},
    requests: {type: 'ARRAY', description: '4 things that team can request on demand (not maintenance)', items: {type: 'OBJECT', properties: {title: S('2-4 words'), type: S('', {enum: TYPES})}, required: ['title', 'type']}},
    problem: S('one short sentence: a door in that area that will not close properly (the video evidence shows a damaged door hinge)'),
    ticketBoard: S('the department maintenance alerts go to, 1-2 words, e.g. Maintenance, Facilities, Engineering'),
    otherTickets: {type: 'ARRAY', description: '3 other open alert tickets of that department', items: {type: 'OBJECT', properties: {title: S('2 words ending in Alert, e.g. Leak Alert'), problem: S('one short sentence'), area: S('1-2 words')}, required: ['title', 'problem', 'area']}},
    people: {type: 'ARRAY', description: '4 staff names: first name and last initial, e.g. Maria L', items: S('')},
  }, required: ['team', 'area', 'missions', 'requests', 'problem', 'ticketBoard', 'otherTickets', 'people']},
}, required: ['planning', 'maintenance']};

export function sectionsPrompt(industry, pack = null) {
  const known = pack ? `\nThe workspace already set up for it (reuse its names where they fit): business "${str(pack.name, 40)}", teams ${pack.teams.map(t => `"${str(t.name, 28)}" (${t.missions.map(m => str(m.title, 34)).join(', ')})`).join('; ')}; ticket board "${str(pack.ticketBoard, 40)}"; On-Demand requests ${(pack.requests ?? []).map(r => `"${str(r.title, 30)}"`).join(', ')}.` : '';
  return `You write demo data for two short product videos of Taskmaverick (software that runs frontline teams) for this kind of business: "${str(industry, 60)}".${known}
1. A planning dashboard: the manager opens one location, sees its 6 teams and how their work is spread over the hours of the day, opens team 1 to see its scheduled missions (one at two set times, one that recurs every few hours, one more), and sees that the recurring mission is also scheduled for team 2 at set times.
2. A maintenance request: a team member taps + on the team's board, picks "Maintenance Request" from the On-Demand list, describes a door that will not close, and an alert ticket goes to the maintenance department.
Realistic for that industry, plain English, short Title Case names, fictional people (first name + last initial), no real brands, no emojis. Hours are 0-23 (24-hour clock).`;
}

// What the AI wrote, as the sections' data (anything missing or wrong is the default's). -> {'precision-planning': data, 'requesting-maintenance': data}
export function cleanSections(raw, pack = null) {
  const fallback = fromPack(pack) ?? {'precision-planning': normalizePlanning(), 'requesting-maintenance': normalizeMaintenance()};
  const p = raw?.planning, m = raw?.maintenance, out = {...fallback};
  if (p && typeof p === 'object') {
    const two = list => { const h = hoursOf({times: list}); return h && h.length >= 2 ? h.slice(0, 3) : null; };
    const every = int(p.everyHours, 2, 4) ?? 3, start = int(p.startHour, 5, 11) ?? 9;
    const names = (Array.isArray(p.teams) ? p.teams : []).map(t => str(t, 28)).filter(Boolean).slice(0, 6);
    const base = fallback['precision-planning'];
    const team = i => names[i] ?? base.teams[i]?.name;
    out['precision-planning'] = normalizePlanning({
      unit: p.location,
      others: Array.isArray(p.otherLocations) ? p.otherLocations : base.others,
      teams: [
        {name: team(0), missions: [
          {name: p.specific?.name, position: p.specific?.position, hours: two(p.specificTimes) ?? [10, 16]},
          {name: p.recurring?.name, position: p.recurring?.position, every, from: start, until: Math.min(21, start + every * 4)},
          {name: p.third?.name, position: p.third?.position, hours: two(p.thirdTimes) ?? [8, 14]},
        ]},
        {name: team(1), missions: [
          {name: p.recurring?.name, position: p.recurring?.position, hours: two(p.sharedTimes) ?? [10, 16]},
          {name: p.fourth?.name, position: p.fourth?.position, every: 4, from: 7, until: 19},
        ]},
        ...[2, 3, 4, 5].map(i => ({name: team(i)})),
      ],
    });
  }
  if (m && typeof m === 'object') {
    const base = fallback['requesting-maintenance'];
    out['requesting-maintenance'] = normalizeMaintenance({
      team: m.team, area: m.area,
      board: Array.isArray(m.missions) && m.missions.length >= 4 ? m.missions.slice(0, 4).map(x => ({title: x?.title, type: x?.type})) : base.board,
      demand: Array.isArray(m.requests) && m.requests.length ? m.requests : base.demand,
      problem: m.problem, ticketBoard: m.ticketBoard,
      others: Array.isArray(m.otherTickets) ? m.otherTickets : base.others,
      people: Array.isArray(m.people) && m.people.length >= 2 ? m.people : base.people,
    });
  }
  return out;
}
