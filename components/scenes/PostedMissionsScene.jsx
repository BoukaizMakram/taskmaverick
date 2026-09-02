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
//           navigate into the real Media mission ("Access Check": a training
//           video + 2 quizzes). "Micro-trainings are automatically assigned"
//   Act 4 — a hand taps the Training Video row; the media player (MediaViewer)
//           takes over the phone and plays the training clip.
// Narration rides on top as YouTube-style subtitles (SUBTITLES, driven by the
// timeline clock) rather than baked-in captions. A progress timeline runs along
// the bottom. Plays once, then offers Replay.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import PhoneShell from '@/components/PhoneShell';
import MissionChip from '@/components/MissionChip';
import { OpenedMission } from '@/components/OpenedMission';
import MediaViewer from '@/components/MediaViewer';
import SceneCursor from '@/components/scenes/SceneCursor';
import { useT } from '@/lib/i18n/LanguageProvider';

// Narration is delivered as YouTube-style subtitles overlaid on the scene (see
// SUBTITLES below), driven by the timeline clock — not baked into the animation.
// The scene has no voice-over yet, so subtitles are always shown and cannot be
// turned off; flip this to true once an audio track exists and a CC toggle
// appears in the control bar.
const HAS_VOICEOVER = false;

// Subtitle cues, keyed to the timeline clock (seconds). Boundaries line up with
// the three acts (see the timeline below).
const SUBTITLES = [
  { start: 0.4, end: 4.15, text: 'Missions are posted exactly when due' },
  { start: 4.15, end: 9.2, text: 'Audits are performed on time' },
  { start: 9.2, end: 16.8, text: 'Micro-trainings are automatically assigned' },
];

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
  { kind: 'Media', points: 50, title: 'Access Check', date: '07-09-26', time: '04:07 PM', timer: 700 },
  { kind: 'Checklist', points: 10, title: 'Inventory Check', date: '07-09-26', time: '04:07 PM', timer: 460 },
];
const MEDIA_I = 2;
const AUDIT_I = 3;

// The real Media "Mission Details" mission (opens with a Claim button). Generic:
// one video step + two quizzes.
const MEDIA_MISSION = {
  id: 'scene-media',
  type: 'Media',
  title: 'Access Check',
  points: 50,
  location: '',
  postedBy: 'Julian D',
  claimer: 'Anna F. - Staff',
  date: '07-09-26',
  time: '04:07 PM',
  pillTime: '00:07:00',
  pillClass: 'chip--green',
  description: 'Watch the short training and answer the quizzes.',
  notice: 'Pay attention to the badge reader’s green and red indicators, then answer the questions that follow.',
  headerRight: 'es-menu',
  estimated: '05:00',
  initialState: 'open',
  contents: [
    { n: 1, label: 'Training Video', kind: 'video', meta: '01:00' },
    { label: 'Quiz-1', kind: 'quiz', meta: 'n/a', sub: true },
    { label: 'Quiz-2', kind: 'quiz', meta: 'n/a', sub: true },
  ],
};

// The Inventory Check's checklist — real .om-* UI. Slides in directly UNDER the
// Inventory Check card (the phone rises to make room), so no duplicate card here.
function ChecklistCallout() {
  return (
    <div className="scene-callout-list">
      <div className="om-checklist">
        <div className="om-grp om-grp--yellow">
          <div className="om-item">
            <span className="om-item-label"><b>1.</b> Item A</span>
            <span className="om-num om-num--yellow"><span className="om-num-hash">#</span><span className="om-num-val">130</span></span>
          </div>
          <div className="om-item">
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
  );
}

export default function PostedMissionsScene({ poster, title }) {
  const t = useT();
  const root = useRef(null);
  const cueIdx = useRef(-1);
  const cardRefs = useRef([]);
  const callout = useRef(null);
  const intro = useRef(null);
  const hand = useRef(null);
  const bar = useRef(null);
  const track = useRef(null);
  const tl = useRef(null);
  const sub = useRef(null);
  const [paused, setPaused] = useState(true);
  const [started, setStarted] = useState(false); // hide the poster after first play
  const [ended, setEnded] = useState(false); // show the replay overlay after it finishes
  const [cueText, setCueText] = useState(''); // live cue from the timeline ('' between/around cues)
  const [shownText, setShownText] = useState(''); // last non-empty line — kept during the exit fade
  const [subPos, setSubPos] = useState(null); // user-dragged position {x: center, y: top}, or null = default
  const [subtitlesOn, setSubtitlesOn] = useState(true); // CC toggle (only offered with a voice-over)
  const [full, setFull] = useState(false);
  const [controlsShown, setControlsShown] = useState(true);
  const hideTimer = useRef(null);

  // Keep the last line on screen while it fades out — the box only ever swaps to
  // a new non-empty cue, so it never blanks mid-exit.
  useEffect(() => {
    if (cueText) setShownText(cueText);
  }, [cueText]);

  // Real fullscreen via the Fullscreen API (fills the actual screen, hides the
  // browser chrome). We drive the request off the root element and mirror the
  // browser's fullscreen status into `full` so the .is-full styling and the
  // button icon follow it — including when the user exits with Escape.
  const toggleFull = () => {
    const el = root.current;
    if (!el) return;
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (fsEl) {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    } else if (el.requestFullscreen || el.webkitRequestFullscreen) {
      (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    } else {
      // No Fullscreen API (older iOS Safari) — fall back to the CSS overlay.
      setFull((f) => !f);
    }
  };
  useEffect(() => {
    const onChange = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      setFull(Boolean(fsEl));
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

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

  // Scrolled out of view -> just pause where it is (don't reset). Coming back,
  // it stays paused at the same spot and you resume.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) return;
        const t = tl.current;
        if (t && !t.paused()) {
          t.pause();
          setPaused(true);
          setControlsShown(true);
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useGSAP(
    () => {
      const cards = cardRefs.current.filter(Boolean);
      const q = (card, sel) => card.querySelector(sel);
      const paint = (el, s) => { if (el) el.textContent = fmt(s); };

      const sceneEl = root.current.querySelector('.scene');
      const phone = root.current.querySelector('.scene-phone');
      const board = root.current.querySelector('.ph-board');
      const overlay = root.current.querySelector('.ph-overlay:not(.ph-overlay--viewer)');
      const viewerLayer = root.current.querySelector('.ph-overlay--viewer');

      // Measure: trim the phone below the last card + record card centers (design px).
      let centers = [];
      let trimH = 620;
      const ZOOM = 0.78; // Act 2/3 zoom-out (un-trimmed); same scale the media act uses
      let mediaHit = null; // Media card center at that zoom (Act 3 hand target)
      let videoHit = null; // Training Video row center at that zoom (Act 4 hand target)
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

        // In Act 2 the phone un-trims to full height and zooms out (scale ZOOM
        // about its top), so the cards land smaller and higher — no header
        // clipping, room below. Compute where the Inventory Check card's bottom
        // lands at that zoom and sit the checklist just under it (matched width,
        // also scaled ZOOM so it reads at the same size as the card). Precompute
        // the Media card center at that zoom too, for the Act 3 hand tap.
        const pr = phone.getBoundingClientRect();
        const PCX = (pr.left + pr.width / 2 - sr.left) / sceneScale; // phone center X
        const PT = (pr.top - sr.top) / sceneScale; // phone top Y (zoom origin)
        // A design-space point mapped to where it lands once the phone zooms out.
        const zoomPt = (x, y) => ({ x: PCX + (x - PCX) * ZOOM, y: PT + (y - PT) * ZOOM });

        const auditCard = cards[AUDIT_I];
        if (callout.current && auditCard) {
          const acr = auditCard.getBoundingClientRect();
          const auditBottom = (acr.bottom - sr.top) / sceneScale;
          const cardW = acr.width / sceneScale;
          const co = callout.current;
          co.style.right = 'auto';
          co.style.left = `${Math.round(PCX)}px`;
          co.style.width = `${Math.round(cardW)}px`;
          co.style.top = `${Math.round(PT + (auditBottom - PT) * ZOOM + 10)}px`;
        }
        if (centers[MEDIA_I]) mediaHit = zoomPt(centers[MEDIA_I].x, centers[MEDIA_I].y);

        // The Training Video row inside the (rendered) detail overlay — used for
        // the Act 4 tap that opens the player. Measured at scale 1, mapped to zoom.
        const vrow = overlay ? overlay.querySelector('.om-mrow') : null;
        if (vrow) {
          const rr = vrow.getBoundingClientRect();
          videoHit = zoomPt(
            (rr.left + rr.width / 2 - sr.left) / sceneScale,
            (rr.top + rr.height / 2 - sr.top) / sceneScale
          );
        }
      }

      // Shared elapsed clock -> every Open Timer ticks together, in real time.
      const elapsed = { e: 0 };
      const tickAll = () => cards.forEach((card, i) => paint(q(card, '.chip-pill'), MISSIONS[i].timer + elapsed.e));

      const glow = '0 0 0 3px rgba(124,58,237,0.6), 0 14px 30px rgba(124,58,237,0.28)';
      const flat = '0 1px 2.5px rgba(0,0,0,0.25)';

      // Intro line elements (each verse's lines animate as whole units).
      const introEl = intro.current;
      const v1 = introEl ? introEl.querySelectorAll('[data-v="1"] .scene-intro-line') : [];
      const v2 = introEl ? introEl.querySelectorAll('[data-v="2"] .scene-intro-line') : [];
      // Verse 1 starts centered on its own; when verse 2 appears the whole block
      // rises so the pair is centered. That rise = half of (verse 2's height + the
      // inter-verse gap). offsetHeight is design px (CSS transforms don't scale it).
      const verse2El = introEl ? introEl.querySelector('[data-v="2"]') : null;
      const INTRO_GAP = 46; // matches .scene-intro gap in globals.css
      const INTRO_RISE = verse2El ? (verse2El.offsetHeight + INTRO_GAP) / 2 : 0;

      // Initial states.
      cards.forEach((card) => gsap.set(card, { autoAlpha: 0, y: 26, scale: 0.94 }));
      // Callout is centered under the audit card (left set in JS), scaled to match
      // the zoomed-out card, and rises into place. Origin top so its top stays put.
      gsap.set(callout.current, { autoAlpha: 0, xPercent: -50, y: 22, scale: ZOOM, transformOrigin: '50% 0' });
      gsap.set(overlay, { autoAlpha: 0 });
      gsap.set(viewerLayer, { autoAlpha: 0 });
      gsap.set(hand.current, { autoAlpha: 0, x: 300, y: 640 });
      // Phone stays hidden behind the intro; it fades in as the intro leaves.
      gsap.set(phone, { x: 0, y: 0, scale: 1, height: trimH, autoAlpha: 0 });
      gsap.set(introEl, { autoAlpha: 1, y: INTRO_RISE });
      gsap.set([...v1, ...v2], { autoAlpha: 0, y: 22 });
      gsap.set(bar.current, { scaleX: 0 });

      // Start paused — the scene waits on the viewer's play button, like a
      // video. Plays once (no loop); onComplete shows the replay overlay.
      // The scene opens with an on-screen title/tagline intro; the mission board
      // acts play after it. INTRO is that lead-in's length — every board beat
      // (and the subtitle clock) is offset by it. SUBTITLES stay relative to the
      // board start, so syncCue reads the clock minus INTRO.
      const INTRO = 7.5;

      // Keep the current subtitle line in sync with the timeline clock. Only
      // touches React state when the cue actually changes (not every frame).
      const syncCue = (time) => {
        const rel = time - INTRO;
        const idx = SUBTITLES.findIndex((c) => rel >= c.start && rel < c.end);
        if (idx !== cueIdx.current) {
          cueIdx.current = idx;
          setCueText(idx === -1 ? '' : SUBTITLES[idx].text);
        }
      };

      const t = gsap.timeline({ paused: true, onComplete: () => setEnded(true) });
      tl.current = t;
      t.eventCallback('onUpdate', () => {
        if (bar.current) gsap.set(bar.current, { scaleX: t.progress() });
        syncCue(t.time());
      });

      const BOARD = 19.8; // board acts' own duration (clock starts at INTRO)
      const END = INTRO + BOARD;

      // ---- reset ----
      t.call(() => {
        cards.forEach((card, i) => {
          gsap.set(card, { autoAlpha: 0, y: 26, scale: 0.94, boxShadow: flat });
          paint(q(card, '.chip-pill'), MISSIONS[i].timer);
        });
        elapsed.e = 0;
        cueIdx.current = -1;
        setCueText('');
        gsap.set(callout.current, { autoAlpha: 0, xPercent: -50, y: 22, scale: ZOOM, transformOrigin: '50% 0' });
        gsap.set(overlay, { autoAlpha: 0 });
        gsap.set(viewerLayer, { autoAlpha: 0 });
        gsap.set(board, { autoAlpha: 1 });
        gsap.set(hand.current, { autoAlpha: 0, x: 300, y: 640 });
        gsap.set(phone, { x: 0, y: 0, scale: 1, height: trimH, autoAlpha: 0 });
        gsap.set(introEl, { autoAlpha: 1, y: INTRO_RISE });
        gsap.set([...v1, ...v2], { autoAlpha: 0, y: 22 });
      }, null, 0);

      // ===== INTRO — on-screen title + tagline (two verses, stacked) =====
      // Verse 1 appears first: brand + "Automatically guides Teams / to take
      // initiatives…". Verse 2's slot is reserved below (visibility only), so
      // verse 1 sits in its final spot and nothing shifts when verse 2 arrives.
      t.to(v1, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.28, ease: 'power2.out' }, 0.3);
      // …then, after a beat, verse 2 fades in below it — both stay on screen — and
      // the block rises so verse 1 moves up and the pair ends up centered.
      t.to(introEl, { y: 0, duration: 0.7, ease: 'power3.out' }, 3.4);
      t.to(v2, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.28, ease: 'power2.out' }, 3.4);
      // The whole intro clears as the board comes in.
      t.to(introEl, { autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, INTRO - 0.5);
      t.to(phone, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, INTRO - 0.3);

      // Board clock — Open Timers tick in real time once the board is shown.
      t.to(elapsed, { e: BOARD, duration: BOARD, ease: 'none', onUpdate: tickAll }, INTRO);

      // ===== ACT 1 — posted =====
      cards.forEach((card, i) => {
        t.to(card, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }, INTRO + 0.4 + i * 0.26);
      });

      // ===== ACT 2 — phone un-trims & zooms out; the checklist slides in under it =====
      // Instead of sliding the trimmed phone up (which clips its header), un-trim
      // to the full device and zoom out about the top — the board shrinks, freeing
      // room below for the Inventory Check's checklist to slide in under its card.
      const A2 = INTRO + 3.8;
      t.to(phone, { height: FULL_H, scale: ZOOM, duration: 0.9, ease: 'power3.inOut' }, A2);
      t.to(cards[AUDIT_I], { boxShadow: glow, scale: 1.03, duration: 0.5, ease: 'power2.out' }, A2 + 0.6);
      t.to(callout.current, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }, A2 + 0.8);

      // ===== ACT 3 — click the Media mission, open the real detail =====
      // The phone is already un-trimmed and zoomed out from Act 2, so we just tap
      // the Media card (at its zoomed position) and cross-fade board -> detail.
      const A3 = INTRO + 9.0;
      t.to(callout.current, { autoAlpha: 0, y: 22, duration: 0.5, ease: 'power2.in' }, A3);
      t.to(cards[AUDIT_I], { boxShadow: flat, scale: 1, duration: 0.4 }, A3);

      // hand cursor moves to the Media card (zoomed position) and taps
      t.to(hand.current, { autoAlpha: 1, duration: 0.3 }, A3 + 0.8);
      if (mediaHit) {
        t.to(hand.current, { x: mediaHit.x + 12, y: mediaHit.y + 6, duration: 0.9, ease: 'power2.inOut' }, A3 + 0.8);
      }
      t.to(hand.current, { scale: 0.82, duration: 0.12, ease: 'power2.in' }, A3 + 1.8)
        .to(hand.current, { scale: 1, duration: 0.18, ease: 'back.out(3)' }, A3 + 1.92);
      t.to(cards[MEDIA_I], { boxShadow: glow, scale: 1.03, duration: 0.35, ease: 'power2.out' }, A3 + 1.8);

      // navigate INSIDE the same phone: cross-fade board -> detail (already zoomed)
      t.to(hand.current, { autoAlpha: 0, duration: 0.3 }, A3 + 2.05);
      t.to(board, { autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, A3 + 2.2)
        .to(overlay, { autoAlpha: 1, duration: 0.55, ease: 'power2.out' }, A3 + 2.5);

      // ===== ACT 4 — open the Training Video; the player takes over and plays =====
      // Hold on the Access Check detail (title + alert read), then the hand taps
      // the Training Video row and the media player slides over, playing the mp4.
      const A4 = A3 + 4.0;
      t.to(hand.current, { autoAlpha: 1, duration: 0.3 }, A4);
      if (videoHit) {
        t.to(hand.current, { x: videoHit.x + 12, y: videoHit.y + 6, duration: 0.9, ease: 'power2.inOut' }, A4);
      }
      t.to(hand.current, { scale: 0.82, duration: 0.12, ease: 'power2.in' }, A4 + 1.0)
        .to(hand.current, { scale: 1, duration: 0.18, ease: 'back.out(3)' }, A4 + 1.12);
      t.to(hand.current, { autoAlpha: 0, duration: 0.3 }, A4 + 1.35);
      // restart the video from the top as the player is revealed
      t.call(() => {
        const v = root.current.querySelector('.mv-video');
        if (v) { try { v.currentTime = 0; } catch (e) { /* not ready */ } v.play?.(); }
      }, null, A4 + 1.45);
      t.to(viewerLayer, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, A4 + 1.45);

      // ===== end — fade out before the loop =====
      t.to(phone, { autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, END - 0.6);
    },
    { scope: root }
  );

  const togglePlay = () => {
    const t = tl.current;
    if (!t) return;
    if (t.paused()) {
      t.play();
      setPaused(false);
      setStarted(true);
      armHide();
    } else {
      t.pause();
      setPaused(true);
      setControlsShown(true);
      clearTimeout(hideTimer.current);
    }
  };

  // Replay from the top (from the end/replay overlay).
  const replay = () => {
    const t = tl.current;
    if (!t) return;
    setEnded(false);
    setStarted(true);
    setPaused(false);
    t.play(0);
    armHide();
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

  // Drag the subtitle anywhere over the frame. Position is stored as {x: center,
  // y: top} in .scene-fit px; the box keeps its translate(-50%, …) so the
  // enter/exit slide still works while dragged.
  const onSubtitleDown = (e) => {
    const el = sub.current;
    const fit = root.current;
    if (!el || !fit) return;
    e.preventDefault();
    const er = el.getBoundingClientRect();
    const fr = fit.getBoundingClientRect();
    const offX = e.clientX - (er.left + er.width / 2); // pointer offset from the box center
    const offY = e.clientY - er.top;
    const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
    const move = (ev) => {
      const x = clamp(ev.clientX - fr.left - offX, er.width / 2, fr.width - er.width / 2);
      const y = clamp(ev.clientY - fr.top - offY, 0, fr.height - er.height);
      setSubPos({ x, y });
    };
    // Anchor at the current spot first so grabbing never makes it jump.
    setSubPos({ x: er.left + er.width / 2 - fr.left, y: er.top - fr.top });
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div
      className={`scene-fit${full ? ' is-full' : ''}${started ? ' is-started' : ''}`}
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
              viewer={<MediaViewer src="/videos/training%20video%201.mp4" index="1/2" label="Video" />}
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

        {/* Animated on-screen intro (product title + tagline). Not a caption —
            each line fades/rises in as a whole, centered (never typed or wiped
            left-to-right), broken only at points where the line reads as a
            complete thought. See docs/mission-animation.md → "On-screen text". */}
        <div className="scene-intro" ref={intro} aria-hidden="true">
          <div className="scene-intro-verse" data-v="1">
            <span className="scene-intro-line scene-intro-brand">{t('Taskmaverick')}</span>
            <span className="scene-intro-line">{t('Teams Are Automatically Guided')}</span>
            <span className="scene-intro-line">{t('To Take Initiatives On Their Own')}</span>
          </div>
          <div className="scene-intro-verse" data-v="2">
            <span className="scene-intro-line">{t('Without A Need For A Manager')}</span>
            <span className="scene-intro-line">{t('To Constantly Remind Them')}</span>
          </div>
        </div>

        {/* checklist coming out of the phone (real .om-* UI) */}
        <div className="scene-callout" ref={callout} aria-hidden="true"><ChecklistCallout /></div>

        <div className="scene-hand" ref={hand} aria-hidden="true"><SceneCursor /></div>

        {/* Poster shown over the scene until the viewer hits play: a plain black
            panel with the chapter's stage-cta title in white. Clicking it bubbles
            to the .scene onClick (togglePlay), which starts the scene and hides it. */}
        {!started && (
          <div className="scene-poster">
            <div className="cover-cta-dots" aria-hidden="true" />
            {title ? (
              <h2 className="stage-cta">
                {t(title).split('\n').map((line, i) => (
                  <span className="cta-line" style={{ '--i': i }} key={i}>
                    {line || ' '}
                  </span>
                ))}
              </h2>
            ) : null}
          </div>
        )}
      </div>

      {/* YouTube-style subtitles overlaid on the scene, timed to the animation.
          Rendered in .scene-fit (unscaled) so they read at a steady size. Stays
          mounted while playing so it can slide down/fade as each line leaves;
          drag it anywhere over the frame to reposition. */}
      {started && !ended && subtitlesOn ? (
        <div
          ref={sub}
          className={`scene-subtitle${cueText ? ' is-visible' : ''}${controlsShown ? '' : ' is-low'}`}
          style={subPos ? { left: subPos.x, top: subPos.y, bottom: 'auto' } : undefined}
          onPointerDown={onSubtitleDown}
          aria-live="polite"
        >
          <span>{t(shownText)}</span>
        </div>
      ) : null}

      {/* live playback controls (drive the GSAP timeline — not baked) */}
      <div className={`scene-controls${started && controlsShown && !ended ? '' : ' is-hidden'}`}>
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
        {/* CC toggle — only offered once the scene has a voice-over; without one,
            subtitles carry the narration and can't be turned off. */}
        {HAS_VOICEOVER && (
          <button
            type="button"
            className={`scene-play scene-cc-btn ${subtitlesOn ? 'is-active' : ''}`}
            onClick={() => setSubtitlesOn((v) => !v)}
            aria-pressed={subtitlesOn}
            aria-label={subtitlesOn ? 'Turn subtitles off' : 'Turn subtitles on'}
            title={subtitlesOn ? 'Subtitles on' : 'Subtitles off'}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <rect x="2" y="5" width="20" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M10 10.6c-.5-.6-1.2-1-2.1-1-1.5 0-2.6 1.1-2.6 2.4s1.1 2.4 2.6 2.4c.9 0 1.6-.4 2.1-1M18.7 10.6c-.5-.6-1.2-1-2.1-1-1.5 0-2.6 1.1-2.6 2.4s1.1 2.4 2.6 2.4c.9 0 1.6-.4 2.1-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
        <button
          type="button"
          className="scene-play scene-full-btn"
          onClick={toggleFull}
          aria-label={full ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {full ? (
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
          )}
        </button>
      </div>

      {/* End state — no loop; replay button over the faded cover. */}
      {ended && (
        <div className="scene-ended">
          {poster && <img className="scene-ended-cover" src={poster} alt="" />}
          <button type="button" className="scene-replay" onClick={replay}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M1 4v6h6" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            Replay
          </button>
        </div>
      )}
    </div>
  );
}
