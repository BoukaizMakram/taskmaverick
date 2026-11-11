// The sections of the website (the user, 2026-10-14: "work on all the other sections ... a new storyboard page for each one and video chunks for each one, exactly like the Improved
// Quality videos"; website Narration (October 14, 2026).docx). Each section is data (lib/sections/<id>.mjs): its chapters (the narration's words, the art, what is outlined, what the cursor
// presses) and its chunks (the videos). This registry gives the rest of the code what it needs from them:
//   SECTIONS          the specs, in the order of the site
//   SECTION_BOARDS    [{id (the board), name, group, draft}] for the storyboard's board menu and the command line
//   BOARD_GROUPS      the board menu's groups, in the narration's order: [{name, boards: [board ids]}] (the user, 2026-10-20: "add the name of each section in the dropdown like Risk then
//                     indent and show subtitles"); a board in no group comes after them
//   SECTION_STOPS     the cursor's stops by board and chapter ({target, kind}: what lib/demoTargets.mjs `clickTarget` reads, as HAND_STOPS is for the two demos)
//   SECTION_TARGETS   the selectors of the targets whose name is not a data-iq-target
//   SECTION_RUNS      the videos of a board: [{id, title, lines}] (VIDEO_RUNS' shape)
//   SECTION_DETAILS   the steps of each video's detailed twins (lib/storyboardDetails.mjs' shape)
//   SECTION_LESSONS   the written lessons the sections' quizzes play (`lessonTopics` of a spec: lib/storyboardLesson.mjs LESSON_TOPICS' shape)
// A spec with `draft: true` is being built: it is registered (its stage can be drawn and captured) but the board menu leaves it out until the flag is gone.
import liveOversight from './live-oversight.mjs';
import dynamicAuditing from './dynamic-auditing.mjs';
import requestingMaintenance from './requesting-maintenance.mjs';
import requestingSupport from './requesting-support.mjs';
import trackingExpirations from './tracking-expirations.mjs';
import replenishingInventory from './replenishing-inventory.mjs';
import exceptionManagement from './exception-management.mjs';
import reportingAi from './reporting-ai.mjs';
import precisionPlanning from './precision-planning.mjs';
import increasedEfficiency from './increased-efficiency.mjs';
// Training, Risk, Knowledge (the user, 2026-10-20: "do not forget about the other videos in training/risk/knowledge"; not Streamlining Complexity)
import automatedCoaching from './automated-coaching.mjs';
import reactiveTraining from './reactive-training.mjs';
import dynamicTesting from './dynamic-testing.mjs';
import liveMonitoring from './live-monitoring.mjs';
import automatedCertification from './automated-certification.mjs';
import learningEfficiency from './learning-efficiency.mjs';
import massBroadcasting from './mass-broadcasting.mjs';
import trainingDataAi from './training-data-ai.mjs';
import riskLiability from './risk-liability.mjs';
import mealRestBreaks from './meal-rest-breaks.mjs';
import predictionAi from './prediction-ai.mjs';
import standardizingEnterprise from './standardizing-enterprise.mjs';
import poweringFranchising from './powering-franchising.mjs';
import innovatingConsulting from './innovating-consulting.mjs';
import contentAdaptation from './content-adaptation.mjs';

export const SECTIONS = [liveOversight, dynamicAuditing, requestingMaintenance, requestingSupport, trackingExpirations, replenishingInventory, exceptionManagement, reportingAi, precisionPlanning, increasedEfficiency,
  automatedCoaching, reactiveTraining, dynamicTesting, liveMonitoring, automatedCertification, learningEfficiency, massBroadcasting, trainingDataAi,
  riskLiability, mealRestBreaks, predictionAi,
  standardizingEnterprise, poweringFranchising, innovatingConsulting, contentAdaptation];
export const sectionOfBoard = board => SECTIONS.find(s => s.board === board) ?? null;
export const SECTION_BOARDS = SECTIONS.map(s => ({id: s.board, name: s.name, group: s.group ?? 'Operations', draft: !!s.draft}));
export const BOARD_GROUPS = [
  {name: 'Operations', boards: ['increased-efficiency-v3', 'increased-efficiency-v2', 'improved-quality-v2', 'live-oversight-v2', 'precision-planning-v2', 'dynamic-auditing-v2', 'requesting-maintenance-v2', 'requesting-support-v2', 'tracking-expirations-v2', 'replenishing-inventory-v2', 'exception-management-v2', 'reporting-ai-v2']},
  {name: 'Training', boards: ['automated-coaching-v2', 'reactive-training-v2', 'dynamic-testing-v2', 'live-monitoring-v2', 'automated-certification-v2', 'learning-efficiency-v2', 'mass-broadcasting-v2', 'training-data-ai-v2']},
  {name: 'Risk', boards: ['risk-liability-v2', 'meal-rest-breaks-v2', 'prediction-ai-v2']},
  {name: 'Knowledge', boards: ['standardizing-enterprise-v2', 'powering-franchising-v2', 'innovating-consulting-v2', 'content-adaptation-v2']},
];
export const SECTION_STOPS = Object.fromEntries(SECTIONS.map(s => [s.board, Object.fromEntries(s.chapters.filter(c => c.acts?.length).map(c => [c.id, c.acts.map(a => ({target: a.target, kind: 'click', ...(a.leave ? {leave: true} : {})}))]))]));
export const SECTION_TARGETS = Object.fromEntries(SECTIONS.map(s => [s.board, s.targets ?? {}]));
export const SECTION_RUNS = Object.fromEntries(SECTIONS.map(s => [s.board, s.chunks.map(c => ({id: c.id, title: c.title, lines: c.lines}))]));
export const SECTION_DETAILS = Object.fromEntries(SECTIONS.map(s => [s.board, s.details ?? {}]));
export const SECTION_LESSONS = Object.assign({}, ...SECTIONS.map(s => s.lessonTopics ?? {}));
