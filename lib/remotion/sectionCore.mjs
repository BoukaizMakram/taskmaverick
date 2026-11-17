// What the cuts made of a board's SECTIONS, cards and panels share: Requesting Maintenance's first (the user's notes on its storyboard, 2026-11-16: no tablet, one ticket for the whole story,
// the request kept open while what it raises pops at its right, a camera pan), then the films told the same way (the user, the same day: "based on all videos like requesting maintenance,
// precision planing, increased effeciency, the style and everything should be done to requesting support till reports & AI"): Requesting Support, Tracking Expirations, Replenishing
// Inventory, Exception Management. The room, the sizes, the speeds, where things stand, a timer that ages, the tellers of a plan. Their pieces are drawn by
// components/remotion/SectionParts.jsx. Pure: no React, no Remotion. What EVERY cut shares is lib/remotion/cutCore.mjs.
//
// THE STYLE (every film made with this; lib/remotion/maintenanceCut.mjs is the model):
//   - NO TABLET: a board is shown as the section concerned, by itself (its column tab over its cards: `sectionLayout`); the board's plus stands beside the tab and the On-Demand list grows out of it
//   - a mission opened is its panel in the middle (a 9:16 phone's panel, `PANEL`); it STAYS OPEN while what it raises pops at its right with an arrow (`chainLayout`); the answer that raises a
//     ticket is the trigger, at the right, in the ticket's border color (components/sections/parts.jsx `item.trigger`, `item.flip`)
//   - going on to the next thing is a CAMERA move: everything goes to the left, what is left behind fades as it goes (`pan`)
//   - ONE item for the whole story: the same card goes from one scene to the next (its timer goes on), never a board full of others
//   - a claim and a close are one avatar's (the picture's own octagon): from its seat straight to the card's right edge at the middle of its height, with the card to the next section,
//     then to the name's place; the same to close (`boardLayout`, `rideAt`)
//   - the words slide (`story(words, {slide: true})`): a label of two or three words, a sentence of two short lines, never more; the action starts as the last word is written, the words go
//     `GONE` s after it has ended; what is only shown is outlined in yellow; what is done is done by the cursor, which leaves before the screen changes; one speed (`M`), a screen change `XF`
//   - timers run a second a second; one that ages on screen runs fast between its colors (`agingOf`) and its pill pops once at each
import {M, SLIDE, clamp, prog} from './cutCore.mjs';

export const PANEL = {left: 620, top: 85.5, scale: 1.15}; // the mission, a 9:16 phone's panel (360 x 573) centered at x 800, y 372: over the band's straight edge (y 744) with its shadow (lib/remotion/auditingCut.mjs has it from here)
// ---- the room over the words: 1600 wide, down to y 744 (the band's straight edge); its middle is where a panel stands ----
export const MID = {x: 800, y: 372};
export const CARD = {w: 334, h: 129, ticket: 232}; // a mission's card and an alert ticket's, in the board's own units
export const PW = 360 * PANEL.scale;               // a panel as it is seen (360 x 573 drawn `PANEL.scale` times bigger about its middle)
export const panelLeft = x => x + (PW - 360) / 2;  // the `left` to give a panel for it to be SEEN from `x`
export const panelRight = left => left - (PW - 360) / 2 + PW; // the right edge of a panel given that `left`

// ---- the speeds (Increased Efficiency's) ----
export const QUICK = 1.3, TR = M / QUICK, GONE = 0.3;
export const SHOW = 1.1, EACH = 0.45;
export const XF = 0.4;      // a change of screen: the new one comes in over the old one, which goes as it comes
export const POPS = 0.34;   // a card that pops in
export const SIT = M * 0.7; // an avatar between a card's edge and the name's place on it
export const READ = lines => 0.8 + lines.join('').replace(/\s+/g, '').length / 18;
export const popped = (t, at) => clamp((t - at) / POPS);
export const step = (t, at) => prog(t, at, M);

// ---- what the cursor presses and what is outlined: each layer says its name (`data-rc-layer`, SectionParts.jsx `Layer`); a card is named by its id, its parts <id>-exec, <id>-who,
// <id>-pill, <id>-title (components/sections/parts.jsx FlowPart) ----
export const tg = (layer, key) => `[data-rc-layer="${layer}"] [data-iq-target="${key}"]`;

// ---- the tellers of a plan, over a `story` of cutCore: `says` {id: [label, lines]} ----
export function tellers(st, says) {
  const say = (id, at) => st.say(id, says[id][0], says[id][1], at);
  const next = c => st.next(c);                                       // the next sentence: once these words have gone, and the titles added after them have been said (cutCore `story`)
  const last = c => st.last(c);                                       // ... after the film's last sentence: with the added titles that follow no sentence
  const acted = (c, end) => { c.until = end + GONE; return c; };       // words with an action: they go `GONE` s after it has ended
  const shown = (c, at, n = 1) => { c.until = at + (n - 1) * EACH + SHOW + GONE; return c; }; // words that only show something (`n` things, one after the other): it is seen `SHOW` s
  const each = (c, at, targets, pad = 6) => { shown(c, at, targets.length); targets.forEach((sel, i) => st.mark(at + i * EACH, c.until, [sel], pad)); }; // ... each outlined in turn
  const read = c => { c.until = c.written + READ(c.lines); return c; }; // words with nothing under them: read
  return {say, next, last, acted, shown, each, read};
}

// ---- a section of a board with no tablet: its tab, `slots` cards under it (room is kept for all of them), centered in the room. `plus`: the board's plus at the right of the tab; with the
// On-Demand list open at the right of the plus the group is centered again (`opened`): glide between `closed` and `opened` as the list opens and closes ----
export function sectionLayout({k = 1.25, slots = 3, plus = false, card = 'mission'} = {}) {
  const w = CARD.w * k, tab = 38 * k, gap = 16 * k, h = (card === 'ticket' ? CARD.ticket : CARD.h) * k, between = 15, P = 46, plusGap = 22, menu = {w: 383, h: 676, k: 0.88, gap: 14};
  const y = Math.round(MID.y - (tab + gap + slots * h + (slots - 1) * between) / 2), closedW = w + (plus ? plusGap + P : 0);
  return {k, w, tab, gap, card: h, between, plus: P, plusGap, menu, y, closed: Math.round(MID.x - closedW / 2), opened: Math.round(MID.x - (closedW + menu.gap + menu.w * menu.k) / 2),
    slotY: i => y + tab + gap + i * (h + between),
    plusAt: gx => ({x: gx + w + plusGap, y: y + (tab - P) / 2, size: P}),
    menuAt: gx => ({x: gx + w + plusGap + P + menu.gap, y, w: menu.w, h: menu.h, k: menu.k})};
}

// ---- a thing and what it raises at its right, an arrow between them, centered in the room: `leftW` how wide the left thing is seen (a panel: `PW`; a card: 334 x its scale), the right one a
// card (`right`: 'ticket' | 'mission') `k` times the board's. After the camera's pan (`pan` px to the left) that card is at `after` and what IT raises at `second`. `level`: the arrows' y ----
export function chainLayout({leftW = PW, k = 1.3, right = 'ticket', gap = 120, pad = 12} = {}) {
  const w = CARD.w * k, h = (right === 'ticket' ? CARD.ticket : CARD.h) * k, x0 = MID.x - (leftW + gap + w) / 2, after = MID.x - (2 * w + gap) / 2;
  return {k, w, h, gap, pad, leftW, left: x0, right: x0 + leftW + gap, y: MID.y - h / 2, after, second: after + w + gap, pan: x0 + leftW + gap - after, level: MID.y};
}

// ---- a board's three sections with no tablet: only their tabs, and the one card under the one it is in; an avatar's seat at the left of Open, level with the card's middle ----
export function boardLayout({k = 1.2, x0 = 160, pitch = 470, card = 'ticket'} = {}) {
  const tab = 38 * k, gap = 22, h = (card === 'ticket' ? CARD.ticket : CARD.h) * k, tabY = Math.round(MID.y - (tab + gap + h) / 2), cardY = tabY + tab + gap;
  return {k, x0, pitch, tabY, cardY, w: CARD.w * k, h, colX: i => x0 + i * pitch, seat: {x: x0 - 84 - 26, y: cardY + (h - 84) / 2, s: 84}};
}

// ---- a timer that ages on screen: from 00:00:00 as its card pops (`pop`), a second a second; from `tick` it runs `rate` s a second, orange at half an hour, red at an hour, until just
// past the hour (`aged`); then a second a second again. -> when it turns (`orange`, `red`), `seconds(t, stop)` (stopped at `stop`: the card closed), its `tone`, how far its pill has popped ----
export const AGING = {rate: 900, aged: 3600 + 8};
export function agingOf({pop, tick, rate = AGING.rate, aged = AGING.aged}) {
  const t0 = tick - pop, orange = tick + (1800 - t0) / rate, red = tick + (3600 - t0) / rate, done = tick + (aged - t0) / rate;
  const seconds = (t, stop = Infinity) => { const at = Math.min(t, stop); return at < pop ? 0 : at < tick ? at - pop : at < done ? t0 + (at - tick) * rate : aged + (at - done); };
  const UP = 0.3, GROW = 0.16;
  const pillPop = t => 1 + GROW * (prog(t, orange - UP / 2, UP) - prog(t, orange + 0.45, UP)) + GROW * (prog(t, red - UP / 2, UP) - prog(t, red + 0.45, UP));
  return {orange, red, done, seconds, pillPop, tone: s => (s >= 3600 ? 'red' : s >= 1800 ? 'orange' : 'green')};
}

// ---- the avatar that takes a card (SectionParts.jsx `Rider`): popped (0 to 1), from its seat to the card's edge (`go`), from the edge to the name's place on the card (`spot`), out of there
// to the edge again to close it (`out`), back to the name's place (`rest`). `b`: when each starts {in, go, settle, out, rest} ----
export const rideAt = (t, b) => ({pop: popped(t, b.in), go: prog(t, b.go, M), spot: prog(t, b.settle, SIT), out: b.out == null ? 0 : prog(t, b.out, SIT), rest: b.rest == null ? 0 : prog(t, b.rest, SIT), on: t >= b.in});
