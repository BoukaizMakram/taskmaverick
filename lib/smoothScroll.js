import { ScrollSmoother } from 'gsap/ScrollSmoother';

// Smoothly scroll a target below the fixed nav. Uses ScrollSmoother (desktop
// landing) when it's active — a native hash jump snaps abruptly under its
// transformed content — and falls back to native smooth scrolling otherwise.
// `target` may be a DOM element, an id ("use-cases"), or a selector ("#x").
// Pass `{ instant: true }` to jump immediately with no animated scroll — used
// for the industries in/out transitions, where an animated scroll visibly
// races the snap + observer ("two systems fighting").
// Returns false when the target isn't on the page (so callers can navigate).
export function smoothScrollTo(target, { instant = false } = {}) {
  const el =
    typeof target === 'string'
      ? target.startsWith('#') || target.includes(' ')
        ? document.querySelector(target)
        : document.getElementById(target)
      : target;
  if (!el) return false;

  const navH =
    parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 64;
  const smoother = ScrollSmoother.get();
  if (smoother) {
    // ScrollSmoother.scrollTo(y, smooth) — smooth:false snaps instantly.
    smoother.scrollTo(smoother.offset(el, 'top top') - navH, !instant);
  } else {
    el.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'start' });
  }
  return true;
}
