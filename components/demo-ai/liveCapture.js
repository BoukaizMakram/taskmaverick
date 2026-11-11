'use client';

// ---------------------------------------------------------------------------
// liveCapture — the storyboard's section videos made in the visitor's page, with
// the visitor's data (the user, 2026-10-19: "make the AI use our storyboards …
// change the mission names depending on the industry of the user, adding
// missions … on the fly"). A hidden frame holds the sections' stage page
// (/demo-ai/stage: the same stage /section-stage gives the capture script, at
// the same 1600 px, so it is laid out the same), the data is drawn there state
// by state, and the frames are made by the capture script's own loop
// (lib/sections/captureCore.mjs). The result has the shape of a board's file
// (public/storyboard/<board>.json), so the storyboard's director and engine play
// it as they play the board's (components/demo-ai/SectionVideo.jsx).
//   capture(sectionId, data, {only}) → Promise<video>   one at a time, kept per data
//   warm()                                              load the frame now
// ---------------------------------------------------------------------------

import { SECTIONS } from '@/lib/sections/index.mjs';
import { captureSection, quickHash } from '@/lib/sections/captureCore.mjs';

const STAGE_URL = '/demo-ai/stage';
const KEEP = 24;

export function createLiveCapture() {
  let iframe = null, ready = null, queue = Promise.resolve();
  const made = new Map();

  function mount() {
    if (ready) return ready;
    ready = new Promise((resolve, reject) => {
      iframe = document.createElement('iframe');
      iframe.src = STAGE_URL;
      iframe.title = 'Video stage';
      iframe.tabIndex = -1;
      iframe.setAttribute('aria-hidden', 'true');
      // On the page (not off it: a frame that is not drawn may not run its animation frames), at its own size, unseen.
      Object.assign(iframe.style, { position: 'fixed', left: '0', top: '0', width: '1600px', height: '1000px', border: '0', opacity: '0', pointerEvents: 'none', zIndex: '-1' });
      document.body.appendChild(iframe);
      const started = Date.now();
      const poll = () => {
        const win = iframe?.contentWindow;
        if (win?.__stage?.extract) return resolve(win);
        if (!iframe || Date.now() - started > 30000) return reject(new Error('the video stage did not load'));
        setTimeout(poll, 120);
      };
      poll();
    });
    ready.catch(() => { iframe?.remove(); iframe = null; ready = null; });
    return ready;
  }

  async function run(sectionId, data, only) {
    const spec = SECTIONS.find(s => s.id === sectionId);
    if (!spec) throw new Error(`no section ${sectionId}`);
    const win = await mount();
    const seen = new Map(); // (a state drawn twice in a capture is taken apart once)
    const draw = async (state, targets) => {
      const key = JSON.stringify([state, targets]);
      if (!seen.has(key)) {
        await win.__stage.show(spec.stage, state, data);
        seen.set(key, JSON.stringify(win.__stage.extract(targets))); // (out of the frame's own objects)
      }
      return JSON.parse(seen.get(key)); // (the loop adds to what it gets: a copy each time)
    };
    return captureSection(spec, { draw, hash: quickHash, only, warn: text => console.warn(`[video] ${spec.id}: ${text}`) });
  }

  return {
    warm: () => mount().then(() => true, () => false),
    capture(sectionId, data, { only = [] } = {}) {
      const key = `${sectionId}|${only.join(',')}|${JSON.stringify(data ?? null)}`;
      if (made.has(key)) return made.get(key);
      const job = queue.then(() => run(sectionId, data, only));
      queue = job.catch(() => {});
      made.set(key, job);
      job.catch(() => made.delete(key));
      if (made.size > KEEP) made.delete(made.keys().next().value);
      return job;
    },
    dispose() { iframe?.remove(); iframe = null; ready = null; },
  };
}
