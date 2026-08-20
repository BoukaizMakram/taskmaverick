'use client';

import { useState } from 'react';

// A chapter cover image with an optional play button. The button — a blue play
// triangle notched into the image's lower-right corner — only appears when a
// video source is available; clicking it swaps the still cover for the video.
// No text is drawn over the image.
export default function CoverPlayer({ cover, video, poster, alt }) {
  const [playing, setPlaying] = useState(false);

  if (playing && video) {
    return (
      <video
        className="video-el"
        src={video}
        poster={poster || undefined}
        autoPlay
        controls
        playsInline
      />
    );
  }

  return (
    <div className={`cover${video ? ' cover--playable' : ''}`}>
      <img className="cover-img" src={cover} alt={alt || ''} />
      {video && (
        <button
          type="button"
          className="cover-play"
          onClick={() => setPlaying(true)}
          aria-label="Play video"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      )}
    </div>
  );
}
