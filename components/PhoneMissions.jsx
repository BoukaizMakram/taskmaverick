'use client';

// ---------------------------------------------------------------------------
// Phone "Personal Board" — uses the shared PhoneShell (chrome) + MissionChip
// (same card as the tablet). Both shown missions are Claimed, so per the timer
// rules both timers run: each counts UP in real time.
// ---------------------------------------------------------------------------

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import PhoneShell from '@/components/PhoneShell';
import MissionChip from '@/components/MissionChip';

const fmt = (s) => {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const TABS = [
  { label: 'Open - 2' },
  { label: 'Claimed - 2', active: true },
  { label: 'Closed - 5' },
];

export default function PhoneMissions() {
  const root = useRef(null);
  const c1 = useRef(null);
  const c2 = useRef(null);

  useGSAP(
    () => {
      const paint = (el, s) => (el.textContent = fmt(s));
      const D = 3600; // run as a real-time stopwatch for a long time (no visible reset)

      // Both missions are Claimed -> both timers run. Both count UP.
      const cards = [
        { ref: c1, clock: { exec: 312, timer: 460 } }, // Cook Pasta:    00:05:12 / 00:07:40
        { ref: c2, clock: { exec: 200, timer: 460 } }, // Cook Tiramisu: 00:03:20 / 00:07:40
      ];

      cards.forEach(({ ref, clock }) => {
        const execEl = ref.current.querySelector('.chip-exec');
        const pillEl = ref.current.querySelector('.chip-pill');
        paint(execEl, clock.exec);
        paint(pillEl, clock.timer);
        gsap.to(clock, { exec: clock.exec + D, duration: D, ease: 'none', onUpdate: () => paint(execEl, clock.exec) });
        gsap.to(clock, { timer: clock.timer + D, duration: D, ease: 'none', onUpdate: () => paint(pillEl, clock.timer) });
      });
    },
    { scope: root }
  );

  return (
    <div className="ph-fit" ref={root}>
      <PhoneShell title="Personal Board" tabs={TABS}>
        <MissionChip
          ref={c1}
          kind="Media"
          title="Cook Pasta"
          who="Anna F. - Staff"
          date="04-01-24"
          time="06:56 PM"
          showExec
          execTime="00:05:12"
          pillTime="00:07:40"
        />
        <MissionChip
          ref={c2}
          kind="Media"
          title="Cook Tiramisu"
          who="Anna F. - Staff"
          date="04-01-24"
          time="06:56 PM"
          showExec
          execTime="00:03:20"
          pillTime="00:07:40"
        />
      </PhoneShell>
    </div>
  );
}
