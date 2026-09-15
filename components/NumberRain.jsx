'use client';

// ---------------------------------------------------------------------------
// NumberRain — a soft "digital rain" of falling digits on <canvas>, tinted to
// match the navy CTA poster. Columns of 0–9 stream downward with a fading tail;
// the centre is kept dim so the headline stays readable. Same self-contained
// contract as Starfield: sizes to its parent, caps DPR, pauses off-screen / when
// hidden, and renders a static field for reduced-motion users.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react';

export default function NumberRain({ className = '', speed = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext('2d');

    let w = 1, h = 1, cx = 0.5, cy = 0.5;
    let cols = [];
    let cell = 18; // px per glyph
    let rows = 1, nCols = 1;
    let raf = 0;
    let running = true;
    let last = 0;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const rnd = (a, b) => a + Math.random() * (b - a);
    const digit = () => String(Math.floor(Math.random() * 10));

    function build() {
      const trail = 14;
      cols = Array.from({ length: nCols }, () => ({
        head: rnd(-rows, 0),
        speed: rnd(0.006, 0.015),
        glyphs: Array.from({ length: trail }, digit),
      }));
    }

    function resize() {
      const rect = parent.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2;
      cy = h / 2;
      cell = Math.max(14, Math.min(26, w / 60));
      nCols = Math.ceil(w / cell);
      rows = Math.ceil(h / cell);
      ctx.font = `${Math.round(cell * 0.9)}px "Courier New", ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      build();
      if (reduce) draw();
    }

    const halfDiag = () => Math.hypot(w, h) / 2 || 1;
    // Dim the inner ~30% so digits never crowd the centred headline.
    function centreFade(x, y) {
      return Math.min(1, Math.hypot(x - cx, y - cy) / halfDiag() / 0.3);
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (let c = 0; c < cols.length; c += 1) {
        const col = cols[c];
        const x = c * cell + cell / 2;
        for (let i = 0; i < col.glyphs.length; i += 1) {
          const rowY = (Math.floor(col.head) - i) * cell + cell / 2;
          if (rowY < -cell || rowY > h + cell) continue;
          const tail = 1 - i / col.glyphs.length; // 1 head → 0 tail
          const a = (i === 0 ? 0.95 : 0.12 + tail * 0.5) * centreFade(x, rowY);
          ctx.fillStyle =
            i === 0 ? `rgba(226,240,255,${a})` : `rgba(150,196,255,${a})`;
          ctx.fillText(col.glyphs[i], x, rowY);
        }
      }
    }

    function frame(now) {
      if (!running) return;
      const dt = Math.min(50, last ? now - last : 16);
      last = now;
      for (const col of cols) {
        const prev = Math.floor(col.head);
        col.head += col.speed * dt * speed;
        if (Math.floor(col.head) !== prev) {
          col.glyphs.unshift(digit());
          col.glyphs.pop();
        }
        if ((Math.floor(col.head) - col.glyphs.length) * cell > h) {
          col.head = rnd(-rows * 0.5, 0);
          col.speed = rnd(0.006, 0.015);
        }
      }
      draw();
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (reduce || raf) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }

    resize();
    start();

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting && !document.hidden ? start() : stop()),
      { threshold: 0.01 }
    );
    io.observe(parent);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [speed]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
