// The voice-over of EVERY Remotion cut (the user, 2026-11-16: "add voice over to all videos ... with also a new feature where we can put text in between texts and generate the voice over";
// written, NOT played). Increased Efficiency's cut had one since 2026-11-13 (lib/remotion/efficiencyVoice.mjs: the voice, how a text is said, its hash; its audio is kept by layout,
// public/tts/ie/<layout>/, lib/remotion/efficiencyVoiceAudio.mjs). Every other cut that has a voice says so in its plan, `voiceKey` (the id its words are kept under: 'RM-Cut', 'IQ-Cut-IE',
// ...; a cut made with `story(words, {voice: <that id>})`, lib/remotion/cutCore.mjs):
//   - the same ElevenLabs voice (VOICE_ID of efficiencyVoice.mjs: the demos' voice, never changed), the same lines (`voiceLinesOf`: the title as it is typed, each sentence as its white words
//     start to be written, a title added on the All videos page too);
//   - the audio is made ahead (`npm run gen:voice`, or by the Titles panel as a title is added or retyped): public/tts/cuts/<voiceKey>/<line id>.mp3, with what was made in
//     lib/remotion/cutVoiceAudio.mjs. A line whose text no longer matches the audio made for it stays silent until it is made again (never the wrong words);
//   - THE VOICE SETS THE PACE: a sentence never goes before its voice has said it (`cutVoiceSeconds`: the audio's own length when it is made for exactly these words, else what its letters
//     take), so what follows comes later (lib/remotion/cutCore.mjs `story`); the film (components/remotion/CutParts.jsx `CutVoice`, drawn by every cut's `CutFrame`) plays each line where
//     its words start.
// Pure data and functions: the plans, the films, the Titles panel, the generator and the checks share it.
import {spokenOf, voiceFile, voiceHash} from './efficiencyVoice.mjs';
import {VOICE_AUDIO} from './efficiencyVoiceAudio.mjs';
import {CUT_VOICE_AUDIO} from './cutVoiceAudio.mjs';

export const cutVoiceDir = key => `tts/cuts/${key}`; // under public/
export const cutVoiceFile = (key, id) => `${cutVoiceDir(key)}/${String(id).replace(/[^\w-]/g, '-')}.mp3`; // (an added title is 'add:<k>': no colon in a file's name)
// How long a text takes to say when no audio is made for it yet: what its letters take
export const estimateVoice = text => 0.4 + text.replace(/\s+/g, '').length / 13;
// How long the voice takes to say a line of a cut: the audio made for exactly these words, else the estimate
export function cutVoiceSeconds(key, id, lines) {
  const text = spokenOf(lines), made = CUT_VOICE_AUDIO[key]?.[id];
  return made && made.hash === voiceHash(text) ? made.duration : estimateVoice(text);
}
// What was made for a cut's voice ({<line id>: {hash, duration, text}}) and where a line's audio is, whichever way the cut keeps it (`layout`: Increased Efficiency's)
export const madeVoiceOf = (cut, layout = null) => (cut?.voiceKey ? CUT_VOICE_AUDIO[cut.voiceKey] : VOICE_AUDIO[layout ?? 'redo']) ?? {};
export const voiceFileOf = (cut, layout, id) => (cut?.voiceKey ? cutVoiceFile(cut.voiceKey, id) : voiceFile(layout, id));
