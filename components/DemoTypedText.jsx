import {lineLetterProgress} from '@/lib/efficiencyCaptions.mjs';
import {useContext} from 'react';
import {createPortal} from 'react-dom';
import {DemoTextContext} from './DemoTextContext';
import {textFont,textLineStarts,textPositionAt} from '@/lib/demoTextSettings.mjs';
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => 1 - (1 - clamp(value)) ** 3;

// Derive every letter from the demo clock, including pause and backward seeks.
export default function DemoTypedText({ text, elapsed, remaining, center = false, className = '', offsetY = 0, lineBeats = false }) {
  const editor=useContext(DemoTextContext);
  const settings=editor?.settings||{};
  const speed=editor?.speed||1;
  const position=textPositionAt(settings.positions,editor?.elapsed??elapsed);
  const detached=position&&editor?.stageRef?.current;
  if(editor){text=settings.text??editor.text;elapsed=editor.elapsed-(settings.delay??editor.defaultDelay??0);if(remaining!==Infinity)remaining=editor.remaining;}
  const displayText = settings.casing==='original'?text:settings.casing==='uppercase'?text.toUpperCase():text.replace(/\b[a-z]/g, letter => letter.toUpperCase());
  const enter = ease(elapsed / Math.max(.001,settings.fadeIn??(editor ? .35/speed : .35)));
  const fade = clamp(remaining / Math.max(.001,settings.fadeOut??.28));
  const starts=textLineStarts(text,settings,speed);
  const progressForLine=(lineIndex,letterIndex,length)=>{
    const progress=clamp((elapsed-starts[lineIndex])/(settings.reveal??.65/speed));
    return clamp((1-(1-progress)**3)*(length+1)-letterIndex);
  };

  const paragraph=(floating=false)=>{let index=0;return <p aria-label={displayText.replace(/\n/g, ' ')} style={{ zoom:(settings.size??100)/100, fontFamily:textFont(settings.font),fontWeight:settings.weight,fontStyle:settings.fontStyle,textDecoration:settings.decoration,color:settings.color,textAlign:settings.align,lineHeight:settings.lineHeight,letterSpacing:settings.letterSpacing===undefined?undefined:`${settings.letterSpacing}px`,...(editor?{width:settings.width??'max-content',maxWidth:'none',marginLeft:'auto',marginRight:'auto'}:{}),...(floating?{fontFamily:textFont(settings.font)||'var(--font-poppins),sans-serif',fontSize:settings.positionStyle?.fontSize??27,lineHeight:settings.lineHeight??settings.positionStyle?.lineHeight??1.45,fontWeight:settings.weight??400,color:settings.color??'#202a37',textAlign:settings.align??'center',margin:0}:{}),opacity: enter * fade, transform: `translateY(${12 * (1 - enter) - 6 * (1 - fade)}px) scaleX(${.94 + .06 * enter})` }}>
      {displayText.split('\n').map((line, lineIndex) => {let lineLetter=0;return <span key={lineIndex} style={{ display: 'block',whiteSpace:editor&&!settings.width?'nowrap':undefined }}>
      {line.split(' ').map((word, wordIndex) => <span className="adx-typed-word" key={wordIndex} aria-hidden="true">
        {Array.from(word + ' ').map(letter => {
          const letterIndex = index++;
          const progress = lineBeats ? (editor ? progressForLine(lineIndex,lineLetter++,line.length+1) : lineLetterProgress(elapsed,lineIndex,lineLetter++,line.length+1)) : ease((elapsed - .04 - letterIndex * .014) / .2);
          return <span data-intro-letter key={letterIndex} style={{ opacity: progress, transform: `translateY(${7 * (1 - progress)}px) scaleX(${.7 + .3 * progress})` }}>{letter === ' ' ? '\u00a0' : letter}</span>;
        })}
      </span>)}
      </span>;})}
    </p>;};
  const original=<div data-demo-caption={detached?undefined:''} data-demo-caption-source={detached?'':undefined} aria-hidden={detached?true:undefined} className={`adx-title adx-msg adx-script-text ${center ? 'adx-script-center' : 'adx-lower-third'} ${className}`} style={{visibility:detached?'hidden':undefined, transform: `translate(${settings.x??0}px,${offsetY+(settings.y??0)}px)` }}>{paragraph()}</div>;
  return <>{original}{detached&&createPortal(<div data-demo-caption="" className="demo-positioned-caption adx-script-text" style={{position:'absolute',left:position.x,top:position.y,transform:'translate(-50%,-50%)',zIndex:20,pointerEvents:'none',width:'max-content'}}>{paragraph(true)}</div>,editor.stageRef.current)}</>;
}
