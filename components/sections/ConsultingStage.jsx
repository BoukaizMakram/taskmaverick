'use client';
// Innovating Consulting's art for the section videos (lib/sections/innovating-consulting.mjs), drawn from a state given as data. Only the product's own screens and pieces (the user,
// 2026-10-20: "only real product UI"); what is not the product is drawn clearly outside it:
//   view 'web'      the consultant's marketplace (Missions › In Marketplace, tm/37-marketplace.png: Summit Ops Consulting's catalogs; `added`: its new one, Lean Kitchen)
//   view 'export'   the consultant's operational and training standards (the product's mission cards) going into a catalog of its marketplace (the marketplace's own catalog card)
//   view 'masses'   outside the product: the catalog (as the marketplace shows it) open to everyone, a crowd, then the money that comes from it
//   view 'builder'  the web app's mission builder (components/web/WebMissionBuilder.jsx): the mission's Title retyped
//   view 'cards'    one of the catalog's missions (the product's mission card) at three clients, its title edited once and updated at all of them
//   view 'overview' the Overview's Team Board (Live Oversight's art): Running, then History, scrolled
//   view 'report'   the Data Board opened one level at a time (Reporting & AI's art)
//   view 'value'    outside the product: a plain BI report (no Taskmaverick bar, tabs or navigation) of the program's value against its cost
import {WebWindow, Ico, Card, CardsSpread, useNames, BuilderWindow} from './StandardizingStage';
import {MarketplacePage, CatalogCard, MARKET_IMAGES} from './FranchisingStage';
import {useRef} from 'react';
import LiveOversightStage from './LiveOversightStage';
import ReportingStage from './ReportingStage';
import './innovating-consulting.css';

export const CONSULTING_BASE = {view: 'web', added: false, focus: null, pan: 0, flow: 1, crowd: 0, dollars: 0, step: 3, edit: 0, title: 0, overview: 'Running', scroll: 0, level: 0, reportTo: 'top', chart: 1};

// ---- the consultant's marketplace ----
export const SUMMIT = {name: 'Summit Ops Consulting', mark: 'SO', color: '#0f766e', industry: 'Restaurant'};
const CATALOGS = [
  {id: 'retail', name: 'Summit Ops – Retail Excellence', missions: 41, img: MARKET_IMAGES.retail, text: 'Store standards, merchandising and customer service routines.'},
  {id: 'fitness', name: 'Summit Ops – Fitness Clubs', missions: 28, img: MARKET_IMAGES.fitness, text: 'Front desk, cleaning and equipment checks for clubs.'},
  {id: 'clinic', name: 'Summit Ops – Clinic Operations', missions: 35, img: MARKET_IMAGES.clinic, text: 'Room turnover, supplies and patient-flow checklists.'},
];
const LEAN = {id: 'lean', name: 'Summit Ops – Lean Kitchen', missions: 50, img: MARKET_IMAGES.menu, text: 'Operational and training standards for lean, low-waste kitchens.'};
const BUNDLES = [
  {id: 'quick', name: 'Quick Wins Starter', missions: 12, text: 'The first twelve standards every new client deploys.', action: 'Import'},
  {id: 'ready', name: 'Audit Readiness', missions: 20, text: 'Self-audits that keep a client ready for inspection.', action: 'Import'},
];
const PURPLE = '#7b3cf0';
const Arrows = ({paths, on = true}) => <svg className="sec-flow-lines" width="1" height="1" style={{overflow: 'visible'}} aria-hidden="true">
  <defs><marker id="sec-ic-arrow" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="9" markerHeight="9" orient="auto"><path d="M1.5 1.5 10 6l-8.5 4.5" fill="none" stroke={PURPLE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></marker></defs>
  {paths.map(([d, end], i) => <path key={i} d={d} fill="none" stroke={PURPLE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" markerEnd={end ? 'url(#sec-ic-arrow)' : undefined} style={{opacity: on ? 1 : 0}}/>)}
</svg>;

// ---- the standards exported: the consultant's missions into a catalog of its marketplace ----
const STANDARDS = [
  ['Operational Standards', [{id: 'std-prep', kind: 'Checklist', points: 20, title: 'Prep Station Setup'}, {id: 'std-line', kind: 'Audit', points: null, title: 'Kitchen Line Check'}]],
  ['Training Standards', [{id: 'std-knife', kind: 'Media', points: 10, title: 'Knife Skills'}, {id: 'std-cost', kind: 'Test', points: 15, title: 'Food Cost Basics'}]],
];
function ExportFlow({s}) {
  const root = useRef(null);
  useNames(root);
  const K = 0.86, cw = 334 * K, ch = 128 * K, left = 140, cardX = left, catX = 600, catW = 286 * 1.15, catH = 300 * 1.15, catY = 300, bus = 520;
  let y = 150; const cards = [], labels = [];
  STANDARDS.forEach(([label, list]) => { labels.push({label, y}); y += 26; list.forEach(m => { cards.push({...m, y}); y += ch + 14; }); y += 24; });
  const paths = [...cards.map(c => [`M${cardX + cw + 10} ${c.y + ch / 2} L${bus} ${c.y + ch / 2} L${bus} 450`, false]), [`M${bus} 450 L${catX - 12} 450`, true]];
  return <div ref={root} className="iq2-iso-layer sec-flow sec-ic-export" data-sec-part="Layer" style={{width: 1600, height: 900}}>
    {labels.map(l => <span key={l.label} className="iq2-rating-label sec-label" style={{left: cardX, top: l.y + 6}}>{l.label}</span>)}
    {cards.map(c => <Card key={c.id} c={{id: c.id, x: cardX, y: c.y, scale: K, origin: '0 0', mission: {kind: c.kind, points: c.points, title: c.title, pill: '00:00:00', time: '08:00 AM'}}}/>)}
    <Arrows paths={paths} on={s.flow >= 1}/>
    <span className="iq2-rating-label sec-label sec-ic-label" style={{left: catX + catW / 2, top: 450 - catH / 2 - 22, opacity: s.flow >= 1 ? 1 : 0}}>Marketplace · {SUMMIT.name}</span>
    <div className="sec-ic-catalog" style={{left: catX, top: catY, opacity: s.flow >= 1 ? 1 : 0, transform: `scale(${s.flow >= 1 ? 1.15 : 1.05})`}}><CatalogCard vendor={SUMMIT} c={LEAN}/></div>
  </div>;
}

// ---- outside the product: the catalog open to everyone, the crowd, the money ----
// The crowd and the coin are photographs (public/storyboard-art/, scripts/generate-images.mjs: crowd, coin): the crowd fills the lower half of the
// plate, the coins pop just over its heads, at both sides of the revenue (their middles).
const COINS = [[170, 455], [235, 420], [300, 458], [365, 428], [420, 462], [620, 462], [680, 428], [745, 458], [810, 420], [875, 455]];
function Masses({s}) {
  return <div className="iq2-iso-layer sec-flow sec-ic-masses" data-sec-part="Layer" style={{width: 1600, height: 900}}>
    <div className="sec-ic-beam" style={{opacity: s.crowd ? 1 : 0}}/>
    <div className="sec-ic-pub" data-iq-target="public-catalog"><CatalogCard vendor={SUMMIT} c={LEAN}/></div>
    <div className="sec-ic-revenue" data-iq-target="revenue" style={{opacity: s.dollars >= 2 ? 1 : 0, transform: `translateX(-50%) scale(${s.dollars >= 2 ? 1 : 0.85})`}}>
      <b>+$18,400</b><span>a month · 312 businesses</span>
    </div>
    <div className="sec-ic-crowd" data-iq-target="crowd">
      <img className="sec-ic-crowd-photo" src="/storyboard-art/crowd.webp" alt="" style={{opacity: s.crowd ? 1 : 0, transform: `translateY(${s.crowd ? 0 : 18}px) scale(${s.crowd ? 1 : 0.96})`}}/>
      {COINS.map(([x, y], k) => { const on = s.dollars >= 2 || (s.dollars >= 1 && k % 2 === 0); return <span key={k} className="sec-ic-coin" style={{left: x - 15, top: y - 15, opacity: on ? 1 : 0, transform: `translateY(${on ? 0 : 12}px) scale(${on ? 1 : 0.6})`}}/>; })}
    </div>
  </div>;
}

// ---- outside the product: a plain BI report of the program's value against its cost ----
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const VALUE = [6, 15, 27, 41, 57, 74, 92, 110, 128, 146, 165, 184.2], COST = [14.5, 17, 19.5, 22, 24.5, 27, 29.5, 32, 34.5, 37, 39.5, 42];
const SOURCES = [['Labor hours saved', 96.4], ['Waste reduced', 50.8], ['Fewer incidents', 37.0]];
const PLOT = {w: 470, h: 290, left: 56, top: 12, bottom: 30, right: 110};
function LineChart({chart}) {
  const W = PLOT.left + PLOT.w + PLOT.right, H = PLOT.top + PLOT.h + PLOT.bottom, x = i => PLOT.left + (i / 11) * PLOT.w, y = v => PLOT.top + PLOT.h - (v / 200) * PLOT.h;
  const path = list => list.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  return <div className="sec-ic-chart">
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-label="Cumulative value delivered against cumulative program cost, January to December 2026">
      {[0, 50, 100, 150, 200].map(v => <g key={v}><line x1={PLOT.left} x2={PLOT.left + PLOT.w} y1={y(v)} y2={y(v)} className="sec-ic-grid"/><text x={PLOT.left - 10} y={y(v) + 4} className="sec-ic-tick" textAnchor="end">${v}K</text></g>)}
      {MONTHS.map((m, i) => (i % 2 === 0 || i === 11) && <text key={m} x={x(i)} y={H - 10} className="sec-ic-tick" textAnchor="middle">{m}</text>)}
      <path d={`${path(VALUE)} L${x(11)} ${y(0)} L${x(0)} ${y(0)} Z`} className="sec-ic-area"/>
      <path d={path(VALUE)} className="sec-ic-line is-value"/>
      <path d={path(COST)} className="sec-ic-line is-cost"/>
      <circle cx={x(11)} cy={y(VALUE[11])} r="5" className="sec-ic-dot is-value"/><circle cx={x(11)} cy={y(COST[11])} r="5" className="sec-ic-dot is-cost"/>
      <text x={x(11) + 12} y={y(VALUE[11]) + 5} className="sec-ic-end">Value $184K</text>
      <text x={x(11) + 12} y={y(COST[11]) + 5} className="sec-ic-end">Cost $42K</text>
    </svg>
    <span className="sec-ic-mask" data-iq-target="chart-mask" style={{left: PLOT.left + 2, top: 0, width: PLOT.w + PLOT.right, height: PLOT.top + PLOT.h - 1, transform: `translateX(${chart ? PLOT.w + PLOT.right + 4 : 0}px)`}}/>
  </div>;
}
// It is on a monitor (a photograph: public/storyboard-art/bi-monitor.webp, scripts/generate-images.mjs `bi-monitor`, 1363 × 954, its screen at 18,19
// 1327 × 714 as the script printed it), 1000 wide in the middle of the plate. The report is laid out at the screen's proportions, 640 high (its rows
// need no more: the chart's panel takes the width), and scaled into it, a pixel past each edge (no seam).
const MONITOR = {x: 21, y: 100, w: 1000, h: 700}, SCREEN = {x: 18 / 1363, y: 19 / 954, w: 1327 / 1363, h: 714 / 954}, BI_H = 640;
function ValueReport({chart}) {
  const w = MONITOR.w * SCREEN.w + 2, h = MONITOR.h * SCREEN.h + 2, k = h / BI_H;
  return <div className="iq2-iso-layer sec-flow" data-sec-part="Layer" style={{width: 1600, height: 900}}>
    <div className="sec-ic-monitor" style={{left: MONITOR.x, top: MONITOR.y, width: MONITOR.w, height: MONITOR.h}}><div className="sec-ic-screen" style={{left: MONITOR.w * SCREEN.x - 1, top: MONITOR.h * SCREEN.y - 1, width: w, height: h}}>
    <div className="sec-ic-bi" data-iq-target="bi-report" style={{width: w / k, height: BI_H, transform: `scale(${k})`}}>
      <header className="sec-ic-bi-bar"><span><i/><i/><i/></span><b>Lean Kitchen Program · Value Report</b><em>BI report</em></header>
      <div className="sec-ic-bi-body">
        <div className="sec-ic-bi-head"><div><b>Program Value vs. Cost</b><small>Client: Harbor Grill · Jan – Dec 2026</small></div></div>
        <div className="sec-ic-kpis">
          <div className="sec-ic-kpi" data-iq-target="kpi-value"><small>Value Delivered</small><b>$184,200</b><em className="is-up">▲ $18.4K this month</em></div>
          <div className="sec-ic-kpi" data-iq-target="kpi-cost"><small>Program Cost</small><b>$42,000</b><em>Setup $12K · $2.5K a month</em></div>
          <div className="sec-ic-kpi is-key" data-iq-target="roi"><small>Return On Investment</small><b>4.4×</b><em className="is-up">Value is 4.4 times the cost</em></div>
          <div className="sec-ic-kpi" data-iq-target="kpi-payback"><small>Payback Period</small><b>3 Months</b><em>Value passed cost in March</em></div>
        </div>
        <div className="sec-ic-panels">
          <section className="sec-ic-panel" data-iq-target="value-chart"><header><b>Cumulative Value vs. Cost</b><span className="sec-ic-legend"><i className="is-value"/>Value delivered<i className="is-cost"/>Program cost</span></header><LineChart chart={chart}/></section>
          <section className="sec-ic-panel is-side" data-iq-target="value-sources"><header><b>Value By Source</b></header>
            <div className="sec-ic-bars">{SOURCES.map(([label, v]) => <div key={label} className="sec-ic-bar"><span>{label}</span><i><em style={{width: `${v}%`}}/></i><b>${v.toFixed(1)}K</b></div>)}</div>
            <p className="sec-ic-note">Labor hours are valued at $24 an hour; waste at its food cost.</p>
          </section>
        </div>
      </div>
    </div>
    </div></div>
  </div>;
}

// ---- one mission at three clients ----
const PREP = {kind: 'Checklist', points: 20, title: 'Prep Station Setup', pill: '00:00:00'};
const SOURCE = {label: 'Marketplace · Summit Ops – Lean Kitchen', mission: {...PREP, time: '07:00 AM'}};
const CLIENTS = [
  {id: 'harbor', name: 'Harbor Grill', sub: 'Client', icon: 'store', mission: {...PREP, time: '07:00 AM'}},
  {id: 'lakeside', name: 'Lakeside Cafe', sub: 'Client', icon: 'store', mission: {...PREP, time: '07:30 AM'}},
  {id: 'downtown', name: 'Downtown Deli', sub: 'Client', icon: 'store', mission: {...PREP, time: '08:00 AM'}},
];
export const LEAN_TITLE = 'Lean Prep Station Setup';
const PREP_CONTENT = {type: 'Checklist', folder: 'Summit Ops – Lean Kitchen', guide: 'Set up every prep station the same way before each shift.', alert: 'Keep raw and ready-to-eat items apart.', team: ['Client Kitchens'], category: 'Operations', tag: ['Lean Kitchen'], steps: ['Knives and boards are in place?', 'Containers are labeled and dated?', 'Waste bins are empty?']};

export default function ConsultingStage({state}) {
  const s = {...CONSULTING_BASE, ...state};
  if (s.view === 'export') return <ExportFlow s={s}/>;
  if (s.view === 'masses') return <Masses s={s}/>;
  if (s.view === 'cards') return <CardsSpread source={SOURCE} targets={CLIENTS} step={s.step} edit={s.edit} newTitle={LEAN_TITLE}/>;
  if (s.view === 'builder') return <BuilderWindow mission={{...PREP_CONTENT, title: s.title ? LEAN_TITLE : PREP.title}} tab="In Marketplace" focus={s.focus} pan={s.pan}/>;
  if (s.view === 'overview') return <LiveOversightStage state={{page: 'overview', view: s.overview, scroll: s.scroll, pan: 0, focus: s.focus}}/>;
  if (s.view === 'report') return <ReportingStage state={{level: s.level, scrollTo: s.reportTo, focus: s.focus, pan: 0}}/>;
  if (s.view === 'value') return <ValueReport chart={s.chart}/>;
  const catalogs = s.added ? [...CATALOGS, LEAN] : CATALOGS;
  return <WebWindow focus={s.focus} pan={s.pan} label="Taskmaverick web: Missions, In Marketplace">
    <MarketplacePage vendor={SUMMIT} catalogs={catalogs} bundles={BUNDLES} missions={['Prep Station Setup', 'Kitchen Line Check', 'Waste Log', 'Shift Huddle']}/>
  </WebWindow>;
}
