'use client';
// The storyboard's sidebar (the inspector), built like Figma's design panel: sections
// (Position, Layout, Appearance, Fill, Stroke, Effects, Text...) of small fields. A number
// field is set with Enter or by leaving it, stepped with the arrow keys (Shift: 10) and
// scrubbed by dragging its label left and right; a color or a paint is a Figma fill row (its swatch
// opens Figma's color picker beside the sidebar). Only the parts: what they change is in Storyboard.jsx.
import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {normalizeHex} from '@/lib/storyboardDraw.mjs';
import {PAINT_PRESETS, TEXTURES, gradientFrom, insertStop, isGradient, moveStop, normalizePaint, paintCss, removeStop, samePaint, setStop, solidFrom} from '@/lib/storyboardPaint.mjs';
import './StoryboardPaint.css';

// A color as the page computes it -> '#rrggbb', or null when it is clear (nothing painted).
export function solidHex(color) {
  const text = String(color ?? '').trim().toLowerCase();
  if (!text || text === 'transparent' || /^rgba\(.*[,/]\s*0(\.0+)?\s*\)$/.test(text)) return null;
  return normalizeHex(text);
}

export const PanelIcon = {
  plus: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M8 3.5v9M3.5 8h9"/></svg>,
  minus: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M3.5 8h9"/></svg>,
  left: <svg viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="2" width="1.3" height="12" rx=".6"/><rect x="4.6" y="4" width="8" height="3" rx=".8"/><rect x="4.6" y="9" width="5" height="3" rx=".8"/></svg>,
  hcenter: <svg viewBox="0 0 16 16" fill="currentColor"><rect x="7.35" y="2" width="1.3" height="12" rx=".6"/><rect x="3" y="4" width="10" height="3" rx=".8"/><rect x="4.5" y="9" width="7" height="3" rx=".8"/></svg>,
  right: <svg viewBox="0 0 16 16" fill="currentColor"><rect x="12.7" y="2" width="1.3" height="12" rx=".6"/><rect x="3.4" y="4" width="8" height="3" rx=".8"/><rect x="6.4" y="9" width="5" height="3" rx=".8"/></svg>,
  top: <svg viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="2" width="12" height="1.3" rx=".6"/><rect x="4" y="4.6" width="3" height="8" rx=".8"/><rect x="9" y="4.6" width="3" height="5" rx=".8"/></svg>,
  vcenter: <svg viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="7.35" width="12" height="1.3" rx=".6"/><rect x="4" y="3" width="3" height="10" rx=".8"/><rect x="9" y="4.5" width="3" height="7" rx=".8"/></svg>,
  bottom: <svg viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="12.7" width="12" height="1.3" rx=".6"/><rect x="4" y="3.4" width="3" height="8" rx=".8"/><rect x="9" y="6.4" width="3" height="5" rx=".8"/></svg>,
  tleft: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M2.5 4h11M2.5 8h7M2.5 12h9"/></svg>,
  tcenter: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M2.5 4h11M4.5 8h7M3.5 12h9"/></svg>,
  tright: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M2.5 4h11M6.5 8h7M4.5 12h9"/></svg>,
  tjustify: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M2.5 4h11M2.5 8h11M2.5 12h11"/></svg>,
  rotate: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12.5 8A4.5 4.5 0 1 1 8 3.5h2.5M9 1.8l1.7 1.7L9 5.2"/></svg>,
  radius: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M3 13V8a5 5 0 0 1 5-5h5"/></svg>,
  opacity: <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.2"/><path d="M8 2.5a5.5 5.5 0 0 1 0 11Z" fill="currentColor"/></svg>,
  lock: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="3.5" y="7" width="9" height="6.5" rx="1.2"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>,
  unlock: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="3.5" y="7" width="9" height="6.5" rx="1.2"/><path d="M5.5 7V5a2.5 2.5 0 0 1 4.8-1"/></svg>,
  lineHeight: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M2.5 2.5h11M2.5 13.5h11M6 10.5 8 5l2 5.5M6.7 8.7h2.6"/></svg>,
  spacing: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M2.5 3v10M13.5 3v10M6 11 8 5l2 6M6.7 9h2.6"/></svg>,
  shadow: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="2.5" y="2.5" width="8" height="8" rx="1.5"/><path d="M12.5 5.5v6a1 1 0 0 1-1 1h-6" strokeLinecap="round"/></svg>,
  blur: <svg viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="2.2"/><circle cx="3.5" cy="8" r="1.1" opacity=".55"/><circle cx="12.5" cy="8" r="1.1" opacity=".55"/><circle cx="8" cy="3.5" r="1.1" opacity=".55"/><circle cx="8" cy="12.5" r="1.1" opacity=".55"/><circle cx="4.6" cy="4.6" r=".8" opacity=".35"/><circle cx="11.4" cy="4.6" r=".8" opacity=".35"/><circle cx="4.6" cy="11.4" r=".8" opacity=".35"/><circle cx="11.4" cy="11.4" r=".8" opacity=".35"/></svg>,
  bgBlur: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="2.5" y="2.5" width="11" height="11" rx="2"/><path d="M5 11 11 5M5 8l3-3M8 11l3-3" strokeLinecap="round" opacity=".6"/></svg>,
  copyPos: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 3.5v-.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h.5"/><path d="M9.5 8v3M8 9.5h3" strokeLinecap="round"/></svg>,
  pastePos: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"><path d="M5.5 3H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-1.5"/><rect x="5.5" y="2" width="5" height="2.5" rx=".8"/><path d="M8 7v4M6.5 9.5 8 11l1.5-1.5" strokeLinecap="round"/></svg>,
};

// A titled part of the panel; `add` / `remove` put a + / − at its right, like Figma's Fill;
// `addMenu` makes the + a short list to pick from (`onAdd` gets the value); `tools`: buttons of its own.
export function Section({title, children, add, remove, addLabel, addMenu, onAdd, tools}) {
  return <section className="sb-sec">
    <header>
      <h4>{title}</h4>
      {tools}
      {addMenu?.length > 0 && <label className="sb-sec-btn sb-sec-menu" title={addLabel ?? `Add to ${title.toLowerCase()}`}>
        {PanelIcon.plus}
        <select value="" onChange={e => { if (e.target.value) onAdd(e.target.value); }} aria-label={addLabel ?? `Add to ${title.toLowerCase()}`}>
          <option value="" disabled>Add…</option>
          {addMenu.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>}
      {add && <button type="button" className="sb-sec-btn" onClick={add} title={addLabel ?? `Add ${title.toLowerCase()}`} aria-label={addLabel ?? `Add ${title.toLowerCase()}`}>{PanelIcon.plus}</button>}
      {remove && <button type="button" className="sb-sec-btn" onClick={remove} title={`Remove ${title.toLowerCase()}`} aria-label={`Remove ${title.toLowerCase()}`}>{PanelIcon.minus}</button>}
    </header>
    {children}
  </section>;
}

const shown = (value, digits = 2) => (value == null || value === '' || !Number.isFinite(Number(value)) ? '' : String(Math.round(Number(value) * 10 ** digits) / 10 ** digits));

// A number: a short label or icon on its left (drag it to scrub), the value, a unit.
export function NumField({label, value, onChange, step = 1, min = -Infinity, max = Infinity, unit = '', title, disabled = false, placeholder = ''}) {
  const [text, setText] = useState(shown(value)), focused = useRef(false), scrub = useRef(null);
  useEffect(() => { if (!focused.current) setText(shown(value)); }, [value]);
  const clamp = n => Math.max(min, Math.min(max, n));
  // (a number left as it was shown is not a change: clicking into a field and out again must not save what it displays, e.g. a line height, which would then stay put when the font size changes)
  const set = raw => { const n = Number(String(raw).replace(',', '.').replace(/[^\d.+-]/g, '')); if (String(raw).trim() === shown(value)) setText(shown(value)); else if (String(raw).trim() !== '' && Number.isFinite(n)) { onChange(clamp(n)); setText(shown(clamp(n))); } else setText(shown(value)); };
  const startScrub = event => {
    if (disabled) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    scrub.current = {x: event.clientX, v: Number(value) || 0};
  };
  const moveScrub = event => {
    const s = scrub.current;
    if (!s) return;
    const n = clamp(Math.round((s.v + Math.round((event.clientX - s.x) / 2) * step) / step) * step);
    setText(shown(n)); onChange(n);
  };
  return <label className={`sb-field${disabled ? ' is-off' : ''}`} title={title}>
    <span className="sb-field-k" onPointerDown={startScrub} onPointerMove={moveScrub} onPointerUp={() => { scrub.current = null; }} onPointerCancel={() => { scrub.current = null; }}>{label}</span>
    <input type="text" inputMode="decimal" value={text} disabled={disabled} placeholder={placeholder} spellCheck="false"
      onFocus={e => { focused.current = true; e.target.select(); }}
      onBlur={() => { focused.current = false; set(text); }}
      onChange={e => setText(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') { e.preventDefault(); set(text); e.currentTarget.blur(); }
        else if (e.key === 'Escape') { e.preventDefault(); setText(shown(value)); e.currentTarget.blur(); }
        else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); const n = clamp((Number(value) || 0) + (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1)); setText(shown(n)); onChange(n); }
      }}/>
    {unit && <i>{unit}</i>}
  </label>;
}

// ---- Colors and paints, picked the way Figma does it (the user, 2026-10-22: "the color should be like this exactly same for gradients", with Figma's fill picker) ----
// In the sidebar a paint is Figma's fill row: its swatch, the hex (or Linear / Radial / Angular), the opacity. The swatch opens the picker at the left of the sidebar:
// Custom | Libraries, the kinds (Solid, Gradient, Texture; Figma's Pattern, Image and Video are there but not in the storyboard), the color square with the hue and
// opacity sliders, the eyedropper, Hex / RGB / HSL / HSB / CSS, the swatches "On this page"; a gradient: its kind, swap, rotate, the bar with square stops and
// the list of stops. Every change is sent at once, as it was.
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const WHITE = {r: 255, g: 255, b: 255, a: 1};
// A color string -> {r, g, b, a} (0-255, a 0-1), or null: #rgb, #rgba, #rrggbb, #rrggbbaa, rgb(), rgba(), hsl(), transparent.
export function parseColor(text) {
  const t = String(text ?? '').trim().toLowerCase();
  if (!t) return null;
  if (t === 'transparent') return {r: 0, g: 0, b: 0, a: 0};
  let m = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(t);
  if (m) {
    const h = m[1].length <= 4 ? [...m[1]].map(c => c + c).join('') : m[1];
    return {r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1};
  }
  const num = (v, full) => (v.endsWith('%') ? (parseFloat(v) / 100) * full : parseFloat(v));
  m = /^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(t);
  if (m) return {r: clamp(num(m[1], 255), 0, 255), g: clamp(num(m[2], 255), 0, 255), b: clamp(num(m[3], 255), 0, 255), a: m[4] == null ? 1 : clamp(num(m[4], 1), 0, 1)};
  m = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(t);
  if (m) return {...hslToRgb({h: Number(m[1]) % 360, s: clamp(m[2] / 100, 0, 1), l: clamp(m[3] / 100, 0, 1)}), a: m[4] == null ? 1 : clamp(num(m[4], 1), 0, 1)};
  return null;
}
const hex2 = n => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0');
// '#rrggbb', or '#rrggbbaa' when it is not opaque and `alpha` is allowed
export const colorHex = ({r, g, b, a = 1}, alpha = true) => `#${hex2(r)}${hex2(g)}${hex2(b)}${alpha && a < 0.998 ? hex2(a * 255) : ''}`;
function rgbToHsv({r, g, b}) {
  const R = r / 255, G = g / 255, B = b / 255, max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min;
  const h = !d ? 0 : max === R ? ((G - B) / d + 6) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return {h: h * 60, s: max ? d / max : 0, v: max};
}
function hsvToRgb({h, s, v}) {
  const f = n => { const k = (n + (((h % 360) + 360) % 360) / 60) % 6; return (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255; };
  return {r: f(5), g: f(3), b: f(1)};
}
function rgbToHsl({r, g, b}) {
  const R = r / 255, G = g / 255, B = b / 255, max = Math.max(R, G, B), min = Math.min(R, G, B), l = (max + min) / 2, d = max - min;
  const h = !d ? 0 : max === R ? ((G - B) / d + 6) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return {h: h * 60, s: !d ? 0 : d / (1 - Math.abs(2 * l - 1)), l};
}
function hslToRgb({h, s, l}) {
  const a = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255; };
  return {r: f(0), g: f(8), b: f(4)};
}
const hexText = rgba => colorHex(rgba, false).slice(1).toUpperCase(); // (Figma writes it without # and in capitals)
const pct = a => String(Math.round(a * 100));
const KIND_NAME = {linear: 'Linear', radial: 'Radial', angular: 'Angular'};
// Figma's "On this page" swatches (and the site's own colors); the ones you add with + come first (this browser keeps them)
const PALETTE = ['#ffffff00', '#000000', '#00000080', '#e6e6e6', '#1b1f23', '#ffffff', '#9aa3ab', '#c2185b', '#6b6b6b',
  '#14a39a', '#dde3ea', '#0f1f3d', '#d63e7e', '#3fa6dc', '#ffa24a', '#3ecf9b', '#ffd60a', '#fbbd23',
  '#1271b7', '#007a33', '#ffec00', '#ed7f04', '#bd1f59', '#686f76', '#7b3cf0', '#dab072', '#ff3b30',
  '#111111', '#2c2c2c', '#383838', '#4b5563', '#94a3b8', '#cbd5e1', '#f1f5f9', '#e8f4ff', '#0d99ff'];
const SAVED = 'storyboard:swatches';
const readSaved = () => { try { const list = JSON.parse(localStorage.getItem(SAVED) || '[]'); return Array.isArray(list) ? list.filter(c => typeof c === 'string' && parseColor(c)).slice(0, 18) : []; } catch { return []; } };
const writeSaved = list => { try { localStorage.setItem(SAVED, JSON.stringify(list)); } catch {} };

const PK = {
  plus: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></svg>,
  close: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>,
  solid: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="2.5" y="2.5" width="11" height="11" rx="2"/><rect x="5" y="5" width="6" height="6" rx=".8" fill="currentColor" stroke="none"/></svg>,
  gradient: <svg viewBox="0 0 16 16" fill="currentColor"><rect x="2.5" y="2.5" width="11" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2"/><circle cx="5.5" cy="5.5" r=".9"/><circle cx="8" cy="5.5" r=".75" opacity=".75"/><circle cx="10.5" cy="5.5" r=".6" opacity=".5"/><circle cx="5.5" cy="8" r=".9"/><circle cx="8" cy="8" r=".75" opacity=".75"/><circle cx="10.5" cy="8" r=".6" opacity=".5"/><circle cx="5.5" cy="10.5" r=".9"/><circle cx="8" cy="10.5" r=".75" opacity=".75"/><circle cx="10.5" cy="10.5" r=".6" opacity=".5"/></svg>,
  pattern: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="2.5" y="2.5" width="11" height="11" rx="2"/><path d="M6.2 2.5v11M9.8 2.5v11M2.5 6.2h11M2.5 9.8h11"/></svg>,
  image: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"><rect x="2.5" y="2.5" width="11" height="11" rx="2"/><path d="M2.8 11.5 6 8.3l2.4 2.4 1.6-1.6 3.2 3.2"/><circle cx="10.4" cy="5.8" r="1"/></svg>,
  video: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"><rect x="2.5" y="2.5" width="11" height="11" rx="2"/><path d="M6.6 5.6v4.8L10.4 8Z" fill="currentColor"/></svg>,
  texture: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><rect x="2.5" y="2.5" width="11" height="11" rx="2"/><path d="M4.5 6c1-.9 2-.9 3 0s2 .9 3 0 1.4-.6 1.5-.6M4.5 8.5c1-.9 2-.9 3 0s2 .9 3 0 1.4-.6 1.5-.6M4.5 11c1-.9 2-.9 3 0s2 .9 3 0 1.4-.6 1.5-.6"/></svg>,
  drop: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"><path d="M8 2.6C9.8 5 11.8 7.2 11.8 9.6a3.8 3.8 0 0 1-7.6 0C4.2 7.2 6.2 5 8 2.6Z"/></svg>,
  eye: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.2 3.2a1.6 1.6 0 0 1 2.3 0l.3.3a1.6 1.6 0 0 1 0 2.3l-1.3 1.3.6.6-1 1-4.2-4.2 1-1 .6.6Z"/><path d="M8.3 6.3 3.6 11v1.4H5l4.7-4.7"/></svg>,
  swap: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5.5h10M10.5 3 13 5.5 10.5 8M13 10.5H3M5.5 8 3 10.5 5.5 13"/></svg>,
  rotate: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2.5 12 6.5 8 13.5 4 6.5Z"/><path d="M12.6 2.6a5 5 0 0 1 .9 3.3" opacity=".7"/></svg>,
  check: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.4 6.5 11.2 12.5 4.8"/></svg>,
};

// A drag on an element (pointer captured): `at(event)` for the press and every move.
const dragWith = at => ({
  onPointerDown: e => { if (e.button !== 0) return; e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); at(e); },
  onPointerMove: e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) at(e); },
});

// A small text box set with Enter or by leaving it; Esc puts back what it was.
function Entry({value, onCommit, label, className = '', numeric = false}) {
  const [text, setText] = useState(value), focused = useRef(false), cancel = useRef(false);
  useEffect(() => { if (!focused.current) setText(value); }, [value]);
  return <input className={`sb-pk-in ${className}`} value={text} spellCheck="false" aria-label={label} inputMode={numeric ? 'decimal' : undefined}
    onFocus={e => { focused.current = true; cancel.current = false; e.target.select(); }}
    onChange={e => setText(e.target.value)}
    onBlur={() => { focused.current = false; if (!cancel.current && text !== value) onCommit(text); cancel.current = false; setText(value); }}
    onKeyDown={e => {
      if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
      else if (e.key === 'Escape') { e.preventDefault(); cancel.current = true; e.currentTarget.blur(); }
      else if (numeric && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); const n = (Number(text) || 0) + (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1); onCommit(String(n)); }
    }}/>;
}
const numberOf = text => { const n = Number(String(text).replace(',', '.').replace(/[^\d.+-]/g, '')); return String(text).trim() !== '' && Number.isFinite(n) ? n : null; };

// The color being picked, as hue, saturation, brightness and alpha. The hue (and the saturation) are kept when the color goes to black or to white,
// where they no longer show in the color, as Figma does: a drag down to black and up again comes back to the same hue.
function usePicked(value, alpha, onChange) {
  const rgba = parseColor(value) ?? WHITE;
  const [hsv, setHsv] = useState(() => rgbToHsv(rgba));
  const sent = useRef(colorHex(rgba));
  useEffect(() => {
    const now = parseColor(value) ?? WHITE, hex = colorHex(now);
    if (hex === sent.current) return;
    sent.current = hex;
    const next = rgbToHsv(now);
    setHsv(was => ({h: next.s < 0.002 || next.v < 0.002 ? was.h : next.h, s: next.v < 0.002 ? was.s : next.s, v: next.v}));
  }, [value]);
  const send = (nextHsv, a) => {
    const hex = colorHex({...hsvToRgb(nextHsv), a: alpha ? a : 1}, alpha);
    sent.current = colorHex(parseColor(hex));
    setHsv(nextHsv);
    onChange(hex);
  };
  const setHsvA = (nextHsv, a = rgba.a) => send(nextHsv, a);
  const setRgba = next => { const h = rgbToHsv(next); send({h: h.s < 0.002 || h.v < 0.002 ? hsv.h : h.h, s: h.v < 0.002 ? hsv.s : h.s, v: h.v}, next.a ?? rgba.a); };
  return {hsv, rgba, setHsvA, setRgba};
}

// The color square: saturation from left to right, brightness from bottom to top, in the hue of the slider.
function Square({hsv, onChange}) {
  const box = useRef(null);
  const at = e => { const r = box.current.getBoundingClientRect(); onChange({h: hsv.h, s: clamp((e.clientX - r.left) / r.width, 0, 1), v: clamp(1 - (e.clientY - r.top) / r.height, 0, 1)}); };
  return <div ref={box} className="sb-pk-square" style={{'--hue': `hsl(${hsv.h} 100% 50%)`}} {...dragWith(at)} role="slider" aria-label="Saturation and brightness" aria-valuenow={Math.round(hsv.s * 100)}>
    <i style={{left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: colorHex(hsvToRgb(hsv), false)}}/>
  </div>;
}
// A slider of Figma's (the hue, the opacity): a rounded track, a white ring in the color.
function Slider({label, value, track, knob, checker = false, onChange}) {
  const el = useRef(null);
  const at = e => { const r = el.current.getBoundingClientRect(); onChange(clamp((e.clientX - r.left - 7) / Math.max(1, r.width - 14), 0, 1)); };
  return <div ref={el} className={`sb-pk-slider${checker ? ' is-check' : ''}`} {...dragWith(at)} role="slider" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
    <b style={{background: track}}/>
    <i style={{left: `calc(7px + (100% - 14px) * ${value})`, background: knob}}/>
  </div>;
}
// The color as numbers: Hex, RGB, HSL, HSB or CSS, then its opacity.
const MODES = [['hex', 'Hex'], ['rgb', 'RGB'], ['hsl', 'HSL'], ['hsb', 'HSB'], ['css', 'CSS']];
function Values({rgba, hsv, alpha, onRgba, onHsv}) {
  const [mode, setMode] = useState('hex');
  const hsl = rgbToHsl(rgba), three = (vals, labels, apply) => vals.map((v, i) => <Entry key={labels[i]} numeric className="is-num" value={String(Math.round(v))} label={labels[i]} onCommit={t => { const n = numberOf(t); if (n != null) apply(i, n); }}/>);
  const fields = mode === 'hex' ? <Entry className="is-hex" value={hexText(rgba)} label="Hex" onCommit={t => { const c = parseColor(t.trim().replace(/^#?/, '#')) ?? parseColor(t); if (c) onRgba(/^#?[0-9a-f]{8}$/i.test(t.trim()) ? c : {...c, a: rgba.a}); }}/>
    : mode === 'rgb' ? three([rgba.r, rgba.g, rgba.b], ['Red', 'Green', 'Blue'], (i, n) => onRgba({...rgba, [['r', 'g', 'b'][i]]: clamp(n, 0, 255)}))
    : mode === 'hsl' ? three([hsl.h, hsl.s * 100, hsl.l * 100], ['Hue', 'Saturation', 'Lightness'], (i, n) => { const next = {...hsl, [['h', 's', 'l'][i]]: i ? clamp(n, 0, 100) / 100 : ((n % 360) + 360) % 360}; onRgba({...hslToRgb(next), a: rgba.a}); })
    : mode === 'hsb' ? three([hsv.h, hsv.s * 100, hsv.v * 100], ['Hue', 'Saturation', 'Brightness'], (i, n) => onHsv({...hsv, [['h', 's', 'v'][i]]: i ? clamp(n, 0, 100) / 100 : ((n % 360) + 360) % 360}))
    : <Entry className="is-css" value={rgba.a < 0.998 ? `rgba(${Math.round(rgba.r)}, ${Math.round(rgba.g)}, ${Math.round(rgba.b)}, ${Math.round(rgba.a * 100) / 100})` : `rgb(${Math.round(rgba.r)}, ${Math.round(rgba.g)}, ${Math.round(rgba.b)})`} label="CSS color" onCommit={t => { const c = parseColor(t); if (c) onRgba(c); }}/>;
  return <div className="sb-pk-values">
    <label className="sb-pk-select sb-pk-mode"><select value={mode} onChange={e => setMode(e.target.value)} aria-label="Color format">{MODES.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
    <div className="sb-pk-box">
      {fields}
      {alpha && <><span className="sb-pk-sep"/><Entry numeric className="is-pct" value={pct(rgba.a)} label="Opacity" onCommit={t => { const n = numberOf(t); if (n != null) onRgba({...rgba, a: clamp(n, 0, 100) / 100}); }}/><i className="sb-pk-unit">%</i></>}
    </div>
  </div>;
}
// Figma's picker for one color: the square, the eyedropper with the hue and opacity sliders, the numbers, the swatches.
function Picker({value, onChange, alpha = true, swatches = PALETTE}) {
  const {hsv, rgba, setHsvA, setRgba} = usePicked(value, alpha, onChange);
  const [eye, setEye] = useState(false);
  useEffect(() => { setEye(typeof window !== 'undefined' && 'EyeDropper' in window); }, []);
  const sample = async () => { try { const got = await new window.EyeDropper().open(); const c = parseColor(got.sRGBHex); if (c) setRgba({...c, a: rgba.a}); } catch {} };
  const solid = colorHex(hsvToRgb(hsv), false);
  return <div className="sb-pk-picker">
    <Square hsv={hsv} onChange={next => setHsvA(next)}/>
    <div className="sb-pk-sliders">
      <button type="button" className="sb-pk-icon" disabled={!eye} onClick={sample} title={eye ? 'Pick a color from the screen' : 'The eyedropper is not in this browser'} aria-label="Pick a color from the screen">{PK.eye}</button>
      <div className="sb-pk-tracks">
        <Slider label="Hue" value={hsv.h / 360} track="linear-gradient(90deg, #f00 0%, #ff0 16.67%, #0f0 33.33%, #0ff 50%, #00f 66.67%, #f0f 83.33%, #f00 100%)" knob={`hsl(${hsv.h} 100% 50%)`} onChange={p => setHsvA({...hsv, h: Math.min(359.9, p * 360)})}/>
        {alpha && <Slider label="Opacity" checker value={rgba.a} track={`linear-gradient(90deg, ${solid}00, ${solid})`} knob={colorHex({...hsvToRgb(hsv), a: rgba.a})} onChange={p => setHsvA(hsv, p)}/>}
      </div>
    </div>
    <Values rgba={rgba} hsv={hsv} alpha={alpha} onRgba={setRgba} onHsv={next => setHsvA(next)}/>
    {swatches && <div className="sb-pk-library">
      <label className="sb-pk-select sb-pk-wide"><select value="page" onChange={() => {}} aria-label="Swatches"><option value="page">On this page</option></select></label>
      <div className="sb-pk-swatches">
        {swatches.map((c, i) => <button key={`${c}-${i}`} type="button" className={colorHex(parseColor(c) ?? WHITE) === colorHex(rgba) ? 'is-on' : ''} onClick={() => { const p = parseColor(c); if (p) setRgba(alpha ? p : {...p, a: 1}); }} title={c.toUpperCase()} aria-label={c}><i style={{background: c}}/></button>)}
      </div>
    </div>}
  </div>;
}

// The gradient as Figma draws it: the bar, a square stop over it for each of its colors (the one picked outlined blue, its little pointer on the bar). Drag a stop to move it,
// click the bar to add one there (the color the gradient has there), drag a stop well up or down to take it off (two always stay).
function StopBar({paint, pick, onPick, onChange}) {
  const track = useRef(null), drag = useRef(null), [leaving, setLeaving] = useState(null);
  const posAt = clientX => { const r = track.current.getBoundingClientRect(); return clamp(((clientX - r.left) / Math.max(1, r.width)) * 100, 0, 100); };
  const press = (event, i) => {
    if (event.button !== 0) return;
    event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId);
    onPick(i); drag.current = {i, y: event.clientY, paint};
  };
  const move = event => {
    const d = drag.current;
    if (!d) return;
    const away = d.paint.stops.length > 2 && Math.abs(event.clientY - d.y) > 36;
    setLeaving(away ? d.i : null);
    if (away) return;
    const {paint: next, index} = moveStop(d.paint, d.i, posAt(event.clientX));
    d.paint = next; d.i = index; onPick(index); onChange(next);
  };
  const release = event => {
    const d = drag.current;
    drag.current = null; setLeaving(null);
    if (d && d.paint.stops.length > 2 && Math.abs(event.clientY - d.y) > 36) { onChange(removeStop(d.paint, d.i)); onPick(Math.max(0, d.i - 1)); }
  };
  const add = event => {
    if (event.button !== 0) return;
    const {paint: next, index} = insertStop(paint, posAt(event.clientX));
    if (index >= 0) { onChange(next); onPick(index); }
  };
  return <div className="sb-pk-gbar">
    <div className="sb-pk-gstops">
      {paint.stops.map((s, i) => <button key={i} type="button" className={`sb-pk-gstop${i === pick ? ' is-on' : ''}${leaving === i ? ' is-leaving' : ''}`} style={{left: `${s.at}%`}}
        onPointerDown={event => press(event, i)} onPointerMove={move} onPointerUp={release} onPointerCancel={release} title={`${hexText(parseColor(s.color) ?? WHITE)} at ${Math.round(s.at)}% · drag to move it, up or down to take it off`} aria-label={`Stop ${i + 1}: ${s.color} at ${Math.round(s.at)}%`}>
        <i style={{background: s.color}}/>
      </button>)}
    </div>
    <div className="sb-pk-gtrack"><b ref={track} style={{background: `linear-gradient(90deg, ${paint.stops.map(s => `${s.color} ${s.at}%`).join(', ')})`}} onPointerDown={add} title="Click to add a stop here"/></div>
  </div>;
}

// The picker itself, beside the sidebar (a portal: over everything, at the left of the field's row, kept on the screen).
function PaintPicker({anchor, paint, onChange, onClose, gradients, presets, edge, swatches, label}) {
  const pop = useRef(null), gradient = isGradient(paint);
  const [pos, setPos] = useState({left: -9999, top: 0});
  const [tab, setTab] = useState('custom'), [view, setView] = useState(gradient ? 'gradient' : 'solid'), [pick, setPick] = useState(0), [saved, setSaved] = useState(readSaved);
  const at = gradient ? Math.min(pick, paint.stops.length - 1) : 0;
  useEffect(() => { setView(v => (v === 'texture' ? v : gradient ? 'gradient' : 'solid')); }, [gradient]); // (Undo, a ready one picked: the view follows the paint)
  useLayoutEffect(() => {
    const place = () => {
      const row = anchor.current, el = pop.current;
      if (!row || !el) return;
      const r = row.getBoundingClientRect(), side = row.closest('.sb-side')?.getBoundingClientRect(), W = el.offsetWidth, H = el.offsetHeight;
      let left = (side ? side.left : r.left) - W - 10;
      if (left < 8) left = clamp(r.left, 8, window.innerWidth - W - 8);
      setPos({left, top: clamp(r.top - 10, 8, Math.max(8, window.innerHeight - H - 8))});
    };
    place();
    const watch = new ResizeObserver(place);
    watch.observe(pop.current);
    window.addEventListener('resize', place);
    return () => { watch.disconnect(); window.removeEventListener('resize', place); };
  }, [anchor]);
  useEffect(() => { // a press outside closes it; so does Esc (not in a field of its own, where Esc puts the field back)
    const press = e => { if (!pop.current?.contains(e.target) && !anchor.current?.contains(e.target)) onClose(); };
    const key = e => { if (e.key !== 'Escape' || (pop.current?.contains(e.target) && e.target.matches?.('input, select'))) return; e.preventDefault(); e.stopPropagation(); onClose(); };
    document.addEventListener('pointerdown', press, true);
    window.addEventListener('keydown', key, true);
    return () => { document.removeEventListener('pointerdown', press, true); window.removeEventListener('keydown', key, true); };
  }, [anchor, onClose]);

  const current = gradient ? paint.stops[at].color : paint;
  const save = () => { const c = colorHex(parseColor(current) ?? WHITE); const next = [c, ...saved.filter(x => x !== c)].slice(0, 18); setSaved(next); writeSaved(next); };
  const list = [...saved, ...(swatches ?? PALETTE)];
  const toSolid = () => { setView('solid'); if (gradient) onChange(solidFrom(paint)); };
  const toGradient = () => { setView('gradient'); if (!gradient) { onChange(gradientFrom(paint, 'linear')); setPick(0); } };
  const texture = id => { const base = gradient ? paint : {kind: 'linear', angle: 0, stops: [{color: paint, at: 0}, {color: paint, at: 100}]}; onChange(normalizePaint({...base, texture: id || undefined, brushed: undefined}) ?? base); };
  const swap = () => { onChange(normalizePaint({...paint, stops: paint.stops.map(s => ({color: s.color, at: 100 - s.at}))}) ?? paint); setPick(paint.stops.length - 1 - at); };
  const rotate = () => onChange({...paint, angle: ((paint.angle ?? 0) + 90) % 360});
  const addStopHere = () => {
    const gaps = paint.stops.slice(1).map((s, i) => [s.at - paint.stops[i].at, (s.at + paint.stops[i].at) / 2]).sort((a, b) => b[0] - a[0]);
    const {paint: next, index} = insertStop(paint, gaps[0]?.[1] ?? 50);
    if (index >= 0) { onChange(next); setPick(index); }
  };
  const stopColor = (i, rgba) => onChange(setStop(paint, i, {color: colorHex(rgba)}));
  const metals = PAINT_PRESETS.filter(p => p.paint.texture || /metal|steel|alumin|chrome|titan|gun|gold|brass|copper|carbon|plate|perforated/i.test(p.name)), others = PAINT_PRESETS.filter(p => !metals.includes(p));
  const kindButton = (id, icon, name, on, click, off = false) => <button type="button" className={`sb-pk-kind${on ? ' is-on' : ''}`} onClick={click} disabled={off} title={off && !click ? 'Not in the storyboard' : name} aria-label={name} aria-pressed={on}>{icon}</button>;

  const ownKey = e => { if ((e.ctrlKey || e.metaKey) && /^[zy]$/i.test(e.key)) return; e.stopPropagation(); }; // (the board's shortcuts wait while the picker is open, but Undo and Redo go through: the user, 2026-10-22, "undo sometimes doesn't work")
  return createPortal(<div ref={pop} className="sb-pk" style={pos} role="dialog" aria-label={`${label}: color`} onKeyDown={ownKey} onKeyUp={ownKey}>
    <header className="sb-pk-head">
      <button type="button" className={`sb-pk-tab${tab === 'custom' ? ' is-on' : ''}`} onClick={() => setTab('custom')}>Custom</button>
      <button type="button" className={`sb-pk-tab${tab === 'libraries' ? ' is-on' : ''}`} onClick={() => setTab('libraries')} disabled={!presets} title={presets ? 'The ready ones: metals, gradients' : 'No ready ones here'}>Libraries</button>
      <span className="sb-pk-fill"/>
      <button type="button" className="sb-pk-icon" onClick={save} title="Add this color to the swatches" aria-label="Add this color to the swatches">{PK.plus}</button>
      <button type="button" className="sb-pk-icon" onClick={onClose} title="Close (Esc)" aria-label="Close">{PK.close}</button>
    </header>
    {tab === 'libraries' ? <div className="sb-pk-libs">
      {[['Metals', metals], ['Gradients', others]].map(([name, items]) => items.length > 0 && <div key={name} className="sb-pk-libgroup">
        <h5>{name}</h5>
        <div className="sb-pk-libgrid">{items.map(p => <button key={p.id} type="button" className={samePaint(p.paint, paint) ? 'is-on' : ''} onClick={() => { onChange(p.paint); setPick(0); setView('gradient'); setTab('custom'); }} title={p.name} aria-label={p.name}><i style={{background: paintCss(p.paint)}}/></button>)}</div>
      </div>)}
    </div> : <>
      <div className="sb-pk-kinds" role="group" aria-label="Kind of paint">
        {kindButton('solid', PK.solid, 'Solid', view === 'solid', toSolid)}
        {kindButton('gradient', PK.gradient, 'Gradient', view === 'gradient', gradients ? toGradient : null, !gradients)}
        {kindButton('pattern', PK.pattern, 'Pattern', false, null, true)}
        {kindButton('image', PK.image, 'Image', false, null, true)}
        {kindButton('video', PK.video, 'Video', false, null, true)}
        {kindButton('texture', PK.texture, 'Texture', view === 'texture', gradients ? () => setView('texture') : null, !gradients)}
        <span className="sb-pk-fill"/>
        {kindButton('blend', PK.drop, 'Blend mode', false, null, true)}
      </div>
      {view === 'texture' ? <div className="sb-pk-textures" role="listbox" aria-label="Texture">
        {[['', 'None', null], ...Object.entries(TEXTURES).map(([id, t]) => [id, t.name, t.css])].map(([id, name, css]) => { const on = (gradient ? paint.texture ?? '' : '') === id; return <button key={id || 'none'} type="button" role="option" aria-selected={on} className={on ? 'is-on' : ''} onClick={() => texture(id)}>
          <i style={{background: css ? `${css}, linear-gradient(135deg, #8e959c, #d8dde1)` : 'linear-gradient(135deg, #8e959c, #d8dde1)'}}/><span>{name}</span>{on && <b>{PK.check}</b>}
        </button>; })}
        {!gradient && <p className="sb-pk-note">A texture lies over a gradient: the color becomes a flat one under it.</p>}
      </div> : view === 'gradient' && gradient ? <>
        <div className="sb-pk-grow">
          <label className="sb-pk-select"><select value={paint.kind} onChange={e => onChange(gradientFrom(paint, e.target.value))} aria-label="Kind of gradient">
            {['linear', 'radial', 'angular'].map(k => <option key={k} value={k}>{KIND_NAME[k]}</option>)}
            <option value="diamond" disabled>Diamond</option>
          </select></label>
          {paint.kind !== 'radial' && <span className="sb-pk-box sb-pk-angle" title="Angle"><Entry numeric className="is-num" value={String(Math.round(paint.angle ?? 0))} label="Angle" onCommit={t => { const n = numberOf(t); if (n != null) onChange({...paint, angle: ((n % 360) + 360) % 360}); }}/><i className="sb-pk-unit">°</i></span>}
          <span className="sb-pk-fill"/>
          <button type="button" className="sb-pk-icon" onClick={swap} title="Flip the stops" aria-label="Flip the stops">{PK.swap}</button>
          <button type="button" className="sb-pk-icon" onClick={rotate} disabled={paint.kind === 'radial'} title="Rotate 90°" aria-label="Rotate 90°">{PK.rotate}</button>
        </div>
        <StopBar paint={paint} pick={at} onPick={setPick} onChange={onChange}/>
        <div className="sb-pk-stopshead"><b>Stops</b><button type="button" className="sb-pk-icon" onClick={addStopHere} disabled={paint.stops.length >= 8} title="Add a stop" aria-label="Add a stop">{PK.plus}</button></div>
        <div className="sb-pk-stops">
          {paint.stops.map((s, i) => { const c = parseColor(s.color) ?? WHITE; return <div key={i} className={`sb-pk-stop${i === at ? ' is-on' : ''}`} onPointerDown={() => setPick(i)}>
            <span className="sb-pk-box sb-pk-pos"><Entry numeric className="is-num" value={String(Math.round(s.at))} label={`Stop ${i + 1} position`} onCommit={t => { const n = numberOf(t); if (n == null) return; const {paint: next, index} = moveStop(paint, i, clamp(n, 0, 100)); onChange(next); setPick(index); }}/><i className="sb-pk-unit">%</i></span>
            <span className="sb-pk-box sb-pk-stopcolor">
              <span className="sb-pk-chip"><i style={{background: s.color}}/></span>
              <Entry className="is-hex" value={hexText(c)} label={`Stop ${i + 1} color`} onCommit={t => { const p = parseColor(t.trim().replace(/^#?/, '#')) ?? parseColor(t); if (p) stopColor(i, /^#?[0-9a-f]{8}$/i.test(t.trim()) ? p : {...p, a: c.a}); }}/>
              <span className="sb-pk-sep"/>
              <Entry numeric className="is-pct" value={pct(c.a)} label={`Stop ${i + 1} opacity`} onCommit={t => { const n = numberOf(t); if (n != null) stopColor(i, {...c, a: clamp(n, 0, 100) / 100}); }}/><i className="sb-pk-unit">%</i>
            </span>
            <button type="button" className="sb-pk-icon" onClick={() => { onChange(removeStop(paint, i)); setPick(Math.max(0, Math.min(at, paint.stops.length - 2))); }} disabled={paint.stops.length <= 2} title="Take this stop off" aria-label={`Take stop ${i + 1} off`}>{PanelIcon.minus}</button>
          </div>; })}
        </div>
        <Picker value={paint.stops[at].color} onChange={c => onChange(setStop(paint, at, {color: c}))} swatches={list}/>
        {edge && <label className="sb-pk-check"><input type="checkbox" checked={!!paint.edge} onChange={e => onChange({...paint, edge: e.target.checked || undefined})}/>Polished metal edge</label>}
      </> : <Picker value={gradient ? solidFrom(paint) : paint} onChange={onChange} swatches={list}/>}
    </>}
  </div>, document.body);
}

// Figma's fill row: the swatch (it opens the picker), the hex or the gradient's kind, the opacity, and a − when the paint can be taken off.
function FillRow({rowRef, paint, label, open, onOpen, onChange, onRemove, alpha = true}) {
  const gradient = isGradient(paint), rgba = gradient ? null : parseColor(paint) ?? WHITE;
  return <div ref={rowRef} className={`sb-pk-row${open ? ' is-open' : ''}`}>
    <div className="sb-pk-rowbox">
      <button type="button" className="sb-pk-chip" onClick={onOpen} aria-label={`${label}: open the color picker`} aria-expanded={open} title={gradient ? `${KIND_NAME[paint.kind]} gradient${paint.texture ? ` · ${TEXTURES[paint.texture]?.name}` : ''}` : label}><i style={{background: paintCss(paint) || 'transparent'}}/></button>
      {gradient ? <button type="button" className="sb-pk-rowname" onClick={onOpen}>{KIND_NAME[paint.kind]}{paint.texture ? <small>{TEXTURES[paint.texture]?.name}</small> : null}</button>
        : <Entry className="is-hex" value={hexText(rgba)} label={`${label} (hex)`} onCommit={t => { const p = parseColor(t.trim().replace(/^#?/, '#')) ?? parseColor(t); if (p) onChange(colorHex(/^#?[0-9a-f]{8}$/i.test(t.trim()) ? p : {...p, a: rgba.a}, alpha)); }}/>}
      {!gradient && alpha && <><span className="sb-pk-sep"/><Entry numeric className="is-pct" value={pct(rgba.a)} label={`${label} opacity`} onCommit={t => { const n = numberOf(t); if (n != null) onChange(colorHex({...rgba, a: clamp(n, 0, 100) / 100})); }}/><i className="sb-pk-unit">%</i></>}
    </div>
    {onRemove && <button type="button" className="sb-pk-icon" onClick={onRemove} title={`Remove the ${label.toLowerCase()}`} aria-label={`Remove the ${label.toLowerCase()}`}>{PanelIcon.minus}</button>}
  </div>;
}

// A color (a stroke, a text's color, the words'): Figma's row and picker, a plain color only (with its opacity).
export function ColorField({value, onChange, onRemove, label = 'Color'}) {
  const [open, setOpen] = useState(false), row = useRef(null), close = useRef(() => setOpen(false)).current;
  const color = typeof value === 'string' && parseColor(value) ? value : '#000000';
  return <div className="sb-pk-field">
    <FillRow rowRef={row} paint={color} label={label} open={open} onOpen={() => setOpen(o => !o)} onChange={onChange} onRemove={onRemove}/>
    {open && <PaintPicker anchor={row} paint={color} onChange={onChange} onClose={close} gradients={false} presets={false} label={label}/>}
  </div>;
}

// A paint (a frame's background, an asset's fill, a look of the videos): a color or a gradient, Figma's row and picker. `gradients` off: plain colors only;
// `presets` off: no Libraries; `edge`: the polished metal edge of an iPad's frame; `swatches`: the colors "On this page" (else Figma's palette).
export function PaintField({value, onChange, onRemove, label = 'Fill', gradients = true, presets = true, edge = false, swatches = null}) {
  const paint = normalizePaint(value) ?? '#ffffff', [open, setOpen] = useState(false), row = useRef(null), close = useRef(() => setOpen(false)).current;
  return <div className="sb-pk-field">
    <FillRow rowRef={row} paint={paint} label={label} open={open} onOpen={() => setOpen(o => !o)} onChange={onChange} onRemove={onRemove}/>
    {open && <PaintPicker anchor={row} paint={paint} onChange={onChange} onClose={close} gradients={gradients} presets={presets} edge={edge} swatches={swatches} label={label}/>}
  </div>;
}

// A color picked in the sidebar itself (the pencil's, a drawing's ink): Figma's square, hue slider, numbers and swatches, open in place. A plain '#rrggbb', as before.
export function ColorWheel({value, onChange}) {
  return <div className="sb-pk-inline"><Picker value={value} alpha={false} onChange={c => onChange(normalizeHex(c) ?? c)}/></div>;
}

// A row of icon buttons, one of them on (alignment, text alignment).
export function IconButtons({items, value, onChange}) {
  return <div className="sb-iconrow" role="group">
    {items.map(item => <button key={item.id} type="button" className={value === item.id ? 'is-on' : ''} onClick={() => onChange(item.id)} title={item.label} aria-label={item.label} aria-pressed={value === item.id}>{item.icon}</button>)}
  </div>;
}

// Words (a line's name, a frame's): set with Enter or by leaving the box, Esc puts back what it was (allowEmpty: it can be emptied too).
export function TextField({value, onChange, label, disabled = false, allowEmpty = false}) {
  const [text, setText] = useState(value), focused = useRef(false), cancel = useRef(false);
  useEffect(() => { if (!focused.current) setText(value); }, [value]);
  return <label className="sb-field is-wide">
    <input value={text} disabled={disabled} aria-label={label} spellCheck="false"
      onFocus={() => { focused.current = true; cancel.current = false; }}
      onChange={e => setText(e.target.value)}
      onBlur={() => { focused.current = false; if (!cancel.current && (allowEmpty || text.trim()) && text.trim() !== value) onChange(text.trim()); else setText(value); }}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } else if (e.key === 'Escape') { e.preventDefault(); cancel.current = true; e.currentTarget.blur(); } }}/>
  </label>;
}

// One effect of an asset (Effects): its icon, its name, its amount (a blur's px), a − to take it off.
export function EffectRow({icon, name, value, onChange, onRemove}) {
  return <div className="sb-row sb-effect">
    <span className="sb-effect-icon">{icon}</span>
    <span className="sb-effect-name">{name}</span>
    {onChange && <NumField label={PanelIcon.blur} title={`${name} (px)`} value={value} min={0} max={200} step={0.5} unit="px" onChange={onChange}/>}
    <button type="button" className="sb-sec-btn" onClick={onRemove} title={`Remove the ${name.toLowerCase()}`} aria-label={`Remove the ${name.toLowerCase()}`}>{PanelIcon.minus}</button>
  </div>;
}
// Lock (or unlock) a width or a height: the handles and the field leave it as it is.
export function LockButton({on, label, onClick}) {
  return <button type="button" className={`sb-sec-btn sb-lockbtn${on ? ' is-on' : ''}`} onClick={onClick} title={`${on ? 'Unlock' : 'Lock'} the ${label}`} aria-label={`${on ? 'Unlock' : 'Lock'} the ${label}`} aria-pressed={!!on}>{on ? PanelIcon.lock : PanelIcon.unlock}</button>;
}
// A small icon button for a section's header (copy / paste a position).
export function ToolButton({icon, label, onClick, disabled = false}) {
  return <button type="button" className="sb-sec-btn" onClick={onClick} disabled={disabled} title={label} aria-label={label}>{icon}</button>;
}

// A choice from a short list (a font, a weight).
export function SelectField({value, options, onChange, label, wide = false}) {
  return <label className={`sb-field sb-field--select${wide ? ' is-wide' : ''}`}>
    <select value={value} onChange={e => onChange(e.target.value)} aria-label={label}>
      {options.map(o => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
    </select>
  </label>;
}
