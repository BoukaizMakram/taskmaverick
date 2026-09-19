const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => 1 - (1 - clamp(value)) ** 3;

// Derive every letter from the demo clock, including pause and backward seeks.
export default function DemoTypedText({ text, elapsed, remaining, center = false, className = '', offsetY = 0 }) {
  const displayText = text.replace(/\b[a-z]/g, letter => letter.toUpperCase());
  const enter = ease(elapsed / .35);
  const fade = clamp(remaining / .28);
  let index = 0;
  return <div className={`adx-title adx-msg adx-script-text ${center ? 'adx-script-center' : 'adx-lower-third'} ${className}`} style={{ transform: `translateY(${offsetY}px)` }}>
    <p aria-label={displayText.replace(/\n/g, ' ')} style={{ opacity: enter * fade, transform: `translateY(${12 * (1 - enter) - 6 * (1 - fade)}px) scaleX(${.94 + .06 * enter})` }}>
      {displayText.split('\n').map((line, lineIndex) => <span key={lineIndex} style={{ display: 'block' }}>
      {line.split(' ').map((word, wordIndex) => <span className="adx-typed-word" key={wordIndex} aria-hidden="true">
        {Array.from(word + ' ').map(letter => {
          const letterIndex = index++;
          const progress = ease((elapsed - .04 - letterIndex * .014) / .2);
          return <span data-intro-letter key={letterIndex} style={{ opacity: progress, transform: `translateY(${7 * (1 - progress)}px) scaleX(${.7 + .3 * progress})` }}>{letter === ' ' ? '\u00a0' : letter}</span>;
        })}
      </span>)}
      </span>)}
    </p>
  </div>;
}
