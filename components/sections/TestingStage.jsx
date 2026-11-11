'use client';
// Dynamic Testing's art for the section videos (lib/sections/dynamic-testing.mjs), drawn from a state given as data:
//   test     a test by itself (the shared Panel, a little smaller than a phone view so that what it triggers fits beside it): a True / False question on top, a single choice of four in the
//            middle, a True / False at the bottom. A wrong answer triggers the lesson that goes with it: its card pops beside the question, a purple arrow from the question to it; the right
//            answer at the bottom triggers nothing: the arrow goes to "No Training Needed". The test and the cards are one group in the middle of the plate.
//   people   three people top to bottom, their test scores, and the lessons each gets on the side (5, 1, 3: the product's mission cards, one over the other), one person after the other
import {useLayoutEffect, useRef, useState} from 'react';
import {Panel, Question, Layer} from './trainingParts';
import {AVATAR} from './parts';
import './dynamic-testing.css';

export const TESTING_BASE = {view: 'test', answers: [null, null, null], lessons: 0, none: 0, shown: 0};

// ---- the test, and what its answers trigger beside it ----
const SCALE = 1.1, H = 690, CARD = 1, CARD_W = 334 * CARD, CARD_H = 127, GAP = 80; // (the panel's own px are 360 x H; the cards at their own scale)
const LEFT = Math.round((1042 - (360 * SCALE + GAP + CARD_W)) / 2), TOP = Math.round((900 - H * SCALE) / 2); // (where the group's left and the panel's top are seen)
const LESSONS = [
  {id: 'lesson-1', mission: {kind: 'Media', points: 5, title: 'Storing Raw Meat', who: 'Anna F', avatar: AVATAR.anna, exec: null, pill: '00:00:00', tone: 'green'}},
  {id: 'lesson-2', mission: {kind: 'Media', points: 5, title: 'Hot Holding Temperatures', who: 'Anna F', avatar: AVATAR.anna, exec: null, pill: '00:00:00', tone: 'green'}},
];
const QUESTIONS = ['q1', 'q2', 'q3'];
function Test({s}) {
  const wrap = useRef(null), [at, setAt] = useState(null); // (`at`: the middle of each question and the panel's right edge, in stage px, measured once the panel is laid out)
  useLayoutEffect(() => {
    const root = wrap.current, stage = root?.parentElement;
    if (!stage) return;
    const S = stage.getBoundingClientRect(), k = S.width / (stage.offsetWidth || 1) || 1, panel = root.querySelector('.iq2-mission')?.getBoundingClientRect();
    if (!panel) return;
    const mid = id => { const r = root.querySelector(`[data-iq-target="cp-${id}"]`)?.getBoundingClientRect(); return r ? Math.round(((r.top + r.bottom) / 2 - S.top) / k) : 0; };
    const next = {right: Math.round((panel.right - S.left) / k), ys: QUESTIONS.map(mid)};
    if (JSON.stringify(next) !== JSON.stringify(at)) setAt(next);
  });
  const right = at?.right ?? LEFT + 360 * SCALE, ys = at?.ys ?? [260, 470, 700], x = right + GAP;
  const chips = LESSONS.slice(0, s.lessons).map((l, i) => ({id: l.id, x, y: ys[i] - CARD_H / 2, mission: l.mission, scale: CARD}));
  const lines = [...LESSONS.slice(0, s.lessons).map((l, i) => ({id: `arrow-${i + 1}`, from: [right + 8, ys[i]], to: [x - 10, ys[i]]})), ...(s.none ? [{id: 'arrow-3', from: [right + 8, ys[2]], to: [x - 10, ys[2]]}] : [])];
  const labels = s.none ? [{id: 'no-training', x, y: ys[2], text: 'No Training Needed', kind: 'dark'}] : []; // (words on the plate, not the product's: dark, as the outline round them is drawn on a light card)
  return <div ref={wrap} style={{display: 'contents'}}>
    <Panel kind="Test" points={20} title="Food Safety Test" location="Kitchen / Training" who="Anna F" date="09-23-26 10:00 AM" exec="00:01:12" timer="00:01:30" scale={SCALE} height={H}
      left={LEFT + (360 * SCALE - 360) / 2} top={TOP + (H * SCALE - H) / 2}>
      <Question id="q1" n={1} q="Raw meat is stored above vegetables." options={['True', 'False']} answer={s.answers[0]}/>
      <Question id="q2" n={2} q="Hot food must be held at what temperature?" kind="single" options={['41°F', '100°F', '120°F', '135°F or above']} answer={s.answers[1]}/>
      <Question id="q3" n={3} q="Hands are washed after handling raw meat." options={['True', 'False']} answer={s.answers[2]}/>
    </Panel>
    <Layer name="Mission cards" chips={chips} lines={lines} labels={labels}/>
  </div>;
}

// ---- three people, their scores and the lessons each gets ----
const PEOPLE = [
  {id: 'anna', name: 'Anna F', src: AVATAR.anna, score: 'Score 50%', lessons: [['Storing Raw Meat', 'video', '00:45'], ['Hot Holding Temperatures', 'audio', '00:38'], ['Cross-Contamination', 'video', '00:52'], ['Cleaning Surfaces', 'audio', '00:30'], ['Allergen Awareness', 'video', '00:41']]},
  {id: 'ben', name: 'Ben R', src: AVATAR.ben, score: 'Score 90%', lessons: [['Cooling Leftovers', 'audio', '00:35']]},
  {id: 'carla', name: 'Carla M', src: AVATAR.carla, score: 'Score 70%', lessons: [['Storing Raw Meat', 'video', '00:45'], ['Hand Washing', 'video', '00:40'], ['Thawing Food Safely', 'audio', '00:33']]},
];
const FACE = 92, CHIP = 0.8, CW = 334 * CHIP, CH = 127 * CHIP, STEP = {x: 16, y: 14}, DECK_X = 190; // (each person's lessons: the product's mission cards, one over the other)
function People({s}) {
  const deckH = n => CH + STEP.y * (n - 1), blocks = PEOPLE.map(p => Math.max(FACE + 60, deckH(p.lessons.length))), gap = 40, total = blocks.reduce((a, b) => a + b, 0) + gap * (blocks.length - 1);
  let y = 450 - total / 2;
  const faces = [], chips = [], lines = [], labels = [];
  PEOPLE.forEach((p, i) => {
    const mid = y + blocks[i] / 2, n = p.lessons.length, top = mid - deckH(n) / 2, on = s.shown > i ? 1 : 0;
    faces.push({id: `face-${p.id}`, x: 0, y: mid - (FACE + 60) / 2, src: p.src, name: p.name, note: p.score, size: FACE});
    lines.push({id: `arrow-${p.id}`, from: [FACE + 40, mid], to: [DECK_X - 14, mid], opacity: on});
    p.lessons.forEach(([title], j) => chips.push({id: `${p.id}-lesson-${j + 1}`, x: DECK_X + j * STEP.x, y: top + j * STEP.y, scale: CHIP, opacity: on,
      mission: {kind: 'Media', points: 5, title, who: p.name, avatar: p.src, exec: null, pill: '00:00:00', tone: 'green'}}));
    labels.push({id: `count-${p.id}`, x: DECK_X + (n - 1) * STEP.x + CW + 22, y: mid, text: `${n} ${n === 1 ? 'Lesson' : 'Lessons'}`, opacity: on});
    y += blocks[i] + gap;
  });
  return <Layer chips={chips} faces={faces} lines={lines} labels={labels} center/>;
}

export default function TestingStage({state}) {
  const s = {...TESTING_BASE, ...state};
  if (s.view === 'people') return <People s={s}/>;
  return <Test s={s}/>;
}
