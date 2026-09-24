const clamp=value=>Math.max(0,Math.min(1,value));
export const LINE_REVEAL_DURATION=.65;
export const LINE_PAUSE=.45;
export const LINE_START=.1;
export const lineStart=index=>LINE_START+index*(LINE_REVEAL_DURATION+LINE_PAUSE);
export const captionReady=text=>lineStart(text.split('\n').length-1)+LINE_REVEAL_DURATION+.35;
export function lineLetterProgress(elapsed,lineIndex,letterIndex,length){
  const progress=clamp((elapsed-lineStart(lineIndex))/LINE_REVEAL_DURATION);
  const revealed=(1-(1-progress)**3)*(length+1);
  return clamp(revealed-letterIndex);
}
