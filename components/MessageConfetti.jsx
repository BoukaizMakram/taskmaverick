'use client';

import { useEffect, useRef } from 'react';
import styles from './GabrielMessage.module.css';

const COLORS = ['#ef1760', '#ffbc08', '#008f74', '#16899b', '#963890', '#fa8610', '#3268a5'];

export default function MessageConfetti({ open }) {
  const canvas = useRef(null);
  const fired = useRef(false);

  useEffect(() => {
    if (!open || fired.current) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches) return;
    const surface = canvas.current;
    const context = surface.getContext('2d');
    if (!context) return;
    let width, height, frame, previous, elapsed = 0;
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.round(width * ratio);
      surface.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    const pieces = Array.from({ length: 150 }, (_, index) => ({
      x: width * .5 + (Math.random() - .5) * 40,
      y: height * .64 + (Math.random() - .5) * 20,
      vx: (Math.random() - .5) * width * 1.7,
      vy: -Math.sqrt(height * 440) * (.75 + Math.random() * .65),
      width: 10 + Math.random() * 11,
      height: 7 + Math.random() * 10,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - .5) * 9,
      phase: Math.random() * Math.PI * 2,
      flutter: 5 + Math.random() * 5,
      color: COLORS[index % COLORS.length],
      ribbon: index % 3 === 0,
    }));
    const clear = () => context.clearRect(0, 0, width, height);
    const stop = () => { cancelAnimationFrame(frame); clear(); };
    const tick = now => {
      fired.current = true;
      const dt = previous === undefined ? 0 : Math.min((now - previous) / 1000, .035);
      previous = now;
      elapsed += dt;
      clear();
      let visible = false;
      for (const piece of pieces) {
        // Gravity accelerates each piece; air resistance slows its outward flight.
        piece.vx *= Math.exp(-1.05 * dt);
        piece.vy = (piece.vy + 440 * dt) * Math.exp(-.32 * dt);
        piece.x += (piece.vx + Math.sin(elapsed * piece.flutter + piece.phase) * 24) * dt;
        piece.y += piece.vy * dt;
        piece.angle += piece.spin * dt;
        if (piece.y > height + 40 && piece.vy > 0) continue;
        visible = true;
        const fold = Math.cos(elapsed * piece.flutter + piece.phase);
        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.angle);
        context.scale(1, fold * .85 + (fold >= 0 ? .15 : -.15));
        context.globalAlpha = Math.min(1, Math.max(0, 7 - elapsed));
        context.fillStyle = piece.color;
        context.beginPath();
        if (piece.ribbon) {
          // Bent paper strips, with a subtle shaded fold as they tumble.
          context.moveTo(-piece.width / 2, -piece.height / 2);
          context.lineTo(0, -piece.height / 3);
          context.lineTo(piece.width / 2, -piece.height / 2);
          context.lineTo(piece.width / 3, piece.height / 2);
          context.lineTo(-piece.width / 5, piece.height / 3);
          context.lineTo(-piece.width / 2, piece.height / 2);
          context.closePath();
        } else {
          context.rect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
        }
        context.fill();
        context.fillStyle = fold < 0 ? '#00000024' : '#ffffff20';
        context.fill();
        context.restore();
      }
      if (visible && elapsed < 7) frame = requestAnimationFrame(tick);
      else clear();
    };
    frame = requestAnimationFrame(tick);
    window.addEventListener('resize', resize);
    motion.addEventListener('change', stop);
    return () => {
      stop();
      window.removeEventListener('resize', resize);
      motion.removeEventListener('change', stop);
    };
  }, [open]);

  return <canvas ref={canvas} className={styles.confetti} aria-hidden="true"/>;
}
