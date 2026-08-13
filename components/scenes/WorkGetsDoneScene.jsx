'use client';

// ---------------------------------------------------------------------------
// Feature scene: "Work Gets Done Automatically".
// A single mission's whole lifecycle, driven inside the same phone with a cursor
// that moves to where it clicks and captions that follow the action:
//   Open board -> open the mission -> Claim it -> back to the Claimed board (now
//   with the execution timer + performer) -> open it again -> Close it -> back to
//   the Closed board (gray timers, stopped). Loops. Reuses the real OpenedMission
//   + MissionChip + PhoneShell UI (no new UI).
// ---------------------------------------------------------------------------

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import PhoneShell from '@/components/PhoneShell';
import MissionChip from '@/components/MissionChip';
import { OpenedMission } from '@/components/OpenedMission';
import SceneCursor from '@/components/scenes/SceneCursor';

// The mission that travels through the lifecycle (real Checklist detail).
const MISSION = {
  id: 'lifecycle',
  type: 'Checklist',
  title: 'Inventory Check',
  points: 10,
  location: '',
  postedBy: 'Julian D',
  claimer: 'Anna F. - Staff',
  claimedWho: 'Anna F. - Staff',
  date: '07-09-26',
  time: '04:07 PM',
  pillTime: '00:07:53',
  pillClass: 'chip--green',
  headerRight: 'es-undo',
  claimedFooter: { label: 'Close', variant: 'muted' },
  sectionTitle: 'Checklist',
  groups: [
    {
      title: 'Shelf',
      tone: 'yellow',
      items: [
        { n: 1, label: 'Item A', value: 130 },
        { n: 2, label: 'Item B', value: 5 },
        { n: 3, label: 'Item C', value: 110 },
      ],
    },
  ],
};

const TABS = (tab) => [
  { label: `Open - ${tab === 'open' ? 1 : 0}`, active: tab === 'open' },
  { label: `Claimed - ${tab === 'claimed' ? 1 : 0}`, active: tab === 'claimed' },
  { label: `Closed - ${tab === 'closed' ? 1 : 0}`, active: tab === 'closed' },
];

// The board's single mission chip, shown per lifecycle state.
function BoardChip({ tab }) {
  if (tab === 'open') {
    return <MissionChip kind="Checklist" points={10} title="Inventory Check" date="07-09-26" time="04:07 PM" pillTime="00:07:53" />;
  }
  if (tab === 'claimed') {
    return (
      <MissionChip kind="Checklist" points={10} title="Inventory Check" who="Anna F. - Staff" date="07-09-26" time="04:07 PM" showExec execTime="00:01:12" pillTime="00:09:41" />
    );
  }
  return (
    <MissionChip kind="Checklist" points={10} title="Inventory Check" who="Anna F. - Staff" date="07-09-26" time="04:07 PM" showExec execTime="00:03:40" pillTime="00:13:22" pillClass="chip--gray" />
  );
}

export default function WorkGetsDoneScene() {
  const root = useRef(null);
  const caption = useRef(null);
  const hand = useRef(null);
  const [boardTab, setBoardTab] = useState('open');
  const [detailState, setDetailState] = useState('open');

  useGSAP(
    () => {
      const sceneEl = root.current.querySelector('.scene');
      const board = root.current.querySelector('.ph-board');
      const overlay = root.current.querySelector('.ph-overlay');

      // Measure cursor targets (scene design px): the board mission card + the
      // detail footer button.
      const toScene = (el) => {
        const sr = sceneEl.getBoundingClientRect();
        const sc = sr.width / 1280 || 1;
        const r = el.getBoundingClientRect();
        return { x: (r.left + r.width / 2 - sr.left) / sc, y: (r.top + r.height / 2 - sr.top) / sc };
      };
      const cardEl = root.current.querySelector('.ph-board .chip');
      const btnEl = root.current.querySelector('.ph-overlay .om-cta');
      const card = cardEl ? toScene(cardEl) : { x: 640, y: 250 };
      const btn = btnEl ? toScene(btnEl) : { x: 640, y: 640 };
      const parkX = card.x + 180;
      const parkY = card.y + 220;

      const setCap = (at, text) =>
        t.to(caption.current, { autoAlpha: 0, y: -12, duration: 0.3, ease: 'power2.in' }, at)
          .call(() => (caption.current.textContent = text), null, at + 0.31)
          .to(caption.current, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }, at + 0.33);
      const tap = (at) =>
        t.to(hand.current, { scale: 0.8, duration: 0.1, ease: 'power2.in' }, at)
          .to(hand.current, { scale: 1, duration: 0.16, ease: 'back.out(3)' }, at + 0.1);

      const t = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });

      // ---- reset ----
      t.call(() => {
        setBoardTab('open');
        setDetailState('open');
        gsap.set(board, { autoAlpha: 1 });
        gsap.set(overlay, { autoAlpha: 0 });
        gsap.set(hand.current, { autoAlpha: 0, x: parkX, y: parkY, scale: 1 });
        gsap.set(caption.current, { autoAlpha: 0, y: 24 });
        caption.current.textContent = 'A mission starts in the Open board';
      }, null, 0);

      // intro caption
      t.to(caption.current, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.4);

      // ---- open the mission ----
      setCap(1.4, 'Open it');
      t.to(hand.current, { autoAlpha: 1, duration: 0.3 }, 1.5);
      t.to(hand.current, { x: card.x, y: card.y, duration: 0.8, ease: 'power2.inOut' }, 1.5);
      tap(2.35);
      t.to(board, { autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, 2.6)
        .to(overlay, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, 2.75);

      // ---- claim it (cursor moves down to the Claim button) ----
      setCap(3.2, 'Claim it');
      t.to(hand.current, { x: btn.x, y: btn.y, duration: 0.9, ease: 'power2.inOut' }, 3.3);
      tap(4.25);
      t.call(() => setDetailState('claimed'), null, 4.45); // exec timer + performer appear; button -> Close

      // ---- back to the board — now Claimed ----
      t.to(overlay, { autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, 5.1);
      t.call(() => setBoardTab('claimed'), null, 5.35);
      t.to(hand.current, { autoAlpha: 0, duration: 0.3 }, 5.1);
      t.to(board, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, 5.5);
      setCap(5.5, "It's Claimed — performer and a running execution timer");

      // ---- open it again to close ----
      setCap(7.3, 'Open it again to finish');
      t.to(hand.current, { autoAlpha: 1, x: parkX, y: parkY, duration: 0.01 }, 7.4)
        .to(hand.current, { x: card.x, y: card.y, duration: 0.8, ease: 'power2.inOut' }, 7.45);
      tap(8.3);
      t.call(() => setDetailState('claimed'), null, 8.4);
      t.to(board, { autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, 8.55)
        .to(overlay, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, 8.7);

      // ---- close it (cursor to the Close button) ----
      setCap(9.2, 'Close it');
      t.to(hand.current, { x: btn.x, y: btn.y, duration: 0.9, ease: 'power2.inOut' }, 9.3);
      tap(10.25);
      t.call(() => setDetailState('closed'), null, 10.45); // pill snaps gray, timers freeze

      // ---- back to the board — now Closed ----
      t.to(overlay, { autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, 11.1);
      t.call(() => setBoardTab('closed'), null, 11.35);
      t.to(hand.current, { autoAlpha: 0, duration: 0.3 }, 11.1);
      t.to(board, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, 11.5);
      setCap(11.5, "Closed — timers stopped, work is done");

      // hold, then loop
      t.to({}, { duration: 1.6 }, 12.2);
    },
    { scope: root }
  );

  return (
    <div className="scene-fit" ref={root}>
      <div className="scene">
        <div className="dots-bg" aria-hidden="true"><i className="d1" /><i className="d2" /></div>

        <div className="scene-fullphone">
          <div className="ph-fit">
            <PhoneShell
              title="Team Board"
              tabs={TABS(boardTab)}
              overlay={<OpenedMission mission={MISSION} state={detailState} showExec={detailState !== 'open'} />}
            >
              <BoardChip tab={boardTab} />
            </PhoneShell>
          </div>
        </div>

        <div className="scene-hand" ref={hand} aria-hidden="true"><SceneCursor /></div>

        <p className="lower-third" ref={caption}>A mission starts in the Open board</p>
      </div>
    </div>
  );
}
