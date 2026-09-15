'use client';

// Product-UI backgrounds for the CTA posters: instead of an abstract field, the
// poster fills with faded, drifting Taskmaverick UI — live-ticking timer pills,
// mission chips, or a faded mission board. All are dimmed toward the centre so
// the headline stays readable (see .pui in globals.css).

import { useEffect, useState } from 'react';
import MissionChipField from '@/components/MissionChipField';

const GREEN = '#007A33';
const RED = '#bd1f59';
const ORANGE = '#ed7f04';

function fmt(total) {
  const s = Math.max(0, Math.floor(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n) => String(n).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(sec)}`;
}

// One shared 1s clock for all ticking UI, paused for reduced-motion users.
function useTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return tick;
}

export { default as TimersBg } from '@/components/ExecutionTimersBg';

// ---- A single faded mission chip (mini) --------------------------------------
const TYPE_TINTS = {
  Checklist: '#1271b7',
  Media: '#8b5cf6',
  Test: '#0ea5a3',
  Survey: '#ed7f04',
};

function MiniChip({ type = 'Checklist', count, title, who, exec, timer, timerColor = GREEN }) {
  return (
    <div className="pui-chip">
      <div className="pui-chip-top">
        <span className="pui-chip-dot" style={{ background: TYPE_TINTS[type] || '#1271b7' }} />
        <span className="pui-chip-type">{type}</span>
        {count != null && <span className="pui-chip-count">{count}</span>}
        <span className="pui-chip-spacer" />
        {exec && <span className="pui-chip-exec">{exec}</span>}
        {timer && (
          <span className="pui-chip-timer" style={{ background: timerColor }}>
            {timer}
          </span>
        )}
      </div>
      <div className="pui-chip-title">{title}</div>
      <div className="pui-chip-foot">
        <span>{who}</span>
        <span>07-09-26</span>
      </div>
    </div>
  );
}

// ---- Missions: mission chips drifting up the poster --------------------------
const CHIPS = [
  { top: 6, left: 8, type: 'Checklist', count: 10, title: 'Inventory Check', who: 'Julian D', dur: 20 },
  { top: 30, left: 60, type: 'Media', title: 'Shelf Photos', who: 'Mara K', dur: 24 },
  { top: 56, left: 14, type: 'Test', count: 5, title: 'Safety Quiz', who: 'Ravi P', dur: 22 },
  { top: 62, left: 64, type: 'Survey', title: 'Shift Feedback', who: 'Elena V', dur: 26 },
  { top: 84, left: 36, type: 'Checklist', count: 8, title: 'Close Register', who: 'Sam T', dur: 21 },
];

export function MissionsBg() {
  const tick = useTick();
  return (
    <MissionChipField>
      {Array.from({ length: 12 }, (_, i) => CHIPS[i % CHIPS.length]).map((c, i) => (
        <div
          key={i}
        >
          <MiniChip
            type={c.type}
            count={c.count}
            title={c.title}
            who={c.who}
            exec={fmt(300 + tick + i * 37)}
            timer={fmt(473 + tick + i * 53)}
            timerColor={[GREEN, RED, '#bd4b00'][i % 3]}
          />
        </div>
      ))}
    </MissionChipField>
  );
}

// ---- Board: a faded three-column mission board -------------------------------
const COLUMNS = [
  { name: 'Open', chips: [
    { type: 'Checklist', count: 10, title: 'Inventory Check', who: 'Julian D', color: RED },
    { type: 'Media', title: 'Shelf Photos', who: 'Mara K', color: ORANGE },
  ] },
  { name: 'Claimed', chips: [
    { type: 'Test', count: 5, title: 'Safety Quiz', who: 'Ravi P', color: GREEN },
    { type: 'Checklist', count: 8, title: 'Restock Aisle 4', who: 'Sam T', color: GREEN },
  ] },
  { name: 'Closed', chips: [
    { type: 'Survey', title: 'Shift Feedback', who: 'Elena V', color: '#686f76' },
  ] },
];

export function BoardBg() {
  const tick = useTick();
  return (
    <div className="cover-cta-stars pui pui--board" aria-hidden="true">
      <div className="pui-board">
        {COLUMNS.map((col, ci) => (
          <div className="pui-board-col" key={ci}>
            <div className="pui-board-head">{col.name}</div>
            {col.chips.map((c, i) => (
              <MiniChip
                key={i}
                type={c.type}
                count={c.count}
                title={c.title}
                who={c.who}
                exec={col.name === 'Open' ? null : fmt(200 + tick + i * 41)}
                timer={fmt(600 + tick + ci * 90 + i * 47)}
                timerColor={c.color}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

