// ---------------------------------------------------------------------------
// /demo-ai — turn the AI's streaming reply into an ordered queue of
//   { type: 'speech', text }  — a sentence (or clause before an action) to voice
//   { type: 'command', command } — a screen action, e.g. [[phone open Brew Coffee]]
// so actions happen exactly where they sit in the speech. Vocabulary: see
// COMMANDS in lib/demoAi/prompt.mjs.
// ---------------------------------------------------------------------------

export const TARGETS = ['stage', 'phone', 'tablet', 'web', 'tour'];
const POSITIONAL = {
  open: 'mission', board: 'board', unit: 'unit', tab: 'status', expand: 'status', request: 'title', rate: 'score',
  capture: 'item', create: 'type', edit: 'mission', catalog: 'name', process: 'name', dashboard: 'tab', report: 'report',
  section: 'name', missions: 'tab', library: 'tab',
};

export function parseCommand(raw) {
  const text = String(raw).trim().replace(/^([a-z]+)\s*:\s*/i, '$1 ');
  const [target = '', action = '', ...rest] = text.split(/\s+/);
  const command = { target: target.toLowerCase(), cmd: action.toLowerCase() };
  if (!TARGETS.includes(command.target) || !command.cmd) return null;
  const args = rest.join(' ').trim();
  if (!args) return command;
  if (/^[a-z]+\s*=/i.test(args)) {
    for (const pair of args.split(';')) {
      const at = pair.indexOf('=');
      if (at > 0) command[pair.slice(0, at).trim().toLowerCase()] = pair.slice(at + 1).trim();
    }
    return command;
  }
  if (command.cmd === 'answer') {
    const [item, ...value] = args.split(/\s+/);
    return { ...command, item, value: value.join(' ') };
  }
  return { ...command, [POSITIONAL[command.cmd] || 'arg']: args };
}

// Index just past the first sentence end in `text` (or 0 if none yet). A
// boundary works in any language: . ! ? … ؟ ۔ । followed by whitespace and
// anything but a lowercase letter (a capital, a digit, a quote, ¿ ¡, or a
// letter from a script without case — Arabic, Hindi, Chinese…), so "3.5" and
// "e.g. the" don't split; Chinese / Japanese 。！？ end a sentence even without
// a space. Very short sentences merge with the next; very long clauses split at
// a comma (, ، ， 、) so speech can start sooner.
const BOUNDARY = /[.!?…؟۔।]+["')\]»”’]*\s+(?=[^\p{Ll}\s])|[。！？]+["')\]」』”’]*/gu;
function sentenceEnd(text, final) {
  BOUNDARY.lastIndex = 0;
  let m;
  while ((m = BOUNDARY.exec(text))) {
    const end = m.index + m[0].length;
    if (end >= 28 || (/[。！？]/.test(m[0]) && end >= 12)) return end;
  }
  if (text.length > 170) {
    const comma = Math.max(text.lastIndexOf(', ', 150), text.lastIndexOf('، ', 150), text.lastIndexOf('，', 150), text.lastIndexOf('、', 150));
    if (comma > 60) return comma + (text[comma + 1] === ' ' ? 2 : 1);
  }
  return final ? text.length : 0;
}

export function createSegmenter(emit) {
  let buffer = '';
  // Anything with a letter or digit in any script is speech (not just a–z).
  const speech = text => { const t = text.replace(/\s+/g, ' ').trim(); if (/[\p{L}\p{N}]/u.test(t)) emit({ type: 'speech', text: t }); };
  const drain = final => {
    for (;;) {
      const open = buffer.indexOf('[[');
      if (open === 0) {
        const close = buffer.indexOf(']]');
        if (close === -1) { if (final) buffer = ''; return; }
        const command = parseCommand(buffer.slice(2, close));
        if (command) emit({ type: 'command', command });
        buffer = buffer.slice(close + 2);
        continue;
      }
      const text = open === -1 ? buffer : buffer.slice(0, open);
      // A lone "[" at the end may be the start of a command still streaming.
      const safe = open === -1 && !final && text.endsWith('[') ? text.slice(0, -1) : text;
      const end = sentenceEnd(safe, final && open === -1);
      if (end > 0) { speech(safe.slice(0, end)); buffer = buffer.slice(end); continue; }
      if (open > 0) { speech(text); buffer = buffer.slice(open); continue; }
      if (final) { speech(buffer); buffer = ''; }
      return;
    }
  };
  return { push(chunk) { buffer += chunk; drain(false); }, end() { drain(true); } };
}

// Plain text for the chat transcript (commands removed).
export const stripCommands = text => String(text).replace(/\[\[[^\]]*\]\]/g, ' ').replace(/\s+/g, ' ').trim();
