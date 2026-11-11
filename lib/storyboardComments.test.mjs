import test from 'node:test';
import assert from 'node:assert/strict';
import {COMMENT_SHOW, addVideoComment, cleanVideoComment, cleanVideoComments, commentNumber, commentsOf, isCommentShown, mergeVideoComments, removeVideoComment, updateVideoComment} from './storyboardComments.mjs';
import {mergeEdits, normalizeEdits} from './storyboardEdits.mjs';

const TITLE = 'A video';
const empty = normalizeEdits(null);

test('a comment is placed on the picture, with its second, and numbered by its place in the list', () => {
  const one = addVideoComment(empty, TITLE, {x: 400, y: 300, at: 2.5, text: ''}), two = addVideoComment(one.edits, TITLE, {x: 10, y: 20, at: 7, text: 'Slower'});
  assert.deepEqual([one.id, two.id], ['comment-1', 'comment-2']);
  const items = commentsOf(two.edits, TITLE);
  assert.equal(items.length, 2);
  assert.equal(commentNumber(items, 'comment-2'), 2);
  assert.equal(items[0].text, '', 'a pin just placed has no words yet');
  assert.ok(items[0].created, 'it keeps when it was placed');
});

test('the words are kept as typed, the place stays on the picture, and a change that changes nothing is no change', () => {
  const made = addVideoComment(empty, TITLE, {x: 1700, y: -5, at: 1}).edits, c = commentsOf(made, TITLE)[0];
  assert.deepEqual([c.x, c.y], [1600, 0], 'a point is kept inside the 1600 x 900 picture');
  const typed = updateVideoComment(made, TITLE, c.id, {text: 'Make it faster '});
  assert.equal(commentsOf(typed, TITLE)[0].text, 'Make it faster ', 'no trimming while it is typed');
  assert.equal(updateVideoComment(typed, TITLE, c.id, {text: 'Make it faster '}), typed, 'the same edits back: no step of Undo');
  assert.equal(updateVideoComment(typed, TITLE, 'nope', {text: 'x'}), typed);
});

test('a comment is deleted by its id, the others keep their order, and an empty list is kept', () => {
  let e = empty;
  for (const at of [1, 2, 3]) e = addVideoComment(e, TITLE, {x: 5, y: 5, at, text: `at ${at}`}).edits;
  const gone = removeVideoComment(e, TITLE, 'comment-2');
  assert.deepEqual(commentsOf(gone, TITLE).map(c => c.id), ['comment-1', 'comment-3']);
  assert.equal(removeVideoComment(gone, TITLE, 'comment-2'), gone, 'nothing to delete: the same edits');
  const none = ['comment-1', 'comment-3'].reduce((cur, id) => removeVideoComment(cur, TITLE, id), gone);
  assert.deepEqual(none.comments[TITLE].items, [], 'the empty list says all of them were deleted');
});

test('a pin is on the picture from its second to a few seconds after', () => {
  const c = cleanVideoComment({id: 'a', x: 1, y: 1, at: 10});
  assert.ok(isCommentShown(c, 10));
  assert.ok(isCommentShown(c, 10 + COMMENT_SHOW.after));
  assert.ok(!isCommentShown(c, 10 + COMMENT_SHOW.after + 0.5));
  assert.ok(!isCommentShown(c, 9));
});

test('a comment marked done is not on the picture, and comes back when it is not done', () => {
  const c = cleanVideoComment({id: 'a', x: 1, y: 1, at: 10, done: true});
  assert.ok(!isCommentShown(c, 10));
  assert.ok(isCommentShown({...c, done: false}, 10));
});

test('what is saved is cleaned, and survives the edits being saved and loaded', () => {
  const made = addVideoComment(empty, TITLE, {x: 40.26, y: 80, at: 3, text: 'Hello', done: true}).edits;
  const again = normalizeEdits(JSON.parse(JSON.stringify(made)));
  assert.deepEqual(commentsOf(again, TITLE), commentsOf(made, TITLE));
  assert.equal(commentsOf(again, TITLE)[0].done, true);
  assert.deepEqual(cleanVideoComments({[TITLE]: {items: [{x: 1, y: 1}, 'x', {id: 'b', x: 'no', y: 1}]}})[TITLE].items, [], 'no id, not a comment, no place: none kept');
});

test('two copies meet: for each video the newer list wins', () => {
  const a = {...addVideoComment(empty, TITLE, {x: 1, y: 1, at: 1}, '2026-10-29T10:00:00.000Z').edits}, b = addVideoComment(a, TITLE, {x: 2, y: 2, at: 2}, '2026-10-29T11:00:00.000Z').edits;
  assert.equal(commentsOf(mergeEdits(a, b).edits, TITLE).length, 2, 'the newer copy has two');
  assert.equal(commentsOf(mergeEdits(b, a).edits, TITLE).length, 2, 'whichever way they meet');
  assert.equal(mergeVideoComments(b.comments, a.comments).changed, false);
});
