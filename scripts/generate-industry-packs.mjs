// Generate the premade industry workspaces for /demo-ai with Gemini.
//
//   node scripts/generate-industry-packs.mjs            # missing industries only
//   node scripts/generate-industry-packs.mjs hotel gym  # (re)generate these
//   node scripts/generate-industry-packs.mjs --force    # regenerate everything
//
// Reads GEMINI_API_KEY (and GEMINI_MODEL) from the environment or .env.local
// (gitignored). Writes lib/sim/industryPacks.mjs — review and edit it freely:
// premade packs load instantly in the call and always win over generating one
// live. The restaurant and the factory are the recorded demo's own data
// (lib/sim/data.mjs) and are not generated. Format: lib/sim/packs.mjs.

import fs from 'node:fs/promises';
import path from 'node:path';
import { generatePack, isComplete } from '../lib/sim/packs.mjs';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'lib', 'sim', 'industryPacks.mjs');
const FORCE = process.argv.includes('--force');
const ONLY = process.argv.slice(2).filter(a => !a.startsWith('--'));

// id, what to ask for, unit code, and the words a visitor may use for it.
const INDUSTRIES = [
  ['hotel', 'Hotel', 'H001', ['hotel', 'hospitality', 'resort', 'motel', 'inn', 'lodging', 'bed and breakfast', 'hostel']],
  ['retail', 'Retail Store', 'R001', ['retail', 'store', 'shop', 'boutique', 'supermarket', 'grocery', 'grocery store', 'convenience store', 'department store', 'mall']],
  ['hospital', 'Hospital', 'M001', ['hospital', 'healthcare', 'health care', 'health', 'medical', 'clinic', 'nursing', 'nurses', 'medical center', 'urgent care']],
  ['senior-living', 'Senior Living Community', 'N001', ['senior living', 'nursing home', 'assisted living', 'elder care', 'care home', 'retirement home', 'long term care']],
  ['veterinary', 'Veterinary Clinic', 'V001', ['veterinary', 'veterinarian', 'vet', 'vet clinic', 'animal hospital', 'pet clinic', 'animal clinic']],
  ['security', 'Security Services', 'S001', ['security', 'security company', 'security guard', 'guards', 'patrol', 'guarding']],
  ['delivery', 'Delivery & Logistics', 'D001', ['delivery', 'logistics', 'courier', 'fleet', 'trucking', 'transportation', 'transport', 'last mile']],
  ['warehouse', 'Warehouse & Distribution', 'W001', ['warehouse', 'distribution center', 'distribution', 'fulfillment', 'fulfillment center', 'e-commerce fulfillment', '3pl']],
  ['fitness', 'Fitness Gym', 'G001', ['gym', 'gyms', 'fitness', 'fitness center', 'health club', 'fitness club', 'yoga studio', 'crossfit', 'fitness gym']],
  ['construction', 'Construction', 'C001', ['construction', 'contractor', 'general contractor', 'building site', 'job site', 'builder', 'construction company']],
  ['property', 'Property Management', 'B001', ['property management', 'apartments', 'apartment complex', 'real estate', 'residential property', 'facilities management', 'facility management', 'building management', 'hoa']],
  ['cleaning', 'Commercial Cleaning', 'J001', ['cleaning', 'cleaning company', 'janitorial', 'custodial', 'cleaning services', 'commercial cleaning', 'housekeeping services']],
  ['auto', 'Auto Repair Shop', 'A001', ['auto repair', 'car repair', 'mechanic', 'garage', 'car dealership', 'dealership', 'automotive', 'car wash', 'body shop', 'tire shop']],
  ['school', 'School', 'E001', ['school', 'schools', 'education', 'k-12', 'campus', 'university', 'college', 'daycare', 'childcare']],
];

async function loadEnv(name) {
  if (process.env[name]) return process.env[name];
  try {
    const env = await fs.readFile(path.join(ROOT, '.env.local'), 'utf8');
    for (const line of env.split('\n')) {
      const m = line.match(new RegExp(`^\\s*${name}\\s*=\\s*(.+?)\\s*$`));
      if (m) return m[1].replace(/^["']|["']$/g, '');
    }
  } catch { /* no .env.local */ }
  return null;
}

async function existing() {
  try { return (await import(`${new URL(`file:///${OUT.replace(/\\/g, '/')}`).href}?t=${Date.now()}`)).INDUSTRY_PACKS || []; } catch { return []; }
}

// One mission per line, so a pack reads (and diffs) like a list.
const j = v => JSON.stringify(v);
const NL = '\n';
const format = p => [
  '  {',
  `    id: ${j(p.id)}, industry: ${j(p.industry)}, code: ${j(p.code)}, name: ${j(p.name)}, ticketBoard: ${j(p.ticketBoard)},`,
  `    aliases: ${j(p.aliases)},`,
  '    teams: [',
  ...p.teams.map(t => [`      { name: ${j(t.name)}, missions: [`, ...t.missions.map(m => `        ${j(m)},`), '      ] },'].join(NL)),
  '    ],',
  '    personal: [',
  ...p.personal.map(x => `      ${j(x)},`),
  '    ],',
  `    requests: ${j(p.requests)},`,
  '  }',
].join(NL);

async function main() {
  const key = await loadEnv('GEMINI_API_KEY');
  if (!key) { console.error('Missing GEMINI_API_KEY (set it in the environment or .env.local).'); process.exit(1); }
  const model = (await loadEnv('GEMINI_MODEL')) || 'gemini-3.5-flash';
  const have = await existing();
  const todo = INDUSTRIES.filter(([id]) => (ONLY.length ? ONLY.includes(id) : FORCE || !have.some(p => p.id === id)));
  console.log(`Generating ${todo.length} pack(s) with ${model}…`);
  const made = [];
  // A few at a time.
  for (let i = 0; i < todo.length; i += 4) {
    await Promise.all(todo.slice(i, i + 4).map(async ([id, industry, code, aliases]) => {
      const started = Date.now();
      try {
        let pack = null;
        for (let attempt = 0; attempt < 3 && !isComplete(pack); attempt += 1) pack = await generatePack(industry, { key, model }).catch(e => { console.error(`    retry ${industry}: ${e.message} ${e.detail || ''}`); return null; });
        if (!isComplete(pack)) throw new Error('incomplete after 3 tries');
        made.push({ id, ...pack, industry, code, aliases });
        console.log(`  ✓ ${industry} (${((Date.now() - started) / 1000).toFixed(1)}s): ${pack.name} — ${pack.teams.map(t => `${t.name} ${t.missions.length}`).join(', ')}`);
      } catch (error) {
        console.error(`  ✗ ${industry}: ${error.message} ${error.detail || ''}`);
      }
    }));
  }
  const order = INDUSTRIES.map(([id]) => id);
  const packs = [...have.filter(p => !made.some(m => m.id === p.id)), ...made].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  const file = `// AUTO-GENERATED by scripts/generate-industry-packs.mjs (Gemini) — then reviewed.
// Premade industry workspaces for the /demo-ai call. Edit freely: [[stage
// industry …]] loads these instantly and only generates one live for an
// industry that isn't here. The restaurant (L001) and the factory (P001) are
// the recorded demo's own data in lib/sim/data.mjs. Format: lib/sim/packs.mjs.

export const INDUSTRY_PACKS = [
${packs.map(format).join(`,${NL}`)},
];
`;
  await fs.writeFile(OUT, file);
  console.log(`Wrote ${path.relative(ROOT, OUT)} (${packs.length} packs).`);
}

main();
