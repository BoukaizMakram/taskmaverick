'use client';

import { useEffect, useRef } from 'react';
import styles from './MissionChipField.module.css';

// Animate the existing product cards as a perspective field, preserving their UI.
export default function MissionChipField({ children }) {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    const elements = [...root.children];
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 1, height = 1, visible = false, raf = 0, last = 0;
    const items = elements.map((element, i) => ({ element, index: i, cycle: 0 }));
    function place(item, initial) {
      // Alternating upper/lower trajectories keep the headline clear. Each
      // card has its own depth and speed, with no synchronized loop reversal.
      const angle = ((item.index * 137.508 + item.cycle * 47) % 360) * Math.PI / 180;
      item.x = Math.cos(angle) * .35;
      item.y = (item.index % 2 ? 1 : -1) * (.23 + Math.abs(Math.sin(angle)) * .13);
      item.z = initial ? .52 + (item.index % 6) * .21 : 1.75;
      item.speed = .048 + (item.index % 4) * .006;
      item.cycle += 1;
    }
    items.forEach(item => place(item, true));
    function paint() {
      for (const item of items) {
        const scale = Math.min(1.25, .65 / item.z);
        const x = width * (.5 + item.x / item.z);
        const y = height * (.5 + item.y / item.z);
        const cardHeight = item.element.offsetHeight * scale;
        const gap = Math.abs(y - height / 2) - cardHeight / 2;
        const clearance = Math.max(0, Math.min(1, (gap / height - .12) / .12));
        const emergence = Math.max(0, Math.min(1, (1.75 - item.z) * 1.8));
        item.element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
        item.element.style.opacity = String(clearance * emergence * .96);
        item.element.style.zIndex = String(Math.round(100 / item.z));
      }
    }
    function resize() { width = root.clientWidth; height = root.clientHeight; paint(); }
    function frame(now) {
      const dt = Math.min(.05, last ? (now - last) / 1000 : 0);
      last = now;
      for (const item of items) {
        item.z -= dt * item.speed;
        if (item.z < .12 || Math.abs(item.x / item.z) > .85 || Math.abs(item.y / item.z) > .85) place(item, false);
      }
      paint();
      raf = requestAnimationFrame(frame);
    }
    function update() {
      cancelAnimationFrame(raf); raf = 0; last = 0;
      if (visible && !document.hidden && !motion.matches) raf = requestAnimationFrame(frame);
      else paint();
    }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(root);
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { threshold: .01 });
    io.observe(root);
    document.addEventListener('visibilitychange', update);
    motion.addEventListener('change', update);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', update); motion.removeEventListener('change', update); };
  }, []);
  return <div ref={ref} className={`cover-cta-stars ${styles.field}`} aria-hidden="true">{children}</div>;
}
