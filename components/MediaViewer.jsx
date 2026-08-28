'use client';

// ---------------------------------------------------------------------------
// MediaViewer — the Media "content viewer" secondary state of a Mission: a
// full-screen video player that takes over the phone when a media item (e.g. a
// Training Video) is opened. Reuses the phone status bar; header matches the
// OpenedMission "Mission Details" chrome. Prefix: .mv-*.
//   - pager row: "1/2 · Video" + up/down item nav (as in the product)
//   - a real <video> (muted, looping) so it plays inside the scene
//   - a play/scrub control bar (play + progress + total time)
// The video autoplays muted (browser-allowed) and loops; the scene can restart
// it (set currentTime = 0, play) when the viewer is revealed.
// ---------------------------------------------------------------------------

import { useRef, useState } from 'react';

const fmtMS = (s) => {
  s = Math.max(0, Math.floor(s || 0));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const IconBack = () => (
  <svg viewBox="0 0 22 22" aria-hidden="true"><path d="M16 11H6.5M10.5 6 5.5 11l5 5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const ArrowUp = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 19V6M6 12l6-6 6 6" fill="none" stroke="#1271b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const ArrowDown = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 5v13M6 12l6 6 6-6" fill="none" stroke="#1271b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export default function MediaViewer({ src, index = '1/2', label = 'Video' }) {
  const vref = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [frac, setFrac] = useState(0);
  const [dur, setDur] = useState(0);

  const toggle = () => {
    const v = vref.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  };

  const pct = Math.min(100, Math.max(0, frac * 100));

  return (
    <div className="mv">
      {/* status bar */}
      <div className="ph-status">
        <span className="ph-time">9:41</span>
        <span className="ph-island" aria-hidden="true" />
        <span className="mv-status-sp" aria-hidden="true" />
      </div>

      {/* nav header (matches Mission Details) */}
      <header className="mv-header">
        <button type="button" className="mv-hbtn" aria-label="Back"><IconBack /></button>
        <span className="mv-header-title">Mission Details</span>
        <span className="mv-hspacer" />
      </header>

      {/* item pager */}
      <div className="mv-pager">
        <div className="mv-pager-info">
          <span className="mv-idx">{index}</span>
          <span className="mv-kind">{label}</span>
        </div>
        <div className="mv-pager-nav">
          <button type="button" className="mv-navbtn" aria-label="Previous item"><ArrowUp /></button>
          <button type="button" className="mv-navbtn" aria-label="Next item"><ArrowDown /></button>
        </div>
      </div>

      {/* the video */}
      <div className="mv-stage">
        <video
          ref={vref}
          className="mv-video"
          src={src}
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            setFrac(v.duration ? v.currentTime / v.duration : 0);
          }}
        />
      </div>

      {/* transport controls */}
      <div className="mv-controls">
        <button type="button" className="mv-play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#1271b7" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#1271b7" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
        <div className="mv-track">
          <span className="mv-fill" style={{ width: `${pct}%` }} />
          <span className="mv-knob" style={{ left: `${pct}%` }} />
        </div>
        <span className="mv-time">{fmtMS(dur)}</span>
      </div>
    </div>
  );
}
