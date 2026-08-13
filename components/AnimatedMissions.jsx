'use client';

// ---------------------------------------------------------------------------
// Animated "Missions" prototype — one scripted GSAP timeline drives everything.
// See docs/mission-animation.md for the full rules. In short:
//   - A moving mission always lands at the TOP of its destination column;
//     existing cards slide DOWN to make room (and back UP when the slot frees).
//   - Lifecycle: Open --(claim, move right)--> Claimed --(close, move right)--> Closed.
//   - The timer is an EXECUTION timer: counts UP from 00:00:00, starts on claim,
//     freezes on close.
// Edit the timeline in useGSAP() like a storyboard: each .to()/.call() is a beat.
// ---------------------------------------------------------------------------

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import MissionChip from '@/components/MissionChip';

// Column geometry inside the board (board width = 1082, 3 cols of 350 + 16 gap)
const OPEN_X = 0;
const CLAIMED_X = 366;
const CLOSED_X = 732;

// Default: the mission timer pill stays GREEN. Color aging is opt-in only.
const GREEN = '#007A33';

const fmt = (s) => {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const IconPlus = () => (<svg viewBox="0 0 18 18"><path d="M9 3.5v11M3.5 9h11" {...stroke} /></svg>);
const IconMenu = () => (<svg viewBox="0 0 18 18"><path d="M3.5 5.5h11M3.5 9h11M3.5 12.5h11" {...stroke} /></svg>);
const IconBack = () => (<svg viewBox="0 0 20 20"><path d="M15 10H5.5M9.5 5.5 5 10l4.5 4.5" {...stroke} /></svg>);
const IconExpand = () => (
  <svg viewBox="0 0 18 18"><path d="M7 3H4a1 1 0 0 0-1 1v3M11 3h3a1 1 0 0 1 1 1v3M7 15H4a1 1 0 0 1-1-1v-3M11 15h3a1 1 0 0 1 1-1v-3" {...stroke} strokeWidth={1.5} /></svg>
);

export default function AnimatedMissions() {
  const root = useRef(null);
  const tl = useRef(null);
  const [speed, setSpeed] = useState(1);

  const actor = useRef(null);
  const pill = useRef(null); // the Timer (right, colored) — counts up
  const exec = useRef(null); // execution timer (left) — counts up
  const who = useRef(null);
  const staticCard = useRef(null);
  const cOpen = useRef(null);
  const cClaimed = useRef(null);
  const cClosed = useRef(null);

  useGSAP(
    () => {
      const setCount = (node, val) => {
        node.textContent = String(val);
        gsap.fromTo(node, { scale: 1.5 }, { scale: 1, duration: 0.35, ease: 'back.out(3)' });
      };
      const paint = (el, s) => (el.textContent = fmt(s));

      // The OTHER mission's timers (queried inside its card element).
      const execS = staticCard.current.querySelector('.chip-exec');
      const pillS = staticCard.current.querySelector('.chip-pill');

      // One row = card height + gap; the displaced card slides down by this much.
      const rowY = (actor.current?.offsetHeight || 84) + 8;

      // Beat times (timeline seconds; == real seconds at 1x).
      const CLAIM = 1; // idle in Open, then claim
      const MOVE = 0.9; // slide duration
      const CLOSE = 7.8; // moves to Closed -> both timers stop
      const LOOP_END = CLOSE + MOVE + 0.5;

      // Clocks. Both timers count UP. Left = execution timer, Right = the Timer.
      const A = { exec: 0, timer: 900 }; // moving mission: 00:00:00 up, 00:15:00 up
      const S = { exec: 1333, timer: 900 }; // other mission: 00:22:13 up, 00:15:00 up

      const t = gsap.timeline({ repeat: -1, repeatDelay: 1.4, defaults: { ease: 'power2.inOut' } });
      tl.current = t;
      t.timeScale(speed);

      // ---- reset (top of every loop) ----
      t.set(actor.current, { left: OPEN_X, top: 0 }, 0)
        .set(staticCard.current, { left: CLAIMED_X, top: 0 }, 0)
        .set(pill.current, { backgroundColor: GREEN }, 0)
        .set(exec.current, { display: 'none', autoAlpha: 0 }, 0) // Open: no execution timer
        .set(A, { exec: 0, timer: 900 }, 0)
        .set(S, { exec: 1333, timer: 900 }, 0)
        .call(
          () => {
            paint(exec.current, A.exec);
            paint(pill.current, A.timer);
            paint(execS, S.exec);
            paint(pillS, S.timer);
            who.current.textContent = 'Global - Organization';
            cOpen.current.textContent = '1';
            cClaimed.current.textContent = '1';
            cClosed.current.textContent = '0';
          },
          null,
          0
        );

      // ---- Timers count UP in REAL TIME (one second per second). ----
      // Moving mission: the Timer (pill) runs from Open; freezes on close.
      t.to(A, { timer: 900 + CLOSE, duration: CLOSE, ease: 'none', onUpdate: () => paint(pill.current, A.timer) }, 0);
      // Its Execution timer only exists once claimed: starts at claim, counts up from 0.
      t.to(A, { exec: CLOSE - CLAIM, duration: CLOSE - CLAIM, ease: 'none', onUpdate: () => paint(exec.current, A.exec) }, CLAIM);
      // Other mission stays Claimed the whole loop, so both its timers run the entire time.
      t.to(S, { exec: 1333 + LOOP_END, duration: LOOP_END, ease: 'none', onUpdate: () => paint(execS, S.exec) }, 0)
        .to(S, { timer: 900 + LOOP_END, duration: LOOP_END, ease: 'none', onUpdate: () => paint(pillS, S.timer) }, 0);

      // ---- CLAIM: move right (Open -> Claimed top); the other card slides down ----
      t.addLabel('claim', CLAIM)
        .to(actor.current, { left: CLAIMED_X, top: 0, duration: MOVE }, 'claim')
        .to(staticCard.current, { top: rowY, duration: MOVE }, 'claim')
        .set(exec.current, { display: 'inline-block' }, 'claim') // execution timer appears on claim
        .to(exec.current, { autoAlpha: 1, duration: 0.3 }, 'claim')
        .to(who.current, { autoAlpha: 0, duration: 0.2 }, 'claim')
        .call(() => (who.current.textContent = 'Anna F. - Staff'), null, 'claim+=0.22')
        .to(who.current, { autoAlpha: 1, duration: 0.25 }, 'claim+=0.24')
        .call(() => setCount(cOpen.current, 0), null, 'claim+=0.45')
        .call(() => setCount(cClaimed.current, 2), null, 'claim+=0.55');

      // ---- CLOSE: move right again; other card slides back up; both timers stop ----
      t.addLabel('close', CLOSE)
        .to(actor.current, { left: CLOSED_X, top: 0, duration: MOVE }, 'close')
        .to(staticCard.current, { top: 0, duration: MOVE }, 'close')
        .call(() => setCount(cClaimed.current, 1), null, 'close+=0.25')
        .call(() => setCount(cClosed.current, 1), null, 'close+=0.35');
    },
    { scope: root }
  );

  const setRate = (r) => {
    setSpeed(r);
    tl.current?.timeScale(r);
  };

  return (
    <div>
      <div className="tbl-fit" ref={root}>
        <div className="tbl-tablet">
          <div className="tbl-screen">
            <header className="tbl-header">
              <button type="button" className="tbl-iconbtn tbl-back" aria-label="Back"><IconBack /></button>
              <span className="tbl-dept">Department 1</span>
              <div className="tbl-header-actions">
                <button type="button" className="tbl-iconbtn" aria-label="Add"><IconPlus /></button>
                <button type="button" className="tbl-iconbtn" aria-label="Menu"><IconMenu /></button>
              </div>
            </header>

            <div className="tbl-content">
              <div className="tbl-tabs">
                <div className="tbl-tab"><span>Open - <b className="am-count" ref={cOpen}>1</b></span><IconExpand /></div>
                <div className="tbl-tab"><span>Claimed - <b className="am-count" ref={cClaimed}>1</b></span><IconExpand /></div>
                <div className="tbl-tab"><span>Closed - <b className="am-count" ref={cClosed}>0</b></span><IconExpand /></div>
              </div>

              <div className="am-board">
                {/* card already in Claimed — slides down to make room, then back up */}
                <MissionChip
                  ref={staticCard}
                  className="am-card-abs"
                  style={{ left: CLAIMED_X, top: 0 }}
                  kind="Media"
                  title="Sanitize Surfaces"
                  who="Manager"
                  date="01/02/19"
                  time="10:30 AM"
                  showExec
                  execTime="00:22:13"
                  pillTime="00:15:00"
                  pillClass="chip--red"
                />

                {/* the moving mission — always lands on top of its column.
                    Rendered inline so GSAP can target the pill / exec / who refs. */}
                <article className="chip chip--green am-card-abs am-actor" ref={actor} style={{ left: OPEN_X, top: 0 }}>
                  <div className="chip-top">
                    <div className="chip-id">
                      <img className="chip-logo" src="/mission-logo.png" alt="" aria-hidden="true" />
                      <span className="chip-kind">Checklist</span>
                      <span className="chip-points">25</span>
                    </div>
                    <div className="chip-timers">
                      <span className="chip-exec" ref={exec} style={{ display: 'none' }}>00:00:00</span>
                      <span className="chip-pill" ref={pill}>00:15:00</span>
                    </div>
                  </div>
                  <h3 className="chip-title">Air Conditioning Cleaning</h3>
                  <div className="chip-bottom">
                    <span className="chip-who" ref={who}>Global - Organization</span>
                    <span className="chip-when"><span className="chip-date">01/02/19</span><span className="chip-time">10:30 AM</span></span>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="am-controls">
        <button type="button" onClick={() => tl.current?.restart()}>Replay</button>
        {[0.5, 1, 2].map((r) => (
          <button key={r} type="button" className={speed === r ? 'is-on' : ''} onClick={() => setRate(r)}>
            {r}×
          </button>
        ))}
      </div>
    </div>
  );
}
