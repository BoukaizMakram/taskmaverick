// What the hand of the two demos clicks or points at, by name (a stop's `target` in HAND_STOPS, lib/improvedQualityV2Story.mjs and
// lib/efficiencyV2Story.mjs): a selector in the demo's stage. A name that is not here is looked up as [data-iq-target="name"].
// The demos (components/ImprovedQualityV2Demo.jsx, EfficiencyV2Demo.jsx) aim their hand with these, and the storyboard's video aims its
// cursor with them (the slides it is made from are named after them: "Click Rate knob (2 of 3)").
export const QUALITY_RATED = 'emphasis-Opening Quality Check'; // the mission rated in chapters 12-14
export const QUALITY_TARGETS = {
  menu: '.iq2-kb-tablet .tbl-header [aria-label="Menu"]',
  knowledge: '.iq2-kb-tablet .bn-menu-item:has(img[src="/board-icons/team-book.svg"])',
  'tablet-menu': '.iq-emphasis-tablet .tbl-header [aria-label="Menu"]',
  'business-media': '.iq-emphasis-tablet [data-iq-target="business-media"]',
  mission: '.iq2-mission', report: '.iq2-report', 'peer-cards': '.iq2-iso-stack .iq2-peer-cards',
  iso: '.iq2-iso-stack .chip', 'iso-card': '.iq2-iso-stack .chip', 'iso-ratings': '.iq2-iso-stack .chip-ratings', 'rate-0': '.iq2-iso-stack .chip-rate',
  'rated-card': `.iq-emphasis-tablet [data-mission-id="${QUALITY_RATED}"] .chip`,
  'rate-knob': '.iq2-iso-stack .iq-rate-knob', proofs: '.iq-emphasis-tablet .iq-bp-window', 'mission-window': '.iq2-mission .iq2-m-window',
};
export const EFFICIENCY_TARGETS = {
  'tablet-top': '.ev2-tablet .tbl-header',
  'points-inv': '.ev2-cards [data-card="inv"] .chip-points', 'points-ord': '.ev2-cards [data-card="ord"] .chip-points',
  'pill-inv': '.ev2-cards [data-card="inv"] .chip-pill', 'card-sig': '.ev2-cards [data-card="sig"] .chip',
  'exec-sig': '.ev2-iso [data-card="sig"] .chip-exec', 'exec-front': '.ev2-iso [data-card="front"] .chip-exec',
  'who-sig': '.ev2-iso [data-card="sig"] .chip-who', 'who-front': '.ev2-iso [data-card="front"] .chip-who',
};
const BY_VIDEO = {'improved-quality-v2': QUALITY_TARGETS, 'increased-efficiency-v2': EFFICIENCY_TARGETS};
// The selector of a target of a demo (`video`: its id; `n`: which stop of its chapter it is, from 1). The steps' one spot is where each step's Yes is
// scrolled to, under the hand: the n-th step's Yes.
export const targetSelector = (video, name, n = 1) => (name === 'step-spot' ? `[data-iq-target="yes-${n - 1}"]` : BY_VIDEO[video]?.[name] ?? `[data-iq-target="${name}"]`);

// What the hand clicks, from the names of the storyboard's slides (lib/storyboardFrames.mjs: "Hand on Step spot (1 of 3)", "Click Rate knob (2 of 3)",
// "After the click (2 of 3)"; a copy ends with "(copy)"): {name, n (which stop of its chapter, from 1), stop}, or null (a stop that only points, none).
// `stops`: HAND_STOPS of the demo; `on`: the slide where the cursor rests before the click ("Hand on" names it), `gives`: the slide the click gives.
export function clickTarget(stops, on, gives) {
  const parse = (label, kinds) => { const m = new RegExp(`^(?:${kinds})\\b.*?(?:\\((\\d+) of \\d+\\))?(?:\\s*\\(copy\\))?$`, 'i').exec(String(label ?? '')); return m ? Number(m[1]) || 1 : 0; };
  const pick = (chapter, n) => { const stop = n ? stops?.[chapter]?.[n - 1] : null; return stop && (stop.kind ?? 'click') !== 'point' ? {name: stop.target, n, stop} : null; };
  return pick(on?.chapter, parse(on?.label, 'Hand on|Tail and hand on')) ?? pick(gives?.chapter, parse(gives?.label, 'Click|After the click'));
}
