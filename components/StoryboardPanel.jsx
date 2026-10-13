'use client';
// The storyboard's sidebar (the inspector), built like Figma's design panel: sections
// (Position, Layout, Appearance, Fill, Stroke, Effects, Text...) of small fields. A number
// field is set with Enter or by leaving it, stepped with the arrow keys (Shift: 10) and
// scrubbed by dragging its label left and right; a color field is a chip (it opens the
// wheel) and the color as text. Only the parts: what they change is in Storyboard.jsx.
import {useEffect, useRef, useState} from 'react';
import {SWATCHES, hexToHsv, hsvToHex, normalizeHex, wheelAt, wheelPoint} from '@/lib/storyboardDraw.mjs';
import {PAINT_PRESETS, TEXTURES, addStop, gradientFrom, isGradient, normalizePaint, paintCss, removeStop, samePaint, setStop, solidFrom} from '@/lib/storyboardPaint.mjs';

// A color as the page computes it -> '#rrggbb', or null when it is clear (nothing painted).
export function solidHex(color) {
  const text = String(color ?? '').trim().toLowerCase();
  if (!text || text === 'transparent' || /^rgba\(.*[,/]\s*0(\.0+)?\s*\)$/.test(text)) return null;
  return normalizeHex(text);
}

// ---- The color wheel (the pencil's color, a drawing's, a fill's, a text's...) ----------
// Hue goes round it and saturation from its middle to its rim; the slider under it is
// the brightness; then a few ready colors and the color as text.
export function ColorWheel({value, onChange}) {
  const wheel = useRef(null), hsv = hexToHsv(value), R = 62, dot = wheelPoint(hsv, R);
  const [text, setText] = useState(value);
  useEffect(() => { setText(value); }, [value]);
  const pick = event => {
    const r = wheel.current.getBoundingClientRect();
    onChange(hsvToHex({...wheelAt(event.clientX - r.left - r.width / 2, event.clientY - r.top - r.height / 2, r.width / 2), v: hsv.v < 0.06 ? 1 : hsv.v}));
  };
  return <div className="sb-color">
    <div ref={wheel} className="sb-wheel" style={{width: 2 * R, height: 2 * R}} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); pick(e); }} onPointerMove={e => { if (e.buttons & 1) pick(e); }}>
      <b style={{opacity: 1 - hsv.v}}/>
      <i style={{left: R + dot.x, top: R + dot.y, background: value}}/>
    </div>
    <label className="sb-light">Light<input type="range" min="0" max="100" value={Math.round(hsv.v * 100)} onChange={e => onChange(hsvToHex({...hsv, v: Number(e.target.value) / 100}))} aria-label="Brightness"/></label>
    <div className="sb-swatches">
      {SWATCHES.map(color => <button key={color} type="button" className={color === value ? 'is-on' : ''} style={{background: color}} onClick={() => onChange(color)} aria-label={color} title={color}/>)}
      <input value={text} onChange={e => { setText(e.target.value); const color = normalizeHex(e.target.value); if (color && e.target.value.replace('#', '').length === 6) onChange(color); }} spellCheck="false" aria-label="Color (hex)"/>
    </div>
  </div>;
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

// A color: the chip (opens the wheel under it) and the color as text (without #, like Figma).
export function ColorField({value, onChange, onRemove, label = 'Color'}) {
  const [open, setOpen] = useState(false), [text, setText] = useState((value ?? '').replace('#', '').toUpperCase());
  useEffect(() => { setText((value ?? '').replace('#', '').toUpperCase()); }, [value]);
  const set = raw => { const color = normalizeHex(raw); if (color) onChange(color); else setText((value ?? '').replace('#', '').toUpperCase()); };
  return <div className="sb-colorfield">
    <div className="sb-row">
      <div className="sb-field sb-field--color">
        <button type="button" className="sb-chip" style={{background: value ?? 'transparent'}} onClick={() => setOpen(o => !o)} aria-label={`${label}: open the color wheel`} aria-expanded={open}/>
        <input value={text} spellCheck="false" aria-label={`${label} (hex)`} onChange={e => setText(e.target.value)} onBlur={() => set(text)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); set(text); e.currentTarget.blur(); } }}/>
      </div>
      {onRemove && <button type="button" className="sb-sec-btn" onClick={onRemove} title={`Remove the ${label.toLowerCase()}`} aria-label={`Remove the ${label.toLowerCase()}`}>{PanelIcon.minus}</button>}
    </div>
    {open && <ColorWheel value={value ?? '#000000'} onChange={onChange}/>}
  </div>;
}

// A paint: a plain color, or a linear / radial gradient (its colors, where each one is, the angle),
// and the ready ones to pick from (the Metal plate first). `gradients` off: plain colors only.
export function PaintField({value, onChange, onRemove, label = 'Fill', gradients = true, presets = true, edge = false}) {
  const paint = normalizePaint(value), gradient = isGradient(paint), kind = gradient ? paint.kind : 'solid';
  return <div className="sb-paint">
    {gradients && <div className="sb-row">
      <SelectField wide label={`${label} type`} value={kind} options={[{value: 'solid', label: 'Solid'}, {value: 'linear', label: 'Linear gradient'}, {value: 'radial', label: 'Radial gradient'}]} onChange={id => onChange(id === 'solid' ? solidFrom(paint) : gradientFrom(paint, id))}/>
      {onRemove && <button type="button" className="sb-sec-btn" onClick={onRemove} title={`Remove the ${label.toLowerCase()}`} aria-label={`Remove the ${label.toLowerCase()}`}>{PanelIcon.minus}</button>}
    </div>}
    {!gradient && <ColorField label={label} value={paint ?? '#ffffff'} onChange={onChange} onRemove={gradients ? null : onRemove}/>}
    {gradient && <>
      <div className="sb-paint-bar" style={{background: paintCss(paint)}}/>
      {kind === 'linear' && <div className="sb-row"><NumField label="∠" title="Angle" value={paint.angle ?? 0} unit="°" min={0} max={360} onChange={angle => onChange({...paint, angle})}/><span className="sb-row-fill"/></div>}
      {paint.stops.map((stop, i) => <div key={i} className="sb-stop">
        <ColorField label={`Color ${i + 1}`} value={stop.color} onChange={color => onChange(setStop(paint, i, {color}))}/>
        <div className="sb-row"><NumField label="%" title={`Where color ${i + 1} is`} value={stop.at} unit="%" min={0} max={100} onChange={at => onChange(setStop(paint, i, {at}))}/>{paint.stops.length > 2 && <button type="button" className="sb-sec-btn" onClick={() => onChange(removeStop(paint, i))} title="Remove this color" aria-label={`Remove color ${i + 1}`}>{PanelIcon.minus}</button>}</div>
      </div>)}
      <div className="sb-row sb-paint-tools">
        <button type="button" className="sb-paint-add" onClick={() => onChange(addStop(paint))}>+ Add color</button>
      </div>
      {edge && <label className="sb-paint-brushed"><input type="checkbox" checked={!!paint.edge} onChange={e => onChange({...paint, edge: e.target.checked || undefined})}/>Polished metal edge</label>}
      <SelectField wide label="Texture" value={paint.texture ?? ''} options={[{value: '', label: 'No texture'}, ...Object.entries(TEXTURES).map(([value, t]) => ({value, label: t.name}))]} onChange={texture => onChange({...paint, texture: texture || undefined, brushed: undefined})}/>
    </>}
    {presets && <div className="sb-presets" role="group" aria-label="Ready backgrounds">
      {PAINT_PRESETS.map(p => <button key={p.id} type="button" className={samePaint(p.paint, paint) ? 'is-on' : ''} style={{background: paintCss(p.paint)}} onClick={() => onChange(p.paint)} title={p.name} aria-label={p.name}/>)}
    </div>}
  </div>;
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
