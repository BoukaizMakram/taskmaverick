// The storyboard's assets read without a browser (scripts/storyboard.mjs): a small HTML
// parser that keeps every child node (so paths and text addresses are the ones the page
// uses, components/storyboardDom.js), the texts of an asset with their keys, and how much
// the wrappers around an asset scale it. Pure.
//
//   key            what the page calls a part of an asset: 'layer' (the asset), 'layer/0.2'
//                  (its first child's third child), 'layer/0.2#1' (the second child node of that
//                  element: a piece of text beside other things)
//   a words block  (p[aria-label], a chat bubble's words) is one text: its lines joined by \n
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const ENTITIES = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'"};
const ZWSP = String.fromCharCode(8203);
const decode = text => text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (all, name) => {
  if (name[0] === '#') { const code = name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : Number(name.slice(1)); return Number.isFinite(code) ? String.fromCodePoint(code) : all; }
  return ENTITIES[name.toLowerCase()] ?? all;
});

// HTML -> {type: 'root', children}; an element is {type: 'el', tag, attrs, children, parent, svg}.
export function parseHtml(html) {
  const root = {type: 'root', children: [], parent: null, svg: false};
  let cur = root, i = 0;
  const add = node => { node.parent = cur; cur.children.push(node); };
  while (i < html.length) {
    if (html.startsWith('<!--', i)) { const end = html.indexOf('-->', i + 4); add({type: 'comment'}); i = end < 0 ? html.length : end + 3; continue; }
    if (html[i] === '<' && html[i + 1] === '/') {
      const end = html.indexOf('>', i), tag = html.slice(i + 2, end).trim().toLowerCase();
      for (let up = cur; up && up.type === 'el'; up = up.parent) if (up.tag === tag) { cur = up.parent; break; }
      i = end + 1;
      continue;
    }
    if (html[i] === '<' && /[a-z]/i.test(html[i + 1] ?? '')) {
      const m = /^<([a-z][\w:-]*)/i.exec(html.slice(i, i + 80)), tag = m[1].toLowerCase();
      let j = i + m[0].length, quote = null;
      for (; j < html.length; j++) { const c = html[j]; if (quote) { if (c === quote) quote = null; } else if (c === '"' || c === "'") quote = c; else if (c === '>') break; }
      const inside = html.slice(i + m[0].length, j), closed = /\/\s*$/.test(inside), attrs = {};
      for (const a of inside.matchAll(/([^\s=/>]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attrs[a[1].toLowerCase()] = decode(a[3] ?? a[4] ?? a[5] ?? '');
      const el = {type: 'el', tag, attrs, children: [], svg: tag === 'svg' || cur.svg};
      add(el);
      i = j + 1;
      if (!closed && !VOID.has(tag)) cur = el;
      continue;
    }
    const next = html.indexOf('<', i + 1), end = next < 0 ? html.length : next;
    add({type: 'text', text: decode(html.slice(i, end))});
    i = end;
  }
  return root;
}

const elements = node => node.children.filter(n => n.type === 'el');
export const textOf = node => (node.type === 'text' ? node.text : node.type === 'el' || node.type === 'root' ? node.children.map(textOf).join('') : '');
export function findRoot(tree, layerKey) {
  const stack = [tree];
  while (stack.length) { const n = stack.pop(); if (n.type === 'el' && n.attrs['data-sb-root'] === layerKey) return n; if (n.children) stack.push(...[...n.children].reverse()); }
  return null;
}
// The element at `path` ('0.2') under an asset's root.
export const elementAt = (root, path) => (path ? path.split('.').reduce((el, i) => (el ? elements(el)[Number(i)] ?? null : null), root) : root);
const pathOf = (el, root) => { const path = []; for (let cur = el; cur !== root; cur = cur.parent) path.unshift(elements(cur.parent).indexOf(cur)); return path.join('.'); };
const keyOf = (el, root, layerKey) => { const path = pathOf(el, root); return path ? `${layerKey}/${path}` : layerKey; };
const isWordsBlock = el => el.tag === 'p' && 'aria-label' in el.attrs;
const linesOf = p => elements(p).map(span => textOf(span).split(ZWSP).join('')).join('\n');

// Every text of an asset, in reading order: [{key, text}] (`html`: the asset's HTML).
export function textsOf(html, layerKey) {
  const root = findRoot(parseHtml(html ?? ''), layerKey);
  if (!root) return [];
  const out = [], seen = new Set();
  const visit = el => {
    if (el.svg) return;
    if (isWordsBlock(el)) { const key = keyOf(el, root, layerKey); if (!seen.has(key)) { seen.add(key); out.push({key, text: linesOf(el)}); } return; }
    const kids = elements(el);
    el.children.forEach((n, i) => {
      if (n.type === 'el') { visit(n); return; }
      if (n.type !== 'text' || !n.text.trim()) return;
      const key = kids.length ? `${keyOf(el, root, layerKey)}#${i}` : keyOf(el, root, layerKey);
      if (!seen.has(key)) { seen.add(key); out.push({key, text: kids.length ? n.text : textOf(el)}); }
    });
  };
  visit(root);
  return out;
}

// How much the wrappers around an asset's root scale it (their inline transform / scale):
// a move of 1 css px of the asset is that many stage px.
export function wrapperScale(html, layerKey) {
  const root = findRoot(parseHtml(html ?? ''), layerKey);
  let k = 1;
  for (let el = root?.parent; el && el.type === 'el'; el = el.parent) {
    const style = el.attrs.style ?? '';
    for (const m of style.matchAll(/scale\(\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)/g)) k *= Number(m[1]);
    const prop = /(?:^|;)\s*scale\s*:\s*([\d.]+)/.exec(style);
    if (prop) k *= Number(prop[1]);
  }
  return k;
}
