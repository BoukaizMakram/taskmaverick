'use client';
// A board's Remotion cut drawn at one second, for scripts/capture-cuts.mjs (the board "All storyboards": the user, 2026-11-06, "put the increased efficiency video variation 4 in that storyboard by
// just putting what's in the video scene by scene"). Development only (/cut-stage). The script asks `window.__cut.show(board, seconds, words, layout)`, which resolves once the frame is drawn, its
// outlines placed and its pictures and fonts in; then it takes the frame apart (its pieces say their names: `data-cut-part`).
import {useEffect, useRef, useState} from 'react';
import {Thumbnail} from '@remotion/player';
import {CUT_COMPONENTS} from './index';
import {cutFor} from '@/lib/remotion/cuts.mjs';

const twoFrames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

export default function CutStage() {
  const [shot, setShot] = useState(null), done = useRef(null);
  useEffect(() => {
    window.__cut = {show: (board, seconds, words = {}, layout = null) => new Promise(resolve => { done.current = resolve; setShot({board, seconds, words, layout, n: Date.now()}); })};
    return () => { delete window.__cut; };
  }, []);
  useEffect(() => {
    if (!shot) return undefined;
    let live = true;
    (async () => {
      await twoFrames();
      const pictures = [...document.querySelectorAll('#cut-stage img')];
      await Promise.all(pictures.map(img => (img.complete ? null : new Promise(r => { img.addEventListener('load', r, {once: true}); img.addEventListener('error', r, {once: true}); }))));
      await document.fonts?.ready;
      await twoFrames();
      if (live && done.current) { const resolve = done.current; done.current = null; resolve(true); }
    })();
    return () => { live = false; };
  }, [shot]);
  const cut = shot && cutFor(shot.board, shot.layout), Comp = shot && CUT_COMPONENTS[shot.board]; // (a layout can be a cut of its own: Increased Efficiency's 'storyboard')
  if (!cut || !Comp) return <div id="cut-stage" style={{width: 1600, height: 900}}/>;
  const plan = cut.make(shot.words, {layout: shot.layout}), frame = Math.max(0, Math.min(plan.frames - 1, Math.round(shot.seconds * cut.fps)));
  return <div id="cut-stage" style={{position: 'relative', width: 1600, height: 900, overflow: 'hidden'}}>
    <Thumbnail component={Comp} compositionWidth={cut.width} compositionHeight={cut.height} frameToDisplay={frame} durationInFrames={plan.frames} fps={cut.fps}
      inputProps={{words: shot.words, layout: shot.layout, hide: null}} style={{width: 1600, height: 900}}/>
  </div>;
}
