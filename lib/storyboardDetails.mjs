// The DETAILED videos (the user, 2026-10-14: "add another line of videos under videos where it will have the same videos but citing all details, and always having that gray area to the right ... like
// 'user clicks on menu' when the cursor is going to click on the menu, then 'he will find different options, and the knowledge base is...'"; then, on the first try: "the wording is not what I want,
// it doesn't say what we had ... it should be short, and let the user read, and have same wording as we had just additional steps").
//
// Each video that has an entry here has a twin (lib/storyboardVideos.mjs: `<id>-detail`, "<title> · in detail") that plays the same lines, the same cursor, the same software, with the gray area at
// the right on every slide. The words the video had stay as they were, where they were (the scene's own words, and the ones a scene changes to); what the twin adds are STEPS: short captions for what
// the user does and finds, one at each beat of a scene:
//   - each time the cursor goes to something (what the user does: "The user taps Menu."),
//   - each result of a click (what the user finds: "Different options appear..."),
//   - in the scenes of `each`, each slide where the software changes (a number pad opens, a mission moves).
// A scene's steps are in order; the last one stays for the beats after it. Short: a few words, the user in the third person, the tablet is tapped.
//   DETAILS[board][video id] = {scenes: {scene id: [steps]}, each: [scene ids]}
// A step (or an original caption) can be typed over in the video itself (double-click it: it is kept as `edits.captions[<id>-detail]['<scene>:<n>']` for step n, '<scene>:o<n>' for the n-th
// original caption of the scene, lib/storyboardEdits.mjs `setCaption`) and wins over this list.
import {SECTION_DETAILS} from './sections/index.mjs';
export const DETAILS = {
  ...SECTION_DETAILS, // (the sections of the website: lib/sections/<id>.mjs)
  'improved-quality-v2': {
    knowledge: {scenes: {
      knowledge: ['The user taps Menu.', 'Different options appear, including the Knowledge Base.', 'It holds many media missions.', 'The video plays.'],
    }},
    mission: {scenes: {
      translation: ['The user taps the language button.', 'All content switches language.', 'One more tap switches it back.'],
      steps: ['The user answers each question.', 'Each answer is recorded.'],
      micro: ['The user opens the training.', 'The lesson opens.', 'The video plays.', 'A short quiz follows.', 'The user selects the answers.', 'Then submits.', 'The mission resumes.'],
      photo: ['The user taps Add photo.', 'The photo is attached.'],
      video: ['The user answers No.', 'A video is now required.', 'The camera opens.'],
    }},
    ratings: {scenes: {
      rate: ['The user opens the rating.', 'A slider sets the score.', 'The user submits it.', 'The rating is locked in.'],
    }},
    managers: {scenes: {
      visibility: ['The manager taps Menu.', 'Business Media is among the options.', 'Business Proofs opens.'],
    }},
    report: {scenes: {
      web: ['The manager turns on Gallery View.', 'Proofs appear as pictures.'],
    }},
  },
  'increased-efficiency-v2': {
    board: {scenes: {
      urgency: ['The timer turns red as time passes.'],
    }, each: ['urgency']},
    tablet: {scenes: {
      code: ['The user enters a personal code.'],
      claim: ['The mission moves to Claimed.'],
      close: ['The mission moves to Closed.'],
    }, each: ['code', 'claim', 'close']},
    assign: {scenes: {
      initiative: ['Anyone can claim the next mission.'],
    }, each: ['initiative']},
  },
};
