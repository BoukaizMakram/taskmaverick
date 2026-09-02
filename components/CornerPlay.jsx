'use client';

import { useT } from '@/lib/i18n/LanguageProvider';

// Blue "Play" button tucked inside the video's bottom-right corner. Shared by the
// landing reel (DesktopReel) and the industry reel (IndustrySlides). Clicking it
// plays whatever is in the enclosing `.video-frame-wrap` — a coded scene (which
// toggles play/pause on click) or a plain <video>.
export default function CornerPlay() {
  const t = useT();

  const onClick = (e) => {
    const wrap = e.currentTarget.closest('.video-frame-wrap');
    if (!wrap) return;
    const scene = wrap.querySelector('.scene');
    if (scene) {
      scene.click(); // the scene toggles play/pause on click
      return;
    }
    const video = wrap.querySelector('video');
    if (video) {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    }
  };
  return (
    <button type="button" className="corner-play corner-play--inside" aria-label="Play video" onClick={onClick}>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
        <path d="M8 5.14v13.72c0 .9 1 1.45 1.75.95l10.29-6.86a1.14 1.14 0 000-1.9L9.75 4.19A1.14 1.14 0 008 5.14z" />
      </svg>
      {t('Play')}
    </button>
  );
}
