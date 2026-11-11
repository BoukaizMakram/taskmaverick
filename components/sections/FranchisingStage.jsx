'use client';
// Powering Franchising's art for the section videos (lib/sections/powering-franchising.mjs), drawn from a state given as data. Only the product's own screens and pieces
// (the user, 2026-10-20: "only real product UI"):
//   view 'web'     the web app's Missions › In Marketplace (tm/37-marketplace.png): the franchisor's catalogs, bundles and missions, its filters, Compare List, Import List; a catalog
//                  imported shows Update, as an imported bundle does in the product
//   view 'builder' the web app's mission builder (components/web/WebMissionBuilder.jsx): the mission's Title retyped
//   view 'cards'   one of the catalog's missions (the product's mission card) at three franchisees, its title edited once and updated at all of them
//   view 'overview' the Overview's Team Board (Live Oversight's art) scrolling through the locations
//   view 'board'   the Brand Audits board on the tablet; view 'mission' a brand audit opened (parts.jsx MissionPanel), its video played
//   view 'gallery' the Usage Report, Gallery View pressed (Live Oversight's art)
// The marketplace page and its catalog card are shared with Innovating Consulting (exported here).
import {TabletPart, MissionPanel, mission} from './parts';
import {WebWindow, WebChrome, Ico, CardsSpread, BuilderWindow} from './StandardizingStage';
import LiveOversightStage from './LiveOversightStage';
import './powering-franchising.css';

export const FRANCHISING_BASE = {view: 'web', imported: [], focus: null, pan: 0, step: 3, edit: 0, title: 0, scroll: 0, expand: 1, video: 0, gallery: false};

// ---- Missions › In Marketplace ----
const IMG = '/industries/media/';
export const MARKET_IMAGES = {
  restaurant: `${IMG}industry_restaurant_1774643347669.webp`, training: `${IMG}restaurant-training_thumb_1779750598098.webp`, audits: '/demo-quality/proofs/storage-shelves.jpg',
  menu: `${IMG}restaurant-management_thumb_1779750633964.webp`, retail: `${IMG}industry_retail_1774643551920.webp`, fitness: `${IMG}industry_fitness-gyms_1775773444771.webp`,
  consulting: `${IMG}industry_consulting_1774643346751.webp`, clinic: `${IMG}industry_healthcare_1774643161259.webp`, delivery: `${IMG}industry_delivery_1774643345968.webp`,
};
const Logo = ({mark, color}) => <span className="sec-pf-logo" style={{background: color}}>{mark}</span>;
// A catalog as the marketplace shows it: its picture, the vendor's logo and the catalog's name, its count of missions, its description, Preview, Import (or Update once imported) and Compare.
export function CatalogCard({vendor, c, done = false, style}) {
  return <article className="sec-pf-catalog" data-iq-target={`catalog-${c.id}`} style={style}>
    <div className="sec-pf-img" style={{backgroundImage: `url('${c.img}')`}}/>
    <h4><Logo mark={vendor.mark} color={vendor.color}/><span>{c.name}</span></h4>
    <small><Ico d="folder" className="sec-pf-ic"/>{c.missions} Missions</small>
    <p>{c.text}</p>
    <footer>
      <span className="sec-pf-link"><Ico d="arrowRight" className="sec-pf-ic"/><i/>Preview</span>
      <span className={`sec-pf-import${done ? ' is-done' : ''}`} data-iq-target={`import-${c.id}`}>{done ? 'Update' : <><b>+</b><i/>Import</>}</span>
      <span className="sec-pf-compare"><Ico d="scale" className="sec-pf-ic"/></span>
    </footer>
  </article>;
}
// `vendor`: {name, mark, color, industry}; `catalogs`: [{id, name, missions, img, text, pop}]; `bundles`: [{id, name, missions, text, action}]; `imported`: catalog ids imported.
export function MarketplacePage({vendor, catalogs, bundles = [], imported = [], missions = []}) {
  return <>
    <WebChrome tab="In Marketplace"/>
    <div className="sec-pf-market">
      <aside className="sec-pf-filters">
        <h3>Marketplace</h3>
        <h4>Filters</h4>
        {[['Vendor', vendor.name], ['Industry', vendor.industry], ['Classification', ''], ['Tags', ''], ['Category', '']].map(([label, value]) => <span key={label} className={`sec-pf-select${value ? ' has-value' : ''}`} data-iq-target={`filter-${label.toLowerCase()}`}><i>{label}:</i>{value && <b>{value}</b>}<Ico d="down" className="sec-pf-ic"/></span>)}
        <h4 className="sec-pf-state">State<span><Ico d="down" className="sec-pf-ic"/></span></h4>
        <span className="sec-pf-check"><i/>Imported</span><span className="sec-pf-check"><i/>Not Imported</span>
      </aside>
      <main className="sec-pf-main">
        <div className="sec-pf-bar">
          <span className="sec-pf-search"><Ico d="search" className="sec-pf-ic"/>Search by keyword</span>
          <span className="sec-pf-btn"><Ico d="scale" className="sec-pf-ic"/><i/>Compare List<em>0</em></span>
          <span className="sec-pf-btn" data-iq-target="import-list"><Ico d="import" className="sec-pf-ic"/><i/>Import List<em>0</em></span>
        </div>
        <div className="sec-pf-section"><h3><Ico d="folder" className="sec-pf-ic is-blue"/>Catalogs</h3><span>See All Catalogs <Ico d="arrowRight" className="sec-pf-ic"/></span></div>
        <div className="sec-pf-catalogs" data-iq-target="catalogs" style={{gridTemplateColumns: `repeat(${catalogs.length}, 286px)`}}>
          {catalogs.map(c => <CatalogCard key={c.id} vendor={vendor} c={c} done={imported.includes(c.id)} style={c.pop != null ? {opacity: c.pop, transform: `scale(${0.9 + 0.1 * c.pop})`} : undefined}/>)}
        </div>
        <div className="sec-pf-section"><h3><Ico d="tablet" className="sec-pf-ic is-blue"/>Bundles</h3><span>See All Bundles <Ico d="arrowRight" className="sec-pf-ic"/></span></div>
        <div className="sec-pf-bundles">
          {bundles.map(b => <article key={b.id} className="sec-pf-bundle" data-iq-target={`bundle-${b.id}`}>
            <div className="sec-pf-bimg" style={b.img ? {backgroundImage: `url('${b.img}')`} : undefined}>{!b.img && <Ico d="tablet" className="sec-pf-bic"/>}</div>
            <div className="sec-pf-btext"><header><Logo mark={vendor.mark} color={vendor.color}/><b>{vendor.name}</b><small><Ico d="folder" className="sec-pf-ic"/>{b.missions} Missions</small></header>
              <h4>{b.name}</h4><p>{b.text}</p>
              <footer><span className="sec-pf-link"><Ico d="arrowRight" className="sec-pf-ic"/><i/>Preview</span><span className="sec-pf-update">{b.action ?? 'Import'}</span><span className="sec-pf-compare"><Ico d="scale" className="sec-pf-ic"/></span></footer>
            </div>
          </article>)}
        </div>
        <div className="sec-pf-section"><h3><Ico d="info" className="sec-pf-ic is-blue"/>Missions</h3><span>See All Missions <Ico d="arrowRight" className="sec-pf-ic"/></span></div>
        <div className="sec-pf-missions">{missions.map(m => <span key={m} className="sec-pf-mission"><Ico d="info" className="sec-pf-ic is-blue"/>{m}</span>)}</div>
      </main>
    </div>
  </>;
}

// ---- the franchisor's marketplace ----
export const BAKERY = {name: 'Riverside Bakery', mark: 'RB', color: '#c2410c', industry: 'Restaurant'};
const CATALOGS = [
  {id: 'ops', name: 'Riverside Bakery – Operations', missions: 148, img: MARKET_IMAGES.restaurant, text: 'Opening, closing, food safety and cleaning standards for every location.'},
  {id: 'training', name: 'Riverside Bakery – Training', missions: 62, img: MARKET_IMAGES.training, text: 'Micro-lessons and tests for bakers, cashiers and shift leads.'},
  {id: 'audits', name: 'Riverside Bakery – Brand Audits', missions: 24, img: MARKET_IMAGES.audits, text: 'Monthly brand standards, storefront and display audits.'},
];
const BUNDLES = [
  {id: 'launch', name: 'New Location Launch', missions: 36, text: 'Everything a new franchisee needs in the first 90 days.', action: 'Import'},
  {id: 'season', name: 'Fall Menu Kit', missions: 12, text: 'Display, recipes and training for the fall menu.', action: 'Import'},
];
const PASTRY = {kind: 'Checklist', points: 25, title: 'Pastry Display Setup', pill: '00:00:00'};
const SOURCE = {label: 'Marketplace · Riverside Bakery', mission: {...PASTRY, time: '06:00 AM'}};
const FRANCHISEES = [
  {id: 'main', name: 'Main Street', sub: 'Franchisee', icon: 'store', mission: {...PASTRY, time: '06:00 AM'}},
  {id: 'harbor', name: 'Harbor Point', sub: 'Franchisee', icon: 'store', mission: {...PASTRY, time: '06:30 AM'}},
  {id: 'lakeside', name: 'Lakeside', sub: 'Franchisee', icon: 'store', mission: {...PASTRY, time: '07:00 AM'}},
];
export const FALL_TITLE = 'Fall Pastry Display Setup';
const PASTRY_CONTENT = {type: 'Checklist', folder: 'Riverside Bakery – Operations', guide: 'Set the pastry display before opening, the same way at every location.', alert: 'Label every tray with its bake time.', team: ['Front Of House'], category: 'Operations', tag: ['Display'], steps: ['Trays are full and faced?', 'Labels show bake times?', 'Glass is clean and clear?']};

// ---- the brand audits, posted at each location on time ----
const AUDITS = [['main', 'Main Street Brand Audit'], ['harbor', 'Harbor Point Brand Audit'], ['lakeside', 'Lakeside Storefront Audit'], ['plaza', 'Plaza Display Case Audit']];
const auditBoard = () => AUDITS.map(([id, title], i) => mission(`audit-${id}`, title, 'Audit', 'open', {points: null, ageSeconds: 40 + (AUDITS.length - i) * 30, openOrder: i, time: '09:00 AM', date: '09-23-26'}));
const SHELVING = '/demo-quality/shelving.png', SHELVING_CLIP = '/demo-quality/shelving-training.mp4';
function AuditMission({s}) {
  return <MissionPanel kind="Audit" points={null} title="Main Street Brand Audit" location="Main Street / Franchisee" who="Anna F" date="09-23-26 09:00 AM" timer="00:02:40" expand={s.expand} scrollTo={s.video ? 'cp-walk' : 'top'}
    brief={{instructions: 'Walk the store as a guest. Check every brand standard below and film the display.'}}
    items={[{id: 'sign', type: 'yesno', q: 'Is the storefront sign clean and lit?', answer: 'yes'},
      {id: 'uniforms', type: 'yesno', q: 'Is the team in brand uniforms?', answer: 'yes'},
      {id: 'walk', type: 'training', q: 'Film the pastry display.', title: 'Display walkthrough', poster: SHELVING, meta: 'Video · 0:06', done: false, player: s.video ? {src: SHELVING_CLIP, poster: SHELVING, time: s.video, length: 6} : null}]}/>;
}

export default function FranchisingStage({state}) {
  const s = {...FRANCHISING_BASE, ...state};
  if (s.view === 'cards') return <CardsSpread source={SOURCE} targets={FRANCHISEES} step={s.step} edit={s.edit} newTitle={FALL_TITLE}/>;
  if (s.view === 'builder') return <BuilderWindow mission={{...PASTRY_CONTENT, title: s.title ? FALL_TITLE : PASTRY.title}} tab="In Marketplace" focus={s.focus} pan={s.pan}/>;
  if (s.view === 'overview') return <LiveOversightStage state={{page: 'overview', view: 'Running', scroll: s.scroll, pan: 0, focus: s.focus}}/>;
  if (s.view === 'gallery') return <LiveOversightStage state={{page: 'usage', pan: 340, groupBy: 'Checkpoint', gallery: s.gallery, reportScroll: 0, focus: s.focus}}/>;
  if (s.view === 'board') return <TabletPart title="Brand Audits" missions={auditBoard()}/>;
  if (s.view === 'mission') return <AuditMission s={s}/>;
  return <WebWindow focus={s.focus} pan={s.pan} label="Taskmaverick web: Missions, In Marketplace">
    <MarketplacePage vendor={BAKERY} catalogs={CATALOGS} bundles={BUNDLES} imported={s.imported} missions={['Pastry Display Setup', 'Oven Cleaning', 'Morning Bake Checklist', 'Allergen Labeling']}/>
  </WebWindow>;
}
