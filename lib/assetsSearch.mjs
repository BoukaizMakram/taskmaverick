import {ELEMENTS} from './assetElements.mjs';

// Search for the Assets Library. Every word typed has to match something about
// the asset (what it shows, the aliases of what it shows, its title, keywords,
// caption words, description); the more important the match, the higher it
// ranks. Words match from their start, plural or not: "timer" finds "timers",
// "aler" finds "alert".
const STOP = new Set(['and', 'the', 'of', 'a', 'an', 'with', 'in', 'on', 'to', 'for']);
const WEIGHT = {show: 10, title: 9, alias: 6, keyword: 5, words: 3, about: 2, demo: 2};

export const fold = text => String(text ?? '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/&/g, ' and ').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const stem = word => (word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word);
export const termsOf = text => fold(text).split(' ').filter(word => word && !STOP.has(word)).map(stem);

const index = new WeakMap();
function fieldsOf(asset) {
  if (index.has(asset)) return index.get(asset);
  const make = (kind, text, element) => ({kind, element, tokens: termsOf(text), phrase: termsOf(text).join(' ')});
  const fields = [
    make('title', asset.title),
    make('words', asset.words),
    make('about', asset.about),
    make('demo', `${asset.demoName} ${asset.kind}`),
    ...asset.keywords.map(keyword => make('keyword', keyword)),
    ...asset.shows.flatMap(name => [make('show', name, name), ...(ELEMENTS[name] ?? []).map(alias => make('alias', alias, name))]),
  ];
  index.set(asset, fields);
  return fields;
}

const matchesTerm = (field, term) => field.tokens.some(token => token.startsWith(term));

// -> [{asset, score, matched}] best first; `matched` lists the shown elements
// the search hit (so a card can say why it is here). An empty search keeps every
// asset in its own order.
export function searchAssets(query, assets) {
  const terms = termsOf(query);
  if (!terms.length) return assets.map(asset => ({asset, score: 0, matched: []}));
  const phrase = terms.join(' ');
  const results = [];
  assets.forEach((asset, order) => {
    const fields = fieldsOf(asset);
    let score = 0;
    const matched = new Set();
    for (const term of terms) {
      let best = 0;
      for (const field of fields) {
        if (!matchesTerm(field, term)) continue;
        best = Math.max(best, WEIGHT[field.kind]);
        if (field.element) matched.add(field.element);
      }
      if (!best) return;
      score += best;
    }
    // Typing a whole name ("execution timer") ranks what shows exactly that first.
    const named = new Set();
    let exact = false;
    if (terms.length > 1) for (const field of fields) if (['show', 'alias', 'title'].includes(field.kind) && field.phrase.includes(phrase)) { exact = true; if (field.element) named.add(field.element); }
    if (exact) score += 12;
    // What the clip points at (listed first) counts a little more.
    const pointed = asset.shows.findIndex(name => (named.size ? named : matched).has(name));
    if (pointed >= 0) score += Math.max(0, 4 - pointed);
    results.push({asset, score, matched: [...matched], order});
  });
  return results.sort((a, b) => b.score - a.score || a.order - b.order).map(({order, ...rest}) => rest);
}
