'use client';
// Tracking Expirations' art for the section videos (lib/sections/tracking-expirations.mjs): the board of food items with the timer each carries (green, orange, red), the order they
// stand in (the longer the timer, the higher), and the alert that goes out when one expires (Isolated missions, with the arrow).
import {TabletPart, FlowPart, mission, card, across, FLOW} from './parts';

export const EXPIRATIONS_BASE = {view: 'board', items: 5, phase: 0, flow: 'alert', flowStep: 0};
const ORANGE = '#ed7f04', RED = '#bd1f59';
// The five items, in the order they were posted; what each shows by phase: 0 (one orange, the first), 1 (the last one has turned orange and has risen to second place), 2 (it has turned red and is first).
const ITEMS = [
  {id: 'chicken', title: 'Grilled Chicken', age: [18720, 19260, 19800], tone: [ORANGE, ORANGE, ORANGE]},
  {id: 'salmon', title: 'Fresh Salmon', age: [7512, 8060, 8600], tone: [null, null, null]},
  {id: 'mozzarella', title: 'Mozzarella', age: [6030, 6580, 7120], tone: [null, null, null]},
  {id: 'tomatoes', title: 'Cut Tomatoes', age: [4222, 4770, 5310], tone: [null, null, null]},
  {id: 'rice', title: 'Cooked Rice', age: [1844, 19000, 30610], tone: [null, ORANGE, RED]},
];
const ORDER = [[0, 1, 2, 3, 4], [0, 4, 1, 2, 3], [4, 0, 1, 2, 3]]; // the position of each item (by index) in each phase: openOrder
function missionsOf(s) {
  const phase = Math.min(2, s.phase), rank = ORDER[phase];
  return ITEMS.slice(0, s.items).map((it, i) => mission(it.id, it.title, 'Task', 'open', {points: null, ageSeconds: it.age[phase], openOrder: rank.indexOf(i), timerColor: it.tone[phase] ?? undefined, time: '08:15 AM', date: '09-23-26'}));
}

const clock = sec => [Math.floor(sec / 3600), Math.floor(sec / 60) % 60, sec % 60].map(n => String(n).padStart(2, '0')).join(':');
export default function ExpirationsStage({state}) {
  const s = {...EXPIRATIONS_BASE, ...state};
  if (s.view === 'flow') {
    const left = 70, right = 570, mid = 360, a = {x: left, y: mid}, b = {x: right, y: mid};
    const chips = [card('expired', left, mid, {kind: 'Task', title: 'Cooked Rice', who: null, exec: null, pill: clock(30610), tone: 'red'})], lines = [];
    if (s.flowStep >= 1) { lines.push(across('arrow', a, b)); chips.push(card('alert', right, mid, {kind: 'Ticket', title: 'Item Expired', response: 'Cooked Rice has expired: remove it.', location: 'Kitchen - Food Safety', who: null, exec: null, pill: '00:00:00', tone: 'green'})); }
    return <FlowPart chips={chips} lines={lines}/>;
  }
  return <TabletPart title="Food Freshness" missions={missionsOf(s)} compact/>;
}
