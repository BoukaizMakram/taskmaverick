'use client';

// Reusable GSAP ScrollSmoother wrapper for standalone content pages. Renders the
// required #smooth-wrapper / #smooth-content structure and enables inertia-based
// smooth scrolling on desktop only (the nav lives outside, so globals.css pins
// it via `.page:has(#smooth-wrapper) .nav`). Transparent on mobile / reduced
// motion — just two nested divs, native scroll.
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

export default function SmoothScroll({ children }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', () => {
      const smoother = ScrollSmoother.create({
        wrapper: '#smooth-wrapper',
        content: '#smooth-content',
        smooth: 1.6,
        ease: 'power4.out',
        smoothTouch: 0,
        effects: true,
        normalizeScroll: true,
        ignoreMobileResize: true,
      });
      return () => smoother.kill();
    });
    return () => mm.revert();
  }, []);

  return (
    <div id="smooth-wrapper">
      <div id="smooth-content">{children}</div>
    </div>
  );
}
