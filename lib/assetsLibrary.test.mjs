import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {ASSETS, ELEMENTS, SUGGESTIONS} from './assetsLibrary.mjs';
import {searchAssets, termsOf} from './assetsSearch.mjs';
import {clipRange} from '../components/useClipSlice.js';

const ids = query => searchAssets(query, ASSETS).map(r => r.asset.id);
const first = query => ids(query)[0];

test('every asset is a real clip with a unique id and a still on disk', () => {
  assert.equal(new Set(ASSETS.map(a => a.id)).size, ASSETS.length);
  for (const a of ASSETS) {
    assert.ok(a.seconds > 1, `${a.id} is too short`);
    assert.ok(a.shows.length, `${a.id} shows nothing`);
    assert.ok(a.poster >= 0 && a.poster < 1, `${a.id} poster`);
    assert.ok(existsSync(new URL(`../public${a.image}`, import.meta.url)), `${a.id} has no still at ${a.image} (npm run gen:posters)`);
  }
});

test('every element and suggestion is known, and aliases do not repeat the name', () => {
  for (const name of SUGGESTIONS) assert.ok(ELEMENTS[name], name);
  for (const [name, aliases] of Object.entries(ELEMENTS)) assert.ok(!aliases.map(x => x.toLowerCase()).includes(name.toLowerCase()), name);
});

test('clips are named by chapter and resolve against the timeline', () => {
  const timeline = [{id: 'a', start: 0, end: 4}, {id: 'b', start: 4, end: 9}, {id: 'c', start: 9, end: 12}];
  assert.deepEqual(clipRange(timeline, 'b'), {from: 4, to: 9});
  assert.deepEqual(clipRange(timeline, 'a:c'), {from: 0, to: 12});
  assert.deepEqual(clipRange(timeline, 'all'), {from: 0, to: 12});
  assert.deepEqual(clipRange(timeline, 'nope'), {from: 0, to: 12});
  assert.deepEqual(clipRange(timeline, 'c:a'), {from: 0, to: 12});
  // a clip starts after the last scene's art has left
  assert.deepEqual(clipRange(timeline, 'b', {b: 0.5}), {from: 4.5, to: 9});
  assert.deepEqual(clipRange(timeline, 'a:c', {a: 1, c: 2}), {from: 1, to: 12}, 'only the first chapter counts');
  assert.deepEqual(clipRange([{id: 'x', start: 0, end: 10, duration: 10, original: {start: 0, end: 5}}], 'x', {x: 1}), {from: 2, to: 10}, 'a stretched chapter stretches its skip');
});

test('an alert is found by alert, by its synonyms and by mission details', () => {
  assert.equal(first('alert'), 'improved-quality-v2/alerts');
  assert.equal(first('alerts'), 'improved-quality-v2/alerts');
  assert.equal(first('warning'), 'improved-quality-v2/alerts');
  assert.ok(ids('mission details').includes('improved-quality-v2/alerts'));
  assert.ok(ids('alert mission details').includes('improved-quality-v2/alerts'));
  assert.ok(!ids('alert').includes('increased-efficiency-v2/claim'));
});

test('the mission chip and what is on it', () => {
  for (const query of ['mission chip', 'mission card', 'timer', 'execution timer', 'performer']) {
    const found = ids(query);
    assert.ok(found.includes('increased-efficiency-v2/execution'), query);
    assert.ok(found.includes('improved-quality-v2/emphasis'), query);
  }
  assert.ok(!ids('execution timer').includes('improved-quality-v2/alerts'));
  assert.equal(first('execution timer'), 'increased-efficiency-v2/execution');
  assert.equal(first('who performed'), 'improved-quality-v2/performer');
  assert.ok(ids('timers').includes('increased-efficiency-v2/urgency'));
});

test('words can be started, not finished, and the name of a place is found', () => {
  assert.equal(first('aler'), 'improved-quality-v2/alerts');
  assert.equal(first('date & time'), 'improved-quality-v2/timestamp');
  assert.ok(ids('keypad').includes('increased-efficiency-v2/code'));
  assert.ok(ids('spanish').includes('improved-quality-v2/translation'));
  assert.ok(ids('gallery').includes('improved-quality-v2/web'));
  assert.ok(ids('efficiency').every(id => id.startsWith('increased-efficiency-v2/')));
});

test('no search keeps everything in order, and nonsense finds nothing', () => {
  assert.equal(searchAssets('', ASSETS).length, ASSETS.length);
  assert.equal(searchAssets('  ', ASSETS).length, ASSETS.length);
  assert.deepEqual(searchAssets('', ASSETS).map(r => r.asset.id), ASSETS.map(a => a.id));
  assert.equal(searchAssets('zzzz qqqq', ASSETS).length, 0);
  assert.deepEqual(termsOf('The Mission & Chips'), ['mission', 'chip']);
});

test('a result says which shown elements it matched', () => {
  const hit = searchAssets('warning', ASSETS).find(r => r.asset.id === 'improved-quality-v2/alerts');
  assert.deepEqual(hit.matched, ['Alert']);
});

test('reviews from the file and from the browser merge: the newest edit per clip wins, nothing is lost', async () => {
  const {mergeReviews} = await import('./assetsLibrary.mjs');
  const file = {a: {rating: 3, notes: 'old', updatedAt: '2026-09-30T10:00:00Z'}, b: {rating: null, notes: 'only in the file', updatedAt: '2026-09-30T10:00:00Z'}};
  const browser = {a: {rating: 4, notes: 'newer', updatedAt: '2026-09-30T11:00:00Z'}, c: {rating: null, notes: 'only here', updatedAt: '2026-09-30T09:00:00Z'}, d: {rating: null, notes: '  ', updatedAt: '2026-09-30T12:00:00Z'}};
  const {reviews, changed} = mergeReviews(file, browser);
  assert.equal(reviews.a.notes, 'newer');
  assert.equal(reviews.b.notes, 'only in the file');
  assert.equal(reviews.c.notes, 'only here');
  assert.equal('d' in reviews, false, 'an empty review is not kept');
  assert.equal(changed, true);
  assert.equal(mergeReviews(file, file).changed, false);
  assert.deepEqual(mergeReviews({}, null).reviews, {});
});
