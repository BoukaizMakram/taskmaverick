'use client';

// ---------------------------------------------------------------------------
// Starfield — a lightweight forward-flying hyperspace effect on <canvas>.
// Stars stream out from the centre toward the edges (as if we're flying
// forward through space); the further out they travel the longer/brighter the
// streak, giving a subtle sci-fi speed feel. The centre is kept dim so the
// headline stays readable. Replaces the old CSS dot field on the black posters.
//
// Self-contained: sizes to its parent (ResizeObserver), caps devicePixelRatio,
// pauses when off-screen or the tab is hidden, and renders a static field for
// users who prefer reduced motion.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react';

export default function Starfield({ className = '', speed = 1, density = 1, paused = false, fitParent = false }) {
  const canvasRef = useRef(null);
  const pausedRef = useRef(paused);
  const playbackRef = useRef(null);

  useEffect(() => {
    pausedRef.current = paused;
    playbackRef.current?.();
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext('2d');

    let w = 1, h = 1, cx = 0.5, cy = 0.5, D = 1;
    let stars = [];
    let raf = 0;
    let running = true;
    let last = 0;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const rand = (a, b) => a + Math.random() * (b - a);

    // A star lives in a fixed 2D plane at depth z; projecting x·D/z fans it out
    // from the centre as z shrinks toward the camera. Reset far away (z = D).
    function place(s, initial) {
      s.x = rand(-w / 2, w / 2);
      s.y = rand(-h / 2, h / 2);
      s.z = initial ? rand(1, D) : D;
      s.pz = s.z;
    }

    function build() {
      const count = Math.max(70, Math.min(460, Math.round((w * h) / 5200 * density)));
      stars = Array.from({ length: count }, () => {
        const s = {};
        place(s, true);
        return s;
      });
    }

    function resize() {
      const rect = parent.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = fitParent ? '100%' : `${w}px`;
      canvas.style.height = fitParent ? '100%' : `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2;
      cy = h / 2;
      D = Math.max(w, h);
      build();
      if (reduce || pausedRef.current) drawStatic();
    }

    const halfDiag = () => Math.hypot(w, h) / 2 || 1;

    // Dim the inner ~30% so stars never crowd the centred headline.
    function centreFade(sx, sy) {
      return Math.min(1, Math.hypot(sx - cx, sy - cy) / halfDiag() / 0.3);
    }

    function drawStatic() {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const sx = cx + (s.x * D) / s.z;
        const sy = cy + (s.y * D) / s.z;
        if (sx < 0 || sx > w || sy < 0 || sy > h) continue;
        const t = 1 - s.z / D;
        const a = Math.min(1, 0.25 + t) * centreFade(sx, sy);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 0.4 + t * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function frame(now) {
      if (!running) return;
      const dt = Math.min(50, last ? now - last : 16);
      last = now;
      // Travel the full depth in ~3.4s at speed 1 — cinematic, not frantic.
      const adv = (D / (3400 / speed)) * dt;

      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';
      for (const s of stars) {
        s.pz = s.z;
        s.z -= adv;
        if (s.z < 1) { place(s, false); continue; }

        const sx = cx + (s.x * D) / s.z;
        const sy = cy + (s.y * D) / s.z;
        if (sx < -60 || sx > w + 60 || sy < -60 || sy > h + 60) { place(s, false); continue; }

        const px = cx + (s.x * D) / s.pz;
        const py = cy + (s.y * D) / s.pz;
        const t = 1 - s.z / D;              // 0 far → 1 near
        const size = 0.4 + t * 1.9;
        const a = Math.min(1, 0.18 + t) * centreFade(sx, sy);

        // Streak from previous → current position (longer/brighter near edges).
        ctx.strokeStyle = `rgba(255,255,255,${a})`;
        ctx.lineWidth = size;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();

        // Bright head.
        ctx.fillStyle = `rgba(255,255,255,${Math.min(1, a + 0.15)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (reduce || pausedRef.current || raf) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }

    playbackRef.current = () => pausedRef.current ? stop() : start();

    resize();
    start();

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    // A scaled demo stage changes its visual size without changing its layout size.
    if (fitParent) window.addEventListener('resize', resize);

    // Pause when scrolled out of view or the tab is hidden — keeps it cheap.
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting && !document.hidden ? start() : stop()),
      { threshold: 0.01 }
    );
    io.observe(parent);

    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);

    return () => {
      stop();
      playbackRef.current = null;
      ro.disconnect();
      if (fitParent) window.removeEventListener('resize', resize);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [speed, density, fitParent]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
