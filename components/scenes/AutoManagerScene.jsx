'use client';

// ---------------------------------------------------------------------------
// Scene: Automated Business Manager (Chapter 1). Two parts:
//   INTRO (on-screen title + taglines, per docs → "On-screen text"):
//     1. Automated Business Manager
//     2. Taskmaverick automatically guides teams to take initiatives on their own
//     3. There is no need for a human manager to constantly remind people
//   BOARD ACTS (real product UI — PhoneShell + MissionChip — with subtitles):
//     Act 1 — a Personal Board fills as missions are auto-assigned to one person.
//             "Work Missions can be automatically assigned … on their Personal Boards"
//     Act 2 — cross-fade to a Team Board where missions are posted for a team.
//             "…or they can be posted on Team Boards to facilitate cooperation"
// Reuses the same scene harness as PostedMissionsScene (play/pause, scrub,
// subtitles, poster, replay, fullscreen).
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import PhoneShell from '@/components/PhoneShell';
import MissionChip from '@/components/MissionChip';
import Starfield from '@/components/Starfield';
import { useT } from '@/lib/i18n/LanguageProvider';

const HAS_VOICEOVER = false;

// Subtitle cues, relative to the board start (after the intro).
const SUBTITLES = [
  { start: 0.3, end: 6.4, text: 'Work Missions can be automatically assigned to people on their Personal Boards' },
  { start: 6.4, end: 13.0, text: '…or they can be posted on Team Boards to facilitate cooperation' },
];

const fmt = (s) => {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

// Personal Board — missions auto-assigned to one person (ordered by time posted).
const PERSONAL = [
  { kind: 'Checklist', points: 15, title: 'Opening Checklist', date: '07-09-26', time: '04:07 PM', timer: 1150 },
  { kind: 'Media', points: 50, title: 'Access Check', date: '07-09-26', time: '04:07 PM', timer: 820 },
  { kind: 'Checklist', points: 10, title: 'Inventory Check', date: '07-09-26', time: '04:07 PM', timer: 470 },
];
// Team Board — missions posted for the whole team to cooperate on.
const TEAM = [
  { kind: 'Checklist', points: 20, title: 'Line Setup', date: '07-09-26', time: '04:07 PM', timer: 1420 },
  { kind: 'Survey', points: 30, title: 'Shift Feedback', date: '07-09-26', time: '04:07 PM', timer: 1010 },
  { kind: 'Media', points: 50, title: 'Safety Briefing', date: '07-09-26', time: '04:07 PM', timer: 760 },
  { kind: 'Checklist', points: 15, title: 'Restock Aisle 4', date: '07-09-26', time: '04:07 PM', timer: 520 },
];

const PERSONAL_TABS = [{ label: `Open - ${PERSONAL.length}`, active: true }, { label: 'Claimed - 0' }, { label: 'Closed - 0' }];
const TEAM_TABS = [{ label: `Open - ${TEAM.length}`, active: true }, { label: 'Claimed - 0' }, { label: 'Closed - 0' }];

export default function AutoManagerScene({ poster, title }) {
  const t = useT();
  const root = useRef(null);
  const cueIdx = useRef(-1);
  const introEl = useRef(null);
  const cardsA = useRef([]);
  const cardsB = useRef([]);
  const bar = useRef(null);
  const track = useRef(null);
  const tl = useRef(null);
  const inView = useRef(false);
  const sub = useRef(null);
  const [paused, setPaused] = useState(true);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [cueText, setCueText] = useState('');
  const [shownText, setShownText] = useState('');
  const [full, setFull] = useState(false);
  const [controlsShown, setControlsShown] = useState(true);
  const hideTimer = useRef(null);

  useEffect(() => {
    if (cueText) setShownText(cueText);
  }, [cueText]);

  const toggleFull = () => {
    const el = root.current;
    if (!el) return;
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (fsEl) {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    } else if (el.requestFullscreen || el.webkitRequestFullscreen) {
      (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    } else {
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
    const id = setTimeout(() => {
      if (tl.current && !tl.current.paused()) setControlsShown(false);
    }, 2600);
    return () => {
      clearTimeout(id);
      clearTimeout(hideTimer.current);
    };
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        inView.current = e.isIntersecting;
        if (e.isIntersecting) return;
        const tt = tl.current;
        if (tt && !tt.paused()) {
          tt.pause();
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
      const A = cardsA.current.filter(Boolean);
      const B = cardsB.current.filter(Boolean);
      const q = (card, sel) => card.querySelector(sel);
      const paint = (el, s) => { if (el) el.textContent = fmt(s); };

      const phoneA = root.current.querySelector('.scene-phone--a');
      const phoneB = root.current.querySelector('.scene-phone--b');
      const intro = introEl.current;
      const verses = intro ? intro.querySelectorAll('.scene-intro-verse') : [];
      const lines = intro ? intro.querySelectorAll('.scene-intro-line') : [];

      // Shared elapsed clock → visible Open Timers tick together, in real time.
      const elapsed = { e: 0 };
      const tickAll = () => {
        A.forEach((card, i) => paint(q(card, '.chip-pill'), PERSONAL[i].timer + elapsed.e));
        B.forEach((card, i) => paint(q(card, '.chip-pill'), TEAM[i].timer + elapsed.e));
      };

      // Initial states.
      const reset = () => {
        gsap.set(intro, { autoAlpha: 1 });
        gsap.set(lines, { autoAlpha: 0, y: 22 });
        gsap.set(phoneA, { autoAlpha: 0 });
        gsap.set(phoneB, { autoAlpha: 0 });
        A.forEach((card, i) => { gsap.set(card, { autoAlpha: 0, y: 26, scale: 0.94 }); paint(q(card, '.chip-pill'), PERSONAL[i].timer); });
        B.forEach((card, i) => { gsap.set(card, { autoAlpha: 0, y: 26, scale: 0.94 }); paint(q(card, '.chip-pill'), TEAM[i].timer); });
        elapsed.e = 0;
        cueIdx.current = -1;
        setCueText('');
        gsap.set(bar.current, { scaleX: 0 });
      };
      reset();

      const INTRO = 8.0;      // on-screen title + taglines
      const BOARD = 13.4;     // board acts (clock starts at INTRO)
      const END = INTRO + BOARD;

      const syncCue = (time) => {
        const rel = time - INTRO;
        const idx = SUBTITLES.findIndex((c) => rel >= c.start && rel < c.end);
        if (idx !== cueIdx.current) {
          cueIdx.current = idx;
          setCueText(idx === -1 ? '' : SUBTITLES[idx].text);
        }
      };

      const tt = gsap.timeline({ paused: true, onComplete: () => setEnded(true) });
      tl.current = tt;
      tt.eventCallback('onUpdate', () => {
        if (bar.current) gsap.set(bar.current, { scaleX: tt.progress() });
        syncCue(tt.time());
      });

      tt.call(reset, null, 0);

      // ===== INTRO — three verses reveal in sequence, all stay, centered =====
      // Whole lines fade + rise as units (never typed / left-to-right); verses
      // are stacked with a gap (see .scene-intro in globals.css).
      verses.forEach((v, vi) => {
        const vLines = v.querySelectorAll('.scene-intro-line');
        tt.to(vLines, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.22, ease: 'power2.out' }, 0.3 + vi * 2.5);
      });
      tt.to(intro, { autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, INTRO - 0.5);

      // Board clock — Open Timers tick in real time once the boards are shown.
      tt.to(elapsed, { e: BOARD, duration: BOARD, ease: 'none', onUpdate: tickAll }, INTRO);

      // ===== ACT 1 — Personal Board: missions auto-assigned (pop in) =====
      tt.to(phoneA, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, INTRO - 0.2);
      A.forEach((card, i) => {
        tt.to(card, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }, INTRO + 0.5 + i * 0.7);
      });

      // ===== ACT 2 — cross-fade to the Team Board: missions posted =====
      const A2 = INTRO + 6.4;
      tt.to(phoneA, { autoAlpha: 0, duration: 0.55, ease: 'power2.in' }, A2);
      tt.to(phoneB, { autoAlpha: 1, duration: 0.55, ease: 'power2.out' }, A2 + 0.25);
      B.forEach((card, i) => {
        tt.to(card, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }, A2 + 0.6 + i * 0.6);
      });

      // ===== end — fade out before the replay =====
      tt.to([phoneA, phoneB], { autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, END - 0.6);
    },
    { scope: root }
  );

  const togglePlay = () => {
    const tt = tl.current;
    if (!tt) return;
    if (tt.paused()) {
      tt.play();
      setPaused(false);
      setStarted(true);
      armHide();
    } else {
      tt.pause();
      setPaused(true);
      setControlsShown(true);
      clearTimeout(hideTimer.current);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== ' ' && e.code !== 'Space' && e.key !== 'Enter') return;
      if (!inView.current) return;
      if (e.target.closest?.('input, textarea, select, [contenteditable], button, a')) return;
      e.preventDefault();
      togglePlay();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const replay = () => {
    const tt = tl.current;
    if (!tt) return;
    setEnded(false);
    setStarted(true);
    setPaused(false);
    tt.play(0);
    armHide();
  };

  const seekTo = (clientX) => {
    const el = track.current;
    const tt = tl.current;
    if (!el || !tt) return;
    const r = el.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    tt.progress(frac);
    if (bar.current) gsap.set(bar.current, { scaleX: frac });
  };
  const onTrackDown = (e) => {
    const tt = tl.current;
    if (!tt) return;
    tt.pause();
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
      className={`scene-fit${full ? ' is-full' : ''}${started ? ' is-started' : ''}`}
      ref={root}
      onPointerMove={showControls}
      onPointerDown={showControls}
    >
      <div className="scene" onClick={togglePlay} role="button" tabIndex={-1} aria-label={paused ? 'Play' : 'Pause'} style={{ cursor: 'pointer' }}>
        <div className="dots-bg" aria-hidden="true">
          <i className="d1" />
          <i className="d2" />
        </div>

        {/* Personal Board */}
        <div className="scene-phone scene-phone--a scene-phone--dual">
          <div className="ph-fit">
            <PhoneShell title="Personal Board" tabs={PERSONAL_TABS}>
              {PERSONAL.map((m, i) => (
                <MissionChip
                  key={m.title}
                  ref={(el) => (cardsA.current[i] = el)}
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

        {/* Team Board (cross-fades in over the Personal Board) */}
        <div className="scene-phone scene-phone--b scene-phone--dual">
          <div className="ph-fit">
            <PhoneShell title="Team Board" tabs={TEAM_TABS}>
              {TEAM.map((m, i) => (
                <MissionChip
                  key={m.title}
                  ref={(el) => (cardsB.current[i] = el)}
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

        {/* On-screen intro (title + taglines) — whole lines, centered, stacked
            verses (see docs/mission-animation.md → "On-screen text"). */}
        <div className="scene-intro" ref={introEl} aria-hidden="true">
          <div className="scene-intro-verse" data-v="1">
            <span className="scene-intro-line scene-intro-brand">{t('Automated Business Manager')}</span>
          </div>
          <div className="scene-intro-verse" data-v="2">
            <span className="scene-intro-line">{t('Taskmaverick automatically guides teams')}</span>
            <span className="scene-intro-line">{t('to take initiatives on their own')}</span>
          </div>
          <div className="scene-intro-verse" data-v="3">
            <span className="scene-intro-line">{t('There is no need for a human manager')}</span>
            <span className="scene-intro-line">{t('to constantly remind people')}</span>
          </div>
        </div>

        {!started && (
          <div className="scene-poster">
            <Starfield className="cover-cta-stars" />
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

      {started && !ended ? (
        <div
          ref={sub}
          className={`scene-subtitle${cueText ? ' is-visible' : ''}${controlsShown ? '' : ' is-low'}`}
          aria-live="polite"
        >
          <span>{t(shownText)}</span>
        </div>
      ) : null}

      <div className={`scene-controls${started && controlsShown && !ended ? '' : ' is-hidden'}`}>
        <button type="button" className="scene-play" onClick={togglePlay} aria-label={paused ? 'Play' : 'Pause'}>
          {paused ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
          )}
        </button>
        <div className="scene-track" ref={track} onPointerDown={onTrackDown}>
          <span className="scene-timeline-fill" ref={bar} />
        </div>
        <button type="button" className="scene-play scene-full-btn" onClick={toggleFull} aria-label={full ? 'Exit fullscreen' : 'Fullscreen'}>
          {full ? (
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
          )}
        </button>
      </div>

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
