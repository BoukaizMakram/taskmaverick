'use client';

import { useLayoutEffect } from 'react';
import gsap from 'gsap';
import { BOARD_ACTIONS, BOARD_END, PRIORITY_BOOST, demoColumnMissions } from '@/lib/automationState.mjs';
import { PERSONAL_REVEAL, TEAM_REVEAL, easeInOut80 } from '@/lib/automationMotion.mjs';
import { TIMING, BOARD_PHASES, SCENES } from '@/lib/demoNarration.mjs';

const clamp = value => Math.max(0, Math.min(1, value));
// Zero velocity and acceleration at both ends prevents abrupt starts/stops.
const ease = value => { const p = clamp(value); return p * p * p * (10 + p * (-15 + 6 * p)); };
const mix = (a, b, p) => a + (b - a) * p;
const COLUMNS = ['open', 'claimed', 'closed'];
const APPROACH_DURATION = BOARD_PHASES.approach;

// Measure the real cards, then derive every pose from playback time. No delayed
// callbacks or independent animations can drift when playback pauses or seeks.
export default function useAutomationMotion({ time, state, root, tablet, avatars, codePanel, people, boardEnd = BOARD_END }) {
  useLayoutEffect(() => {
    const board = tablet.current;
    if (!board || !root.current) return;
    const featureScene = SCENES.find(scene => scene.feature && time >= scene.start && time < scene.end);
    const featureFocus = featureScene ? ease((time-featureScene.start)/.3) * (1-ease((time-featureScene.end+.25)/.25)) : 0;
    board.style.setProperty('--feature-focus', String(featureFocus));
    board.querySelectorAll('[data-mission-id]').forEach(card => {
      card.style.transform = '';
      card.style.position = '';
      card.style.zIndex = '';
      card.style.removeProperty('--demo-active-border');
    });
    board.querySelectorAll('.chip-performer-avatar').forEach(img => { img.style.visibility = ''; });
    if (codePanel.current) codePanel.current.style.opacity = '0';
    const action = state.action;
    // Finish lifting the spotlight as the card starts its transfer.
    const focus = action?.to === 'claimed' ? ease((time - action.start) / .32) * (1 - ease((time - action.confirm + .24) / .24)) : 0;
    const shade = board.querySelector('.mi-demo-shade');
    if (shade) shade.style.opacity = String(focus * .72);
    const caption = root.current.querySelector('.adx-lower-third');
    if (caption) caption.style.opacity = String(1 - focus * .72);
    const stars = root.current.querySelector('.ad-stars');
    if (stars) stars.style.opacity = String(1 - focus * .72);
    const stageRect = root.current.getBoundingClientRect();
    const stageScale = stageRect.width / 1600;
    const stagePoint = (x, y) => ({ x: (x - stageRect.left) / stageScale, y: (y - stageRect.top) / stageScale });
    const tabletRect = board.querySelector('.tbl-fit').getBoundingClientRect();
    const centerY = time < TIMING.claim
      ? 120 + board.querySelector('.tbl-fit').offsetHeight / 2 + TEAM_REVEAL.tabletY
      : stagePoint(0, tabletRect.top + tabletRect.height / 2).y;
    if (time < TIMING.claim) {
      people.forEach((person, i) => {
        const team = time >= TIMING.team;
        const pop = team
          ? clamp((time - TEAM_REVEAL.avatarAt - i * TEAM_REVEAL.avatarStagger) / TEAM_REVEAL.popDuration)
          : clamp((time - PERSONAL_REVEAL.crossfadeAt - i * PERSONAL_REVEAL.avatarStagger) / PERSONAL_REVEAL.crossfadeDuration);
        const popEase = 1 + 2.70158 * (pop - 1) ** 3 + 1.70158 * (pop - 1) ** 2;
        const position = team
          ? { x: TEAM_REVEAL.avatarX, y: centerY - 37 + (i - (people.length - 1) / 2) * 100 }
          : { x: (person.phoneX ?? 220) - 37, y: PERSONAL_REVEAL.avatarRestY };
        const appear = team || person.phoneX ? easeInOut80(pop) : 0;
        const visibility = !team ? 1 - ease((time - (TIMING.team - .4)) / .4) : 1;
        gsap.set(avatars.current[i], {
          ...position,
          scale: mix(.62, 1, popEase), autoAlpha: appear * visibility,
          transformOrigin: '50% 50%', filter: 'drop-shadow(0 6px 16px rgba(0,0,0,.35))',
        });
      });
      return;
    }
    const claims = BOARD_ACTIONS.filter(a => a.to === 'claimed');
    const remaining = at => people.map((_, i) => i).filter(i => !claims.some(a => a.person === i && at >= a.start + APPROACH_DURATION));
    const rail = (i, list) => ({ x: TEAM_REVEAL.avatarX, y: centerY - 37 + (list.indexOf(i) - (list.length - 1) / 2) * 100 });
    const fade = 1 - ease((time - boardEnd) / .6);
    const transfer = action ? ease((time - action.confirm) / (action.arrive - action.confirm)) : 0;
    const currentRail = remaining(time);

    people.forEach((_, i) => {
      let pos = rail(i, currentRail);
      if (action?.to === 'claimed' && time < action.start + APPROACH_DURATION && i !== action.person) {
        const after = remaining(action.start + APPROACH_DURATION);
        if (after.includes(i)) {
          const next = rail(i, after);
          const regroup = ease((time - action.start) / APPROACH_DURATION);
          pos = { x: mix(pos.x, next.x, regroup), y: mix(pos.y, next.y, regroup) };
        }
      }
      gsap.set(avatars.current[i], { ...pos, scale: 1, autoAlpha: currentRail.includes(i) ? fade * (1 - focus * .78) : 0, filter: 'drop-shadow(0 6px 16px rgba(0,0,0,.35))', transformOrigin: '0 0' });
    });
    if (!action) {
      if (time >= PRIORITY_BOOST.move && time < PRIORITY_BOOST.move + PRIORITY_BOOST.duration) {
        const column = board.querySelector('section[aria-label="open missions"] .mi-column-cards');
        const progress = ease((time - PRIORITY_BOOST.move) / PRIORITY_BOOST.duration);
        if (column) {
          let previousTop = column.getBoundingClientRect().top;
          const poses = state.missions.filter(m => m.status === 'open').map(m => {
            const card = board.querySelector(`[data-mission-id="${m.id}"]`);
            const rect = card.getBoundingClientRect();
            const scale = rect.width / card.offsetWidth;
            const dy = (previousTop - rect.top) / scale;
            previousTop += rect.height + (parseFloat(getComputedStyle(column).rowGap) || 0) * scale;
            return { card, dy, boosted: m.boosted };
          });
          poses.forEach(({ card, dy, boosted }) => {
            card.style.transform = `translateY(${dy * (1 - progress)}px)`;
            card.style.position = 'relative';
            card.style.zIndex = boosted ? '3' : '1';
          });
        }
      }
      return;
    }

    const mission = state.missions[action.mission];
    const card = board.querySelector(`[data-mission-id="${mission.id}"]`);
    const columns = board.querySelectorAll('.mi-column-cards');
    if (!card || !columns.length) return;
    const natural = card.getBoundingClientRect();
    const sourceColumn = columns[COLUMNS.indexOf(action.from)];
    const source = sourceColumn.getBoundingClientRect();
    // New claims enter at the top. When closing an older claim, preserve its
    // actual source row so it never jumps upward before traveling across.
    const beforeMissions = state.missions.map(m => m.id === mission.id ? { ...m, status: action.from, stopped: undefined } : m);
    const sourceMissions = demoColumnMissions(beforeMissions, action.from);
    const preceding = sourceMissions.slice(0, sourceMissions.findIndex(m => m.id === mission.id));
    const cardScale = natural.width / card.offsetWidth;
    const gap = (parseFloat(getComputedStyle(sourceColumn).rowGap) || 0) * cardScale;
    const sourceTop = source.top + preceding.reduce((height, m) => height + (board.querySelector(`[data-mission-id="${m.id}"]`)?.getBoundingClientRect().height ?? 0) + gap, 0);
    const moving = time >= action.confirm;
    if (moving && transfer < 1) {
      // Every affected stack settles together, including the card left behind
      // when the top claim closes. Positions remain deterministic when seeking.
      COLUMNS.forEach((status, columnIndex) => {
        let previousTop = columns[columnIndex].getBoundingClientRect().top;
        demoColumnMissions(beforeMissions, status).forEach(m => {
          const peer = board.querySelector(`[data-mission-id="${m.id}"]`);
          if (!peer) return;
          const peerRect = peer.getBoundingClientRect();
          if (m.id !== mission.id) peer.style.transform = `translateY(${(previousTop - peerRect.top) * (1 - transfer) / cardScale}px)`;
          previousTop += peerRect.height + gap;
        });
      });
    }
    const dx = moving ? (source.left - natural.left) * (1 - transfer) : 0;
    const dy = moving ? (sourceTop - natural.top) * (1 - transfer) : 0;
    card.style.position = 'relative';
    card.style.zIndex = '3';
    const borderOpacity = ease((time - action.start) / .15) * (1 - ease((time - action.arrive) / (action.end - action.arrive)));
    card.style.setProperty('--demo-active-border', `rgba(139, 92, 246, ${borderOpacity})`);
    card.style.transform = `translate(${dx / cardScale}px, ${dy / cardScale}px)`;

    const embedded = card.querySelector('.chip-performer-avatar');
    // Grip the mission's moving right edge, then dock in the performer slot
    // after the keypad disappears and the mission finishes its transfer.
    const bottom = card.querySelector('.chip-bottom').getBoundingClientRect();
    const slotRect = embedded?.getBoundingClientRect() ?? {
      left: bottom.left, top: bottom.bottom - 32 * cardScale, width: 32 * cardScale,
    };
    if (embedded) embedded.style.visibility = 'hidden';
    const slot = stagePoint(slotRect.left, slotRect.top);
    const slotScale = slotRect.width / stageScale / 74;
    const approach = ease((time - action.start) / (action.direct ? .42 : APPROACH_DURATION));
    if (action.direct) {
      const from = action.from === 'open' ? rail(action.person, remaining(action.start)) : slot;
      gsap.set(avatars.current[action.person], {
        x: mix(from.x, slot.x, approach), y: mix(from.y, slot.y, approach),
        scale: mix(action.from === 'open' ? 1 : slotScale, slotScale, approach),
        autoAlpha: fade, zIndex: 13,
        filter: `drop-shadow(0 6px 16px rgba(0,0,0,${.35 * (1 - approach)}))`,
      });
      return;
    }
    // Follow the mission's row while keeping the avatar at its right edge.
    const missionRect = card.getBoundingClientRect();
    const missionCenterY = stagePoint(0, missionRect.top + missionRect.height / 2).y;
    const waitingScale = .84;
    const waitingSize = 74 * waitingScale;
    const waiting = {
      x: stagePoint(missionRect.right, 0).x - 20,
      y: missionCenterY - waitingSize / 2,
    };
    const from = action.from === 'open' ? rail(action.person, remaining(action.start)) : slot;
    const fromScale = action.from === 'open' ? 1 : slotScale;
    const docking = ease((time - action.arrive) / (action.end - action.arrive));
    const pos = time < action.arrive ? {
      x: mix(from.x, waiting.x, approach),
      y: mix(from.y, waiting.y, approach),
    } : {
      x: mix(waiting.x, slot.x, docking),
      y: mix(waiting.y, slot.y, docking),
    };
    const shadowOpacity = .35 * approach * (1 - docking);
    gsap.set(avatars.current[action.person], {
      ...pos, autoAlpha: fade, zIndex: 13,
      scale: time < action.arrive ? mix(fromScale, waitingScale, approach) : mix(waitingScale, slotScale, docking),
      filter: `drop-shadow(0 6px 16px rgba(0,0,0,${shadowOpacity}))`,
    });

    if (state.showCode && codePanel.current) {
      const pop = ease((time - action.start - BOARD_PHASES.codeIn) / .12);
      const dismiss = ease((time - action.start - BOARD_PHASES.codeOut) / (BOARD_PHASES.codeHidden - BOARD_PHASES.codeOut));
      gsap.set(codePanel.current, {
        x: waiting.x + waitingSize / 2,
        y: waiting.y + waitingSize - 12,
        opacity: pop * (1 - dismiss), scale: mix(.94, 1, pop) - .03 * dismiss, transformOrigin: 'left top',
      });
    }
  }, [time, state, root, tablet, avatars, codePanel, people, boardEnd]);
}
