// The lesson screen of a training (the user, 2026-10-13: "when I hit the video of the shelving standards show what I sent as a new UI, like a video under it a quiz, while fading out
// the mission details, then after hitting Submit & Close go back to mission details"): the training's video on top, under it a quiz of statements to tick, Submit & Close at the
// bottom. It is not one of the demo's screens: the video makes it (components/storyboardPlayerDom.js, `lessonBeats`) as an asset of its own, drawn in the place of the mission
// details (the same wrapper, so the slide's own moves and scales put it exactly there).
// The user, later the same day: "make the video on top playing before answering the quiz, and make the quiz and video about stock shelving": the video (the shelving clip of the
// mission's own training tile, public/demo-quality/shelving-training.mp4, 6 s) is the real file and PLAYS: the lesson comes in paused (the picture blurred, its play button), the
// cursor presses play, the picture clears and the clip runs by the video's clock with its bar; only then are the statements ticked. The quiz is about stock shelving.
// An asset is named `sb-lesson:<state>` and `lessonHtmlOf(name)` is its HTML (undefined: it is not one of these). A state is `play` (the video not watched yet: the clip is
// driven by the player, `LESSON_FILM`) or the statements ticked after it (a 0 or 1 for each: `00` nothing ticked, `10` the first, `11` the first two).
export const LESSON_PREFIX = 'sb-lesson:';
export const lessonAsset = state => `${LESSON_PREFIX}${state}`;
// What the cursor goes to, in order: the play button, the first two statements' boxes, then Submit & Close (selectors in the lesson's HTML).
export const LESSON_PLAY = '[data-lq="play"]';
export const LESSON_TARGETS = ['[data-lq="box-1"]', '[data-lq="box-2"]', '[data-lq="submit"]'];
// The clip: `clip` seconds long (the file's own), `press` how long the slide where the cursor presses play takes to move on (the video starts when it has), `clear` the seconds the
// blur and the play button take to go once it starts, `tail` how long the slide holds after the clip is over.
export const LESSON_FILM = {src: '/demo-quality/shelving-training.mp4', first: '/demo-quality/shelving.png', last: '/demo-quality/shelving-training-end.jpg', clip: 6, press: 0.4, clear: 0.4, tail: 0.5};

const STATEMENTS = [
  'Heavy items are stored on the lower shelves, and lighter items on the upper shelves.',
  'Every container is labeled, with its label facing out, and older stock is used first.',
  'It is OK to leave boxes on the floor in front of the shelves, when the shelves are full.',
];
const CHECK = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.6 10.6 8.4 14.4 15.6 6.2" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARROW = up => `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="${up ? 'M10 16V4M4.8 9.2 10 4l5.2 5.2' : 'M10 4v12M4.8 10.8 10 16l5.2-5.2'}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2Z" fill="currentColor"/></svg>';

export function lessonHtml(state = '00') {
  const wait = state === 'play', ticks = wait ? '00' : state;
  const options = STATEMENTS.map((text, i) => `<div class="sb-lq-opt${ticks[i] === '1' ? ' is-on' : ''}" data-lq="opt-${i + 1}"><span class="sb-lq-box" data-lq="box-${i + 1}">${ticks[i] === '1' ? CHECK : ''}</span><span class="sb-lq-text">${text}</span></div>`).join('');
  // (paused: the first picture, blurred, its bar not there yet; watched: the last picture of the clip, sharp, its bar full)
  const video = `<video src="${LESSON_FILM.src}" poster="${wait ? LESSON_FILM.first : LESSON_FILM.last}" muted playsinline></video>`
    + `<span class="sb-lq-play" data-lq="play">${PLAY}</span>`
    + `<div class="sb-lq-track"><span class="sb-lq-rail"><i data-lq="fill" style="width:${wait ? 0 : 100}%"></i></span><time data-lq="time">0:0${wait ? LESSON_FILM.clip : 0}</time></div>`;
  return `<div class="iq-camera" style="transform: translate(800px, 450px) scale(1.5) translate(-800px, -450px);" data-sb-wrap><div class="iq2-mission" style="left: 505px; top: 163px; width: 360px; height: 573px; opacity: 1; transform: translateY(0px) scale(1);" data-sb-root="mission"><div class="iq2-m sb-lq${wait ? ' is-wait' : ''}" lang="en" style="clip-path: inset(0px round 18px);">`
    + `<div class="sb-lq-video" data-lq="video">${video}</div>`
    + `<div class="sb-lq-bar"><b>Quiz</b><span class="sb-lq-arrows"><i>${ARROW(true)}</i><i>${ARROW(false)}</i></span></div>`
    + `<div class="sb-lq-body"><p class="sb-lq-q"><b>1. Please select ALL of the correct statements.</b><small>*select the correct options</small></p>${options}</div>`
    + `<div class="sb-lq-submit" data-lq="submit">Submit &amp; Close</div>`
    + `</div></div></div>`;
}
export const lessonHtmlOf = name => (typeof name === 'string' && name.startsWith(LESSON_PREFIX) ? lessonHtml(name.slice(LESSON_PREFIX.length)) : undefined);
