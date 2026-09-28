// ---------------------------------------------------------------------------
// Industry packs — the app set up for one industry: a unit (location), three
// team boards of missions (open / claimed / closed), a ticket board the alerts
// go to, a personal training and On-Demand requests. Written in a compact form
// that people can edit (premade: lib/sim/industryPacks.mjs) and that the AI
// writes on the fly for any other industry (/api/demo-ai/industry, PACK_SCHEMA).
// toSim() turns a pack into simulator boards + raw missions (the lib/sim/data.mjs
// format) for store.loadPack().
//
// Premade always wins: the restaurant and factory from the recorded demo
// (BUILTIN, already in data.mjs), then INDUSTRY_PACKS, then generation.
// ---------------------------------------------------------------------------

export const BUILTIN = [
  { id: 'restaurant', industry: 'Restaurant & cafe', unit: 'L001', board: 'Team A', aliases: ['restaurant', 'cafe', 'café', 'coffee shop', 'coffee', 'bakery', 'qsr', 'quick service', 'fast food', 'food service', 'diner', 'bistro', 'bar', 'pizzeria', 'kitchen', 'catering', 'franchise'] },
  { id: 'manufacturing', industry: 'Food manufacturing', unit: 'P001', board: 'QC Line Inspections', aliases: ['manufacturing', 'factory', 'plant', 'production', 'food manufacturing', 'food production', 'bakery plant', 'processing plant', 'assembly', 'manufacturer'] },
];

const TYPES = ['Task', 'Checklist', 'Survey', 'Audit'];
const KINDS = ['yesno', 'number', 'text', 'photo', 'passfail'];
const str = (v, max = 120) => String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/[\u0000-\u001f<>[\]{}]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const num = v => (v === '' || v == null || !Number.isFinite(Number(v)) ? null : Number(v));
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const singular = w => (w.length > 3 ? w.replace(/ies$/, 'y').replace(/(ses|xes|ches|shes)$/, m => m.slice(0, -2)).replace(/([^s])s$/, '$1') : w);
export const industryKey = q => str(q, 60).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9& ]+/g, ' ').replace(/\b(an?|the|my|our|business|company|industry|companies|businesses|firm|shop|store|stores|sector)\b/g, ' ').replace(/\s+/g, ' ').trim().split(' ').map(singular).join(' ');

// Words that don't change the kind of business ("a hotel chain with 3 locations").
const GENERIC = new Set('chain group location local small big large franchise franchisee multi site center centre service company independent family owned new busy hour luxury boutique budget premium upscale downtown city urban rural regional national international one two three four five six ten several many few with and of in for our my we run own operate'.split(' '));
// Which premade setup (builtin or pack) answers "hotel", "a hotel chain", "gyms"…
// An alias inside a longer name only counts when the other words are generic:
// "boutique hotel" → hotel, but "dental clinic" is not a (hospital) "clinic".
export function findPremade(query, packs = []) {
  const key = industryKey(query);
  if (!key) return null;
  const words = ` ${key} `;
  let best = null;
  for (const entry of [...BUILTIN.map(b => ({ ...b, builtin: true })), ...packs]) {
    for (const alias of [entry.industry, ...(entry.aliases || [])]) {
      const a = industryKey(alias);
      if (!a) continue;
      const rest = words.includes(` ${a} `) ? words.replace(` ${a} `, ' ').trim().split(' ').filter(Boolean) : null;
      const score = words.trim() === a ? 100 + a.length : rest && rest.every(w => GENERIC.has(w) || /^\d+$/.test(w)) ? 50 + a.length : 0;
      if (score && (!best || score > best.score)) best = { entry, score };
    }
  }
  return best?.entry || null;
}

// ---- the AI's format ---------------------------------------------------------------
const S = (description, extra = {}) => ({ type: 'STRING', description, ...extra });
const ITEM = { type: 'OBJECT', properties: {
  kind: S('yesno = Yes/No question; number = a reading; text = free text; photo = take a photo; passfail = Pass/Fail', { enum: KINDS }),
  label: S('The question or step exactly as staff read it'),
  unit: S('number only: a short unit (max 6 characters), e.g. °F, #, psi, ppm, lbs, %; else empty'),
  min: { type: 'NUMBER', description: 'number only: lowest acceptable value', nullable: true },
  max: { type: 'NUMBER', description: 'number only: highest acceptable value', nullable: true },
  photo: { type: 'BOOLEAN', description: 'number only: also require a photo of the reading' },
  alertOn: S('yesno only: the answer that means a problem and raises an alert ticket; otherwise none', { enum: ['none', 'Yes', 'No'] }),
  alertTitle: S('when alertOn is set: the alert ticket title, e.g. Maintenance Alert, Safety Alert'),
  proof: S('when alertOn is set: proof required with that answer; otherwise none', { enum: ['none', 'photo', 'video'] }),
}, required: ['kind', 'label'] };
const MISSION = { type: 'OBJECT', properties: {
  type: S('Task = one action; Checklist = steps; Survey = readings / counts; Audit = inspection', { enum: TYPES }),
  title: S('2-5 words, Title Case'),
  reference: S('optional short reference such as a room, zone, vehicle or station; else empty'),
  description: S('one short sentence of instructions'),
  notice: S('one short warning shown in a red box; else empty'),
  status: S('open = waiting, claimed = in progress, closed = done', { enum: ['open', 'claimed', 'closed'] }),
  minutesAgo: { type: 'INTEGER', description: 'posted this many minutes ago, 5 to 240' },
  performer: S('claimed / closed only: first name and last initial, e.g. Maria L'),
  items: { type: 'ARRAY', items: ITEM, description: 'Checklist, Survey, Audit: 2-4 items. Task: none.' },
}, required: ['type', 'title', 'description', 'status', 'minutesAgo'] };
export const PACK_SCHEMA = { type: 'OBJECT', properties: {
  valid: { type: 'BOOLEAN', description: 'false if the request is not a real kind of business or is inappropriate' },
  industry: S('the industry in 1-3 words, Title Case, e.g. Hotel'),
  code: S('unit code: one capital letter and 001, e.g. H001'),
  name: S('a fictional, generic business name for one location (no real brand)'),
  ticketBoard: S('the board where alert tickets go, e.g. Maintenance Tickets'),
  teams: { type: 'ARRAY', description: 'exactly 3 teams / departments', minItems: 3, maxItems: 3, items: { type: 'OBJECT', properties: {
    name: S('team name, 1-3 words'),
    missions: { type: 'ARRAY', description: 'the missions asked for: most open, 1 claimed, 1 closed', items: MISSION },
  }, required: ['name', 'missions'] } },
  personal: { type: 'ARRAY', description: '1 short training for one person', minItems: 1, maxItems: 1, items: { type: 'OBJECT', properties: {
    title: S('2-4 words'),
    text: S('2-3 spoken sentences'),
    quiz: { type: 'ARRAY', description: '2 true / false statements', minItems: 2, maxItems: 2, items: { type: 'OBJECT', properties: { statement: S('a statement about the training'), answer: { type: 'BOOLEAN' } }, required: ['statement', 'answer'] } },
  }, required: ['title', 'text', 'quiz'] } },
  requests: { type: 'ARRAY', description: '4 things a team member can request from another department', minItems: 4, maxItems: 4, items: { type: 'OBJECT', properties: { type: S('', { enum: ['Task', 'Checklist'] }), title: S('2-5 words') }, required: ['type', 'title'] } },
}, required: ['valid', 'industry', 'code', 'name', 'ticketBoard', 'teams', 'personal', 'requests'] };

export function packPrompt(industry, { missions = 5 } = {}) {
  return `You create demo content for Taskmaverick, an app that runs frontline teams: missions (tasks, checklists, surveys, audits) appear on shared team boards (Open → Claimed → Closed, with live timers), staff answer questions, enter readings, take photo / video proof, and a problem answer raises an alert ticket on a ticket board. There are also personal trainings with a quiz.

Build a realistic workspace for ONE location of this kind of business: "${str(industry, 60)}".
- A fictional, generic business name (no real brands, people or places people could identify; avoid overused words like Apex, Summit, Pinnacle, Prime, Elite). Unit code: first letter of the industry + 001.
- Exactly 3 teams that really exist in that industry. Each team has exactly ${missions} missions from its typical daily work: ${missions - 2} open, 1 claimed, 1 closed. Open missions posted between 5 and 240 minutes ago, all different.
- Checklists, Surveys and Audits have 2-4 items that mix kinds: Yes/No questions, number readings, photo proof, Pass/Fail, text. Tasks have no items.
- Every number reading has a short unit and, whenever there is a safe or target range (temperatures, pressures, levels, counts against a par), its min and / or max — e.g. a fridge: unit °F, max 41; so out-of-range values get flagged.
- In at least two missions, a Yes/No item raises an alert ticket on the ticket board when answered with the problem answer (alertOn), with a clear alertTitle and a proof (video or photo).
- The personal training is 2-3 sentences, as if read aloud, with 2 true/false quiz statements.
- Plain English, short sentences, no emojis.
- If "${str(industry, 60)}" is not a real kind of business, or is offensive, set valid to false.`;
}

// Everything an AI (or a person) wrote, made safe and in range.
export function cleanPack(raw) {
  if (!raw || typeof raw !== 'object' || raw.valid === false) return null;
  const item = (it, i) => {
    const kind = KINDS.includes(it?.kind) ? it.kind : 'yesno';
    const out = { kind, label: str(it?.label, 200) || `Step ${i + 1}` };
    if (kind === 'number') {
      if (str(it.unit, 10)) out.unit = str(it.unit, 10);
      const min = num(it.min), max = num(it.max);
      if (min != null) out.min = min;
      if (max != null && (min == null || max >= min)) out.max = max;
      if (it.photo) out.photo = true;
    }
    if (kind === 'yesno' && ['Yes', 'No'].includes(it?.alertOn)) {
      out.alertOn = it.alertOn;
      out.alertTitle = str(it.alertTitle, 40) || 'Alert';
      if (['photo', 'video'].includes(it.proof)) out.proof = it.proof;
    }
    return out;
  };
  const mission = m => {
    const type = TYPES.includes(m?.type) ? m.type : 'Task';
    const out = { type, title: str(m?.title, 48) || 'Mission', status: ['open', 'claimed', 'closed'].includes(m?.status) ? m.status : 'open', minutesAgo: clamp(Math.round(num(m?.minutesAgo) ?? 30), 2, 1440) };
    for (const k of ['reference', 'description', 'notice']) if (str(m?.[k])) out[k] = str(m[k], k === 'reference' ? 40 : 220);
    if (out.status !== 'open') out.performer = str(m?.performer, 24) || 'Alex R';
    if (type !== 'Task' && Array.isArray(m?.items)) out.items = m.items.slice(0, 6).map(item);
    if (m?.aging) out.aging = true;
    return out;
  };
  const teams = (Array.isArray(raw.teams) ? raw.teams : []).slice(0, 4).map(t => ({ name: str(t?.name, 32) || 'Team', missions: (Array.isArray(t?.missions) ? t.missions : []).slice(0, 8).map(mission) })).filter(t => t.missions.length);
  if (!teams.length) return null;
  const industry = str(raw.industry, 40) || 'Business';
  return {
    industry, aliases: (Array.isArray(raw.aliases) ? raw.aliases : []).map(a => str(a, 40)).filter(Boolean).slice(0, 12),
    code: /^[A-Z]\d{3}$/.test(raw.code) ? raw.code : `${(industry.match(/[A-Za-z]/)?.[0] || 'X').toUpperCase()}001`,
    name: str(raw.name, 40) || `${industry} Demo`,
    ticketBoard: str(raw.ticketBoard, 40) || 'Alert Tickets',
    teams,
    personal: (Array.isArray(raw.personal) ? raw.personal : []).slice(0, 2).map(p => ({ title: str(p?.title, 40) || 'Training', text: str(p?.text, 600), quiz: (Array.isArray(p?.quiz) ? p.quiz : []).slice(0, 4).map(q => ({ statement: str(q?.statement, 200), answer: !!q?.answer })).filter(q => q.statement) })).filter(p => p.text),
    requests: (Array.isArray(raw.requests) ? raw.requests : []).slice(0, 6).map(r => ({ type: r?.type === 'Checklist' ? 'Checklist' : 'Task', title: str(r?.title, 40) })).filter(r => r.title),
  };
}

// A full workspace: 3 teams with at least 4 missions each.
export const isComplete = pack => !!pack && pack.teams.length >= 3 && pack.teams.every(t => t.missions.length >= 4);

// ---- into the simulator ----------------------------------------------------------------
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const PROOF_PHOTO = '/demo-quality/proofs/equipment-gauge.jpg';

// pack → { unit, boards: [{ id, kind, unit, title, requests, missions }], personal }.
// `taken` = unit codes and board titles already in the app (no clashes: a second
// "Kitchen" becomes "Hotel Kitchen").
export function toSim(pack, { codes = [], titles = [] } = {}) {
  let code = pack.code;
  while (codes.includes(code)) code = `${code[0]}${String(Number(code.slice(1)) + 1).padStart(3, '0')}`;
  const unit = { id: code, code, name: pack.name, industry: pack.industry };
  const used = new Set(titles.map(t => t.toLowerCase()));
  const unique = title => { let t = title; if (used.has(t.toLowerCase())) t = `${pack.industry} ${title}`; let n = 2; while (used.has(t.toLowerCase())) t = `${title} ${n++}`; used.add(t.toLowerCase()); return t; };
  const ticketTitle = unique(pack.ticketBoard);
  const ticketId = `${code}-tickets`;
  const mission = m => {
    const ago = m.minutesAgo * 60;
    const out = { type: m.type, points: m.type === 'Checklist' || m.type === 'Audit' ? 25 : 10, title: m.title, ago };
    if (m.reference) out.reference = m.reference;
    if (m.description) out.description = m.description;
    if (m.notice) out.notice = m.notice;
    if (m.aging) out.aging = 'standard';
    if (m.items?.length) out.items = m.items.map((it, i) => {
      const x = { id: `i${i + 1}`, kind: it.kind, label: it.label };
      if (m.type === 'Audit' && it.kind === 'yesno') x.options = ['Yes', 'No', 'N/A'];
      for (const k of ['unit', 'min', 'max', 'photo']) if (it[k] != null) x[k] = it[k];
      if (it.alertOn) {
        x.ticketOn = { [it.alertOn]: { board: ticketId, title: it.alertTitle } };
        if (it.proof) x.proofOn = { [it.alertOn]: it.proof };
      }
      return x;
    });
    if (m.status !== 'open') { out.status = m.status; out.claimedAgo = Math.max(60, Math.round(ago * 0.6)); out.performer = m.performer; }
    if (m.status === 'closed') {
      out.closedAgo = Math.max(30, Math.round(ago * 0.25));
      out.rateable = true;
      // A closed mission shows its answers (the "no problem" ones).
      out.answers = {}; out.proofs = {};
      for (const it of out.items || []) {
        if (it.kind === 'photo' || it.photo) out.proofs[it.id] = { kind: 'photo', src: PROOF_PHOTO, agoAt: out.closedAgo + 20 };
        if (it.kind === 'photo') continue;
        out.answers[it.id] = it.kind === 'yesno' ? (it.ticketOn?.Yes ? 'No' : 'Yes') : it.kind === 'passfail' ? 'Pass' : it.kind === 'text' ? 'OK' : String(it.min != null && it.max != null ? +((it.min + it.max) / 2).toFixed(1) : it.max != null ? it.max - 1 : it.min != null ? it.min + 1 : 12);
      }
    }
    return out;
  };
  const boards = pack.teams.map(t => { const title = unique(t.name); return { id: `${code}-${slug(title)}`, kind: 'team', unit: code, title, requests: pack.requests.length ? pack.requests : undefined, missions: t.missions.map(mission) }; });
  boards.push({ id: ticketId, kind: 'ticket', unit: code, title: ticketTitle, missions: [] });
  const personal = pack.personal.map((p, i) => ({
    type: 'Media', title: p.title, reference: pack.industry, points: 10, ago: 900 + i * 420,
    description: 'Please listen or read carefully. This lesson will repeat until you pass the Quiz.',
    lessons: [
      { id: 'audio', kind: 'audio', title: 'Audio', text: p.text, seconds: clamp(Math.round(p.text.split(/\s+/).length / 2.6), 6, 60) },
      ...(p.quiz.length ? [{ id: 'quiz', kind: 'quiz', title: 'Quiz', questions: p.quiz.map(q => ({ prompt: q.statement, options: ['True', 'False'], correct: q.answer ? 0 : 1 })) }] : []),
    ],
  }));
  return { unit, boards, personal };
}

// ---- generation (server side: the API route and the premade-packs script) ----------------
export async function generatePack(industry, { key, model = 'gemini-3.5-flash', signal, maxTokens = 8000, missions = 5 } = {}) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const body = thinking => JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: packPrompt(industry, { missions }) }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: PACK_SCHEMA, maxOutputTokens: maxTokens, ...(thinking ? { thinkingConfig: { thinkingLevel: 'minimal' } } : {}) },
  });
  const call = thinking => fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: body(thinking), signal });
  let res = await call(true);
  if (res.status === 400) res = await call(false);
  if (!res.ok) { const error = new Error(`Gemini ${res.status}`); error.status = res.status; error.detail = (await res.text().catch(() => '')).slice(0, 400); throw error; }
  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('');
  let raw;
  try { raw = JSON.parse(text); } catch { const error = new Error('The AI returned an unreadable workspace.'); error.status = 502; error.detail = `finish=${data.candidates?.[0]?.finishReason} length=${text.length} tail=${text.slice(-160)}`; throw error; }
  return cleanPack(raw);
}
