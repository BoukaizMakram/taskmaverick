'use client';

import { useLayoutEffect } from 'react';
import gsap from 'gsap';
import { BOARD_ACTIONS, BOARD_END, PRIORITY_BOOST, demoColumnMissions, avatarRailAt } from '@/lib/automationState.mjs';
import { PERSONAL_REVEAL, TEAM_REVEAL, easeInOut80 } from '@/lib/automationMotion.mjs';
import { TIMING, BOARD_PHASES, SCENES } from '@/lib/demoNarration.mjs';

const clamp = value => Math.max(0, Math.min(1, value));
// Zero velocity and acceleration at both ends prevents abrupt starts/stops.
const ease = value => { const p = clamp(value); return p * p * p * (10 + p * (-15 + 6 * p)); };
const easeOut = value => 1 - (1 - clamp(value)) ** 3;
const mix = (a, b, p) => a + (b - a) * p;
const arc = (from,to,p,height) => ({x:mix(from.x,to.x,p),y:mix(from.y,to.y,p)-Math.sin(Math.PI*p)*height});
const claimCurve=(from,to,p)=>{
  const q=1-p;
  return {x:q*q*q*from.x+3*q*q*p*(from.x+35)+3*q*p*p*(to.x-90)+p*p*p*to.x,
    y:q*q*q*from.y+3*q*q*p*(from.y-135)+3*q*p*p*(to.y-85)+p*p*p*to.y};
};
// Leave the mission downward, then sweep along the bottom into the avatar rail.
const returnCurve=(from,to,p)=>{
  const q=1-p;
  return {
    x:q*q*q*from.x+3*q*q*p*from.x+3*q*p*p*mix(from.x,to.x,.25)+p*p*p*to.x,
    y:q*q*q*from.y+3*q*q*p*mix(from.y,to.y,.8)+3*q*p*p*to.y+p*p*p*to.y,
  };
};
const COLUMNS = ['open', 'claimed', 'closed'];
const APPROACH_DURATION = BOARD_PHASES.approach;

// Reorder the actual card elements on either device, using playback time so
// pause, reverse seeking, and replay all produce the same positions.
function animatePriority(surface, column, time, missions) {
  if (!surface || !column) return;
  const cards = surface.querySelectorAll('[data-mission-id]');
  cards.forEach(card => { card.style.transform = ''; card.style.position = ''; card.style.zIndex = ''; });
  if (time < PRIORITY_BOOST.move || time >= PRIORITY_BOOST.move + PRIORITY_BOOST.duration) return;
  const progress = ease((time - PRIORITY_BOOST.move) / PRIORITY_BOOST.duration);
  let previousTop = column.getBoundingClientRect().top;
  const poses = missions.filter(m => m.status === 'open').map(m => {
    const card = surface.querySelector(`[data-mission-id="${m.id}"]`);
    if (!card) return null;
    const rect = card.getBoundingClientRect();
    const scale = rect.width / card.offsetWidth;
    const dy = (previousTop - rect.top) / scale;
    previousTop += rect.height + (parseFloat(getComputedStyle(column).rowGap) || 0) * scale;
    return { card, dy, boosted: m.boosted };
  });
  poses.filter(Boolean).forEach(({card, dy, boosted}) => {
    card.style.transform = `translateY(${dy * (1 - progress)}px)`;
    card.style.position = 'relative';
    card.style.zIndex = boosted ? '3' : '1';
  });
}

// Measure the real cards, then derive every pose from playback time. No delayed
// callbacks or independent animations can drift when playback pauses or seeks.
export default function useAutomationMotion({ time, state, root, tablet, avatars, codePanel, people, boardEnd = BOARD_END, highlightMode = 'spotlight', avatarChoreography = 'default', actions = BOARD_ACTIONS, avatarRailPose = null, codePanelScale = 1 }) {
  useLayoutEffect(() => {
    const board = tablet.current;
    if (!board || !root.current) return;
    const featureScene = SCENES.find(scene => scene.feature && time >= scene.start && time < scene.end);
    const featureFocus = featureScene ? ease((time-featureScene.start)/.3) * (1-ease((time-featureScene.end+.25)/.25)) : 0;
    board.style.setProperty('--feature-focus', String(featureFocus));
    const phone = root.current.querySelector('.adx-feature-phone');
    if (phone) {
      phone.style.setProperty('--feature-focus', String(featureFocus));
      animatePriority(phone, phone.querySelector('.mi-phone-cards'), time, state.missions);
    }
    board.querySelectorAll('[data-mission-id]').forEach(card => {
      card.style.transform = '';
      card.style.position = '';
      card.style.zIndex = '';
      card.style.removeProperty('--demo-active-border');
    });
    board.querySelectorAll('.chip-performer-avatar').forEach(img => { img.style.visibility = ''; });
    const callout = board.querySelector('.adx-feature-callout');
    if (callout && featureScene) {
      const section = board.querySelector(`section[aria-label="${featureScene.feature} missions"]`);
      const copy = board.querySelector('.adx-feature-caption p');
      const targets = section?.querySelectorAll('.tbl-tab, [data-mission-id]');
      if (copy && targets?.length) {
        const bounds = board.getBoundingClientRect();
        const scale = bounds.width / board.offsetWidth;
        const rects = [...targets].map(node => node.getBoundingClientRect());
        const x = (Math.min(...rects.map(rect => rect.left)) - bounds.left) / scale - 6;
        const y = (Math.min(...rects.map(rect => rect.top)) - bounds.top) / scale - 6;
        const width = (Math.max(...rects.map(rect => rect.right)) - bounds.left) / scale + 6 - x;
        const height = (Math.max(...rects.map(rect => rect.bottom)) - bounds.top) / scale + 6 - y;
        const textRange = document.createRange();
        textRange.selectNodeContents(copy);
        const text = textRange.getBoundingClientRect();
        const closed = featureScene.feature === 'closed';
        const startX = ((closed ? text.right : text.left + text.width / 2) - bounds.left) / scale + (closed ? 10 : 0);
        const startY = ((closed ? text.top + text.height / 2 : text.top) - bounds.top) / scale - (closed ? 0 : 8);
        const endX = closed ? x - 3 : x + width / 2;
        const endY = closed ? Math.min(y + height - 12, Math.max(y + 12, startY)) : y + height + 3;
        const arrow = callout.querySelector('[data-callout-arrow]');
        arrow.setAttribute('d', `M ${startX} ${startY} L ${endX} ${endY}`);
        const head = callout.querySelector('[data-callout-head]');
        const angle = Math.atan2(endY - startY, endX - startX);
        const backX = endX - 6 * Math.cos(angle);
        const backY = endY - 6 * Math.sin(angle);
        const sideX = 4 * Math.sin(angle);
        const sideY = 4 * Math.cos(angle);
        head.setAttribute('d', `M ${backX + sideX} ${backY - sideY} L ${endX} ${endY} L ${backX - sideX} ${backY + sideY}`);
        const ring = callout.querySelector('[data-callout-ring]');
        Object.entries({ x, y, width, height }).forEach(([key, value]) => ring.setAttribute(key, String(value)));
        const elapsed = time - featureScene.start;
        const arrowProgress = ease((elapsed - .15) / .45);
        const ringProgress = ease((elapsed - .6) / .45);
        arrow.style.strokeDasharray = '1';
        arrow.style.strokeDashoffset = String(1 - arrowProgress);
        head.style.opacity = String(arrowProgress);
        ring.style.strokeDasharray = '1';
        ring.style.strokeDashoffset = String(1 - ringProgress);
        callout.style.opacity = String(featureFocus);
      }
    }
    if (codePanel.current) codePanel.current.style.opacity = '0';
    const action = state.action;
    const moveEase=avatarChoreography==='highlight'?easeOut:ease;
    // Finish lifting the spotlight as the card starts its transfer.
    const focus = highlightMode === 'spotlight' && action?.to === 'claimed' ? ease((time - action.start) / .32) * (1 - ease((time - action.confirm + .24) / .24)) : 0;
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
    // Intro avatars use the device's destination, so they can appear before it.
    const railBottom=avatarRailPose
      ? 120+board.querySelector('.tbl-fit').offsetHeight/2+avatarRailPose.y+board.querySelector('.tbl-fit').offsetHeight*avatarRailPose.scale/2
      : stagePoint(0,tabletRect.bottom).y;
    const railLeft=avatarRailPose?800+avatarRailPose.x-board.offsetWidth*avatarRailPose.scale/2:stagePoint(tabletRect.left,0).x;
    const railY=(index,count)=>avatarChoreography==='highlight'
      ? railBottom-142-(count-1-index)*100
      : centerY-37+(index-(count-1)/2)*100;
    const railX=avatarChoreography==='highlight'?railLeft-102:TEAM_REVEAL.avatarX;
    if (time < TIMING.claim) {
      people.forEach((person, i) => {
        const team = time >= TIMING.team;
        const pop = team
          ? clamp((time - TEAM_REVEAL.avatarAt - i * TEAM_REVEAL.avatarStagger) / (avatarChoreography==='highlight'?.5:TEAM_REVEAL.popDuration))
          : clamp((time - PERSONAL_REVEAL.crossfadeAt - i * PERSONAL_REVEAL.avatarStagger) / PERSONAL_REVEAL.crossfadeDuration);
        const popEase = avatarChoreography==='highlight'?ease(pop):1 + 2.70158 * (pop - 1) ** 3 + 1.70158 * (pop - 1) ** 2;
        const position = team
          ? { x: railX, y: railY(i,people.length) }
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
    // Claims leave the rail; completed missions return their performer to its
    // bottom. Appending there lets the other teammates settle upward.
    const remaining = at => avatarRailAt(at, people.length, actions);
    const rail = (i, list) => ({ x: railX, y: railY(list.indexOf(i),list.length) });
    const fade = 1 - ease((time - boardEnd) / .6);
    const transfer = action ? moveEase((time - action.confirm) / (action.arrive - action.confirm)) : 0;
    const currentRail = remaining(time);

    people.forEach((_, i) => {
      let pos = rail(i, currentRail);
      if (action?.to === 'claimed' && time < action.start + APPROACH_DURATION && i !== action.person) {
        const after = remaining(action.start + APPROACH_DURATION);
        if (after.includes(i)) {
          const next = rail(i, after);
          const regroup = moveEase((time - action.start) / APPROACH_DURATION);
          pos = { x: mix(pos.x, next.x, regroup), y: mix(pos.y, next.y, regroup) };
        }
      }
      if (action?.to === 'closed' && i !== action.person) {
        const after = [...remaining(action.start), action.person];
        const next = rail(i, after);
        const regroup = moveEase(action.returnProgress!=null?(action.returnProgress-.75)/.25:(time - (action.end - .3)) / .3);
        pos = { x: mix(pos.x, next.x, regroup), y: mix(pos.y, next.y, regroup) };
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
    const borderOpacity = highlightMode === 'outline'
      ? ease((time - action.start) / .65) * ease((action.end - time) / .65)
      : ease((time - action.start) / .15) * (1 - ease((time - action.arrive) / (action.end - action.arrive)));
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
    const missionRect = card.getBoundingClientRect();
    const missionCenterY = stagePoint(0, missionRect.top + missionRect.height / 2).y;
    const waitingScale = .84;
    const waitingSize = 74 * waitingScale;
    const waiting = {
      x: stagePoint(missionRect.right, 0).x - 20,
      y: missionCenterY - waitingSize / 2,
    };
    if (state.showCode && codePanel.current) {
      const pop = ease((time - action.start - BOARD_PHASES.codeIn) / .12);
      const dismiss = ease((time - action.start - BOARD_PHASES.codeOut) / (BOARD_PHASES.codeHidden - BOARD_PHASES.codeOut));
      gsap.set(codePanel.current, {
        x: waiting.x + waitingSize / 2,
        y: waiting.y + waitingSize - 12,
        opacity: pop * (1 - dismiss), scale: codePanelScale * (mix(.94, 1, pop) - .03 * dismiss), transformOrigin: 'left top',
      });
    }
    const approach = moveEase((time - action.start) / (avatarChoreography==='highlight'?.75:action.direct ? .42 : APPROACH_DURATION));
    if (action.to === 'closed') {
      // Only the code-assisted close moves to the card's right edge. Direct
      // closes stay in the performer slot before returning to the rail.
      const sourceWaiting = {
        x: stagePoint(missionRect.right + (source.left - natural.left) * transfer, 0).x - 20,
        y: stagePoint(0, missionRect.top + missionRect.height / 2 + (sourceTop - natural.top) * transfer).y - waitingSize / 2,
      };
      const sourceSlot = stagePoint(
        bottom.left + (source.left - natural.left) * transfer,
        bottom.top + (sourceTop - natural.top) * transfer,
      );
      const returnOrigin = action.direct ? sourceSlot : sourceWaiting;
      const sourceScale = action.direct ? slotScale : waitingScale;
      const destination = rail(action.person, [...remaining(action.start), action.person]);
      const returning = moveEase(action.returnProgress??((time - action.confirm) / (action.end - action.confirm)));
      const pos = avatarChoreography==='highlight'
        ? (time<action.confirm?arc(slot,returnOrigin,approach,action.direct?0:45):returnCurve(returnOrigin,destination,returning))
        : time < action.confirm
          ? { x: mix(slot.x, returnOrigin.x, approach), y: mix(slot.y, returnOrigin.y, approach) }
          : { x: mix(returnOrigin.x, destination.x, returning), y: mix(returnOrigin.y, destination.y, returning) };
      gsap.set(avatars.current[action.person], {
        ...pos, scale: time < action.confirm
          ? mix(slotScale, sourceScale, approach)
          : mix(sourceScale, 1, returning),
        autoAlpha: fade, zIndex: 13,
        filter: `drop-shadow(0 6px 16px rgba(0,0,0,${.35 * (action.direct ? returning : approach)}))`,
      });
      return;
    }
    if(avatarChoreography==='highlight'&&action.to==='claimed'){
      const from=rail(action.person,remaining(action.start));
      const elapsed=time-action.start;
      const travel=moveEase(elapsed/.86);
      const shrink=moveEase((elapsed-.72)/.4);
      const dock=moveEase((time-action.arrive)/(action.end-action.arrive));
      const {x,y}=claimCurve(from,waiting,travel);
      const settled=arc({x,y},slot,dock,-24);
      const targetScale=waitingScale;
      gsap.set(avatars.current[action.person],{
        ...settled,
        scale:mix(mix(1+.22*Math.sin(Math.PI*travel),targetScale,shrink),slotScale,dock),
        autoAlpha:fade,zIndex:13,transformOrigin:'0 0',
        filter:`drop-shadow(0 9px 20px rgba(0,0,0,${.4*(1-(action.direct?shrink:dock))}))`,
      });
      return;
    }
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

  }, [time, state, root, tablet, avatars, codePanel, people, boardEnd, highlightMode, avatarChoreography, actions, avatarRailPose, codePanelScale]);
}
