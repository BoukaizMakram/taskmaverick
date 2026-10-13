'use client';
// The product's UI, one real piece at a time, for the storyboard's Shift+A menu.
// scripts/capture-storyboard.mjs opens this page (/storyboard-ui) and takes each
// [data-ui] piece (its HTML, its size) into public/storyboard/ui-parts.json. To
// offer another piece of UI there, add it to ITEMS. Every piece is shown at rest
// (nothing ticking, nothing open that was not asked for), at the size it is drawn
// in the product. Development only, like /missions.
import {useEffect, useState} from 'react';
import MissionChip from './MissionChip';
import OpenedMissionPhone from './OpenedMission';
import InteractiveMissionBoard from './InteractiveMissionBoard';
import {OPENED_MISSIONS} from '@/lib/openedMissions';
import {trainingMission} from './MissionEntries';
import {mediaTrainingMission} from './MediaTraining';
import AssetPiece from './AssetPiece';
import {partList} from '@/lib/storyboardParts.mjs';
import './ReferenceBoard.css';
import './EfficiencyStoryDemo.css';
import './ImprovedQualityDemo.css';
import './ImprovedQualityV2Demo.css';
import './CaptionBubbles.css';
import './DemoHand.css';

const mission = (title, type, points, rest) => ({id: `${type}-${title}`, title, type, points, date: '09-23-26', ...rest});
// a team board: three open, two claimed, two closed that can be rated
const TEAM = [
  ...[['Walk-In Freezer Check', 'Checklist', 25, 4720], ['Hand Sink Restock', 'Task', 10, 4540], ['Grease Trap Inspection', 'Task', 20, 4360]].map(([title, type, points, ageSeconds]) => mission(title, type, points, {status: 'open', time: '03:05 PM', ageSeconds})),
  ...[['Dining Room Reset', 'Checklist', 25, 'Carla M', 412, 5020], ['Dish Machine Temp Log', 'Task', 10, 'Ben R', 268, 5240]].map(([title, type, points, performer, executionSeconds, ageSeconds]) => mission(title, type, points, {status: 'claimed', performer, executionSeconds, ageSeconds, time: '02:58 PM'})),
  ...[['Opening Quality Check', 'Checklist', 25, 'Anna F', 522, 4935, '04:12 PM'], ['Ice Maker Filter Check', 'Task', 20, 'Anna F', 190, 5102, '04:03 PM']].map(([title, type, points, performer, executionSeconds, ageSeconds, time], i) => mission(title, type, points, {status: 'closed', stopped: 2 - i, performer, executionSeconds, ageSeconds, time, rateable: true})),
];
const state = extra => ({missions: TEAM, elapsed: 0, selected: null, menuOpen: false, boardTitle: 'Team Board', businessMediaLabel: 'Business Media', ...extra});
const board = (device, screen, extra, props) => <InteractiveMissionBoard device={device} referenceLayout initialScreen={screen} initialMissions={TEAM} demoState={state(extra)} {...props}/>;

// the two training missions a board starts with, claimed, opened on a phone
const CLAIMED = {status: 'claimed', performer: 'Anna F', started: 0};
const ENTRIES = {...trainingMission, ...CLAIMED, entries: {...trainingMission.entries}}, LESSON = {...mediaTrainingMission, ...CLAIMED, completedLessons: []};
const phoneWith = mission => board('phone', 'board', {missions: [mission], selected: mission.id});

// A mission as the iPad draws it (the reference board's chip: 334 wide, the date and time beside the
// performer) and not the phone's wider card: the board's own CSS, with one board unit set to 1px.
const IPAD_CHIP = 334;
const chip = props => <div className="mi-interactive mi-interactive--tablet mi-reference"><div className="mi-tablet-board" style={{'--ref-u': '1px', width: IPAD_CHIP, height: 'auto', overflow: 'visible', background: 'transparent'}}><div className="mi-column-cards"><MissionChip date="09-23-26" time="04:12 PM" pillTime="00:09:12" {...props}/></div></div></div>;
const details = type => <OpenedMissionPhone mission={OPENED_MISSIONS.find(m => m.type === type)}/>;

// [id, category, name, width (css px), what it looks for in a search, the piece]
export const ITEMS = [
  ['task-mission', 'Missions', 'Task mission', IPAD_CHIP, 'card chip', chip({kind: 'Task', points: 10, title: 'Cook Pasta'})],
  ['checklist-mission', 'Missions', 'Checklist mission', IPAD_CHIP, 'card chip', chip({kind: 'Checklist', points: 25, title: 'Opening Quality Check'})],
  ['media-mission', 'Missions', 'Media mission', IPAD_CHIP, 'card chip training lesson video', chip({kind: 'Media', points: 15, title: 'Shelving Standards'})],
  ['survey-mission', 'Missions', 'Survey mission', IPAD_CHIP, 'card chip questions', chip({kind: 'Survey', points: 10, title: 'Customer Feedback'})],
  ['test-mission', 'Missions', 'Test mission', IPAD_CHIP, 'card chip quiz exam', chip({kind: 'Test', points: 20, title: 'Food Safety Test'})],
  ['audit-mission', 'Missions', 'Audit mission', IPAD_CHIP, 'card chip inspection', chip({kind: 'Audit', points: 30, title: 'Restroom Inspection'})],
  ['claimed-mission', 'Missions', 'Claimed mission', IPAD_CHIP, 'card chip execution timer performer', chip({kind: 'Checklist', points: 25, title: 'Opening Quality Check', who: 'Anna F', showExec: true, execTime: '00:08:46'})],
  ['closed-mission', 'Missions', 'Closed mission', IPAD_CHIP, 'card chip done gray', chip({kind: 'Checklist', points: 25, title: 'Opening Quality Check', who: 'Anna F', showExec: true, execTime: '00:08:46', pillClass: 'chip--gray', pillTime: '01:22:15'})],
  ['rated-mission', 'Missions', 'Rated mission', IPAD_CHIP, 'card chip rating stars', chip({kind: 'Checklist', points: 25, title: 'Opening Quality Check', who: 'Anna F', showExec: true, execTime: '00:08:46', pillClass: 'chip--gray', pillTime: '01:22:15', rate: true, ratings: [{initials: 'AF', name: 'Anna F', score: 5}, {initials: 'BR', name: 'Ben R', score: 4}]})],

  ['task-details', 'Mission details', 'Task details', 340, 'opened mission', details('Task')],
  ['checklist-details', 'Mission details', 'Checklist details', 340, 'opened mission', details('Checklist')],
  ['media-details', 'Mission details', 'Media details', 340, 'opened mission training lesson', details('Media')],
  ['survey-details', 'Mission details', 'Survey details', 340, 'opened mission questions', details('Survey')],
  ['test-details', 'Mission details', 'Test details', 340, 'opened mission quiz', details('Test')],
  ['audit-details', 'Mission details', 'Audit details', 340, 'opened mission inspection', details('Audit')],

  ['entries-details', 'Mission details', 'Entries details', 360, 'opened mission numbers form fields', phoneWith(ENTRIES)],
  ['lesson-details', 'Mission details', 'Lesson details', 360, 'opened mission training video text image media', phoneWith(LESSON)],

  ['tablet-board', 'Boards', 'Tablet board', 860, 'team board columns open claimed closed', board('tablet', 'board')],
  ['phone-board', 'Boards', 'Phone board', 360, 'team board mobile', board('phone', 'board')],
  ['personal-board', 'Boards', 'Personal board', 360, 'my missions mobile individual', board('phone', 'board', {boardTitle: 'Personal Board'})],
  ['tablet-mission', 'Boards', 'Mission on a tablet', 860, 'opened mission details drawer', board('tablet', 'board', {selected: TEAM[1].id})],

  ['phone-home', 'Navigation', 'Home (phone)', 360, 'boards dashboard', board('phone', 'home')],
  ['phone-units', 'Navigation', 'Units (phone)', 360, 'boards locations directory', board('phone', 'unit')],
  ['tablet-home', 'Navigation', 'Home (tablet)', 860, 'boards dashboard', board('tablet', 'home')],
  ['tablet-menu', 'Navigation', 'Menu', 860, 'navigation drawer hamburger', board('tablet', 'board', {menuOpen: true})],
  ['personal-code', 'Navigation', 'Personal code', 860, 'pin keypad passcode login claim', board('tablet', 'board', {selected: TEAM[1].id, codeOpen: true, codeAction: 'Claim'})],
];

// ?thumbs=1: every piece in the catalog (ui-parts.json), drawn from the HTML that Shift+A adds, so
// its thumbnail is what you get (AssetPiece, the same drawing /assets-library/<id> opens).
function Thumbs() {
  const [catalog, setCatalog] = useState(null);
  useEffect(() => { fetch('/storyboard/ui-parts.json').then(r => r.json()).then(setCatalog).catch(() => setCatalog({})); }, []);
  if (!catalog) return null;
  return <main className="sbu-page" style={{padding: 40, background: '#e9edf2', minHeight: '100vh'}}>
    <div style={{display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'flex-start'}}>{partList(catalog).map(part => <AssetPiece key={part.id} part={part} data-thumb={part.id}/>)}</div>
  </main>;
}

export default function StoryboardUi({thumbs = false}) {
  if (thumbs) return <Thumbs/>;
  return <main className="sbu-page" style={{padding: 40, background: '#e9edf2', minHeight: '100vh'}}>
    <style>{'.sbu-page .mi-recording-controls, .sbu-page .mi-announcement { display:none; }'}</style>
    <div style={{display: 'flex', flexWrap: 'wrap', gap: 60, alignItems: 'flex-start'}}>
      {ITEMS.map(([id, category, name, width, keywords, piece]) => (
        <div key={id} data-ui={id} data-category={category} data-name={name} data-keywords={keywords} style={{width, position: 'relative', flex: 'none'}}>{piece}</div>
      ))}
    </div>
  </main>;
}
