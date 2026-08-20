'use client';

// ---------------------------------------------------------------------------
// Scene: three smooth acts on the phone Team Board (Open), generic to any
// business. Reuses the real product UI (MissionChip, PhoneShell, the .om-*
// checklist primitives, and the OpenedMission "Mission Details" phone) — no new
// UI, just framed/cropped.
//   Act 1 — 4 missions POP IN (ordered by time posted). "posted exactly when due"
//   Act 2 — highlight the last mission (a Checklist); its Checklist comes out.
//           "Audits are performed on time"
//   Act 3 — highlight the Media mission above it; a hand cursor clicks it and we
//           navigate into the real Media mission (video + 2 quizzes, Claim
//           button). "Micro-trainings are automatically assigned"
// A progress timeline runs along the bottom. Loops.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import PhoneShell from '@/components/PhoneShell';
import MissionChip from '@/components/MissionChip';
import { OpenedMission } from '@/components/OpenedMission';
import SceneCursor from '@/components/scenes/SceneCursor';

const fmt = (s) => {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const TABS = [
  { label: 'Open - 4', active: true },
  { label: 'Claimed - 1' },
  { label: 'Closed - 0' },
];

// Ordered by time posted (longer Timer = higher). Bottom = Checklist audit; the
// one above it = Media micro-training. Generic titles (any business).
const MISSIONS = [
  { kind: 'Checklist', points: 15, title: 'Daily Log', date: '07-09-26', time: '04:07 PM', timer: 1330 },
  { kind: 'Checklist', points: 20, title: 'Opening Checklist', date: '07-09-26', time: '04:07 PM', timer: 900 },
  { kind: 'Media', points: 50, title: 'Safety Training', date: '07-09-26', time: '04:07 PM', timer: 700 },
  { kind: 'Checklist', points: 10, title: 'Inventory Check', date: '07-09-26', time: '04:07 PM', timer: 460 },
];
const MEDIA_I = 2;
const AUDIT_I = 3;

// The real Media "Mission Details" mission (opens with a Claim button). Generic:
// one video step + two quizzes.
const MEDIA_MISSION = {
  id: 'scene-media',
  type: 'Media',
  title: 'Safety Training',
  points: 50,
  location: '',
  postedBy: 'Julian D',
  claimer: 'Anna F. - Staff',
  date: '07-09-26',
  time: '04:07 PM',
  pillTime: '00:07:00',
  pillClass: 'chip--green',
  description: 'Watch the short training and answer the quizzes.',
  notice: 'Complete before your next shift',
  headerRight: 'es-menu',
  estimated: '05:00',
  initialState: 'open',
  contents: [
    { n: 1, label: 'Training Video', kind: 'video', meta: '01:00' },
    { label: 'Quiz-1', kind: 'quiz', meta: 'n/a', sub: true },
    { label: 'Quiz-2', kind: 'quiz', meta: 'n/a', sub: true },
  ],
};

// Checklist that "comes out" of the phone — composed from the real .om-* UI.
function ChecklistCallout() {
  return (
    <>
      <MissionChip
        className="scene-callout-chip"
        kind="Checklist"
        points={10}
        title="Inventory Check"
        who="Julian D"
        date="07-09-26"
        time="04:07 PM"
        showExec
        execTime="00:05:53"
        pillTime="00:07:53"
      />
      <div className="scene-callout-list">
        <div className="om-checklist">
          <div className="om-grp om-grp--yellow">
            <div className="om-item">
              <span className="om-item-label"><b>1.</b> Item A</span>
              <span className="om-num om-num--yellow"><span className="om-num-hash">#</span><span className="om-num-val">130</span></span>
            </div>
            <div className="om-item scene-hl-item">
              <span className="om-item-label"><b>2.</b> Item B</span>
              <span className="om-num om-num--yellow"><span className="om-num-hash">#</span><span className="om-num-val">5</span></span>
            </div>
            <div className="om-item">
              <span className="om-item-label"><b>3.</b> Item C</span>
              <span className="om-num om-num--yellow"><span className="om-num-hash">#</span><span className="om-num-val">110</span></span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function PostedMissionsScene() {
  const root = useRef(null);
  const caption = useRef(null);
  const cardRefs = useRef([]);
  const callout = useRef(null);
  const hand = useRef(null);
  const bar = useRef(null);
  const track = useRef(null);
  const tl = useRef(null);
  const [paused, setPaused] = useState(true);
  const [full, setFull] = useState(false);
  const [controlsShown, setControlsShown] = useState(true);
  const hideTimer = useRef(null);

  // Fullscreen: lock body scroll and allow Escape to exit.
  useEffect(() => {
    if (!full) return;
    const onKey = (e) => e.key === 'Escape' && setFull(false);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [full]);

  // Auto-hide the controls after inactivity (only while playing) — like a video.
  const armHide = () => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!tl.current || !tl.current.paused()) setControlsShown(false);
    }, 2600);
  };
  const showControls = () => {
    setControlsShown(true);
    clearTimeout(hideTimer.current);
    if (tl.current && !tl.current.paused()) armHide();
  };
  useEffect(() => {
    // Keep the play button up until the viewer actually starts the scene.
    const id = setTimeout(() => {
      if (tl.current && !tl.current.paused()) setControlsShown(false);
    }, 2600);
    return () => {
      clearTimeout(id);
      clearTimeout(hideTimer.current);
    };
  }, []);

  useGSAP(
    () => {
      const cards = cardRefs.current.filter(Boolean);
      const q = (card, sel) => card.querySelector(sel);
      const paint = (el, s) => { if (el) el.textContent = fmt(s); };

      const sceneEl = root.current.querySelector('.scene');
      const phone = root.current.querySelector('.scene-phone');
      const board = root.current.querySelector('.ph-board');
      const overlay = root.current.querySelector('.ph-overlay');

      // Measure: trim the phone below the last card + record card centers (design px).
      let centers = [];
      let trimH = 620;
      const FULL_H = 823; // full phone height in design px (390*838/401 + 8 pad)
      if (sceneEl && phone && cards.length) {
        const sr = sceneEl.getBoundingClientRect();
        const sceneScale = sr.width / 1280 || 1;
        const topY = phone.getBoundingClientRect().top;
        const lastBottom = cards[cards.length - 1].getBoundingClientRect().bottom;
        trimH = Math.round((lastBottom - topY) / sceneScale + 14);
        phone.style.height = `${trimH}px`;
        centers = cards.map((c) => {
          const r = c.getBoundingClientRect();
          return { x: (r.left + r.width / 2 - sr.left) / sceneScale, y: (r.top + r.height / 2 - sr.top) / sceneScale };
        });
      }

      // Shared elapsed clock -> every Open Timer ticks together, in real time.
      const elapsed = { e: 0 };
      const tickAll = () => cards.forEach((card, i) => paint(q(card, '.chip-pill'), MISSIONS[i].timer + elapsed.e));

      const glow = '0 0 0 3px rgba(124,58,237,0.6), 0 14px 30px rgba(124,58,237,0.28)';
      const flat = '0 1px 2.5px rgba(0,0,0,0.25)';
      const SHIFT = -300;

      // Initial states.
      cards.forEach((card) => gsap.set(card, { autoAlpha: 0, y: 26, scale: 0.94 }));
      gsap.set(caption.current, { autoAlpha: 0, y: 24 });
      gsap.set(callout.current, { autoAlpha: 0, xPercent: 8, y: 14 });
      gsap.set(overlay, { autoAlpha: 0 });
      gsap.set(hand.current, { autoAlpha: 0, x: 300, y: 640 });
      gsap.set(phone, { x: 0, scale: 1, height: trimH });
      gsap.set(bar.current, { scaleX: 0 });

      // Start paused — the scene waits on the viewer's play button, like a video.
      const t = gsap.timeline({ repeat: -1, repeatDelay: 0.6, paused: true });
      tl.current = t;
      t.eventCallback('onUpdate', () => { if (bar.current) gsap.set(bar.current, { scaleX: t.progress() }); });

      const setCap = (at, text) =>
        t.to(caption.current, { autoAlpha: 0, y: -12, duration: 0.35, ease: 'power2.in' }, at)
          .call(() => (caption.current.textContent = text), null, at + 0.36)
          .to(caption.current, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, at + 0.38);

      const END = 17.4;

      // ---- reset ----
      t.call(() => {
        cards.forEach((card, i) => {
          gsap.set(card, { autoAlpha: 0, y: 26, scale: 0.94, boxShadow: flat });
          paint(q(card, '.chip-pill'), MISSIONS[i].timer);
        });
        elapsed.e = 0;
        gsap.set(caption.current, { autoAlpha: 0, y: 24 });
        gsap.set(callout.current, { autoAlpha: 0, xPercent: 8, y: 14 });
        gsap.set(overlay, { autoAlpha: 0 });
        gsap.set(board, { autoAlpha: 1 });
        gsap.set(hand.current, { autoAlpha: 0, x: 300, y: 640 });
        gsap.set(phone, { x: 0, scale: 1, height: trimH, autoAlpha: 1 });
        caption.current.textContent = 'Missions are posted exactly when due';
      }, null, 0);

      t.to(elapsed, { e: END, duration: END, ease: 'none', onUpdate: tickAll }, 0);

      // ===== ACT 1 — posted =====
      cards.forEach((card, i) => {
        t.to(card, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }, 0.4 + i * 0.26);
      });
      t.to(caption.current, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 1.7);

      // ===== ACT 2 — checklist audit comes out =====
      const A2 = 3.8;
      t.to(phone, { x: SHIFT, duration: 0.9, ease: 'power3.inOut' }, A2);
      t.to(cards[AUDIT_I], { boxShadow: glow, scale: 1.03, duration: 0.5, ease: 'power2.out' }, A2 + 0.5);
      setCap(A2 + 0.35, 'Audits are performed on time');
      t.to(callout.current, { autoAlpha: 1, xPercent: 0, y: 0, duration: 0.7, ease: 'power3.out' }, A2 + 0.7);

      // ===== ACT 3 — click the Media mission, open the real detail =====
      const A3 = 9.0;
      t.to(callout.current, { autoAlpha: 0, xPercent: 8, y: 14, duration: 0.5, ease: 'power2.in' }, A3);
      t.to(cards[AUDIT_I], { boxShadow: flat, scale: 1, duration: 0.4 }, A3);
      t.to(phone, { x: 0, duration: 0.8, ease: 'power3.inOut' }, A3);
      setCap(A3 + 0.2, 'Micro-trainings are automatically assigned');

      // hand cursor moves to the Media card and taps
      t.to(hand.current, { autoAlpha: 1, duration: 0.3 }, A3 + 0.8);
      if (centers[MEDIA_I]) {
        t.to(hand.current, { x: centers[MEDIA_I].x + 12, y: centers[MEDIA_I].y + 6, duration: 0.9, ease: 'power2.inOut' }, A3 + 0.8);
      }
      t.to(hand.current, { scale: 0.82, duration: 0.12, ease: 'power2.in' }, A3 + 1.8)
        .to(hand.current, { scale: 1, duration: 0.18, ease: 'back.out(3)' }, A3 + 1.92);
      t.to(cards[MEDIA_I], { boxShadow: glow, scale: 1.03, duration: 0.35, ease: 'power2.out' }, A3 + 1.8);

      // navigate INSIDE the same phone: zoom out + un-trim, cross-fade board -> detail
      t.to(hand.current, { autoAlpha: 0, duration: 0.3 }, A3 + 2.05);
      t.to(phone, { height: FULL_H, scale: 0.78, duration: 0.9, ease: 'power3.inOut' }, A3 + 2.1);
      t.to(board, { autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, A3 + 2.2)
        .to(overlay, { autoAlpha: 1, duration: 0.55, ease: 'power2.out' }, A3 + 2.5);

      // ===== end — fade out before the loop =====
      t.to([caption.current, phone], { autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, END - 0.6);
    },
    { scope: root }
  );

  const togglePlay = () => {
    const t = tl.current;
    if (!t) return;
    if (t.paused()) {
      t.play();
      setPaused(false);
      armHide();
    } else {
      t.pause();
      setPaused(true);
      setControlsShown(true);
      clearTimeout(hideTimer.current);
    }
  };

  const seekTo = (clientX) => {
    const el = track.current;
    const t = tl.current;
    if (!el || !t) return;
    const r = el.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    t.progress(frac);
    if (bar.current) gsap.set(bar.current, { scaleX: frac });
  };

  // Click / drag the timeline to scrub (pauses while scrubbing).
  const onTrackDown = (e) => {
    const t = tl.current;
    if (!t) return;
    t.pause();
    setPaused(true);
    setControlsShown(true);
    clearTimeout(hideTimer.current);
    seekTo(e.clientX);
    const move = (ev) => seekTo(ev.clientX);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div
      className={`scene-fit${full ? ' is-full' : ''}`}
      ref={root}
      onPointerMove={showControls}
      onPointerDown={showControls}
    >
      {/* Click anywhere on the video (not the control bar) to play/pause. */}
      <div className="scene" onClick={togglePlay} role="button" tabIndex={-1} aria-label={paused ? 'Play' : 'Pause'} style={{ cursor: 'pointer' }}>
        <div className="dots-bg" aria-hidden="true">
          <i className="d1" />
          <i className="d2" />
        </div>

        {/* board (trimmed to the 4 cards). Clicking Media navigates to the real
            Mission Details overlay inside this same phone. */}
        <div className="scene-phone">
          <div className="ph-fit">
            <PhoneShell
              title="Team Board"
              tabs={TABS}
              overlay={<OpenedMission mission={MEDIA_MISSION} state="open" showExec={false} />}
            >
              {MISSIONS.map((m, i) => (
                <MissionChip
                  key={m.title}
                  ref={(el) => (cardRefs.current[i] = el)}
                  kind={m.kind}
                  points={m.points}
                  title={m.title}
                  date={m.date}
                  time={m.time}
                  pillTime={fmt(m.timer)}
                />
              ))}
            </PhoneShell>
          </div>
        </div>

        {/* checklist coming out of the phone (real .om-* UI) */}
        <div className="scene-callout" ref={callout} aria-hidden="true"><ChecklistCallout /></div>

        <div className="scene-hand" ref={hand} aria-hidden="true"><SceneCursor /></div>

        <p className="lower-third" ref={caption}>Missions are posted exactly when due</p>
      </div>

      {/* live playback controls (drive the GSAP timeline — not baked) */}
      <div className={`scene-controls${controlsShown ? '' : ' is-hidden'}`}>
        <button
          type="button"
          className="scene-play"
          onClick={togglePlay}
          aria-label={paused ? 'Play' : 'Pause'}
        >
          {paused ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
          )}
        </button>
        <div className="scene-track" ref={track} onPointerDown={onTrackDown}>
          <span className="scene-timeline-fill" ref={bar} />
        </div>
        <button
          type="button"
          className="scene-play scene-full-btn"
          onClick={() => setFull((f) => !f)}
          aria-label={full ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {full ? (
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
          )}
        </button>
      </div>
    </div>
  );
}
