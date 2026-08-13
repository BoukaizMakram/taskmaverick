// Shared scene cursor — the macOS pointing hand (public/pointinghand.svg).
// Wrap it in a positioned `.scene-hand` element; the image is offset so the
// fingertip sits at that element's origin (the click hotspot).
export default function SceneCursor() {
  return <img className="scene-hand-img" src="/pointinghand.svg" alt="" aria-hidden="true" />;
}
