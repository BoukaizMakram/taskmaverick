// Prediction & AI (website Narration (October 14, 2026).docx, section "Prediction & AI", group Risk): the format is described at the top of live-oversight.mjs and dynamic-auditing.mjs.
// The narration is one sentence, "AI Models Can Be Fed / With Extensive Data / To Analyze Risk Factors / And To Predict Risk Exposure", over "Scroll through reports with words on screen".
// One short video: it opens on the web report (components/sections/PredictionStage.jsx: the Data Board's look, every level open) and scrolls through it while the first half of the
// sentence is written, then the second half closes it as its title (a section ends on a title): the sentence is read once, in its order, and no word is added.
export default {
  id: 'prediction-ai',
  board: 'prediction-ai-v2',
  name: 'Prediction & AI',
  group: 'Risk',
  stage: 'prediction-ai',
  view: 'web',
  base: {focus: null, pan: 0, scrollTo: 'top'},
  chapters: [
    {id: 'fed', name: 'The report, scrolled', words: 'AI Models Can Be Fed / With Extensive Data', art: {scrollTo: 'top'},
      end: [{name: 'the missions', state: {scrollTo: 'mission-3'}}, {name: 'the people', state: {scrollTo: 'person-2'}}, {name: 'the teams and units', state: {scrollTo: 'team-3'}}]},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'To Analyze Risk Factors / And To Predict Risk Exposure'},
  ],
  details: {
    all: {scenes: {
      fed: ['The report opens every level, down to each answer.'],
    }},
  },
  chunks: [
    {id: 'all', title: 'Prediction & AI', lines: ['fed', 'conclusion'], pace: {fed: {extra: 3}}},
  ],
};
