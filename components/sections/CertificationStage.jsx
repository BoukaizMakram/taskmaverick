'use client';
// Automated Certification's art for the section videos (lib/sections/automated-certification.mjs). ONLY the product's own screens (the user, 2026-10-20: "use real mission's UI"; nothing
// invented): the mission cards (MissionChip, as FlowPart draws them), the phone's Personal Board (PhoneShell), the Mission Details of a phone (MissionPanel's look), Certifications
// (tm/31, tm/33: Certificate › Courses › missions, Validity, Notification Period) and People › People Certifications (tm/39). The certificate itself is a DOCUMENT, not the product:
// it is drawn as a paper certificate, on its own, outside any Taskmaverick screen (the business that issues it, not the product, at its top). What joins them (the purple arrows, the
// dates written on them, the check and the X) is the diagram's own, as the other sections' FlowPart draws its connectors and labels.
// The diagram is ONE layer whose pieces are all always drawn (what a scene does not show is faded out where it will come): the video moves it from one scene to the next.
import {useLayoutEffect, useRef} from 'react';
import PhoneShell, {IconBack} from '../PhoneShell';
import MissionChip from '../MissionChip';
import {AVATAR} from './parts';
import {NAV} from '../DataReport';
import './automated-certification.css';

export const CERTIFICATION_BASE = {view: 'cert', scene: 'cert', date: 0, phone: 'empty', certBadge: null, courseBadge: null, missed: false, doc: 'ask', scrollTo: 'top', expand: 1, level: 0, openB: true, renewTitle: 'Renew Certificate', renewKind: 'Task'};

// ---- the certificate: a paper document (also drawn by Learning Efficiency: LearningStage.jsx). The paper, its border and its seal are a photograph (automated-certification.css) ----
const Tick = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5.5 12.5 4.3 4.3L18.5 8" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const Cross = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"/></svg>;
// the check (kept) and the X (expired) of the diagram: both always there, one shown
export function Badges({mark, prefix}) {
  return <>
    <span className="sec-ac-badge is-ok" data-t={`${prefix}-ok`} style={{opacity: mark === 'ok' ? 1 : 0, transform: `scale(${mark === 'ok' ? 1 : 0.4})`}}><Tick/></span>
    <span className="sec-ac-badge is-x" data-t={`${prefix}-x`} style={{opacity: mark === 'x' ? 1 : 0, transform: `scale(${mark === 'x' ? 1 : 0.4})`}}><Cross/></span>
  </>;
}
export function Certificate({name = 'Anna F', title = 'Food Safety Certification', issuer = 'Riverside Bakery', issued = '09-23-2026', expires = '09-23-2027', badge = null, expired = false, prefix = 'cert'}) {
  return <div className="sec-ac-cert" data-t={prefix}>
    <div className="sec-ac-cert-frame">
      <b className="sec-ac-cert-issuer">{issuer}</b>
      <small className="sec-ac-cert-eyebrow">Certificate of Completion</small>
      <h2>{title}</h2>
      <p>This certifies that</p>
      <b className="sec-ac-cert-name">{name}</b>
      <p>has completed every course this certification requires.</p>
      <footer>
        <div data-t={`${prefix}-issued`}><small>Issued</small><b>{issued}</b></div>
        <div className={expired ? 'is-expired' : undefined} data-t={`${prefix}-expires`}><small>{expired ? 'Expired' : 'Expires'}</small><b>{expires}</b></div>
      </footer>
    </div>
    <Badges mark={badge} prefix={prefix}/>
  </div>;
}

// ---- the pieces of the diagram ----
// a mission card on its own (the cards of FlowPart: the board's chip, the same wrapper)
function Card({m}) {
  return <div className="mi-interactive mi-interactive--tablet mi-reference iq2-iso sec-ac-chip"><div className="mi-tablet-board iq2-iso-board"><div className="iq2-iso-stack" style={{width: 334}}>
    <MissionChip kind={m.kind} points={m.points ?? null} title={m.title} who={m.who} avatar={m.avatar} date={m.date ?? '09-23-26'} time={m.time ?? '08:00 AM'} showExec={m.exec != null} execTime={m.exec} pillTime={m.pill ?? '00:00:00'} pillClass={`chip--${m.tone ?? 'green'}`}/>
  </div></div></div>;
}
const Arrow = ({dir}) => <svg className="sec-ac-head" viewBox="0 0 12 12" style={{transform: `rotate(${{right: 0, down: 90, left: 180, up: 270}[dir] ?? 0}deg)`}} aria-hidden="true"><path d="M1.5 1.5 10 6l-8.5 4.5" fill="none" stroke="#7b3cf0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;

// ---- what the diagram holds, and where each piece is in each scene ----
const CERT = {w: 560, h: 396}, CHIP = {w: 334, h: 130}, PHONE = {w: 300, h: 627};
export const COURSE_A = {title: 'Course A: Food Handling', missions: {
  a1: {kind: 'Media', points: 10, title: 'Handwashing Basics'},
  a2: {kind: 'Media', points: 10, title: 'Safe Food Temperatures'},
  a3: {kind: 'Test', points: 20, title: 'Cross-Contamination'},
}};
const ITEMS = ['cert', 'renew', 'renew-when', 'course', 'a1', 'a2', 'a3', 'when', 'phone'];
const LINES = ['renew', 'to-course', 'assign'];
const HEADS = {renew: 'right', 'to-course': 'down', assign: 'right'};
const SCENES = ['cert', 'renew', 'assignC', 'assignL'];
function sceneLayout(scene) {
  const P = {}, L = {};
  const put = (id, x, y, s = 1) => { P[id] = {x, y, s}; };
  if (scene === 'cert') put('cert', 0, 0, 1);
  if (scene === 'renew') { // the certificate, an arrow with the date it is raised on, the renewal mission
    const k = 0.64, w = CERT.w * k, mid = CERT.h * k / 2, chipX = w + 250, ck = 1.1, a = w + 16, b = chipX - 12;
    put('cert', 0, 0, k); put('renew', chipX, mid - CHIP.h * ck / 2, ck); put('renew-when', (a + b) / 2 - 110, mid - 64);
    L.renew = [a, mid, b, mid];
  }
  if (scene === 'assignC' || scene === 'assignL') { // the certificate over Course A and its missions, the date on the arrow, the phone
    const mk = 0.66, cw = CHIP.w * mk, ch = CHIP.h * mk, lx = cw / 2, ck = 0.42, top = CERT.h * ck, label = top + 46, y0 = label + 40;
    put('cert', lx - CERT.w * ck / 2, 0, ck); put('course', lx - 140, label);
    L['to-course'] = [lx, top + 8, lx, label - 8];
    ['a1', 'a2', 'a3'].forEach((id, i) => put(id, 0, y0 + i * 96, mk));
    const my = scene === 'assignL' ? y0 + 96 + ch / 2 : y0 + (192 + ch) / 2, a = cw + 14, px = cw + 270;
    L.assign = [a, my, px - 14, my];
    put('when', (a + px - 14) / 2 - 115, my - 72); put('phone', px, my - PHONE.h / 2);
  }
  return {P, L};
}
const LAYOUTS = Object.fromEntries(SCENES.map(s => [s, sceneLayout(s)]));
// Each scene's pieces, and the ones it does not show where they come next (or were last): they fade in and out in place, moved with the rest
function layoutOf(s) {
  const own = LAYOUTS[s.scene] ?? LAYOUTS.cert, i = SCENES.indexOf(s.scene), order = [...SCENES.slice(i + 1), ...SCENES.slice(0, i).reverse()];
  const lesson = s.scene === 'assignL';
  const shown = id => { // 1 shown, 0.4 shown faintly (the course's other missions while one lesson is reassigned), 0 not
    if (!own.P[id]) return 0;
    if (/^assign/.test(s.scene) && id === 'when') return s.date ? 1 : 0;
    if (lesson && (id === 'a1' || id === 'a3')) return 0.4;
    return 1;
  };
  const P = {}, L = {};
  for (const id of ITEMS) { const from = own.P[id] ? own : LAYOUTS[order.find(k => LAYOUTS[k].P[id])] ?? own; P[id] = {...(from.P[id] ?? {x: 0, y: 0, s: 1}), o: shown(id)}; }
  for (const id of LINES) { const from = own.L[id] ? own : LAYOUTS[order.find(k => LAYOUTS[k].L[id])] ?? own; L[id] = {seg: from.L[id] ?? [0, 0, 0, 0], o: !own.L[id] ? 0 : id === 'assign' ? (s.date ? 1 : 0) : 1}; }
  return {P, L, lesson};
}

// ---- the phone of the person the course (or the lesson) is assigned to: the Personal Board ----
function Phone({s, lesson}) {
  const list = lesson ? ['a2'] : ['a1', 'a2', 'a3'], st = s.phone, n = st === 'empty' ? 0 : list.length;
  const tabs = [{label: `Open - ${st === 'posted' || st === 'late' ? n : 0}`, active: st !== 'done'}, {label: 'Claimed - 0'}, {label: `Closed - ${st === 'done' ? n : 0}`, active: st === 'done'}];
  const EXEC = ['00:02:41', '00:03:05', '00:04:12'];
  return <div className="ph-fit adx-phone sec-ac-phone"><PhoneShell title="Personal Board" tabs={tabs}>
    {[0, 1, 2].map(j => {
      const id = list[j], m = id ? COURSE_A.missions[id] : null, on = !!m && st !== 'empty';
      const card = !m ? {title: ''} : st === 'done' ? {exec: EXEC[j], pill: ['00:05:12', '00:06:40', '00:07:02'][j], tone: 'gray', avatar: AVATAR.anna, who: 'Anna F'} : st === 'late' ? {pill: '04:12:09', tone: 'red', days: 30} : {pill: '00:00:00', tone: 'green'};
      return <div className="es-phone-mission sec-ac-phone-card" key={j} data-t={`phone-${j}`} style={{opacity: on ? 1 : 0, transform: `translateY(${on ? 0 : 14}px) scale(${on ? 1 : 0.92})`, height: on ? 'auto' : 0, overflow: 'hidden'}}>
        <MissionChip kind={m?.kind ?? 'Media'} points={m?.points ?? 10} title={m?.title ?? ''} who={card.who} avatar={card.avatar} date={lesson ? '12-08-26' : '08-24-27'} time="08:00 AM" showExec={card.exec != null} execTime={card.exec} pillTime={card.pill ?? '00:00:00'} pillClass={`chip--${card.tone ?? 'green'}`} days={card.days ?? 0}/>
      </div>;
    })}
  </PhoneShell></div>;
}

function Diagram({s}) {
  const root = useRef(null);
  const {P, L, lesson} = layoutOf(s);
  // the shown pieces are one group, centered on the plate (x 521, y 450), again in every scene
  useLayoutEffect(() => {
    const el = root.current, inner = el?.querySelector('.sec-ac-inner');
    if (!inner) return;
    inner.style.transform = 'none';
    const K = el.getBoundingClientRect().width / (el.offsetWidth || 1) || 1, o = el.getBoundingClientRect();
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    for (const n of inner.querySelectorAll('[data-on="1"]')) { const q = (n.dataset.chip ? n.querySelector('.chip') ?? n : n).getBoundingClientRect(); // (a card is as wide as its chip: its wrapper is the 1080 px board it is drawn on)
      if (q.width < 2 && q.height < 2) continue; l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom); }
    if (!isFinite(l)) return;
    const dx = 521 - ((l + r) / 2 - o.left) / K, dy = 450 - ((t + b) / 2 - o.top) / K;
    inner.style.transform = `translate(${Math.round(dx * 10) / 10}px, ${Math.round(dy * 10) / 10}px)`;
  });
  useLayoutEffect(() => { // (what the cursor goes to or an outline goes round has its name only while it is shown: a piece faded out where it will come is not pointed at)
    const el = root.current;
    if (!el) return;
    el.querySelectorAll('[data-chip]').forEach(n => { const chip = n.querySelector('.chip'); if (chip) chip.dataset.t = n.dataset.chip; });
    el.querySelectorAll('[data-t]').forEach(n => { if (n.closest('[data-on]')?.dataset.on === '0') n.removeAttribute('data-iq-target'); else n.setAttribute('data-iq-target', n.dataset.t); });
  });
  const at = id => { const p = P[id]; return {'data-on': p.o ? '1' : '0', style: {left: p.x, top: p.y, transform: `scale(${p.s * (p.o ? 1 : 0.94)})`, opacity: p.o, visibility: p.o ? 'visible' : 'hidden'}}; };
  const renew = {kind: s.renewKind, points: 10, title: s.renewTitle, who: 'Anna F', avatar: AVATAR.anna, pill: '00:00:00', tone: 'green', date: '08-24-27'};
  return <div ref={root} className="iq2-iso-layer sec-ac-diagram" data-sec-part="Layer">
    <div className="sec-ac-inner">
      {LINES.map(id => { const {seg: [x1, y1, x2, y2], o} = L[id]; return <div key={id} className="sec-ac-line" data-line={id}>
        <i style={{left: Math.min(x1, x2) - 1.5, top: Math.min(y1, y2) - 1.5, width: Math.abs(x2 - x1) + 3, height: Math.abs(y2 - y1) + 3, opacity: o}}/>
        <span className="sec-ac-headbox" style={{left: x2, top: y2, opacity: o}}><Arrow dir={HEADS[id]}/></span>
      </div>; })}
      <div className="sec-ac-item" {...at('cert')}><Certificate badge={s.certBadge} expired={s.certBadge === 'x'}/></div>
      <div className="sec-ac-item" data-chip="renew" {...at('renew')}><Card m={renew}/></div>
      <div className="sec-ac-item sec-ac-label" data-t="renew-when" {...at('renew-when')}><b>08-24-2027</b><small>30 days before it expires</small></div>
      <div className="sec-ac-item sec-ac-label sec-ac-course-label" data-t="course" {...at('course')}><b>{COURSE_A.title}</b><Badges mark={s.courseBadge} prefix="course"/></div>
      {Object.entries(COURSE_A.missions).map(([id, m]) => <div key={id} className="sec-ac-item" data-chip={id} {...at(id)}><Card m={m}/></div>)}
      <div className="sec-ac-item sec-ac-label" data-t="when" {...at('when')}>
        <b>{lesson ? '12-08-2026' : '08-24-2027'}</b>
        <small className={s.missed ? 'is-missed' : undefined} data-t="due">{s.missed ? 'Missed: due' : 'Due'} {lesson ? '12-22-2026' : '09-23-2027'}</small>
      </div>
      <div className="sec-ac-item" data-t="phone" {...at('phone')}><Phone s={s} lesson={lesson}/></div>
    </div>
  </div>;
}

// ---- Certifications (the web app, tm/31-certifications.png, tm/33-cert-level3.png): a certificate opened to its courses, a course to its missions, each with its Validity ----
const ROW_ICON = {
  Certificate: <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="4" width="15" height="12" rx="1.5" fill="none" stroke="#1271b7" strokeWidth="1.4"/><path d="M5.5 7.5h6M5.5 10h4" stroke="#1271b7" strokeWidth="1.4" strokeLinecap="round"/><circle cx="13.5" cy="11.5" r="2.2" fill="none" stroke="#1271b7" strokeWidth="1.3"/></svg>,
  Course: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 6.5h14v9.5H3z M5 4h10v2.5" fill="none" stroke="#7b3cf0" strokeWidth="1.4" strokeLinejoin="round"/></svg>,
  Media: <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none" stroke="#d6409f" strokeWidth="1.4"/><path d="M8.5 7.3v5.4l4.3-2.7z" fill="#d6409f"/></svg>,
  Test: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 3h7.5L15 5.5V17H5z" fill="none" stroke="#e8902c" strokeWidth="1.4" strokeLinejoin="round"/><path d="M7.5 9h5M7.5 12h5" stroke="#e8902c" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  Checklist: <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3.5" y="3.5" width="13" height="13" rx="3" fill="none" stroke="#3b82c4" strokeWidth="1.4"/><path d="M6.5 8h7M6.5 11.5h7" stroke="#3b82c4" strokeWidth="1.4" strokeLinecap="round"/></svg>,
};
const CERT_ROWS = [ // the certificates of the page (the first one is opened in the scenes)
  ['Food Safety Certification', 2, '365 Days', 12],
  ['Forklift Operation', 1, '730 Days', 4],
  ['First Aid & CPR', 2, '730 Days', 9],
  ['Driver’s License', 0, '-', 6],
  ['Allergen Awareness', 1, '180 Days', 7],
  ['Opening Procedures', 1, '365 Days', 11],
];
const COURSES = [
  {id: 'a', title: 'Course A: Food Handling', validity: '365 Days', notify: '30 Days', missions: [['a1', 'Handwashing Basics', 'Media', '90 Days', '14 Days'], ['a2', 'Safe Food Temperatures', 'Media', '180 Days', '14 Days'], ['a3', 'Cross-Contamination', 'Test', '365 Days', '30 Days']]},
  {id: 'b', title: 'Course B: Allergen Awareness', validity: '180 Days', notify: '14 Days', missions: [['b1', 'Allergen Labels', 'Media', '180 Days', '14 Days'], ['b2', 'Allergen Cleanup', 'Checklist', '180 Days', '14 Days']]},
];
const Reveal = ({open, children}) => <div className="iq2-reveal" style={{gridTemplateRows: `${open ? 1 : 0}fr`, opacity: open ? 1 : 0, visibility: open ? 'visible' : 'hidden'}}><div>{children}</div></div>;
const RowToggle = ({open}) => <span className={`sec-pl-toggle${open ? '' : ' is-closed'}`} aria-hidden="true"><svg viewBox="0 0 16 16"><path d="m4.2 6.2 3.8 3.8 3.8-3.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>;
const Kebab = () => <svg className="sec-pl-kebab" viewBox="0 0 6 20" aria-hidden="true"><circle cx="3" cy="4" r="1.6"/><circle cx="3" cy="10" r="1.6"/><circle cx="3" cy="16" r="1.6"/></svg>;
function CertRow({kind, depth, index, name, count, open, cells, id, last, branch}) {
  return <div className={`sec-ac-crow is-${kind.toLowerCase()}${open ? ' is-open' : ''}`} data-iq-target={id ? `row-${id}` : undefined}>
    <span className="sec-ac-cname" style={{paddingLeft: 40 + depth * 17}}>
      {branch && <i className="sec-ac-celbow" style={{left: 3 + depth * 17}}/>}{branch && !last && <i className="sec-ac-cpipe" style={{left: 3 + depth * 17}}/>}
      {count > 0 && <span className="sec-ac-ctoggle" style={{left: 12 + depth * 17}}><RowToggle open={open}/></span>}<em>{index}.</em><i className="sec-ac-cicon">{ROW_ICON[kind]}</i><b data-iq-target={id ? `name-${id}` : undefined}>{name}</b>{count > 0 && <small>{count}</small>}<Kebab/>
    </span>
    {cells.map(([text, target], i) => <span key={i} className={text === '-' ? 'is-dash' : undefined}><span data-iq-target={target}>{text}</span></span>)}
  </div>;
}
function CertsPage({s}) {
  return <div className="iq2-report" data-sec-part="Report" style={{left: 24, top: 62, width: 1110, height: 776}}>
    <div className="iq2-report-page" style={{transform: 'translateX(0px)', height: 776, width: 1110}}><div className="iq-ol-page">
      <div className="ow-workspace iq-ow sec-pl sec-ac-web" aria-label="Taskmaverick web: Certifications">
        <WebChrome active="Certifications" tools={<><span className="ow-tool sec-ac-new"><WebIcon d={ICON.plus}/>New Certificate</span><span className="ow-tool"><WebIcon d={ICON.tree}/>Expand/Collapse</span><span className="ow-tool"><WebIcon d={ICON.eye}/>Hide/Show Column</span><span className="ow-tool"><WebIcon d={ICON.cloud}/>Export</span></>}/>
        <div className="sec-ac-table">
          <div className="sec-ac-crow is-head">{['Name', 'Type', 'Status', 'Expiration Period', 'Validity', 'Notification Period', 'Active Persons'].map(h => <span key={h}><b>{h}</b><i>⋮</i></span>)}</div>
          <div className="sec-ac-cbody">
            {CERT_ROWS.map(([name, count, period, persons], c) => <div key={name} className="sec-block" data-iq-target={c === 0 ? 'cert-block' : undefined}>
              <CertRow kind="Certificate" depth={0} index={c + 1} name={name} count={count} open={c === 0 && s.level >= 1} id={c === 0 ? 'cert' : undefined}
                cells={[['Certificate'], [<><i className="sec-ac-dot"/>Active</>], [period, c === 0 ? 'period-cert' : undefined], ['-'], ['-'], [<u key="u">{persons}</u>]]}/>
              {c === 0 && <Reveal open={s.level >= 1}><div className="sec-block" data-iq-target="courses-block">
                {COURSES.map((course, k) => <div key={course.id} className="sec-block" data-iq-target={`course-${course.id}`}>
                  <CertRow kind="Course" depth={1} index={k + 1} name={course.title} count={course.missions.length} open={s.level >= 2 && (course.id === 'a' || s.openB)} id={`course-${course.id}`} branch last={k === COURSES.length - 1}
                    cells={[['Course'], ['-'], ['-'], [course.validity, `val-course-${course.id}`], [course.notify], ['-']]}/>
                  <Reveal open={s.level >= 2 && (course.id === 'a' || s.openB)}><div className="sec-block" data-iq-target={`missions-${course.id}`}>
                    {course.missions.map(([id, title, type, validity, notify], j) => <CertRow key={id} kind={type} depth={2} index={j + 1} name={title} count={0} id={id} branch last={j === course.missions.length - 1}
                      cells={[[type], ['-'], ['-'], [validity, `val-${id}`], [notify], ['-']]}/>)}
                  </div></Reveal>
                </div>)}
              </div></Reveal>}
            </div>)}
          </div>
        </div>
      </div>
    </div></div>
  </div>;
}

// ---- a third-party certificate uploaded in a mission (the Mission Details of the phone, as the other sections draw it: components/sections/parts.jsx MissionPanel; the document is
// attached as a proof is: its picture, its file name under it) ----
const DocIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h8.5L19 7.5V21H6Z"/><path d="M14 3v5h5M9 13h7M9 16.5h7" strokeLinecap="round"/></svg>;
function License() { // the first page of the PDF: a driver's license (a made-up one)
  return <div className="sec-ac-license">
    <header><b>DRIVER LICENSE</b><small>CLASS C</small></header>
    <div className="sec-ac-license-body">
      <span className="sec-ac-license-photo"><img src={AVATAR.leo} alt=""/></span>
      <dl><dt>Name</dt><dd>Leo T</dd><dt>License No.</dt><dd>D 4471 2093</dd><dt>Expires</dt><dd data-iq-target="license-expires">06-30-2029</dd></dl>
    </div>
  </div>;
}
function UploadPhone({s}) {
  const panel = useRef(null);
  useLayoutEffect(() => { // (MissionPanel's own: the content scrolled under the pinned chip, the card popped then expanded)
    const box = panel.current, content = box.querySelector('.iq2-m-content'), win = box.querySelector('.iq2-m-window'), chip = box.querySelector('.iq2-m-summary');
    const at = key => { if (key === 'top') return 0; const el = content.querySelector(`[data-iq-target="${key}"]`); return el ? el.getBoundingClientRect().top - content.getBoundingClientRect().top : 0; };
    const k = content.getBoundingClientRect().height / content.offsetHeight || 1, max = Math.max(0, content.offsetHeight - win.clientHeight);
    const y = Math.min(max, Math.max(0, at(s.scrollTo) / k - chip.offsetHeight - 8));
    content.style.transform = `translateY(${-y}px)`; chip.style.transform = `translateY(${y}px)`;
    chip.style.boxShadow = y > 2 ? '0 10px 14px -10px rgb(21 39 54 / 30%)' : 'none';
    const H = box.offsetHeight, top = chip.offsetTop + win.offsetTop, bottom = top + chip.offsetHeight, e = s.expand, shift = (H / 2 - (top + bottom) / 2) * (1 - e);
    box.style.transform = `translateY(${shift * 1.5}px) scale(1.5)`;
    box.firstElementChild.style.clipPath = `inset(${top * (1 - e)}px 0px ${(H - bottom) * (1 - e)}px 0px round ${14 + 4 * e}px)`; // (always an inset, never `none`: the video moves from the card to the opened mission, it cannot move to `none`)
  });
  const done = s.doc === 'done';
  return <div ref={panel} className="iq2-mission" data-sec-part="Mission" style={{left: 341, top: 163, width: 360, height: 573, transform: 'scale(1.5)'}}>
    <div className="iq2-m">
      <header className="iq2-m-head"><span className="iq2-m-back"><IconBack/></span><b>Mission Details</b></header>
      <div className="iq2-m-window" data-sec-window><div className="iq2-m-content">
        <section className="iq2-m-summary" data-iq-target="mission-chip">
          <div className="iq2-m-kind"><img src="/mission-logo.png" alt=""/><span>Checklist</span><b>10</b><em className="sec-timer sec-timer--green" data-iq-target="mission-timer">00:01:24</em></div>
          <h3>Upload Driver’s License</h3><small>Delivery Team / Certifications</small>
          <div className="iq2-m-meta"><span>Leo T</span><time>09-23-26 09:12 AM</time></div>
        </section>
        <section className="iq2-m-brief"><p data-iq-target="instructions">Upload your current driver’s license. Its expiration date is tracked like any certificate.</p></section>
        <section className="iq2-m-cp" data-iq-target="cp-license"><b>1. Attach your driver’s license</b>
          <div className="iq-proof-request sec-ac-request" style={{display: done ? 'none' : undefined}}><small>Add at least one document</small><div><span className="iq-proof-add" data-iq-target="add-document"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="10" cy="10" r="7.5"/><path d="M10 6.5v7M6.5 10h7"/></svg>Add document</span><span>0/1</span></div></div>
          <div className="iq2-m-proof" data-iq-target="pdf-license" style={{display: done ? undefined : 'none'}}>
            <div className="iq2-m-frame iq2-m-shot sec-ac-docshot"><License/></div>
            <div className="iq2-m-file"><DocIcon/><span>Driver’s License.pdf</span></div>
          </div>
        </section>
        <section className="iq2-m-cp" data-iq-target="cp-expires"><b>2. License expiration date</b><div className={`sec-field${done ? ' has-value' : ''}`} data-iq-target="field-expires">{done ? '06-30-2029' : 'MM-DD-YYYY'}</div></section>
      </div></div>
    </div>
  </div>;
}

// ---- People › People Certifications: the live dashboard of who holds what (the product's own look: tm/39-people-certs.png) ----
const TODAY = Date.UTC(2026, 8, 23);
const day = text => { const [m, d, y] = text.split('/').map(Number); return Date.UTC(y, m - 1, d); };
const PEOPLE = [
  ['Anna F', [['Food Safety Certification', 'Active', '09/23/2026', '09/23/2027', 'Carla M'], ['Allergen Awareness', 'Active', '03/10/2026', '03/10/2027', 'Carla M'], ['Forklift Operation', 'Expired', '08/12/2025', '08/12/2026', 'Dan K']]],
  ['Ben R', [['Food Safety Certification', 'Active', '11/02/2025', '11/02/2026', 'Carla M'], ['First Aid & CPR', 'Failed']]],
  ['Carla M', [['Food Safety Certification', 'Active', '01/15/2026', '01/15/2027', 'Dan K'], ['Allergen Awareness', 'Expired', '07/01/2025', '07/01/2026', 'Dan K']]],
  ['Dan K', [['Food Safety Certification', 'Active', '06/20/2026', '06/20/2027', 'Carla M']]],
  ['Leo T', [['Driver’s License', 'Active', '06/30/2025', '06/30/2029', 'Leo T'], ['Food Safety Certification', 'Expired', '09/01/2025', '09/01/2026', 'Carla M']]],
  ['Maya R', [['Food Safety Certification', 'Active', '12/05/2025', '12/05/2026', 'Carla M'], ['First Aid & CPR', 'Active', '02/14/2026', '02/14/2028', 'Dan K']]],
  ['Omar H', [['Food Safety Certification', 'Expired', '09/18/2025', '09/18/2026', 'Carla M']]],
  ['Priya N', [['Food Safety Certification', 'Active', '04/11/2026', '04/11/2027', 'Dan K'], ['Allergen Awareness', 'Active', '05/02/2026', '11/02/2026', 'Dan K']]],
  ['Sam W', [['Forklift Operation', 'Active', '02/27/2026', '02/27/2028', 'Dan K'], ['Food Safety Certification', 'Failed']]],
  ['Tara L', [['Food Safety Certification', 'Active', '07/08/2026', '07/08/2027', 'Carla M'], ['Allergen Awareness', 'Expired', '03/03/2026', '09/03/2026', 'Carla M']]],
  ['Victor G', [['First Aid & CPR', 'Active', '10/30/2025', '10/30/2027', 'Dan K']]],
];
const WebIcon = ({d}) => <svg className="sec-pl-ic" viewBox="0 0 24 24" aria-hidden="true"><path d={d} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ICON = {
  bell: 'M18 8.5a6 6 0 0 0-12 0v5.2L4.4 16.5h15.2L18 13.7zM9.8 19.2a2.3 2.3 0 0 0 4.4 0',
  list: 'M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01',
  tree: 'M2.5 10.2h4.2v4.2H2.5zM15.8 3h4.2v4.2h-4.2zM15.8 10.2h4.2v4.2h-4.2zM15.8 17.4h4.2v4.2h-4.2zM6.7 12.3h4.6M11.3 5.1v14.4M11.3 5.1h4.5M11.3 19.5h4.5M11.3 12.3h4.5',
  cloud: 'M7.5 17.5H7a4.5 4.5 0 1 1 .9-8.9A6 6 0 0 1 19.4 10a3.6 3.6 0 0 1-.9 7.1M12 12.5v8.5M9 18l3 3 3-3',
  plus: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 8v8M8 12h8',
  eye: 'M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
};
export function WebChrome({active, tabs = null, tab, tools, right = null}) { // the web app's top bar, its sub-navigation and the toolbar (Precision Planning's look: .sec-pl, sections.css)
  return <>
    <header className="ow-topbar"><span className="ow-logo"><img src="/logo.svg" alt="taskmaverick"/></span>
      <nav>{NAV.map(n => <span key={n} className={n === active ? 'is-active' : undefined}>{n}</span>)}</nav>
      <div className="ow-account"><span className="ow-icon-button"><WebIcon d={ICON.bell}/></span><span className="ow-icon-button"><WebIcon d={ICON.gear}/></span><span className="ow-avatar">JM</span></div>
    </header>
    {tabs && <div className="ow-subnav"><nav>{tabs.map(n => <span key={n} className={n === tab ? 'is-active' : undefined}>{n}</span>)}</nav>{right}</div>}
    <div className="ow-toolbar">{tools}</div>
  </>;
}
export const TOOL_ICON = ICON;
const Toggle = () => <span className="sec-ac-toggle" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="m4.2 6.2 3.8 3.8 3.8-3.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>;
function PeopleCerts({s}) {
  const win = useRef(null);
  useLayoutEffect(() => { // (the list scrolls inside the window, to the person `scrollTo` names; the window never moves)
    const box = win.current?.querySelector('.sec-scroll');
    if (!box) return;
    box.scrollTop = 0;
    const el = s.scrollTo && s.scrollTo !== 'top' ? box.querySelector(`[data-iq-target="${s.scrollTo}"]`) : null;
    if (el) { const k = box.getBoundingClientRect().height / (box.offsetHeight || 1) || 1; box.scrollTop = Math.min(box.scrollHeight - box.clientHeight, Math.max(0, (el.getBoundingClientRect().top - box.getBoundingClientRect().top) / k)); }
  });
  return <div ref={win} className="iq2-report" data-sec-part="Report" style={{left: 24, top: 62, width: 1110, height: 776}}>
    <div className="iq2-report-page" style={{transform: 'translateX(0px)', height: 776, width: 1110}}><div className="iq-ol-page">
      <div className="ow-workspace iq-ow sec-pl sec-ac-web" aria-label="Taskmaverick web: People Certifications">
        <WebChrome active="People" tabs={['People', 'Positions', 'People Certifications']} tab="People Certifications"
          tools={<><span className="ow-tool"><WebIcon d={ICON.list}/>Group by: Person</span><span className="ow-tool"><WebIcon d={ICON.tree}/>Expand/Collapse</span><span className="ow-tool"><WebIcon d={ICON.cloud}/>Export</span></>}/>
        <div className="sec-ac-table">
          <div className="sec-ac-row is-head">{['Name', 'Status', 'Issued', 'Expires', 'Days to Expire', 'Issued by'].map(h => <span key={h}><b>{h}</b><i>⋮</i></span>)}</div>
          <div className="sec-scroll"><div className="sec-ac-body">
            {PEOPLE.map(([name, certs], p) => <div key={name} className="sec-block" data-iq-target={`person-${p}`}>
              <div className="sec-ac-row is-person"><span className="sec-ac-name"><Toggle/><em>{p + 1}.</em><b>{name}</b><small>{certs.length}</small></span>{[0, 1, 2, 3, 4].map(i => <span key={i} className="is-dash">-</span>)}</div>
              {certs.map(([title, status, issued, expires, by], c) => {
                const days = expires ? Math.round((day(expires) - TODAY) / 86400000) : null;
                return <div key={title} className="sec-ac-row is-cert" data-iq-target={`cert-${p}-${c}`}>
                  <span className="sec-ac-name"><i className="sec-ac-branch" data-last={c === certs.length - 1 ? '1' : undefined}/><em>{c + 1}.</em><span>{title}</span></span>
                  <span><i className={`sec-ac-dot is-${status.toLowerCase()}`}/>{status}</span>
                  <span>{issued ? `${issued}-08:00 AM` : '-'}</span><span>{expires ? `${expires}-08:00 AM` : '-'}</span>
                  <span className={days != null && days < 0 ? 'is-late' : undefined}>{days == null ? '-' : days < 0 ? `(${days})` : days.toLocaleString('en-US')}</span>
                  <span>{by ?? 'Carla M'}</span>
                </div>;
              })}
            </div>)}
          </div></div>
          <i className="sec-ac-col" data-iq-target="col-status" style={{left: 290, width: 115}}/>
          <i className="sec-ac-col" data-iq-target="col-days" style={{left: 755, width: 145}}/>
        </div>
      </div>
    </div></div>
  </div>;
}

export default function CertificationStage({state}) {
  const s = {...CERTIFICATION_BASE, ...state};
  if (s.view === 'phone') return <UploadPhone s={s}/>;
  if (s.view === 'web') return <PeopleCerts s={s}/>;
  if (s.view === 'certs') return <CertsPage s={s}/>;
  return <Diagram s={s}/>;
}
