import { cutFor } from '@/lib/remotion/cuts.mjs';
import { cutWordsOf } from '@/lib/remotion/cutWords.mjs';
import { titlesCut, voicedLayouts } from '@/lib/remotion/cutTitles.mjs';
import { makeVoice } from '@/lib/remotion/cutVoiceMake.mjs';

// The voice-over of a Remotion cut, made as its titles change (the user, 2026-11-14: "add a way to add titles to the video and the audio generates automatically"; 2026-11-16: every cut,
// "add voice over to all videos ... put text in between texts and generate the voice over"; written, NOT tested).
// The Titles panel of the All videos page (components/StoryboardTitlesPanel.jsx) posts here when a title is added (at the end, or between two), retyped or deleted:
//   POST { board, layout, words: {<key>: text} } -> { made: [ids made now], missing: [ids with no audio: no ElevenLabs key], total, lines: [{id, text, ready, duration}] }
// The cut is made from those words (lib/remotion/cuts.mjs), and ElevenLabs makes the audio of the lines that have none yet (lib/remotion/cutVoiceMake.mjs: the same voice as the demos; a cut
// keeps its audio under its own key, lib/remotion/cutVoice.mjs; Increased Efficiency's by layout). The key stays on the server (.env.local). Local development only, like /api/storyboard: it
// writes files in the source tree; production answers 404.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (process.env.NODE_ENV === 'production') return new Response(null, { status: 404 });
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'This must come from this site.' }, { status: 403 });
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 200000) throw new Error('Too large.');
    body = JSON.parse(raw);
  } catch (error) { return Response.json({ error: error.message }, { status: 400 }); }
  const { board } = body ?? {}, layout = body?.layout ?? null;
  if (typeof board !== 'string' || !titlesCut(board, layout)) return Response.json({ error: 'No voice is made for this video.' }, { status: 400 });
  const cut = cutFor(board, layout);
  if (!cut) return Response.json({ error: 'Unknown video.' }, { status: 400 });
  try {
    const words = cutWordsOf({ cuts: { [cut.id]: { words: body.words ?? {} } } }, cut.id); // (each text cleaned as the board's file would)
    const result = await makeVoice({ root: process.cwd(), layout, cut: cut.make(words, { layout }) });
    // the film's other tellings that share these words (its narrator's variation, or the one it is a narration of): a title added or retyped here is said there too
    for (const other of voicedLayouts(board)) {
      const twin = other === layout ? null : cutFor(board, other);
      if (twin && twin.id === cut.id) { try { await makeVoice({ root: process.cwd(), layout: other, cut: twin.make(words, { layout: other }) }); } catch { /* its own Titles tab makes what is missing */ } }
    }
    return Response.json(result);
  } catch (error) { return Response.json({ error: error.message || 'The voice could not be made.' }, { status: 502 }); }
}
