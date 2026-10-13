'use client';
// One piece of the product's UI, drawn from the very HTML that Shift+A adds to a storyboard
// frame (lib/storyboardParts.mjs `partHtml`) — so what the thumbnails show, what the Assets
// Library opens (/assets-library/<id>) and what lands in a frame are the same thing. It brings
// the CSS those pieces need (the web app's `.wa-*` rules included: without web.css a mission's
// logo is drawn at its native 235px).
import {bubbleShape} from '@/lib/storyboardBubble.mjs';
import {partHtml, sizeOf} from '@/lib/storyboardParts.mjs';
import './ReferenceBoard.css';
import './EfficiencyStoryDemo.css';
import './ImprovedQualityDemo.css';
import './ImprovedQualityV2Demo.css';
import './CaptionBubbles.css';
import './DemoHand.css';
import './web/web.css';

// The made pieces float in a little white space so their outline is not cut.
const PAD = {spotlight: 30, hand: 20};
const BUBBLE_CANVAS = {w: 400, h: 160};

// The size of the picture of a piece (its own size plus the space around it).
export function pieceSize(part) {
  if (part.id === 'speech-bubble') return BUBBLE_CANVAS;
  const {w, h} = sizeOf(part), pad = PAD[part.id] ?? 0;
  return {w: w + 2 * pad, h: h + 2 * pad};
}

// The speech bubble's shape is drawn by the storyboard, so it is drawn here too.
export default function AssetPiece({part, ...rest}) {
  const {w, h} = pieceSize(part), style = {position: 'relative', width: w, height: h, background: '#fff', overflow: 'hidden'};
  if (part.id === 'speech-bubble') {
    const own = sizeOf(part), rect = {x: 70, y: 52, w: own.w, h: own.h}, tip = {x: 14, y: 128}, shape = bubbleShape({rect, tip, mode: 'words'});
    return <div {...rest} style={style}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0, width: w, height: h}} dangerouslySetInnerHTML={{__html: shape.svg}}/>
      <div style={{position: 'absolute', inset: 0}} dangerouslySetInnerHTML={{__html: partHtml(part, 'thumb', rect.x, rect.y + own.h / 2)}}/>
    </div>;
  }
  const pad = PAD[part.id] ?? 0;
  return <div {...rest} style={style} dangerouslySetInnerHTML={{__html: partHtml(part, 'thumb', pad, pad)}}/>;
}
