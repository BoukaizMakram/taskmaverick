import test from 'node:test';
import assert from 'node:assert/strict';
import { createSegmenter, parseCommand, stripCommands } from './commands.mjs';

const segment = (text, size = 5) => {
  const out = [];
  const s = createSegmenter(item => out.push(item));
  for (let i = 0; i < text.length; i += size) s.push(text.slice(i, i + size));
  s.end();
  return out;
};

test('speech and commands come out in spoken order, even when streamed in tiny chunks', () => {
  const out = segment("Let me show you how that works. [[stage devices]] Here's the board, [[phone board Team A]] and it syncs.");
  assert.deepEqual(out.map(i => i.type), ['speech', 'command', 'speech', 'command', 'speech']);
  assert.equal(out[0].text, 'Let me show you how that works.');
  assert.deepEqual(out[1].command, { target: 'stage', cmd: 'devices' });
  assert.deepEqual(out[3].command, { target: 'phone', cmd: 'board', board: 'Team A' });
});

test('decimals and abbreviations do not split a sentence', () => {
  const out = segment('A personal board costs about 3.5 dollars, e.g. for training only. Teams are sixty dollars a month.');
  assert.equal(out.length, 2);
  assert.match(out[0].text, /3\.5 dollars, e\.g\. for training only\.$/);
});

test('commands parse positional and key=value arguments', () => {
  assert.deepEqual(parseCommand('phone answer 4 No'), { target: 'phone', cmd: 'answer', item: '4', value: 'No' });
  assert.deepEqual(parseCommand('tablet: open Fry Dispenser Cleaning'), { target: 'tablet', cmd: 'open', mission: 'Fry Dispenser Cleaning' });
  assert.deepEqual(parseCommand('web overview board=Team Board; view=History'), { target: 'web', cmd: 'overview', board: 'Team Board', view: 'History' });
  assert.equal(parseCommand('printer print everything'), null);
});

test('an unfinished command at the end of a stream is dropped, never spoken', () => {
  const out = segment('All done here. [[phone clo');
  assert.deepEqual(out, [{ type: 'speech', text: 'All done here.' }]);
});

test('stripCommands leaves only the words', () => {
  assert.equal(stripCommands('See? [[phone claim]] It moved.'), 'See? It moved.');
});

test('speech in any script is voiced, with its own sentence endings', () => {
  const arabic = segment('مرحبا بك في تاسك مافريك، أنا ماف. هل تدير مطعما أو فندقا؟ سأعرض لك الجهاز اللوحي الآن.');
  assert.ok(arabic.length >= 2, 'Arabic is split into sentences');
  assert.ok(arabic.every(i => i.type === 'speech' && /[؀-ۿ]/.test(i.text)));
  const chinese = segment('欢迎来到Taskmaverick，我是Mav，很高兴认识你。你经营什么样的业务？我现在给你看平板电脑。');
  assert.ok(chinese.length >= 2, 'Chinese splits at 。and ？');
  const spanish = segment('Claro que sí, te lo muestro ahora mismo. Él puede reclamar la misión con su código personal.');
  assert.equal(spanish.length, 2, 'a sentence starting with an accented capital splits');
  const hindi = segment('नमस्ते, मैं माव हूँ। [[stage devices]] यह टैबलेट पूरी टीम साझा करती है।');
  assert.deepEqual(hindi.map(i => i.type), ['speech', 'command', 'speech']);
});
