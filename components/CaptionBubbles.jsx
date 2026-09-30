'use client';
// The layer the caption bubble is drawn into (by drawBubble, see
// components/captionBubbleDom.js and lib/captionBubbles.mjs).
import './CaptionBubbles.css';

export function BubbleLayer({gRef}){
 return <svg className="cb-layer" viewBox="0 0 1600 900" aria-hidden="true"><g ref={gRef}/></svg>;
}
