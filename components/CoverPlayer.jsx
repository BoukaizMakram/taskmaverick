'use client';

import { useState } from 'react';

// Chapter cover for a reel frame. When the chapter has a video, the cover image
// is the video's poster and the reel's corner Play button starts it. Native
// controls stay hidden until the video actually starts playing, so the cover
// reads as a clean image until you hit Play. With no video, just the image.
export default function CoverPlayer({ cover, video, poster, alt }) {
  const [started, setStarted] = useState(false);

  if (video) {
    return (
      <video
        className="video-el"
        src={video}
        poster={cover || poster || undefined}
        controls={started}
        playsInline
        preload="metadata"
        onPlay={() => setStarted(true)}
      />
    );
  }

  return <img className="cover-img" src={cover} alt={alt || ''} />;
}
