'use client';
// One piece of the product's UI, opened (/assets-library/<id>): the piece itself, drawn from its
// real HTML at the size it has in the product (AssetPiece), not the thumbnail's picture — so it
// stays sharp at any zoom. Fit (0), 100% (1), + and − zoom it; Esc goes back to the library.
import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import AssetPiece, {pieceSize} from './AssetPiece';
import {sizeLabel} from '@/lib/storyboardParts.mjs';
import './AssetsLibrary.css';

const STEPS = [0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3, 4];
const MARGIN = 28;// space kept around the piece when it is fitted
const MAX_FIT = 3;// a small piece (a mission) is fitted bigger than it is, but not absurdly

const Icon = {
  back: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 4-6 6 6 6"/></svg>,
  plus: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M10 4v12M4 10h12"/></svg>,
  minus: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 10h12"/></svg>,
};

export default function AssetViewer({part}) {
  const router = useRouter();
  const {w, h} = pieceSize(part);
  const stage = useRef(null);
  const [room, setRoom] = useState(null);// what the stage has to show the piece in
  const [zoom, setZoom] = useState('fit');// 'fit' or a scale
  useLayoutEffect(() => {
    const el = stage.current, read = () => setRoom({w: el.clientWidth - 2 * MARGIN, h: el.clientHeight - 2 * MARGIN});
    read();
    const watch = new ResizeObserver(read);
    watch.observe(el);
    return () => watch.disconnect();
  }, []);
  const fit = room ? Math.max(0.1, Math.min(MAX_FIT, room.w / w, room.h / h)) : 1;
  const scale = zoom === 'fit' ? fit : zoom;
  const step = useCallback(direction => {
    const now = zoom === 'fit' ? fit : zoom;
    const next = direction > 0 ? STEPS.find(s => s > now * 1.001) : [...STEPS].reverse().find(s => s < now / 1.001);
    if (next) setZoom(next);
  }, [zoom, fit]);
  useEffect(() => {
    const onKey = event => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'Escape') router.push(`/assets-library?asset=${part.id}`);
      else if (event.key === '0') setZoom('fit');
      else if (event.key === '1') setZoom(1);
      else if (event.key === '+' || event.key === '=') step(1);
      else if (event.key === '-') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router, part.id, step]);
  return <div className="al-asset">
    <header className="al-asset-bar">
      <Link href={`/assets-library?asset=${part.id}`} className="al-asset-back" aria-label="Back to the Assets Library">{Icon.back}<span>Assets Library</span></Link>
      <div className="al-asset-title"><small>{part.category}</small><h1>{part.name}</h1></div>
      <span className="al-asset-size">{sizeLabel(part)} px</span>
      <div className="al-zoom" role="group" aria-label="Zoom">
        <button type="button" onClick={() => step(-1)} aria-label="Zoom out">{Icon.minus}</button>
        <output aria-live="polite">{Math.round(scale * 100)}%</output>
        <button type="button" onClick={() => step(1)} aria-label="Zoom in">{Icon.plus}</button>
        <button type="button" className="al-zoom-mode" aria-pressed={zoom === 'fit'} onClick={() => setZoom('fit')}>Fit</button>
        <button type="button" className="al-zoom-mode" aria-pressed={zoom === 1} onClick={() => setZoom(1)}>100%</button>
      </div>
    </header>
    <main className="al-stage" ref={stage}>
      {room && <div className="al-canvas" style={{width: Math.round(w * scale), height: Math.round(h * scale)}}>
        <div style={{width: w, height: h, transform: `scale(${scale})`, transformOrigin: '0 0'}}><AssetPiece part={part}/></div>
      </div>}
    </main>
  </div>;
}
