// Chapter cover for a reel frame. When the chapter has a video, render it with
// the cover image as its poster so the reel's corner Play button (and the native
// controls) play it — no separate on-cover play button. With no video, just show
// the cover image.
export default function CoverPlayer({ cover, video, poster, alt }) {
  if (video) {
    return (
      <video
        className="video-el"
        src={video}
        poster={cover || poster || undefined}
        controls
        playsInline
        preload="metadata"
      />
    );
  }

  return <img className="cover-img" src={cover} alt={alt || ''} />;
}
