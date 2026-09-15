'use client';

import { useEffect, useRef } from 'react';

// Timer-only perspective field. The existing stars and number rain stay independent.
export default function ExecutionTimersBg() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext('2d');
    if (!parent || !ctx) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const colors = [
      { fill: '#007A33', text: '#ffffff' },
      { fill: '#bd4b00', text: '#ffffff' },
      { fill: '#bd1f59', text: '#ffffff' },
    ];
    let w = 1, h = 1, timers = [], raf = 0, last = 0, elapsed = 0, visible = false;
    let background;
    const random = (a, b) => a + Math.random() * (b - a);
    function place(timer, initial = false) {
      const angle = random(0, Math.PI * 2);
      const radius = random(.22, .46);
      timer.x = Math.cos(angle) * radius;
      timer.y = Math.sin(angle) * radius;
      timer.z = initial ? random(.3, 1.7) : 1.7;
      timer.velocity = random(.075, .12);
      timer.color = colors[Math.floor(random(0, colors.length))];
      timer.base = Math.floor(random(150, 6200));
    }
    const format = (seconds) => [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(n => String(n).padStart(2, '0')).join(':');
    function draw() {
      ctx.globalAlpha = 1;
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, w, h);
      // Far timers stay small; nearer timers grow and fan toward the edges.
      for (const timer of [...timers].sort((a, b) => b.z - a.z)) {
        const x = w * (.5 + timer.x / timer.z);
        const y = h * (.5 + timer.y / timer.z);
        const scale = Math.min(1.65, .64 / timer.z);
        const font = Math.max(9, Math.min(19, w / 65)) * scale;
        const bw = font * 7.1, bh = font * 2.05;
        const distance = Math.hypot((x / w - .5) * 1.1, (y / h - .5) * 1.8);
        const headlineClearance = Math.max(0, Math.min(1, (Math.abs(y / h - .5) - .11) / .16));
        const quietCentre = Math.max(0, Math.min(1, (distance - .28) / .25)) * headlineClearance;
        const edge = Math.min(1, Math.max(0, Math.min(x + bw / 2, w - x + bw / 2, y + bh, h - y + bh) / (bh * 2)));
        ctx.globalAlpha = Math.min(.95, (1.7 - timer.z) * 1.2) * quietCentre * edge;
        if (ctx.globalAlpha < .01) continue;
        ctx.fillStyle = timer.color.fill;
        ctx.beginPath();
        ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, bh / 2);
        ctx.fill();
        ctx.fillStyle = timer.color.text;
        ctx.font = `600 ${font}px ui-monospace, SFMono-Regular, Consolas, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(format(timer.base + Math.floor(elapsed)), x, y + .5);
      }
      ctx.globalAlpha = 1;
    }
    function resize() {
      const rect = parent.getBoundingClientRect();
      w = Math.max(1, rect.width); h = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      background = ctx.createRadialGradient(w * .5, h * .42, 0, w * .5, h * .5, Math.max(w, h) * .75);
      background.addColorStop(0, '#132d43');
      background.addColorStop(.5, '#091d30');
      background.addColorStop(1, '#040e1b');
      timers = Array.from({ length: w < 600 ? 22 : 38 }, () => { const timer = {}; place(timer, true); return timer; });
      draw();
    }
    function frame(now) {
      raf = 0;
      const dt = Math.min(.05, last ? (now - last) / 1000 : 0);
      last = now; elapsed += dt;
      for (const timer of timers) {
        timer.z -= dt * timer.velocity;
        if (timer.z < .12 || Math.abs(timer.x / timer.z) > .7 || Math.abs(timer.y / timer.z) > .7) place(timer);
      }
      draw();
      raf = requestAnimationFrame(frame);
    }
    function update() {
      cancelAnimationFrame(raf); raf = 0; last = 0;
      if (visible && !document.hidden && !motion.matches) raf = requestAnimationFrame(frame);
      else draw();
    }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(parent);
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { threshold: .01 });
    io.observe(parent);
    document.addEventListener('visibilitychange', update);
    motion.addEventListener('change', update);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', update); motion.removeEventListener('change', update); };
  }, []);
  return <canvas ref={canvasRef} className="cover-cta-stars" aria-hidden="true" />;
}
