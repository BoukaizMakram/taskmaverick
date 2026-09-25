'use client';
import { useEffect, useRef, useState } from 'react';
import { DEMO_LENGTH } from '@/lib/demoNarration.mjs';

// A single visual clock drives the silent demo, including pause and seeking.
export default function useDemoPlayback(duration = DEMO_LENGTH) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const clock = useRef(0);
  const commit = value => { clock.current = value; setTime(value); };

  useEffect(() => {
    if (clock.current > duration) { commit(duration); setPlaying(false); }
  }, [duration]);

  useEffect(() => {
    if (!playing) return;
    let frame, last = performance.now();
    const tick = now => {
      const next = Math.min(duration, clock.current + Math.min((now - last) / 1000, .1) * speed);
      last = now;
      commit(next);
      if (next >= duration) { setPlaying(false); return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, duration]);

  useEffect(() => {
    const hide = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, []);

  const replay = () => { commit(0); setPlaying(true); };
  const toggle = () => {
    if (clock.current >= duration) { replay(); return; }
    setPlaying(value => !value);
  };
  const seek = event => { setPlaying(false); commit(Math.max(0,Math.min(duration,Number(event.target.value)))); };
  const cycleSpeed = () => setSpeed(value => value === 3 ? 1 : value + 1);
  return { time, playing, speed, replay, toggle, seek, cycleSpeed };
}
