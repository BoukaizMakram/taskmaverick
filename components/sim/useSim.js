'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

// Read the simulator store (lib/sim/store.mjs) from React.
export function useSim(store) {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

// Wall clock for the live timers (one tick per second, real time).
export function useNow(interval = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, interval);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [interval]);
  return now;
}

// Timers depend on the wall clock, so render only after mount (no SSR mismatch).
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
