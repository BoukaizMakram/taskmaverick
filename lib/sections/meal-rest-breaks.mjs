// Meal & Rest Breaks (website Narration (October 14, 2026).docx, section "Meal & Rest Breaks", group Risk): the format is described at the top of live-oversight.mjs and dynamic-auditing.mjs.
// The art is components/sections/BreaksStage.jsx: the break board on a tablet on the wall of the break area, then the tablet itself (the zoom: the next scene's tablet at its place),
// two people claiming their break, their durations running; the 30-minute break that ran 35 minutes and what it raises (an alert to the managers, a written notice and a training to
// the person, cards on their own); the board's three columns (due, on break, taken); the web Team Board of every team's breaks, scrolled; the report of the breaks by person, scrolled.
// "Words on screen" in the narration (Excessive Durations Can Trigger, Everyone Is Constantly Informed, the closing words) are titles: the words alone.
const BOARD = {view: 'board', claimed: 2, time: 1};
export default {
  id: 'meal-rest-breaks',
  board: 'meal-rest-breaks-v2',
  name: 'Meal & Rest Breaks',
  group: 'Risk',
  stage: 'meal-rest-breaks',
  view: 'tablet',
  base: {view: 'wall', claimed: 0, time: 0, flow: 0, scroll: 0, focus: null, pan: 0, scrollTo: null},
  chapters: [
    {id: 'intro', name: 'The title', title: true, words: 'Missing Breaks Can / Increase Costs & Liability'},
    {id: 'display', name: 'The display on the wall', words: 'A Visible Display / Reminds About Breaks', art: {view: 'wall', claimed: 0, time: 0}, marks: [{target: 'wall-tablet', pad: 12}]},
    {id: 'claim', name: 'Two people claim their break', words: 'Individuals Claim / Their Break', point: ['card-rest', 'card-lunch'], art: {view: 'board', claimed: 0, time: 0},
      end: [{name: 'Anna F claims her lunch break', state: {claimed: 1}}, {name: 'Ben R claims his rest break', state: {claimed: 2}}]},
    {id: 'tracked', name: 'The duration is tracked', words: 'Each Break’s Duration Is Tracked', art: {view: 'board', claimed: 2, time: 0}, marksSequence: true, marks: [{target: 'card-rest-exec', padX: 6, padY: 9}, {target: 'card-lunch-exec', padX: 6, padY: 9}]},
    {id: 'excessive', name: 'Excessive durations', title: true, words: 'Excessive Durations / Can Trigger'},
    {id: 'alerts', name: 'Alerts to managers', words: 'Alerts To Managers', view: 'flow', art: {view: 'flow', flow: 0}, marks: [{target: 'src-exec'}], end: [{name: 'the alert', state: {flow: 1}, marks: false}]},
    {id: 'writeups', name: 'Write-ups to people', words: 'Write-Ups To People', view: 'flow', point: ['notice'], art: {view: 'flow', flow: 1}, end: [{name: 'the written notice', state: {flow: 2}}]},
    {id: 'trainings', name: 'Corrective trainings', words: 'Corrective Trainings', view: 'flow', point: ['training'], art: {view: 'flow', flow: 2}, end: [{name: 'the training', state: {flow: 3}}]},
    {id: 'informed', name: 'Everyone is informed', title: true, words: 'Everyone Is Constantly Informed'},
    {id: 'due', name: 'The breaks due', words: 'What Breaks Are Due', art: BOARD, marks: [{target: 'col-open', pad: 10}]},
    {id: 'onbreak', name: 'Who is on break', words: 'Who Is On Break', art: BOARD, marks: [{target: 'col-claimed', pad: 10}]},
    {id: 'took', name: 'Who took their breaks', words: 'Who Took Their Breaks', art: BOARD, marks: [{target: 'col-closed', pad: 10}]},
    {id: 'dashboards', name: 'Live dashboards', words: 'Live Dashboards Provide Constant Visibility', view: 'web', art: {view: 'dash', scroll: 0}, end: [{name: 'the dashboard scrolls', state: {scroll: 0.5}}, {name: 'to the last team', state: {scroll: 1}}]},
    {id: 'records', name: 'Records of compliance', words: 'Records Are Maintained / To Show Compliance', view: 'web', art: {view: 'report', scrollTo: 'top'}, end: [{name: 'the report scrolls', state: {scrollTo: 'person-carla'}}, {name: 'further', state: {scrollTo: 'person-sam'}}]},
    {id: 'conclusion', name: 'The closing words', title: true, words: 'Automating Breaks / Ensures Compliance / Reduces Liability / Frees-Up Management'},
  ],
  details: {
    display: {scenes: {
      display: ['The break board hangs where everyone passes.'],
      claim: ['The breaks due are open.', 'Anna F claims her lunch break.', 'Ben R claims his rest break.'],
      tracked: ['Each break’s timer runs from the claim.'],
    }, each: ['claim']},
    excess: {scenes: {
      alerts: ['Anna F’s 30-min break has run 35 min.', 'An alert goes to the managers.'],
      writeups: ['A written notice goes to Anna F.'],
      trainings: ['So does a training.'],
    }, each: ['alerts', 'writeups', 'trainings']},
    informed: {scenes: {
      due: ['Open: the breaks that are due.'],
      onbreak: ['Claimed: who is on break now.'],
      took: ['Closed: the breaks already taken.'],
      dashboards: ['The Team Board shows every team’s breaks.'],
      records: ['The report lists each person’s breaks.'],
    }},
  },
  chunks: [
    {id: 'display', title: 'The break display', lines: ['intro', 'display', 'claim', 'tracked']},
    {id: 'excess', title: 'When a break runs over', lines: ['excessive', 'alerts', 'writeups', 'trainings']},
    {id: 'informed', title: 'Everyone is informed', lines: ['informed', 'due', 'onbreak', 'took', 'dashboards', 'records', 'conclusion']},
  ],
};
