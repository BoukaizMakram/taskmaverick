'use client';

// ---------------------------------------------------------------------------
// PhoneBoard — the phone "Personal Board" (PhoneShell + MissionChips) with the
// animation toolkit layered on. Targets are the mission chips:
//   • Dim others — spotlight the selected chip, darken the rest.
//   • Pop out — lift the selected chip (scale + shadow).
//   • Zoom in — camera push onto the selected chip.
// Both chips are Claimed, so their timers tick up in real time (pausable).
// Chip geometry is measured (the phone layout isn't a fixed grid), so the
// overlays track the chip at any container size. Driven by OverviewLab-style
// controls in PhoneLab.
// ---------------------------------------------------------------------------

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import PhoneShell from '@/components/PhoneShell';
import MissionChip from '@/components/MissionChip';

const fmt = (s) => {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const TABS = [{ label: 'Open - 2' }, { label: 'Claimed - 2', active: true }, { label: 'Closed - 5' }];

export const PHONE_CHIPS = [
  { kind: 'Media', title: 'Cook Pasta', who: 'Anna F. - Staff', date: '04-01-24', time: '06:56 PM', exec: 312, pill: 460 },
  { kind: 'Media', title: 'Cook Tiramisu', who: 'Anna F. - Staff', date: '04-01-24', time: '06:56 PM', exec: 200, pill: 460 },
];

export default function PhoneBoard({ highlight = { chip: null, effects: [] }, paused = false }) {
  // real-time tick (one whole second per second) unless paused
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [paused]);

  const active = highlight && highlight.chip != null;
  const has = (e) => active && Array.isArray(highlight.effects) && highlight.effects.includes(e);
  const zoomOn = has('zoom');

  // measure each chip's rect (in rendered px, relative to the viewport) so the
  // overlays can track it. Re-measure on resize; skip while zoomed (the zoom
  // transform would corrupt the reading).
  const viewportRef = useRef(null);
  const chipRefs = useRef([]);
  const [rects, setRects] = useState([]);
  const zoomRef = useRef(false);
  zoomRef.current = zoomOn;
  useLayoutEffect(() => {
    const measure = () => {
      if (zoomRef.current) return;
      const vp = viewportRef.current;
      if (!vp) return;
      const vr = vp.getBoundingClientRect();
      setRects(
        chipRefs.current.map((el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { left: r.left - vr.left, top: r.top - vr.top, width: r.width, height: r.height, vw: vr.width, vh: vr.height };
        })
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (viewportRef.current) ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, []);

  const sel = active ? rects[highlight.chip] : null;

  const zoomStyle = (() => {
    if (!zoomOn || !sel) return { transform: 'translate(0px, 0px) scale(1)' };
    const Z = 2.1;
    const { vw, vh } = sel;
    const cx = sel.left + sel.width / 2;
    const cy = sel.top + sel.height / 2;
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const tx = clamp(vw / 2 - cx * Z, vw - vw * Z, 0);
    const ty = clamp(vh / 2 - cy * Z, vh - vh * Z, 0);
    return { transform: `translate(${tx}px, ${ty}px) scale(${Z})` };
  })();

  const clip = active && (has('dim') || zoomOn);

  return (
    <div className={`pb-viewport${clip ? ' is-clip' : ''}`} ref={viewportRef}>
      <div className="pb-stage" style={zoomStyle}>
        <div className="ph-fit">
          <PhoneShell title="Personal Board" tabs={TABS}>
            {PHONE_CHIPS.map((c, i) => (
              <MissionChip
                key={c.title}
                ref={(el) => (chipRefs.current[i] = el)}
                className={has('pop') && highlight.chip === i ? 'pb-pop' : ''}
                kind={c.kind}
                title={c.title}
                who={c.who}
                date={c.date}
                time={c.time}
                showExec
                execTime={fmt(c.exec + elapsed)}
                pillTime={fmt(c.pill + elapsed)}
              />
            ))}
          </PhoneShell>
        </div>

        {has('dim') && sel && (
          <div className="pb-dim" style={{ left: sel.left, top: sel.top, width: sel.width, height: sel.height }} aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
