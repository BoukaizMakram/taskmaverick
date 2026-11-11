'use client';
// Replenishing Inventory's art for the section videos (lib/sections/replenishing-inventory.mjs): the board where the inventory check is posted and the replenishment is ordered, the check by itself
// with the counts it collects, the replenishment with its count and its photo, the cards that age (Isolated missions), the photos on a tablet and in the web gallery.
import {TabletPart, MissionPanel, FlowPart, mission, AVATAR, card, across} from './parts';
import {BusinessProofs} from '../ImprovedQualityV2Panels';
import LiveOversightStage from './LiveOversightStage';

const SHELF = '/demo-quality/proofs/storage-shelves.jpg';
export const INVENTORY_BASE = {view: 'board', board: 'base', panel: 'check', counts: 0, expand: 1, count: null, photo: 'none', flow: 'aging', flowStep: 0, scroll: 0, gallery: true, scrollTo: 'top'};

function missionsOf(board) {
  const rest = [
    mission('napkins', 'Restock Napkins', 'Task', 'open', {ageSeconds: 920, openOrder: 5}),
    mission('delivery', 'Receive Delivery', 'Checklist', 'claimed', {performer: 'Ben R', performerAvatar: AVATAR.ben, executionSeconds: 402, started: 40, ageSeconds: 1300}),
    mission('labels', 'Check Labels', 'Task', 'closed', {performer: 'Leo T', performerAvatar: AVATAR.leo, executionSeconds: 190, stopped: 20, ageSeconds: 2200}),
  ];
  const check = status => mission('check', 'Inventory Check', 'Checklist', status, {points: 25, ageSeconds: 7, openOrder: 0, performer: 'Anna F', performerAvatar: AVATAR.anna, executionSeconds: 311, stopped: 60, started: 60});
  const replenish = mission('replenish', 'Replenish Item-C', 'Task', 'open', {points: 10, ageSeconds: 5, openOrder: 0});
  if (board === 'posted') return [check('open'), ...rest];
  if (board === 'checked') return [check('closed'), ...rest];
  if (board === 'ordered') return [replenish, check('closed'), ...rest];
  return rest;
}

// ---- the inventory check by itself, with the counts it collects ----
const ITEMS = [['A', 15], ['B', 22], ['C', 5]];
function CheckPanel({s}) {
  const items = ITEMS.map(([k, v], i) => ({id: `item-${k}`, type: 'number', q: `Item-${k} on hand`, value: s.counts > i ? v : null, unit: 'units', flag: k === 'C' && s.counts > i}));
  return <MissionPanel kind="Checklist" points={25} title="Inventory Check" location="Stockroom / Shelf 3" who="Anna F" date="09-23-26 07:00 AM" timer="00:05:11" expand={s.expand}
    brief={{instructions: 'Count what is on the shelf and enter each number.', alert: 'Par is 20 units for every item.'}}
    groupTitle={{name: 'Counts', count: `${s.counts}/3`}} items={items} scrollTo={s.scrollTo}/>;
}
// ---- the replenishment: the count, then the photo of the shelf ----
function ReplenishPanel({s}) {
  const items = [{id: 'count', type: 'number', q: 'Item-C on the shelf now', value: s.count, unit: 'units'},
    {id: 'shelf', type: 'photo', q: 'Take a photo of the shelf.', state: s.photo === 'done' ? 'done' : 'ask', poster: SHELF}];
  return <MissionPanel kind="Task" points={10} title="Replenish Item-C" location="Stockroom / Shelf 3" who="Ben R" date="09-23-26 07:06 AM" timer="00:00:05" expand={s.expand}
    brief={{instructions: 'Bring Item-C up to par and show the full shelf.', alert: 'Item-C was below par: 5 units.'}} items={items} scrollTo={s.scrollTo}/>;
}

const TONES = ['green', 'orange', 'red'], CLOCKS = ['00:12:08', '00:31:40', '01:02:15'];
function flowOf(s) {
  const left = 70, right = 570, mid = 360, a = {x: left, y: mid}, b = {x: right, y: mid};
  const tone = Math.min(2, s.flowStep), chips = [card('replenish', left, mid, {kind: 'Task', points: 10, title: 'Replenish Item-C', who: null, exec: null, pill: CLOCKS[tone], tone: TONES[tone]})], lines = [];
  if (s.flowStep >= 3) { lines.push(across('arrow', a, b)); chips.push(card('escalation', right, mid, {kind: 'Ticket', title: 'Escalation Alert', response: 'Item-C has not been ordered in time.', location: 'Stockroom - Purchasing', who: null, exec: null, pill: '00:00:00', tone: 'green'})); }
  return {chips, lines};
}

export default function InventoryStage({state}) {
  const s = {...INVENTORY_BASE, ...state};
  if (s.view === 'mission') return s.panel === 'replenish' ? <ReplenishPanel s={s}/> : <CheckPanel s={s}/>;
  if (s.view === 'flow') { const f = flowOf(s); return <FlowPart chips={f.chips} lines={f.lines}/>; }
  if (s.view === 'web') return <LiveOversightStage state={{page: 'usage', pan: 340, groupBy: 'Checkpoint', gallery: s.gallery, reportScroll: s.scroll}}/>;
  if (s.view === 'proofs') return <TabletPart title="Stockroom" missions={missionsOf('checked')} overlay={<div className="iq-bp-layer"><BusinessProofs tablet scroll={s.scroll}/></div>}/>;
  return <TabletPart title="Stockroom" missions={missionsOf(s.board)}/>;
}
