'use client';

// ---------------------------------------------------------------------------
// QualityStoryboard — the /quality page. Ten "Improving Quality" scenes,
// recreated from the Figma "Assets for website animation" storyboard and
// animated with the mission-engine vocabulary (zoom in, circle/highlight,
// timers ticking, staggered reveals, content transitions). Each scene is a
// fixed 1280x720 .scene stage (scaled to its container) driven by its own
// looping GSAP timeline.
// ---------------------------------------------------------------------------

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import SceneCursor from '@/components/scenes/SceneCursor';
import {
  PhoneBezel,
  ChecklistStepsScreen,
  TranslateScreen,
  RatingScreen,
  AlertTicketScreen,
  CheckpointScreen,
  ProofFeedScreen,
  GalleryScreen,
} from '@/components/quality/parts';

const fmt = (s) => {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const GOLD = '#f5a623';
const GRAY = '#d7dce2';

const SCENES = [
  { id: 'steps', lines: ['Performers follow steps', 'to ensure precision'], hl: 'q-hl-steps', render: () => <ChecklistStepsScreen /> },
  { id: 'translate', lines: ['Content is instantly translated', 'upon pressing a button'], hl: 'q-hl-es', render: () => <TranslateScreen /> },
  { id: 'self-rate', lines: ['Self-ratings improve', 'personal accountability'], render: () => <RatingScreen variant="self" /> },
  { id: 'peer-rate', lines: ['Peer ratings can be used', 'to crowdsource quality control'], render: () => <RatingScreen variant="peer" /> },
  { id: 'alert', lines: ['Management can be alerted', 'when quality ratings are low'], render: () => <AlertTicketScreen /> },
  { id: 'capture', lines: ['Photos or videos can be taken', 'within checkpoints to confirm conditions'], render: () => <CheckpointScreen variant="capture" /> },
  { id: 'cloud', lines: ['The photos or videos', 'are not stored on the phone'], render: () => <CheckpointScreen variant="cloud" /> },
  { id: 'stamped', lines: ['They cannot be reused in a future instance —', 'the date and time are clearly stamped'], render: () => <CheckpointScreen variant="stamped" /> },
  { id: 'feed', lines: ['Browse through past audits', 'as if on social media'], render: () => <ProofFeedScreen /> },
  { id: 'gallery', lines: ['In the Gallery, review conditions', 'by mission, by person or by date'], render: () => <GalleryScreen /> },
];

// Real-time-ish counting pill (green or red). Returns nothing; drives text.
function tickPill(tl, el, startSec, at, dur = 12) {
  if (!el) return;
  const clock = { t: startSec };
  el.textContent = fmt(startSec);
  tl.to(clock, { t: startSec + dur, duration: dur, ease: 'none', onUpdate: () => (el.textContent = fmt(clock.t)) }, at);
}

function QScene({ scene, index }) {
  const root = useRef(null);

  useGSAP(
    () => {
      const r = root.current;
      const q = (s) => r.querySelector(s);
      const qa = (s) => Array.from(r.querySelectorAll(s));

      const device = q('.q-device');
      const caption = q('.q-caption');
      const reduce =
        typeof window !== 'undefined' &&
        (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
          window.location.search.includes('static'));

      // Caption + device intro are shared by every scene.
      gsap.set(caption, { autoAlpha: 0, y: 16 });
      gsap.set(device, { autoAlpha: 0, y: 18, scale: 0.965, transformOrigin: '50% 42%' });

      if (reduce) {
        gsap.set([caption, device], { autoAlpha: 1, y: 0, scale: 1 });
        return;
      }

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.1 });
      tl.to(device, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' }, 0.1)
        .to(caption, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power2.out' }, 0.35);

      switch (scene.id) {
        case 'steps': {
          const items = qa('.om-item');
          gsap.set(items, { autoAlpha: 0, x: -10 });
          items.forEach((it, i) =>
            tl.to(it, { autoAlpha: 1, x: 0, duration: 0.4, ease: 'power2.out' }, 0.7 + i * 0.16)
          );
          const grp = q('.om-checklist .om-grp');
          if (grp) tl.fromTo(grp, { boxShadow: '0 0 0 0px rgba(124,58,237,0)' }, { boxShadow: '0 0 0 2.5px #7c3aed', duration: 0.4 }, 0.7 + items.length * 0.16);
          tickPill(tl, q('.chip-pill'), 460, 0.1, 6);
          tl.to({}, { duration: 2 });
          break;
        }
        case 'translate': {
          const es = q('.q-lang-es');
          const enBtn = q('.q-lang-en .om-es');
          const hand = q('.q-hand');
          gsap.set(es, { autoAlpha: 0 });
          gsap.set(hand, { autoAlpha: 0, x: 250, y: 150, scale: 1 });
          tl.to(hand, { autoAlpha: 1, x: 196, y: 42, duration: 0.9, ease: 'power2.inOut' }, 1.0);
          if (enBtn) tl.to(enBtn, { scale: 0.86, duration: 0.12 }, 1.95).to(enBtn, { scale: 1, duration: 0.18, ease: 'back.out(3)' }, 2.07);
          tl.to(hand, { scale: 0.86, duration: 0.12 }, 1.95).to(hand, { scale: 1, duration: 0.18, ease: 'back.out(3)' }, 2.07);
          tl.to(es, { autoAlpha: 1, duration: 0.6, ease: 'power2.out' }, 2.15);
          tl.to(hand, { autoAlpha: 0, duration: 0.4 }, 2.6);
          tickPill(tl, q('.q-lang-es .chip-pill'), 460, 2.2, 6);
          tl.to({}, { duration: 2 });
          break;
        }
        case 'self-rate': {
          const stars = qa('.q-stars svg');
          gsap.set(stars, { fill: GRAY, scale: 0.6, transformOrigin: '50% 50%' });
          stars.slice(0, 4).forEach((st, i) =>
            tl.to(st, { fill: GOLD, scale: 1, duration: 0.3, ease: 'back.out(2.4)' }, 0.9 + i * 0.22)
          );
          tl.to(stars[4], { scale: 1, duration: 0.3, ease: 'power2.out' }, 0.9);
          tl.to({}, { duration: 2 });
          break;
        }
        case 'peer-rate': {
          const peers = qa('.q-peer');
          gsap.set(peers, { autoAlpha: 0, x: -12 });
          peers.forEach((p, i) => {
            const st = p.querySelectorAll('.q-mini-star.is-on');
            gsap.set(st, { fill: GRAY });
            tl.to(p, { autoAlpha: 1, x: 0, duration: 0.4, ease: 'power2.out' }, 0.9 + i * 0.3);
            st.forEach((s, j) => tl.to(s, { fill: GOLD, duration: 0.14 }, 1.1 + i * 0.3 + j * 0.06));
          });
          tl.to({}, { duration: 1.8 });
          break;
        }
        case 'alert': {
          const rule = q('.q-hl-rule');
          if (rule) tl.fromTo(rule, { scale: 1 }, { scale: 1.04, duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: 3, transformOrigin: '10% 50%' }, 1.2);
          tickPill(tl, q('.q-pill-red'), 460, 0.1, 8);
          tl.to({}, { duration: 2 });
          break;
        }
        case 'capture': {
          const flash = q('.q-flash');
          const photo = q('.q-photo');
          const btn = q('.q-capture.q-hl-btn');
          gsap.set(photo, { autoAlpha: 0, scale: 1.06 });
          if (btn) tl.fromTo(btn, { boxShadow: '0 0 0 0 rgba(124,58,237,0)' }, { boxShadow: '0 0 0 3px #7c3aed, 0 0 0 6px rgba(124,58,237,0.28)', duration: 0.3, yoyo: true, repeat: 1 }, 1.0);
          tl.set(flash, { autoAlpha: 0 }, 1.6)
            .to(flash, { autoAlpha: 0.9, duration: 0.08 }, 1.6)
            .to(flash, { autoAlpha: 0, duration: 0.4 }, 1.7)
            .to(photo, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power2.out' }, 1.66);
          tl.to({}, { duration: 2 });
          break;
        }
        case 'cloud': {
          const badge = q('.q-photo-badge');
          if (badge) {
            gsap.set(badge, { scale: 0.4, autoAlpha: 0, transformOrigin: '50% 50%' });
            tl.to(badge, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(2.5)' }, 1.2)
              .to(badge, { y: -6, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: 3 }, 1.8);
          }
          tl.to({}, { duration: 2.4 });
          break;
        }
        case 'stamped': {
          const stamp = q('.q-photo-stamp');
          const lock = q('.q-photo-badge--lock');
          if (stamp) {
            gsap.set(stamp, { autoAlpha: 0, scale: 1.7, rotate: -4, transformOrigin: '50% 50%' });
            tl.to(stamp, { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.45, ease: 'back.out(2)' }, 1.3);
          }
          if (lock) {
            gsap.set(lock, { scale: 0.4, autoAlpha: 0 });
            tl.to(lock, { scale: 1, autoAlpha: 1, duration: 0.4, ease: 'back.out(2.5)' }, 1.7);
          }
          tl.to({}, { duration: 2.2 });
          break;
        }
        case 'feed': {
          const posts = qa('.q-post');
          const feed = q('.q-feed');
          gsap.set(posts, { autoAlpha: 0, y: 20 });
          posts.forEach((p, i) => tl.to(p, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.8 + i * 0.35));
          if (feed) tl.to(feed, { y: -70, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 2.2);
          tl.to({}, { duration: 1.4 });
          break;
        }
        case 'gallery': {
          const tiles = qa('.q-grid .q-photo');
          const filters = qa('.q-filter');
          gsap.set(tiles, { autoAlpha: 0, scale: 0.7, transformOrigin: '50% 50%' });
          tiles.forEach((t, i) => tl.to(t, { autoAlpha: 1, scale: 1, duration: 0.32, ease: 'back.out(2)' }, 0.8 + i * 0.08));
          // cycle the active filter chip
          filters.forEach((f, i) => {
            tl.to(f, { backgroundColor: '#1271b7', color: '#fff', duration: 0.2 }, 1.9 + i * 0.6);
            if (i > 0) tl.to(filters[i - 1], { backgroundColor: '#eef1f5', color: '#4a5560', duration: 0.2 }, 1.9 + i * 0.6);
          });
          tl.to({}, { duration: 1.4 });
          break;
        }
        default:
          tl.to({}, { duration: 2.5 });
      }
    },
    { scope: root }
  );

  const extras =
    scene.id === 'translate' ? <div className="q-hand" aria-hidden="true"><SceneCursor /></div> :
    scene.id === 'capture' ? <span className="q-flash" aria-hidden="true" /> :
    null;

  return (
    <section className="q-stage" ref={root} aria-label={scene.lines.join(' ')}>
      <div className="scene">
        <div className="dots-bg" aria-hidden="true">
          <i className="d1" />
          <i className="d2" />
        </div>

        <span className="q-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>

        <div className={`q-device ${scene.hl || ''}`}>
          <PhoneBezel width={282}>{scene.render()}</PhoneBezel>
          {extras}
        </div>

        <p className="lower-third q-caption">
          <span>{scene.lines[0]}</span>
          {scene.lines[1] ? <span>{scene.lines[1]}</span> : null}
        </p>
      </div>
    </section>
  );
}

export default function QualityStoryboard() {
  return (
    <div className="q-storyboard">
      {SCENES.map((s, i) => (
        <QScene key={s.id} scene={s} index={i} />
      ))}
    </div>
  );
}
