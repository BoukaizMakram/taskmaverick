import { TIMING } from './demoNarration.mjs';
export const PERSONAL_REVEAL = {
  crossfadeAt: TIMING.personal + .55,
  crossfadeDuration: .3,
  avatarStagger: .18,
  phoneMoveAt: TIMING.personal + 1.3,
  moveDuration: 1.05,
  avatarRestY: 90,
  phoneOriginY: -53,
  titleDrop: 373,
};

export const TEAM_REVEAL = {
  avatarAt: TIMING.team + .6,
  avatarStagger: .1,
  popDuration: .3,
  tabletAt: TIMING.sharing + 1.3,
  duration: .85,
  titleDrop: 373,
  tabletScale: 1.3,
  tabletX: 0,
  tabletY: -20,
  avatarX: 83,
  originY: -820,
};

// Move immediately, then decelerate gently into the final position.
export function easeOutArrival(progress) {
  const p = Math.max(0, Math.min(1, progress));
  return 1 - (1 - p) ** 4;
}

// Symmetric 80% ease influence: cubic-bezier(.8, 0, .2, 1).
// Share the same curve between GSAP and the seekable avatar poses.
export function easeInOut80(progress) {
  const p = Math.max(0, Math.min(1, progress));
  if (p === 0 || p === 1) return p;
  let low = 0, high = 1;
  for (let i = 0; i < 20; i++) {
    const t = (low + high) / 2;
    const x = 2.4 * (1 - t) * (1 - t) * t + .6 * (1 - t) * t * t + t * t * t;
    if (x < p) low = t; else high = t;
  }
  const t = (low + high) / 2;
  return t * t * (3 - 2 * t);
}
