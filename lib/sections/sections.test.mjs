// The sections of the website (lib/sections/*.mjs): what the capture script, the registry and the storyboard's videos rely on.
import test from 'node:test';
import assert from 'node:assert/strict';
import {SECTIONS, SECTION_BOARDS, SECTION_RUNS, SECTION_DETAILS, SECTION_STOPS, sectionOfBoard} from './index.mjs';

test('every section has a board, a stage and chapters with words', () => {
  assert.ok(SECTIONS.length >= 9, 'the Operations group is all here');
  const ids = new Set(), boards = new Set();
  for (const s of SECTIONS) {
    assert.ok(/^[a-z0-9-]{1,48}$/.test(s.board) && /-v\d+$/.test(s.board), `${s.board}: a board id the store accepts`);
    assert.ok(!ids.has(s.id) && !boards.has(s.board), `${s.id}: unique`); ids.add(s.id); boards.add(s.board);
    assert.ok(s.stage && s.name && s.base, `${s.id}: a stage, a name, a base state`);
    const chapters = new Set();
    for (const c of s.chapters) {
      assert.ok(!chapters.has(c.id), `${s.id}/${c.id}: unique`); chapters.add(c.id);
      assert.ok(c.words && !/\s{2,}/.test(c.words) && !/\S\/|\/\S/.test(c.words), `${s.id}/${c.id}: words, a line ends with " / "`);
      for (const line of c.words.split(' / ')) assert.ok(line.length <= (c.title ? 37 : 46), `${s.id}/${c.id}: "${line}" is short enough to stay on the picture`);
      if (!c.title) assert.ok(c.art || c.view, `${s.id}/${c.id}: the state it starts in`);
      for (const a of c.acts ?? []) assert.ok(a.target && a.state, `${s.id}/${c.id}: an act presses a target and gives a state`);
    }
    assert.ok(s.chapters.at(-1).title || s.chapters.at(-1).closing, `${s.id}: ends on closing words (a card of its own, or on the same screen: \`closing\`, the CEO, 2026-10-28)`);
  }
});

test('the videos of a section play its chapters in order, and its steps are about them', () => {
  for (const s of SECTIONS) {
    const order = s.chapters.map(c => c.id);
    assert.deepEqual(SECTION_RUNS[s.board].map(r => r.id), s.chunks.map(c => c.id), `${s.id}: its chunks are its videos`);
    let at = -1;
    for (const chunk of s.chunks) for (const line of chunk.lines) { const i = order.indexOf(line); assert.ok(i > at, `${s.id}/${chunk.id}: ${line} is a chapter, after the one before`); at = i; }
    assert.deepEqual([...order].sort(), s.chunks.flatMap(c => c.lines).sort(), `${s.id}: every chapter is in a video`);
    for (const [video, spec] of Object.entries(SECTION_DETAILS[s.board])) {
      const chunk = s.chunks.find(c => c.id === video);
      assert.ok(chunk, `${s.id}: ${video} is one of its videos`);
      for (const scene of Object.keys(spec.scenes)) assert.ok(chunk.lines.includes(scene), `${s.id}/${video}: ${scene} is a line of it`);
    }
    for (const chunk of s.chunks) if (!chunk.noTwin) assert.ok(SECTION_DETAILS[s.board][chunk.id], `${s.id}/${chunk.id}: it has a detailed twin`);
  }
});

test('the registry gives the storyboard and the engine what they look up', () => {
  assert.deepEqual(SECTION_BOARDS.map(b => b.id), SECTIONS.map(s => s.board));
  for (const s of SECTIONS) {
    assert.equal(sectionOfBoard(s.board), s);
    for (const c of s.chapters.filter(c => c.acts?.length)) assert.deepEqual(SECTION_STOPS[s.board][c.id].map(x => x.target), c.acts.map(a => a.target), `${s.id}/${c.id}: the cursor's stops are its acts`);
  }
  assert.equal(sectionOfBoard('improved-quality-v2'), null);
});
