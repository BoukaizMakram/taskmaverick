'use client';

import { useEffect, useRef, useState } from 'react';

import PostedMissionsScene from '@/components/scenes/PostedMissionsScene';
import { useT } from '@/lib/i18n/LanguageProvider';

// Chapters can render a code-driven animation scene instead of a <video>.
const SCENES = {
  'posted-missions': PostedMissionsScene,
};

// Filled / duotone glyphs (like the product menu icons): a solid shape in the
// current color with the detail punched out (fill-rule: evenodd) so the soft
// chip background shows through — no strokes.
export function BadgeIcon({ name }) {
  const p = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    fillRule: 'evenodd',
    clipRule: 'evenodd',
    'aria-hidden': true,
  };
  if (name === 'users')
    return (
      <svg {...p}>
        <path d="M9 3a4 4 0 100 8 4 4 0 000-8zM2 19c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5v1H2v-1zm15.5-8a3.5 3.5 0 10-2.3-6.1 5.5 5.5 0 010 5.2A3.5 3.5 0 0017.5 11zm.5 2.6c2.5.5 4 2.2 4 4.4v2h-4v-1c0-2-.8-3.7-2-5 .6-.3 1.3-.4 2-.4z" />
      </svg>
    );
  if (name === 'chart')
    return (
      <svg {...p}>
        <path d="M4 13a1 1 0 011-1h2a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1v-7zm7-5a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V8zm7-4a1 1 0 011-1h2a1 1 0 011 1v16a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
      </svg>
    );
  if (name === 'book')
    return (
      <svg {...p}>
        <path d="M6.5 2H20a1 1 0 011 1v15H6.5a1.5 1.5 0 000 3H20a1 1 0 011 1H6.5A3.5 3.5 0 013 18.5v-13A3.5 3.5 0 016.5 2zM9 6a1 1 0 000 2h7a1 1 0 100-2H9z" />
      </svg>
    );
  if (name === 'clock')
    return (
      <svg {...p}>
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 5a1 1 0 10-2 0v5c0 .27.1.52.29.71l3 3a1 1 0 001.42-1.42L13 11.59V7z" />
      </svg>
    );
  if (name === 'star')
    return (
      <svg {...p}>
        <path d="M12 2.5l2.9 5.88 6.5.95-4.7 4.58 1.11 6.47L12 17.9l-5.81 3.06 1.11-6.47-4.7-4.58 6.5-.95L12 2.5z" />
      </svg>
    );
  if (name === 'compass')
    return (
      <svg {...p}>
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.5 3.5l-2.1 6.3-6.9 2.7 2.1-6.3 6.9-2.7zM12 10.8a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z" />
      </svg>
    );
  if (name === 'graduation')
    return (
      <svg {...p}>
        <path d="M12 3.2L1.5 8 12 12.8 20 9.14V14a1 1 0 002 0V8.4a1 1 0 00-.59-.91L12 3.2zM5 13.2V17c0 1.1 3.13 2.5 7 2.5s7-1.4 7-2.5v-3.8l-6.59 3.01a1 1 0 01-.82 0L5 13.2z" />
      </svg>
    );
  if (name === 'camera')
    return (
      <svg {...p}>
        <path d="M9 3a1 1 0 00-.83.45L7.13 5H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2h-3.13l-1.04-1.55A1 1 0 0015 3H9zm3 5.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm0 2a2.5 2.5 0 110 5 2.5 2.5 0 010-5z" />
      </svg>
    );
  if (name === 'shield')
    return (
      <svg {...p}>
        <path d="M12 2l8 3v6c0 5.05-3.4 8.76-8 10-4.6-1.24-8-4.95-8-10V5l8-3zm3.7 6.3a1 1 0 00-1.4 0L11 11.58l-1.3-1.3a1 1 0 10-1.4 1.42l2 2a1 1 0 001.4 0l4-4a1 1 0 000-1.4z" />
      </svg>
    );
  // default / check — a filled disc with a check punched out
  return (
    <svg {...p}>
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.7 7.3a1 1 0 00-1.4-1.4L11 12.18l-1.8-1.8a1 1 0 10-1.4 1.42l2.5 2.5a1 1 0 001.4 0l4.99-5z" />
    </svg>
  );
}

export const BADGES = [
  { icon: 'users', title: 'Automated Guidance', sub: 'Teams Are Guided To Take Initiatives On Their Own' },
  { icon: 'check', title: 'Automated Training', sub: 'Critical Training Is Automatically Repeated For Emphasis' },
  { icon: 'shield', title: 'Automated Risk Detection', sub: 'HR Violations Are Automatically Detected & Resolved' },
  { icon: 'chart', title: 'Optimized Workload', sub: 'Work Distribution Is Automatically Optimized' },
];

export default function HeroVideo({ src, poster, activeChapter }) {
  const t = useT();
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
            <Scene poster={activeChapter?.cover} title={activeChapter?.heroTitle || activeChapter?.title} />
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
              <p className="video-placeholder-label">
                {activeChapter ? t(activeChapter.title) : t('Your video goes here')}
              </p>
            </div>
          )}
        </div>

        <ul className="stage-badges">
          {BADGES.map((b) => (
            <li className="stage-badge" key={b.title}>
              <span className="stage-badge-icon">
                <BadgeIcon name={b.icon} />
              </span>
              <span className="stage-badge-text">
                <b>{t(b.title)}</b>
                <small>{t(b.sub)}</small>
              </span>
            </li>
          ))}
        </ul>


        <a className="stage-uc" href="#use-cases">
          {t('Industries')}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      </div>
    </section>
  );
}
