// The voice-over of Increased Efficiency's Remotion cut (the user, 2026-11-13: "use eleven labs and make me voice over for video of increased effeciency in .../storyboard?video=all-videos").
// ElevenLabs, the voice the demos already use (lib/demoScript.mjs: TTS_VOICE_ID, which the user asked never to change). The cut says each sentence (the white words under the blue label) as its words
// start to be written (`c.white`), and the title as it is typed. The lines come from the cut's own plan, so a retyped sentence is read as retyped: `voiceLinesOf(cut)`.
// The audio is made ahead (`node scripts/generate-ie-voice.mjs`, `npm run gen:ie-voice`): public/tts/ie/<layout>/<id>.mp3, with what was made in lib/remotion/efficiencyVoiceAudio.mjs
// ({<layout>: {<id>: {hash, duration, text}}}); a sentence whose text no longer matches the audio made for it stays silent until the audio is made again (never the wrong words).
// Pure data and functions: the generator, the film (components/remotion/EfficiencyRedo.jsx) and the checks share it.
export const VOICE_ID = 'O4Sq7yQC1fd484Lr500R';       // (the demos' voice: do not change)
export const VOICE_MODEL = 'eleven_multilingual_v2';
export const VOICE_SETTINGS = {stability: 0.5, similarity_boost: 0.75};
export const TITLE_AT = 0.4;                          // the title is typed from the very start: it is said a moment in
export const VOICE_GAIN = 1;
export const voiceDir = layout => `tts/ie/${layout ?? 'redo'}`;   // under public/
export const voiceFile = (layout, id) => `${voiceDir(layout)}/${String(id).replace(/[^\w-]/g, '-')}.mp3`; // (a title added on the All videos page is 'add:<k>': no colon in a file's name)

// What is said for a text's lines: one sentence, "&" read as "and", with its full stop
export const spokenOf = lines => {
  const text = (Array.isArray(lines) ? lines.join(' ') : String(lines ?? '')).replace(/\s*&\s*/g, ' and ').replace(/\s+/g, ' ').trim();
  return text && !/[.!?]$/.test(text) ? `${text}.` : text;
};
// (a plain 53-bit string hash, cyrb53: the film runs in the browser, where node:crypto is not)
export const voiceHash = text => {
  const str = JSON.stringify([VOICE_ID, VOICE_MODEL, VOICE_SETTINGS, text]);
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
};

// The lines a cut says, in order: [{id, text, at}] (`at`: the second its voice starts)
export function voiceLinesOf(cut) {
  const lines = [{id: 'title', text: spokenOf(cut.voiceTitle ?? cut.title.lines), at: TITLE_AT}]; // (`voiceTitle`, `c.voice`: a narrator's words, which are not the screen's: Variation 10)
  for (const c of cut.captions) lines.push({id: c.id, text: spokenOf(c.voice ?? c.lines), at: c.white});
  return lines.filter(l => l.text);
}
