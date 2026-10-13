// Runs inside the storyboard page (scripts/storyboard-split.mjs evaluates it in headless Chrome). It measures a
// frame's layers and places them, on the live stage the page drew, with the same CSS the page itself uses for
// moving and scaling an asset (`translate`, `scale`, a box's width and height), so what it reads back is exactly
// what the page will draw from the saved edits. Everything is in stage px (the stage is 1600 x 900).
(() => {
  const W = 1600, H = 900, SVG = 'http://www.w3.org/2000/svg';
  const CAVEAT = 'var(--font-caveat), Caveat, "Segoe Script", cursive';
  const alpha = c => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return c && c !== 'transparent' ? 1 : 0; const p = m[1].split(/[,\s/]+/).filter(Boolean); return p.length > 3 ? Number(p[3]) : 1; };
  const stageOf = id => { const f = document.querySelector('[data-frame="' + id.replace(/"/g, '\\"') + '"]'), s = f && f.querySelector('.sb-stage'); return s && s.childElementCount ? s : null; };
  const rootsOf = stage => [...stage.querySelectorAll('[data-sb-root]')].filter(el => !el.parentElement.closest('[data-sb-root]'));
  const keyOf = el => { const root = el.closest('[data-sb-root]'), path = []; for (let cur = el; cur !== root; cur = cur.parentElement) path.unshift([...cur.parentElement.children].indexOf(cur)); return root.dataset.sbRoot + (path.length ? '/' + path.join('.') : ''); };
  const shown = (el, root) => { for (let n = el; n; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || Number(cs.opacity) < 0.04) return false; if (n === root) break; } return true; };
  const parentScale = el => { const p = el.parentElement; return p && p.offsetWidth ? p.getBoundingClientRect().width / p.offsetWidth : 1; };
  const translateOf = el => { const m = /(-?[\d.]+)px(?:\s+(-?[\d.]+)px)?/.exec(el.style.translate || ''); return m ? [Number(m[1]), Number(m[2] ?? 0)] : [0, 0]; };
  const scaleOf = el => { const m = /^(-?[\d.]+)(?:\s+(-?[\d.]+))?/.exec(el.style.scale || ''); return m ? [Number(m[1]), Number(m[2] ?? m[1])] : [1, 1]; };
  const centerOf = r => ({x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2});

  // What a layer paints (stage px): its text, pictures, backgrounds and borders that are seen, inside whatever clips
  // them; not its own empty box, not a full-bleed backdrop. An iPad counts as its frame's body (the photo's
  // transparent margins left out), however the page draws the frame.
  function painted(root, S, u) {
    const out = {l: Infinity, t: Infinity, r: -Infinity, b: -Infinity}, stageArea = W * H * u * u;
    const grow = (l, t, r, b, clip) => {
      if (clip) { l = Math.max(l, clip.l); t = Math.max(t, clip.t); r = Math.min(r, clip.r); b = Math.min(b, clip.b); }
      if (r - l < 1 || b - t < 1) return;
      out.l = Math.min(out.l, l); out.t = Math.min(out.t, t); out.r = Math.max(out.r, r); out.b = Math.max(out.b, b);
    };
    const visit = (el, clip) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || Number(cs.opacity) < 0.04) return;
      const rect = el.getBoundingClientRect(), seen = cs.visibility === 'visible';
      let inner = clip;
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') inner = {l: Math.max(rect.left, clip ? clip.l : -Infinity), t: Math.max(rect.top, clip ? clip.t : -Infinity), r: Math.min(rect.right, clip ? clip.r : Infinity), b: Math.min(rect.bottom, clip ? clip.b : Infinity)};
      if (el.namespaceURI === SVG) { if (seen && el.tagName.toLowerCase() === 'svg') grow(rect.left, rect.top, rect.right, rect.bottom, clip); return; }
      if (seen) {
        if (el.classList.contains('tbl-tablet')) grow(rect.left + rect.width * 47 / 1285, rect.top + rect.height * 22 / 896, rect.left + rect.width * 1235 / 1285, rect.top + rect.height * 874 / 896, clip);
        const big = rect.width * rect.height >= 0.8 * stageArea, media = /^(IMG|VIDEO|CANVAS)$/.test(el.tagName);
        const bg = alpha(cs.backgroundColor) > 0.04 || cs.backgroundImage !== 'none';
        const border = ['Top', 'Right', 'Bottom', 'Left'].some(s => parseFloat(cs['border' + s + 'Width']) > 0 && cs['border' + s + 'Style'] !== 'none' && alpha(cs['border' + s + 'Color']) > 0.04);
        if (media || ((bg || border) && !big)) grow(rect.left, rect.top, rect.right, rect.bottom, clip);
        for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) { const range = document.createRange(); range.selectNodeContents(n); const rr = range.getBoundingClientRect(); grow(rr.left, rr.top, rr.right, rr.bottom, inner); }
      }
      for (const child of el.children) visit(child, inner);
    };
    visit(root, null);
    return isFinite(out.l) ? {l: (out.l - S.left) / u, t: (out.t - S.top) / u, r: (out.r - S.left) / u, b: (out.b - S.top) / u} : null;
  }

  const api = {
    // frames drawn live now (of `ids`)
    liveCount: ids => ids.filter(id => stageOf(id)).length,
    preload: async () => { await document.fonts.load('600 35px Caveat'); await document.fonts.ready; return document.fonts.check('600 35px Caveat'); },
    // the board seen at 1:1 (the stage is measured in its own px)
    actual: () => { const w = document.querySelector('.sb-world'); w.style.transform = 'translate(0px,0px) scale(1)'; return true; },

    measure(id) {
      const stage = stageOf(id);
      if (!stage) return null;
      const S = stage.getBoundingClientRect(), u = S.width / W;
      const st = r => ({l: (r.left - S.left) / u, t: (r.top - S.top) / u, r: (r.right - S.left) / u, b: (r.bottom - S.top) / u});
      const roots = rootsOf(stage).map(el => {
        const bubble = el.hasAttribute('data-sb-bubble'), cs = getComputedStyle(el);
        const out = {key: el.dataset.sbRoot, mode: bubble ? 'bubble' : (el.dataset.sbBox || el.classList.contains('iq2-mark')) ? 'size' : 'scale', rect: st(el.getBoundingClientRect()), paint: bubble ? null : painted(el, S, u), opacity: Number(cs.opacity)};
        const span = el.querySelector('p[aria-label] span');
        if (span) out.font = {px: parseFloat(getComputedStyle(span).fontSize), weight: getComputedStyle(span).fontWeight};
        if (bubble) { const p = el.querySelector('p'); if (p) out.words = st(p.getBoundingClientRect()); out.sized = el.dataset.sbSize ?? null; }
        else {
          out.tablet = el.classList.contains('tbl-tablet') || !!el.querySelector('.tbl-tablet');
          out.screens = [...el.querySelectorAll('.tbl-tablet > .tbl-screen')].map(keyOf);
          out.tabs = [...el.querySelectorAll('.mi-columns .tbl-tab')].filter(t => shown(t, el)).map(t => ({key: keyOf(t), size: parseFloat(getComputedStyle(t).fontSize)}));
          out.chips = [...el.querySelectorAll('.chip')].filter(c => shown(c, el) && c.getBoundingClientRect().width > 4).map(keyOf);
        }
        return out;
      });
      return {u, roots};
    },

    // Place a frame: spec = {roots: {key: {mode, scale, ideal: {x, y}}}, bubble: {key, target: {x, y}, size}}. `ideal` is where the
    // layer's box should have its middle; `scale` how much bigger the layer gets (null: as it is). -> what to save.
    apply(id, spec) {
      const stage = stageOf(id);
      if (!stage) return null;
      const S = stage.getBoundingClientRect(), u = S.width / W, out = {roots: {}, bubble: null};
      const rootOf = key => stage.querySelector('[data-sb-root="' + CSS.escape(key) + '"]');
      const shift = (el, to) => { // move the middle of its box to `to` (stage px)
        const c = centerOf(el.getBoundingClientRect()), k = parentScale(el), t = translateOf(el);
        const dx = (S.left + to.x * u - c.x) / k, dy = (S.top + to.y * u - c.y) / k;
        el.style.translate = (t[0] + dx) + 'px ' + (t[1] + dy) + 'px';
      };
      for (const [key, r] of Object.entries(spec.roots ?? {})) {
        const el = rootOf(key);
        if (!el) continue;
        if (r.scale && Math.abs(r.scale - 1) > 0.0005) {
          if (r.mode === 'size') { el.style.width = (parseFloat(el.style.width) || el.offsetWidth) * r.scale + 'px'; el.style.height = (parseFloat(el.style.height) || el.offsetHeight) * r.scale + 'px'; }
          else { const [sx, sy] = scaleOf(el); el.style.scale = sx * r.scale + ' ' + sy * r.scale; }
        }
        shift(el, r.ideal);
        const t = translateOf(el), sc = scaleOf(el);
        out.roots[key] = {translate: t, scale: Math.abs(sc[0] - 1) < 0.0005 && Math.abs(sc[1] - 1) < 0.0005 ? null : sc, size: r.mode === 'size' && r.scale && Math.abs(r.scale - 1) > 0.0005 ? [parseFloat(el.style.width), parseFloat(el.style.height)] : null};
      }
      const b = spec.bubble, el = b && rootOf(b.key);
      if (el) { // the words as the model's (what the sidebar would set), then its middle where the model's is
        const put = (attr, name, value) => { el.dataset[attr] = ''; el.style.setProperty(name, value); };
        put('sbFont', '--sb-font', CAVEAT); put('sbFontSize', '--sb-font-size', b.fontPx + 'px'); put('sbColor', '--sb-color', b.color);
        if (b.size) { el.dataset.sbSize = b.size[0] + ',' + b.size[1]; el.dataset.sbFit = ''; el.style.setProperty('--sb-fit', Math.max(1, b.size[0] - 2 * b.pad) + 'px'); }
        const p = el.querySelector('p'), k = parentScale(el), c = centerOf(p.getBoundingClientRect()), t = translateOf(el);
        const dx = (S.left + b.target.x * u - c.x) / k, dy = (S.top + b.target.y * u - c.y) / k;
        el.style.translate = (t[0] + dx) + 'px ' + (t[1] + dy) + 'px';
        const now = centerOf(p.getBoundingClientRect());
        out.bubble = {translate: translateOf(el), middle: {x: (now.x - S.left) / u, y: (now.y - S.top) / u}};
      }
      return out;
    },
  };
  window.__split = api;
  return true;
})();
