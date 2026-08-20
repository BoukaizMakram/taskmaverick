'use client';

import { useEffect, useRef, useState } from 'react';

import PostedMissionsScene from '@/components/scenes/PostedMissionsScene';

// Chapters can render a code-driven animation scene instead of a <video>.
const SCENES = {
  'posted-missions': PostedMissionsScene,
};

export function BadgeIcon({ name }) {
  const p = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  if (name === 'check')
    return (
      <svg {...p}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    );
  if (name === 'users')
    return (
      <svg {...p}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  if (name === 'chart')
    return (
      <svg {...p}>
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
      </svg>
    );
  if (name === 'book')
    return (
      <svg {...p}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    );
  if (name === 'clock')
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 14" />
      </svg>
    );
  if (name === 'star')
    return (
      <svg {...p}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  if (name === 'compass')
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="9" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    );
  if (name === 'graduation')
    return (
      <svg {...p}>
        <path d="M22 10 12 5 2 10l10 5 10-5z" />
        <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
      </svg>
    );
  if (name === 'camera')
    return (
      <svg {...p}>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    );
  return (
    <svg {...p}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

export const BADGES = [
  { icon: 'users', title: 'Automated Guidance', sub: 'Teams Are Guided To Take Initiatives On Their Own' },
  { icon: 'check', title: 'Automated Training', sub: 'Critical Training Is Automatically Repeated For Emphasis' },
  { icon: 'shield', title: 'Automated Risk Detection', sub: 'HR Violations Are Automatically Detected & Resolved' },
  { icon: 'chart', title: 'Automated Assignments', sub: 'Work Distribution Is Automatically Optimized' },
];

export default function HeroVideo({ src, poster, activeChapter }) {
  const videoRef = useRef(null);

  // A chapter can bring its own video file; otherwise we fall back to the
  // shared VIDEO_SRC and seek to the chapter's timestamp.
  const chapterSrc = activeChapter?.src || null;
  const effectiveSrc = chapterSrc || src;
  const cues = activeChapter?.subtitles || null;

  // A chapter can render a code-driven animation scene instead of any video.
  const Scene = activeChapter?.scene ? SCENES[activeChapter.scene] : null;

  const [subtitlesOn, setSubtitlesOn] = useState(false);
  const [cueText, setCueText] = useState('');

  // Seek/play when the active chapter changes.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Own-file chapter: the element remounts (see key=), just start at 0.
    if (chapterSrc) {
      try {
        video.currentTime = 0;
      } catch {
        /* metadata not ready yet — safe to ignore */
      }
      return;
    }

    // Shared-video chapter: seek to its timestamp and play.
    if (!src || !activeChapter) return;
    try {
      video.currentTime = activeChapter.start || 0;
      const play = video.play();
      if (play && typeof play.catch === 'function') play.catch(() => {});
    } catch {
      /* seeking before metadata is loaded, safe to ignore */
    }
  }, [activeChapter, src, chapterSrc]);

  // Subtitles: keep the current cue in sync with playback, and auto-enable
  // subtitles the moment the user mutes (they persist after unmute until the
  // user turns them off with the CC button).
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !cues) {
      setCueText('');
      return;
    }

    const updateCue = () => {
      const t = video.currentTime || 0;
      const cue = cues.find((c) => t >= c.start && t < c.end);
      setCueText(cue ? cue.text : '');
    };
    const onVolume = () => {
      if (video.muted || video.volume === 0) setSubtitlesOn(true);
    };

    video.addEventListener('timeupdate', updateCue);
    video.addEventListener('seeked', updateCue);
    video.addEventListener('volumechange', onVolume);
    updateCue();

    return () => {
      video.removeEventListener('timeupdate', updateCue);
      video.removeEventListener('seeked', updateCue);
      video.removeEventListener('volumechange', onVolume);
    };
  }, [cues, effectiveSrc]);

  return (
    <section className="stage" id="overview" aria-label="Overview video">
      <div className="stage-inner">
        <div className="video-frame js-video">
          {Scene ? (
            <Scene />
          ) : effectiveSrc ? (
            <>
              <video
                key={effectiveSrc}
                ref={videoRef}
                className="video-el"
                src={effectiveSrc}
                poster={poster || undefined}
                controls
                playsInline
                preload="metadata"
              />

              {cues ? (
                <>
                  {subtitlesOn && cueText ? (
                    <div className="video-subtitle" aria-live="polite">
                      <span>{cueText}</span>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className={`video-cc ${subtitlesOn ? 'is-active' : ''}`}
                    onClick={() => setSubtitlesOn((v) => !v)}
                    aria-pressed={subtitlesOn}
                    aria-label={subtitlesOn ? 'Turn subtitles off' : 'Turn subtitles on'}
                    title={subtitlesOn ? 'Subtitles on' : 'Subtitles off'}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                      <rect x="2" y="5" width="20" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path
                        d="M10 10.6c-.5-.6-1.2-1-2.1-1-1.5 0-2.6 1.1-2.6 2.4s1.1 2.4 2.6 2.4c.9 0 1.6-.4 2.1-1M18.7 10.6c-.5-.6-1.2-1-2.1-1-1.5 0-2.6 1.1-2.6 2.4s1.1 2.4 2.6 2.4c.9 0 1.6-.4 2.1-1"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </>
              ) : null}
            </>
          ) : (
            <div className="video-placeholder">
              <button type="button" className="play-btn" aria-label="Play video">
                <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor">
                  <path d="M8 5.14v13.72c0 .9 1 1.45 1.75.95l10.29-6.86a1.14 1.14 0 000-1.9L9.75 4.19A1.14 1.14 0 008 5.14z" />
                </svg>
              </button>
              <p className="video-placeholder-label">
                {activeChapter ? activeChapter.title : 'Your video goes here'}
              </p>
            </div>
          )}
        </div>

        <div className="stage-head js-cta">
          <h1 className="stage-cta">
            {activeChapter?.heroTitle || activeChapter?.title || 'See how Taskmaverick makes operational excellence possible'}
          </h1>
        </div>

        <ul className="stage-badges">
          {BADGES.map((b) => (
            <li className="stage-badge" key={b.title}>
              <span className="stage-badge-icon">
                <BadgeIcon name={b.icon} />
              </span>
              <span className="stage-badge-text">
                <b>{b.title}</b>
                <small>{b.sub}</small>
              </span>
            </li>
          ))}
        </ul>

        <a className="stage-uc" href="#use-cases">
          Industries
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      </div>
    </section>
  );
}
