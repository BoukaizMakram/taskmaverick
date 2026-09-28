'use client';

// Full-page photo / video viewer of the web app (Overview drawer, Reports):
// file name, Zoom in, Rotate, Close, previous / next and a thumbnail strip.
import { useEffect, useRef, useState } from 'react';

export default function WebLightbox({ items, index = 0, onClose }) {
  const [at, setAt] = useState(index);
  const [zoom, setZoom] = useState(1);
  const [turn, setTurn] = useState(0);
  const close = useRef(onClose);
  close.current = onClose;
  const closeButton = useRef(null);
  const item = items[at];
  useEffect(() => { setZoom(1); setTurn(0); }, [at]);
  // Capture phase: Escape closes only the viewer, not the drawer beneath it.
  useEffect(() => {
    const previous = document.activeElement;
    closeButton.current?.focus({ preventScroll: true });
    const key = e => {
      if (e.key === 'Escape') { e.stopImmediatePropagation(); e.preventDefault(); close.current(); }
      if (e.key === 'ArrowRight') setAt(a => Math.min(items.length - 1, a + 1));
      if (e.key === 'ArrowLeft') setAt(a => Math.max(0, a - 1));
    };
    document.addEventListener('keydown', key, true);
    return () => { document.removeEventListener('keydown', key, true); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, [items.length]);
  if (!item) return null;
  return <div className="wa-lightbox" role="dialog" aria-modal="true" aria-label={item.name}>
    <header><span/><b>{item.name}</b><div><button type="button" onClick={() => setZoom(z => (z >= 2 ? 1 : z + .5))}>⊕ Zoom in</button><button type="button" onClick={() => setTurn(t => t + 90)}>⟳ Rotate</button><button type="button" ref={closeButton} className="wa-lightbox-close" onClick={onClose}>Close</button></div></header>
    <div className="wa-lightbox-stage">
      <button type="button" className="wa-lightbox-nav" aria-label="Previous" disabled={at === 0} onClick={() => setAt(a => a - 1)}>‹</button>
      <div className="wa-lightbox-media" style={{ transform: `scale(${zoom}) rotate(${turn}deg)` }}>{item.kind === 'video' ? <video src={item.src} poster={item.poster} controls autoPlay muted playsInline/> : <img src={item.src} alt={item.name}/>}</div>
      <button type="button" className="wa-lightbox-nav" aria-label="Next" disabled={at === items.length - 1} onClick={() => setAt(a => a + 1)}>›</button>
    </div>
    {items.length > 1 && <footer>{items.map((it, i) => <button type="button" key={i} className={i === at ? 'is-on' : ''} style={{ backgroundImage: `url('${it.kind === 'video' ? it.poster : it.src}')` }} aria-label={`Show ${it.name}`} onClick={() => setAt(i)}/>)}</footer>}
  </div>;
}
