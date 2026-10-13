import test from 'node:test';
import assert from 'node:assert/strict';
import {elementAt, findRoot, parseHtml, textsOf, wrapperScale} from './storyboardHtml.mjs';

const ASSET = '<div class="cam" style="transform:translate(800px,450px) scale(1.25) translate(-10px,0)" data-sb-wrap><div class="card" data-sb-root="card">'
  + '<h3>Clean &amp; check</h3><!-- a note --><div class="row"><img src="/x.png" alt=""><span>Due</span> 10:00 <b>Today</b></div>'
  + '<p aria-label="Two lines"><span style="display:block">First line</span><span style="display:block">Second&#8203;</span></p>'
  + '<svg viewBox="0 0 10 10"><text>no</text></svg></div></div>';

test('the parser keeps every child node, so paths and text addresses are the ones the page uses', () => {
  const root = findRoot(parseHtml(ASSET), 'card');
  assert.equal(root.tag, 'div');
  assert.equal(elementAt(root, '1.1').tag, 'span', 'children count elements only (the img is the first)');
  assert.equal(root.children[1].type, 'comment', 'child nodes keep comments');
});

test('the texts of an asset with their keys, in reading order; a words block is one text, its lines joined', () => {
  assert.deepEqual(textsOf(ASSET, 'card'), [
    {key: 'card/0', text: 'Clean & check'},
    {key: 'card/1.1', text: 'Due'},
    {key: 'card/1#2', text: ' 10:00 '},
    {key: 'card/1.2', text: 'Today'},
    {key: 'card/2', text: 'First line\nSecond'},
  ]);
  assert.deepEqual(textsOf(ASSET, 'nope'), []);
});

test('how much the wrappers around an asset scale a move of it', () => {
  assert.equal(wrapperScale(ASSET, 'card'), 1.25);
  assert.equal(wrapperScale('<div data-sb-root="a">x</div>', 'a'), 1);
});
