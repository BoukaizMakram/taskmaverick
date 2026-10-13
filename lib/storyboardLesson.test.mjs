import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSON_FILM, LESSON_PLAY, LESSON_TARGETS, lessonAsset, lessonHtml, lessonHtmlOf} from './storyboardLesson.mjs';

test('an asset named for the lesson is its html; any other name is not', () => {
  assert.equal(lessonHtmlOf('sb-lesson:00'), lessonHtml('00'));
  assert.equal(lessonHtmlOf(lessonAsset('play')), lessonHtml('play'));
  assert.equal(lessonHtmlOf('something-else'), undefined);
  assert.equal(lessonHtmlOf(undefined), undefined);
});

test('the lesson is about stock shelving, not meal breaks', () => {
  const html = lessonHtml('00');
  assert.match(html, /shelves/i);
  assert.doesNotMatch(html, /meal break|lunch break/i);
});

test('the video is the shelving clip itself: paused (blurred, play button, no bar) before it plays, its last picture and a full bar after', () => {
  const wait = lessonHtml('play'), seen = lessonHtml('11');
  for (const html of [wait, seen]) assert.ok(html.includes(`<video src="${LESSON_FILM.src}"`), 'the real clip');
  assert.ok(wait.includes('is-wait') && wait.includes(`poster="${LESSON_FILM.first}"`) && wait.includes('width:0%'));
  assert.ok(!seen.includes('is-wait') && seen.includes(`poster="${LESSON_FILM.last}"`) && seen.includes('width:100%'));
  assert.ok(wait.includes(`0:0${LESSON_FILM.clip}`) && seen.includes('0:00'), 'the time that is left');
});

test('what the cursor goes to is in the lesson, and the ticks are the ones asked for', () => {
  const html = lessonHtml('10');
  for (const sel of [LESSON_PLAY, ...LESSON_TARGETS]) assert.ok(html.includes(sel.replace(/^\[|\]$/g, '').replace(/"/g, '"')), sel);
  assert.equal((lessonHtml('00').match(/is-on/g) ?? []).length, 0);
  assert.equal((html.match(/is-on/g) ?? []).length, 1);
  assert.equal((lessonHtml('11').match(/is-on/g) ?? []).length, 2);
  assert.equal((lessonHtml('play').match(/is-on/g) ?? []).length, 0, 'paused: nothing ticked');
});
