'use client';

// ---------------------------------------------------------------------------
// Feature scene: "Train people while they work".
// The real Media "Mission Details" (a training video + quizzes) opens inside the
// phone; a hand cursor taps the video. Reuses the OpenedMission product UI. Loops.
// ---------------------------------------------------------------------------

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import OpenedMissionPhone from '@/components/OpenedMission';
import SceneCursor from '@/components/scenes/SceneCursor';

const TRAIN_MISSION = {
  id: 'train-media',
  type: 'Media',
  title: 'Safety Training',
  points: 50,
  location: '',
  postedBy: 'Julian D',
  claimer: 'Anna F. - Staff',
  date: '07-09-26',
  time: '04:07 PM',
  pillTime: '00:07:00',
  pillClass: 'chip--green',
  description: 'Watch the short training and answer the quizzes.',
  notice: 'Complete before your next shift',
  headerRight: 'es-menu',
  estimated: '05:00',
  initialState: 'open',
  contents: [
    { n: 1, label: 'Training Video', kind: 'video', meta: '01:00' },
    { label: 'Quiz-1', kind: 'quiz', meta: 'n/a', sub: true },
    { label: 'Quiz-2', kind: 'quiz', meta: 'n/a', sub: true },
  ],
};

export default function TrainScene() {
  const root = useRef(null);
  const caption = useRef(null);
  const hand = useRef(null);

  useGSAP(
    () => {
      const sceneEl = root.current.querySelector('.scene');
      const phone = root.current.querySelector('.scene-trainphone');
      const firstRow = root.current.querySelector('.om-mrow');

      // where the hand should tap (the video row), in scene design px
      let tapX = 640;
      let tapY = 430;
      if (sceneEl && firstRow) {
        const sr = sceneEl.getBoundingClientRect();
        const sc = sr.width / 1280 || 1;
        const r = firstRow.getBoundingClientRect();
        tapX = (r.left + r.width / 2 - sr.left) / sc;
        tapY = (r.top + r.height / 2 - sr.top) / sc;
      }

      gsap.set(phone, { autoAlpha: 0, y: 24, scale: 0.97 });
      gsap.set(caption.current, { autoAlpha: 0, y: 24 });
      gsap.set(hand.current, { autoAlpha: 0, x: tapX + 120, y: tapY + 170 });

      const END = 7.6;
      const t = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });

      t.call(() => {
        gsap.set(phone, { autoAlpha: 0, y: 24, scale: 0.97 });
        gsap.set(caption.current, { autoAlpha: 0, y: 24 });
        gsap.set(hand.current, { autoAlpha: 0, x: tapX + 120, y: tapY + 170 });
      }, null, 0);

      t.to(phone, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' }, 0.3);
      t.to(caption.current, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 1.5);

      // hand moves to the training video and taps
      t.to(hand.current, { autoAlpha: 1, duration: 0.3 }, 2.1);
      t.to(hand.current, { x: tapX + 6, y: tapY + 4, duration: 0.85, ease: 'power2.inOut' }, 2.1);
      t.to(hand.current, { scale: 0.82, duration: 0.12, ease: 'power2.in' }, 3.0)
        .to(hand.current, { scale: 1, duration: 0.18, ease: 'back.out(3)' }, 3.12);
      t.to(hand.current, { autoAlpha: 0, duration: 0.4 }, 4.1);

      t.to([phone, caption.current], { autoAlpha: 0, duration: 0.55, ease: 'power2.in' }, END - 0.55);
    },
    { scope: root }
  );

  return (
    <div className="scene-fit" ref={root}>
      <div className="scene">
        <div className="dots-bg" aria-hidden="true"><i className="d1" /><i className="d2" /></div>

        <div className="scene-trainphone">
          <OpenedMissionPhone mission={TRAIN_MISSION} />
        </div>

        <div className="scene-hand" ref={hand} aria-hidden="true"><SceneCursor /></div>

        <p className="lower-third" ref={caption}>Train people while they work</p>
      </div>
    </div>
  );
}
